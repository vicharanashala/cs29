import { Controller, Get, Patch, Param, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQ, FAQDocument } from './faqs/schemas/faq.schema';
import { AiService } from './ai/ai.service';

@Controller('api/faqs')
export class FaqController {
  constructor(
    @InjectModel(FAQ.name) private readonly faqModel: Model<FAQDocument>,
    private readonly aiService: AiService,
  ) {}

  @Post('similar')
  async findSimilarFaqs(@Body() body: { query: string }) {
    if (!body.query?.trim()) return [];
    const results = await this.aiService.findSimilarFaqs(body.query.trim());
    return results.filter((r) => r.score > 0.7);
  }

  @Get()
  async getAllFaqs(): Promise<FAQ[]> {
    return this.faqModel.find().exec();
  }

  @Get('top')
  async getTopFaqs(@Query('limit') limit = 5): Promise<FAQ[]> {
    return this.faqModel
      .find()
      .sort({ view_count: -1 })
      .limit(Number(limit))
      .exec();
  }

  @Get('analytics')
  async getAnalytics() {
    const allFaqs = await this.faqModel.find().lean();

    const totalFaqs = allFaqs.length;
    const totalViews = allFaqs.reduce((sum, f) => sum + (f.view_count || 0), 0);

    // Top 10 by view count
    const topFaqs = [...allFaqs]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10)
      .map((f) => ({ _id: String(f._id), question: f.question, category: f.category, view_count: f.view_count || 0 }));

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    allFaqs.forEach((f) => {
      categoryMap[f.category] = (categoryMap[f.category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 7-day FAQ creation volume (uses createdAt from timestamps)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    allFaqs.forEach((f) => {
      const created = (f as any).createdAt;
      if (created && new Date(created) >= sevenDaysAgo) {
        const key = new Date(created).toISOString().slice(0, 10);
        if (key in dailyMap) dailyMap[key]++;
      }
    });
    const volumeData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    return { totalFaqs, totalViews, topFaqs, categoryData, volumeData };
  }

  @Get('categories')
  async getCategories() {
    const results = await this.faqModel.find().sort({ category: 1 }).exec();
    const nameToCount: Record<string, number> = {};
    results.forEach(f => { nameToCount[f.category] = (nameToCount[f.category] || 0) + 1; });
    const catNames = Object.keys(nameToCount).sort();
    return catNames.map((name, idx) => ({
      name,
      count: nameToCount[name],
      categoryIndex: idx + 1,
    }));
  }

  @Post()
  async createFaq(@Body() createFaqDto: Partial<FAQ>): Promise<FAQ> {
    const faq = await this.faqModel.create({
      ...createFaqDto,
      view_count: 0,
    });

    // Fire-and-forget: generate embedding for the new FAQ so it's immediately searchable
    if (faq._id && createFaqDto.question) {
      const embeddingText = (createFaqDto.question + ' ' + (createFaqDto.answer ?? '') + ' ' + (createFaqDto.category ?? '')).trim();
      this.aiService
        .generateEmbedding(embeddingText)
        .then((embedding) => {
          return this.faqModel.updateOne({ _id: faq._id }, { $set: { embedding } });
        })
        .then(() => {
          // Embedding saved silently
        })
        .catch((err) => {
          // Non-fatal: FAQ is saved, embedding will be backfilled by the generate-embeddings script
          console.error('Warning: could not generate embedding for new FAQ ' + String(faq._id) + ': ' + String(err?.message ?? err));
        });
    }

    return faq;
  }

  @Put(':id')
  async updateFaq(
    @Param('id') id: string,
    @Body() updateDto: Partial<FAQ>,
  ): Promise<FAQ | null> {
    return this.faqModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  @Delete(':id')
  async deleteFaq(@Param('id') id: string): Promise<FAQ | null> {
    return this.faqModel.findByIdAndDelete(id).exec();
  }

  @Patch(':id/view')
  async incrementViewCount(@Param('id') id: string): Promise<FAQ | null> {
    return this.faqModel.findByIdAndUpdate(
      id,
      { $inc: { view_count: 1 } },
      { new: true },
    ).exec();
  }

  @Post(':id/rate')
  async rateFaq(
    @Param('id') id: string,
    @Body() body: { rating: 'helpful' | 'not_helpful' },
  ): Promise<{ helpful_count: number; not_helpful_count: number } | null> {
    if (body.rating !== 'helpful' && body.rating !== 'not_helpful') return null;
    const field = body.rating === 'helpful' ? 'helpful_count' : 'not_helpful_count';
    const updated = await this.faqModel.findByIdAndUpdate(
      id,
      { $inc: { [field]: 1 } },
      { new: true, projection: { helpful_count: 1, not_helpful_count: 1 } },
    ).exec();
    if (!updated) return null;
    return { helpful_count: updated.helpful_count, not_helpful_count: updated.not_helpful_count };
  }
}
