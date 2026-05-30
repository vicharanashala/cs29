import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AiService, AiAnswer } from './ai/ai.service';

export interface ChatResponse {
  answer: string;
  matchedFaqs?: Array<{ _id: string; question: string; answer: string; category: string; refNumber?: string }>;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  async chat(@Body() body: any, @Req() req: Request): Promise<ChatResponse> {
    const raw = JSON.stringify(body).replace(/[\n\r]/g, ' ');
    const cleaned = JSON.parse(raw);
    const question: string = cleaned.question ?? cleaned.query ?? '';
    if (!question.trim()) {
      return { answer: 'Please ask a question first.' };
    }

    let result: AiAnswer;
    try {
      result = await this.aiService.getAnswer(question);
    } catch (err: any) {
      // AI failed — use direct FAQ matches without re-attempting slow embedding calls
      const fallback = await this.aiService.getDirectFaqMatches(question);
      if (fallback.matchedFaqs.length > 0) {
        const faq = fallback.matchedFaqs[0];
        const cleanAnswer = faq.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // Conversational answer with FAQ content — warm, AI-mentor style
        const friendlyAnswer = `Great question! Here's what our FAQ says:\n\n"${faq.question}"\n\n${cleanAnswer.slice(0, 300)}${cleanAnswer.length > 300 ? '...' : ''}\n\n💡 You can read more and explore related questions in the FAQ section below.`;
        return {
          answer: friendlyAnswer,
          matchedFaqs: [{ ...faq, answer: cleanAnswer }],
        };
      }
      const msg = err?.message ?? '';
      const isOverloaded = msg.includes('503') || msg.includes('high demand') || msg.includes('429');
      return {
        answer: isOverloaded
          ? 'Yaksha is receiving too many requests right now. Please wait a moment and try again.'
          : 'I encountered an error processing your question. Please try again in a moment.',
      };
    }

    return {
      answer: result.answer,
      matchedFaqs: result.matchedFaqs.map((f) => ({ ...f })),
    };
  }
}
