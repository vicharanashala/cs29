import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ConnectOptions } from 'mongoose';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FAQ, FAQDocument } from '../faqs/schemas/faq.schema';
import { PendingFaq, PendingFaqDocument } from '../faqs/schemas/pending-faq.schema';

export interface AiAnswer {
  answer: string;
  matchedFaqs: Array<{ _id: string; question: string; answer: string; category: string; refNumber?: string }>;
  callSucceeded: boolean;
}

interface UnknownResponse {
  status: 'unknown';
  draft: string;
  suggested_category: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  // Embedding model confirmed working: gemini-embedding-001 on v1 API (3072 dims)
  private static readonly EMBEDDING_MODEL = 'gemini-embedding-001';
  private static readonly EMBEDDING_API_VERSION = 'v1';

  constructor(
    @InjectModel(FAQ.name) private readonly faqModel: Model<FAQDocument>,
    @InjectModel(PendingFaq.name) private readonly pendingFaqModel: Model<PendingFaqDocument>,
  ) {}

  // ─── OnModuleInit: ensure vector search index exists ─────────────────────────

  async onModuleInit(): Promise<void> {
    try {
      // Confirm Atlas Vector Search index doesn't already exist before creating
      // this.faqModel.collection is the raw MongoDB collection (bypasses Mongoose getters/setters)
      const collection = this.faqModel.collection;
      const existingIndexes = await collection.listSearchIndexes().toArray();
      const vectorIndexExists = existingIndexes.some((idx: any) => idx.name === 'vector_index');

      if (vectorIndexExists) {
        this.logger.log('vector_index already exists — skipping creation');
        return;
      }

      this.logger.warn(
        'vector_index not found — creating it now. ' +
        'Note: MongoDB Atlas Vector Search requires an M10+ cluster tier. ' +
        'If you see a "not supported" error your Atlas plan is too low.',
      );

      await collection.createSearchIndex({
        name: 'vector_index',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              embedding: {
                type: 'knnVector',
                dimensions: 3072,   // Must match gemini-embedding-001 output (3072 dims)
                similarity: 'cosine',
              },
            },
          },
        },
      });

      this.logger.log('vector_index created successfully');
    } catch (err) {
      this.logger.error(
        'Failed to create vector_index — vector search will fall back to text search: ' +
          (err instanceof Error ? err.message : String(err)),
      );
      // Do not re-throw — allow the app to start. Vector search will degrade gracefully.
    }
  }

  // ─── Embedding Generation ─────────────────────────────────────────────────────

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined');
    }

    const url =
      `https://generativelanguage.googleapis.com/${AiService.EMBEDDING_API_VERSION}/models/` +
      `${AiService.EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      { content: { parts: [{ text }] } },
      { timeout: 15000 },  // 15s — sufficient for production; bumped from 5s
    );

    const embedding: number[] = response.data?.embedding?.values ?? [];
    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding returned from Gemini REST API');
    }
    return embedding;
  }

  // ─── Text-based FAQ Keyword Search (pure MongoDB, no AI needed) ───────────────

  private async textSearchFaqs(query: string): Promise<AiAnswer['matchedFaqs']> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 8);

    if (keywords.length === 0) return [];

    try {
      const allFaqs = await this.faqModel
        .find(
          {
            $or: [
              { question: { $regex: keywords.join('|'), $options: 'i' } },
              { answer: { $regex: keywords.join('|'), $options: 'i' } },
            ],
          },
          { _id: 1, question: 1, answer: 1, category: 1, refNumber: 1 },
        )
        .limit(10)
        .lean();

      const scored = (allFaqs as Array<{ _id: Types.ObjectId; question: string; answer: string; category: string; refNumber?: string }>).map((faq) => {
        const textBody = (faq.question + ' ' + faq.answer).toLowerCase();
        const score = keywords.filter((k) => textBody.includes(k)).length;
        return { ...faq, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored
        .slice(0, 3)
        .map(({ score: _score, ...f }) => ({ ...f, _id: String(f._id) }));
    } catch (err) {
      this.logger.warn('Text search fallback failed: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }

  // ─── Vector Search ────────────────────────────────────────────────────────────

  private async vectorSearchFaqs(
    queryEmbedding: number[],
  ): Promise<AiAnswer['matchedFaqs']> {
    try {
      return await this.faqModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 3,
          },
        },
        { $project: { _id: 1, question: 1, answer: 1, category: 1, refNumber: 1 } },
      ]);
    } catch (err) {
      this.logger.warn('Vector search failed: ' + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  }

  // ─── Public: Fast Fallback Retrieval (used by chat controller on AI failure) ──

  /**
   * Attempts vector search first; on failure or empty results, falls through to
   * keyword text search.  Never throws — always returns an array.
   */
  async getDirectFaqMatches(query: string): Promise<{ matchedFaqs: AiAnswer['matchedFaqs'] }> {
    // 1. Try vector search (requires embedding generation)
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await this.generateEmbedding(query);
    } catch (embErr) {
      // Embedding failed — fall through to text search below
      this.logger.warn(
        'getDirectFaqMatches: embedding failed, using text search. Reason: ' +
          (embErr instanceof Error ? embErr.message : String(embErr)),
      );
    }

    if (queryEmbedding.length > 0) {
      const vectorResults = await this.vectorSearchFaqs(queryEmbedding);
      if (vectorResults.length > 0) {
        return { matchedFaqs: vectorResults };
      }
      this.logger.warn('getDirectFaqMatches: vector search returned 0 results, falling back to text search');
    }

    // 2. Text-based keyword fallback — always available
    const textResults = await this.textSearchFaqs(query);
    return { matchedFaqs: textResults };
  }

  // ─── Public: Similar FAQ Search (used by /api/faqs/similar) ──────────────────

  async findSimilarFaqs(
    query: string,
  ): Promise<Array<{ _id: string; question: string; answer: string; category: string; score: number }>> {
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.generateEmbedding(query);
    } catch {
      return [];
    }
    try {
      return await this.faqModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 3,
          },
        },
        {
          $project: {
            _id: 1,
            question: 1,
            answer: 1,
            category: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);
    } catch {
      return [];
    }
  }

  // ─── Public: Main RAG Answer (used by /api/chat) ──────────────────────────────

  async getAnswer(query: string): Promise<AiAnswer> {
    // ── Step 1: Generate query embedding (best-effort; degrade gracefully) ────
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await this.generateEmbedding(query);
    } catch (embedError) {
      this.logger.warn(
        'Embedding generation failed — falling back to text-search context. Reason: ' +
          (embedError instanceof Error ? embedError.message : String(embedError)),
      );
      // DO NOT throw — continue with text search for context
    }

    // ── Step 2: Build context — vector search first, text search as fallback ──
    let contextFaqs: AiAnswer['matchedFaqs'] = [];
    let matchedIds: Types.ObjectId[] = [];

    if (queryEmbedding.length > 0) {
      const vectorResults = await this.vectorSearchFaqs(queryEmbedding);
      this.logger.log(
        'Vector search returned ' + vectorResults.length + ' context matches for query: "' + query + '"',
      );

      if (vectorResults.length > 0) {
        contextFaqs = vectorResults;
        matchedIds = vectorResults.map((r) => new Types.ObjectId(String(r._id)));
      }
    }

    // Text search fallback: if embedding failed or vector search returned nothing
    if (contextFaqs.length === 0) {
      this.logger.warn(
        'Vector context empty — using text search context for query: "' + query + '"',
      );
      contextFaqs = await this.textSearchFaqs(query);
      this.logger.log('Text search context: ' + contextFaqs.length + ' matches');
    }

    // Increment view_count for matched FAQs (fire-and-forget)
    if (matchedIds.length > 0) {
      this.faqModel
        .updateMany({ _id: { $in: matchedIds } }, { $inc: { view_count: 1 } })
        .exec()
        .then(() => {
          this.logger.log('Incremented view_count for ' + matchedIds.length + ' matched FAQs');
        })
        .catch((incError) => {
          this.logger.warn(
            'Failed to increment view_count: ' + (incError instanceof Error ? incError.message : String(incError)),
          );
        });
    }

    // ── Step 3: Build RAG prompt ───────────────────────────────────────────────
    const contextBlock =
      contextFaqs.length > 0
        ? contextFaqs
            .map(
              (f, i) =>
                '[' + (i + 1) + '] Category: ' + f.category + '\nQ: ' + f.question + '\nA: ' + f.answer,
            )
            .join('\n\n')
        : '(No relevant FAQs found in the database.)';

    const ragPrompt =
      'You are Yaksha, the AI assistant for the Vicharanashala Internship Programme at IIT Ropar.\n\n' +
      'Use the FAQ context below to answer accurately.\n\n' +
      'FAQ Context:\n' + contextBlock + '\n\n' +
      'Question:\n' + query + '\n\n' +
      'Rules:\n' +
      '- NEVER start your answer with robotic phrases like "Based on the database context" or "According to the context provided". Speak naturally, authoritatively, and directly as Yaksha, the AI mentor.\n' +
      '- If the answer exists in the context, answer confidently without referencing "the context" or "database".\n' +
      '- If partially covered, answer using available information and mention any limitations.\n' +
      '- If unavailable, output ONLY this JSON (no extra text): ' +
      '{"status":"unknown","draft":"<your best inference>","suggested_category":"<best category>"}\n' +
      '- Never hallucinate policies or dates.\n' +
      '- Be concise but complete.\n' +
      '- Remain friendly and professional.';

    // ── Step 4: LLM call — Gemini primary, Minimax last-resort fallback ────────
    let rawText = '';
    let callSucceeded = false;

    // ── Gemini primary ──────────────────────────────────────────────────────────
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not defined');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let attempt = 0;
      while (attempt < 3) {
        try {
          const result = await model.generateContent(ragPrompt);
          rawText = result.response.text();
          this.logger.log('Gemini primary responded successfully for query: "' + query + '"');
          callSucceeded = true;
          break;
        } catch (geminiErr: any) {
          attempt++;
          const isRetryable =
            geminiErr?.message?.includes('503') ||
            geminiErr?.message?.includes('429') ||
            (geminiErr as any)?.status === 429 ||
            (geminiErr as any)?.status === 503;
          if (!isRetryable || attempt >= 3) {
            this.logger.error('Gemini primary failed: ' + geminiErr?.message);
            throw geminiErr;
          }
          this.logger.warn(
            'Gemini retryable error (attempt ' + attempt + '/3), retrying in ' + attempt * 2000 + 'ms...',
          );
          await new Promise((r) => setTimeout(r, attempt * 2000));
        }
      }
    } catch (geminiPrimaryError) {
      this.logger.warn(
        'Gemini primary failed: ' +
          (geminiPrimaryError instanceof Error ? geminiPrimaryError.message : String(geminiPrimaryError)),
      );
    }

    // ── Minimax last-resort fallback ─────────────────────────────────────────────
    if (!callSucceeded) {
      try {
        const minimaxKey = process.env.MINIMAX_API_KEY;
        if (!minimaxKey || minimaxKey.includes('…') || minimaxKey.length < 20) {
          throw new Error('MINIMAX_API_KEY is missing or placeholder — skipping');
        }
        this.logger.log('Minimax fallback — key prefix: ' + minimaxKey.slice(0, 8) + '...');

        const response = await axios.post(
          'https://samagama.in/platform/proxy/v1/chat/completions',
          {
            model: 'MiniMaxAI/MiniMax-M2.7',
            messages: [{ role: 'user', content: ragPrompt }],
            max_tokens: 500,
            temperature: 0.3,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + minimaxKey,  // Fixed: was '***' + minimaxKey
            },
            timeout: 20000,
          },
        );

        rawText = response.data?.choices?.[0]?.message?.content;
        if (!rawText) {
          throw new Error('Invalid response structure from Minimax API');
        }
        this.logger.log('Minimax fallback responded successfully for query: "' + query + '"');
        callSucceeded = true;
      } catch (minimaxError) {
        const statusCode = (minimaxError as any)?.response?.status;
        const responseBody = (minimaxError as any)?.response?.data;
        this.logger.warn(
          'Minimax fallback also failed (status ' +
            statusCode +
            '): ' +
            (minimaxError instanceof Error ? minimaxError.message : String(minimaxError)),
        );
        if (responseBody) {
          this.logger.warn('Minimax error body: ' + JSON.stringify(responseBody));
        }
      }
    }

    if (!callSucceeded) {
      throw new Error('All LLM providers failed for query: ' + query);
    }

    // ── Step 5: Parse response — never return raw JSON to the user ───────────
    // Extract content from the first code-fence block wherever it appears in the
    // response (Gemini sometimes wraps JSON in prose before the fence).
    // Falls back to the full raw text when no fence is present.
    const fenceMatch = rawText.match(/```(?:json|markdown|text)?\s*([\s\S]*?)\s*```/i);
    const stripped = (fenceMatch ? fenceMatch[1] : rawText).trim();

    let finalAnswer = stripped;
    try {
      const parsed = JSON.parse(stripped) as Record<string, unknown>;

      // Case 1: LLM says it doesn't know — queue to pending_faqs then return the draft
      if (parsed?.status === 'unknown' && typeof parsed.draft === 'string') {
        const unknown = parsed as unknown as UnknownResponse;
        const suggestedCategory =
          typeof unknown.suggested_category === 'string'
            ? unknown.suggested_category.trim()
            : 'General';

        // Queue for admin review (fire-and-forget — don't let a DB error block the response)
        this.pendingFaqModel.create({
          question: query,
          suggestedAnswer: unknown.draft.trim(),
          category: suggestedCategory,
          createdAt: new Date(),
        }).catch((dbErr) => {
          this.logger.warn(
            'Failed to queue unknown question to pending_faqs: ' +
              (dbErr instanceof Error ? dbErr.message : String(dbErr)),
          );
        });

        this.logger.log(
          'Queued unknown question to pending_faqs: "' +
            query +
            '" (category: ' +
            suggestedCategory +
            ')',
        );
        // Return the draft text — the user gets Yaksha's best inference, not a dead-end message
        return {
          answer: unknown.draft.trim(),
          matchedFaqs: contextFaqs,
          callSucceeded: true,
        };
      }

      // Case 2: JSON with an "answer" field
      if (typeof parsed.answer === 'string') {
        finalAnswer = (parsed.answer as string).trim();
      }
      // Case 3: JSON with a "draft" field (any other status)
      else if (typeof parsed.draft === 'string') {
        finalAnswer = (parsed.draft as string).trim();
      }
      // Case 4: JSON with "status":"success" and a "text" field
      else if (parsed?.status === 'success' && typeof (parsed as any).text === 'string') {
        finalAnswer = ((parsed as any).text as string).trim();
      }
      // Case 5: Unknown JSON shape — pull the first non-trivial string value
      else {
        const firstStr = Object.values(parsed).find(
          (v) => typeof v === 'string' && (v as string).trim().length > 10,
        ) as string | undefined;
        if (firstStr) {
          finalAnswer = firstStr.trim();
        }
        // else: finalAnswer stays as `stripped` — raw but at least fence-free
      }
    } catch {
      // Not JSON — use the stripped plain text as-is
    }

    return { answer: finalAnswer, matchedFaqs: contextFaqs, callSucceeded: true };
  }
}
