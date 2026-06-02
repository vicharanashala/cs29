/**
 * reembed-faqs.ts
 *
 * One-shot re-embedding script.
 * Fetches all 142 FAQs from MongoDB, generates fresh 3072-dim gemini-embedding-001
 * vectors for each, and writes them back atomically.
 *
 * Run: npx ts-node scripts/reembed-faqs.ts
 *
 * Features:
 *   - Batch processing (10 FAQs per tick) to respect API rate limits
 *   - Exponential back-off on 429 / 503
 *   - Idempotent: safe to interrupt and re-run (overwrites all embeddings each pass)
 *   - Progress every 10 FAQs
 */

import axios from 'axios';
import mongoose from 'mongoose';
import { FAQSchema } from '../src/faqs/schemas/faq.schema';

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI ??
  'mongodb+srv://admin:Admin2026@cluster0.xa4zt7h.mongodb.net/vicharanashala?appName=Cluster0';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY env var is required');
  process.exit(1);
}

const EMBEDDING_MODEL       = 'gemini-embedding-001';
const EMBEDDING_API_VERSION = 'v1';
const EMBEDDING_URL =
  `https://generativelanguage.googleapis.com/${EMBEDDING_API_VERSION}/models/` +
  `${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

const BATCH_SIZE    = 10;     // pause after every N calls
const BASE_DELAY_MS = 1200;   // 1.2 s base — Gemini free tier ~60 req/min

// ─── Embedding helper with back-off ─────────────────────────────────────────

async function generateEmbedding(text: string, attempt = 1): Promise<number[]> {
  try {
    const response = await axios.post(
      EMBEDDING_URL,
      { content: { parts: [{ text }] } },
      { timeout: 20_000 },
    );
    const values: number[] = response.data?.embedding?.values ?? [];
    if (!values || values.length === 0) {
      throw new Error('Empty embedding returned');
    }
    return values;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status ?? 0;
    const isRateOr503 = status === 429 || status === 503;

    if (isRateOr503 && attempt < 5) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`  ⚠️  ${status} — backing off ${Math.round(delay)}ms (attempt ${attempt + 1})`);
      await new Promise((res) => setTimeout(res, delay));
      return generateEmbedding(text, attempt + 1);
    }

    throw err;
  }
}

// ─── Strip HTML tags for cleaner embedding input ──────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const FAQModel = mongoose.models.FAQ ?? mongoose.model('FAQ', FAQSchema);
  const total = await FAQModel.countDocuments();
  console.log(`Found ${total} FAQ documents in the collection.\n`);

  // Fetch in original document order so log output is predictable
  const faqs = await FAQModel
    .find({}, { _id: 1, question: 1, answer: 1, category: 1 })
    .sort({ _id: 1 })
    .lean();

  let processed = 0;
  let failed = 0;

  console.log(`Starting re-embedding of ${faqs.length} FAQs...`);
  console.log('─'.repeat(50));

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i] as { _id: mongoose.Types.ObjectId; question: string; answer: string; category: string };
    const plainText = `${faq.question} — ${stripHtml(faq.answer)}`;

    try {
      const embedding = await generateEmbedding(plainText);

      await FAQModel.updateOne(
        { _id: faq._id },
        { $set: { embedding } },
      );

      processed++;
      if (processed % 10 === 0 || processed === faqs.length) {
        console.log(`  [${processed}/${faqs.length}] embedded: "${faq.question.slice(0, 55)}..."`);
      }
    } catch (err) {
      failed++;
      console.error(`  [FAIL] "${faq.question.slice(0, 50)}" — ${(err as Error).message}`);
    }

    // Batch pacing: pause after every BATCH_SIZE calls
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < faqs.length) {
      process.stdout.write(`  ⏸  Pausing ${BASE_DELAY_MS}ms to respect rate limit...\n`);
      await new Promise((res) => setTimeout(res, BASE_DELAY_MS));
    }
  }

  console.log('─'.repeat(50));
  console.log(`\n✅ Done.  Processed: ${processed}  |  Failed: ${failed}`);

  if (processed > 0) {
    const sample = await FAQModel
      .findOne({ embedding: { $exists: true, $ne: [] } }, { question: 1, embedding: { $slice: 5 } })
      .lean();
    const dims = sample?.embedding?.length ?? 0;
    console.log(`\n✅ Embedding dimensions confirmed: ${dims}`);
    console.log(`✅ Successfully generated ${processed} × ${dims}-dimension embeddings and seeded all ${total} FAQs into Atlas!`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected. Bye!');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});