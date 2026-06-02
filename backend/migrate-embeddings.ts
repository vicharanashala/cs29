/**
 * migrate-embeddings.ts
 *
 * One-time migration script to generate and persist Gemini gemini-embedding-001
 * vectors for all existing FAQs that don't yet have an embedding field.
 *
 * Usage:
 *   GEMINI_API_KEY="***" MONGO_URI="mongodb+srv://..." \
 *     npx ts-node migrate-embeddings.ts
 *
 * Safety: re-running is idempotent — it only processes FAQs where
 * `embedding` is null or missing.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

const DELAY_MS = 500;

// ── FAQ Schema (inline to avoid NestJS dependency) ───────────────────────────
const faqSchema = new mongoose.Schema(
  {
    question:   { type: String, required: true },
    answer:     { type: String, required: true },
    category:   { type: String, required: true },
    view_count: { type: Number, default: 0 },
    actionUrl:  { type: String, required: false },
    embedding:  { type: [Number], required: false },
  },
  { timestamps: true, collection: 'faqs' },
);

const FAQ = mongoose.model('FAQ', faqSchema);

// ── Embedding helper — calls Gemini REST API directly (not the SDK)
// This bypasses the SDK's v1beta version lock that blocks embedding models.
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const url =
    'https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent' +
    `?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
    },
    { timeout: 15000 },
  );

  const embedding: number[] = response.data?.embedding?.values ?? [];
  if (!embedding || embedding.length === 0) {
    throw new Error('Empty embedding returned from Gemini REST API');
  }
  return embedding;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!mongoUri) {
    console.error('❌  MONGO_URI environment variable is not set.');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('❌  GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅  Connected.\n');

  // ── Status report ───────────────────────────────────────────────────────────
  const total = await FAQ.countDocuments();

  // Count docs missing embeddings (null, undefined, or empty array)
  const missingEmbedding = await FAQ.countDocuments({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $type: 'array', $size: 0 } },
    ],
  });

  console.log('📊  Migration status:');
  console.log(`   Total FAQs  : ${total}`);
  console.log(`   Already done: ${total - missingEmbedding}`);
  console.log(`   Pending     : ${missingEmbedding}\n`);

  if (missingEmbedding === 0) {
    console.log('✅  All FAQs already have valid embeddings. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  // ── Stream through pending FAQs ─────────────────────────────────────────────
  const cursor = FAQ.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $type: 'array', $size: 0 } },
    ],
  }).cursor({ batchSize: 1 });

  let processed = 0;
  let errors    = 0;

  for await (const faq of cursor) {
    const textToEmbed = `[${faq.category}] ${faq.question}`;
    process.stdout.write(
      `[${processed + 1}/${missingEmbedding}] Embedding: "${faq.question.slice(0, 55)}"... `,
    );

    try {
      const embedding = await generateEmbedding(textToEmbed, apiKey);
      await FAQ.updateOne({ _id: faq._id }, { $set: { embedding } });
      processed++;
      console.log(`✅  (dim: ${embedding.length})`);
    } catch (err) {
      errors++;
      console.log(`❌  ${err instanceof Error ? err.message : String(err)}`);
    }

    if (processed + errors < missingEmbedding) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\n🏁  Done.`);
  console.log(`   Processed : ${processed}`);
  console.log(`   Errors    : ${errors}`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected.');
}

migrate().catch((err) => {
  console.error('\n❌  Migration crashed:', err);
  process.exit(1);
});