/**
 * generate-embeddings.ts
 *
 * Backfill script: generates Gemini embeddings for all FAQ documents that
 * currently have empty (or missing) embedding vectors in MongoDB Atlas.
 *
 * Usage (from the backend/ directory):
 *   npx ts-node -r tsconfig-paths/register src/scripts/generate-embeddings.ts
 *
 * Environment variables required (read from .env automatically via dotenvx):
 *   MONGO_URI         — MongoDB Atlas connection string
 *   GEMINI_API_KEY    — Google Gemini API key
 *
 * Safety:
 *   - Only processes FAQs with embedding.length === 0 (resumable).
 *   - Never deletes or overwrites non-empty embeddings.
 *   - Rate-limited to avoid hitting Gemini quota (300ms between requests).
 *   - All secrets read from env — never logged.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import mongoose, { Connection } from 'mongoose';
import axios from 'axios';

// ── Load environment variables from .env ──────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGO_URI) {
  console.error('[generate-embeddings] FATAL: MONGO_URI environment variable is missing');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('[generate-embeddings] FATAL: GEMINI_API_KEY environment variable is missing');
  process.exit(1);
}

// ── Embedding model ────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_API_VERSION = 'v1';
const EMBEDDING_URL =
  `https://generativelanguage.googleapis.com/${EMBEDDING_API_VERSION}/models/` +
  `${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

// ── Generate a single embedding via Gemini REST API ───────────────────────────
async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        EMBEDDING_URL,
        { content: { parts: [{ text }] } },
        { timeout: 20000 },
      );
      const values: number[] = response.data?.embedding?.values ?? [];
      if (values.length === 0) {
        throw new Error('Empty embedding values returned from Gemini');
      }
      return values;
    } catch (err: any) {
      const isRateLimit = err?.response?.status === 429;
      const isServerError = err?.response?.status >= 500;
      if ((isRateLimit || isServerError) && attempt < retries) {
        const delay = attempt * 3000; // 3s, 6s
        console.warn(
          `  [attempt ${attempt}/${retries}] Rate-limited or server error — retrying in ${delay / 1000}s...`,
        );
        await sleep(delay);
        continue;
      }
      const status = err?.response?.status ?? 'N/A';
      const body = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err?.message;
      throw new Error(`Gemini API error (HTTP ${status}): ${body}`);
    }
  }
  throw new Error('All retries exhausted');
}

// ── Utility ────────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('[generate-embeddings] Connecting to MongoDB Atlas...');

  let conn: Connection | null = null;
  try {
    await mongoose.connect(MONGO_URI as string, { serverSelectionTimeoutMS: 15000 });
    conn = mongoose.connection;
    console.log('[generate-embeddings] Connected to MongoDB Atlas.');

    const db = conn.db!;
    const collection = db.collection('faqs');

    // Count total and pending
    const total = await collection.countDocuments({});
    // Target: documents where embedding is missing OR is an empty array
    const pending = await collection.countDocuments({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
      ],
    });
    const alreadyDone = total - pending;

    console.log(`\n[generate-embeddings] Stats:`);
    console.log(`  Total FAQs:               ${total}`);
    console.log(`  Already have embeddings:  ${alreadyDone}`);
    console.log(`  Need embeddings:          ${pending}`);
    console.log(`  Model:                    ${EMBEDDING_MODEL} (${EMBEDDING_API_VERSION})`);
    console.log('');

    if (pending === 0) {
      console.log('[generate-embeddings] All FAQs already have embeddings. Nothing to do.');
      return;
    }

    // Fetch all FAQs needing embeddings
    const faqs = await collection
      .find(
        { $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }] },
        { projection: { _id: 1, question: 1, answer: 1, category: 1 } },
      )
      .toArray();

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];
      const index = i + 1;

      // Build embedding input text (question + category for richer context)
      const embeddingText = [
        faq.question ?? '',
        faq.category ?? '',
        (faq.answer as string ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      process.stdout.write(
        `[${index}/${faqs.length}] Embedding FAQ: "${String(faq.question).slice(0, 60)}${String(faq.question).length > 60 ? '…' : ''}"  `,
      );

      try {
        const embedding = await generateEmbedding(embeddingText);

        await collection.updateOne(
          { _id: faq._id },
          { $set: { embedding } },
        );

        process.stdout.write(`✓ (${embedding.length} dims)\n`);
        successes++;
      } catch (err: any) {
        process.stdout.write(`✗ FAILED: ${err?.message ?? String(err)}\n`);
        failures++;
      }

      // Rate-limit: 300ms between requests to stay within Gemini free-tier quota
      if (i < faqs.length - 1) {
        await sleep(300);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n[generate-embeddings] ─── Summary ───────────────────────────────────────');
    console.log(`  Total processed:  ${faqs.length}`);
    console.log(`  Successes:        ${successes}`);
    console.log(`  Failures:         ${failures}`);
    console.log(`  Duration:         ${duration}s`);

    if (failures > 0) {
      console.warn(
        `\n[generate-embeddings] WARNING: ${failures} FAQ(s) failed. Re-run the script to retry failed items.`,
      );
    } else {
      console.log('\n[generate-embeddings] All embeddings generated successfully. RAG pipeline is ready.');
    }
  } finally {
    if (conn) {
      await mongoose.disconnect();
      console.log('[generate-embeddings] Disconnected from MongoDB.');
    }
  }
}

main().catch((err) => {
  console.error('[generate-embeddings] FATAL:', err?.message ?? String(err));
  process.exit(1);
});
