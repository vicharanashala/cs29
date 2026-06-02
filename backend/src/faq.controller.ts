import { Controller, Get, Patch, Param, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQ, FAQDocument } from './faqs/schemas/faq.schema';
import { AiService } from './ai/ai.service';
import { Notification, NotificationDocument } from './notifications/schemas/notification.schema';
import { User, UserDocument } from './users/schemas/user.schema';

@Controller('api/faqs')
export class FaqController {
  constructor(
    @InjectModel(FAQ.name) private readonly faqModel: Model<FAQDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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

    // Notify all users about the new FAQ (fire-and-forget)
    if (faq._id) {
      this.userModel.find({}, 'email').lean().exec()
        .then((users) => {
          const notifications = users.map((u) => ({
            recipientEmail: u.email,
            title: 'New FAQ published',
            body: `Check out the new FAQ: "${faq.question}" in ${faq.category}.`,
            type: 'new_faq',
            issueId: String(faq._id),
            read: false,
          }));
          if (notifications.length > 0) {
            return this.notificationModel.insertMany(notifications);
          }
        })
        .catch((err) => console.error('Failed to broadcast new FAQ notification:', err));
    }

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
    @Body() body: { rating?: 'helpful' | 'not_helpful' | null; oldRating?: 'helpful' | 'not_helpful' | null; email: string },
  ): Promise<{ helpful_count: number; not_helpful_count: number } | null> {
    const { rating, oldRating, email } = body;
    if (!email) return null;

    const incOps: Record<string, number> = {};
    let emailMoved = false;

    // Scenario A: Toggle off (clicking same rating again)
    if (rating !== undefined && rating === oldRating) {
      const field = rating === 'helpful' ? 'helpful_count' : 'not_helpful_count';
      incOps[field] = -1;
    }
    // Scenario B: New vote (no prior rating)
    else if (rating && !oldRating) {
      const field = rating === 'helpful' ? 'helpful_count' : 'not_helpful_count';
      incOps[field] = 1;
    }
    // Scenario C: Switching between upvote and downvote
    else if (rating && oldRating && rating !== oldRating) {
      const oldField = oldRating === 'helpful' ? 'helpful_count' : 'not_helpful_count';
      const newField = rating === 'helpful' ? 'helpful_count' : 'not_helpful_count';
      incOps[oldField] = -1;
      incOps[newField] = 1;
      emailMoved = true;
    }

    // Execute atomic update only when there's a real state change
    if (Object.keys(incOps).length > 0) {
      const updateOps: Record<string, unknown> = { $inc: incOps };
      // Keep email arrays in sync: pull from old array, add to new array
      if (rating !== undefined && rating === oldRating) {
        const removeFrom = rating === 'helpful' ? 'upvotedBy' : 'downvotedBy';
        (updateOps as Record<string, unknown>).$pull = { [removeFrom]: email };
      } else if (rating && oldRating && rating !== oldRating) {
        (updateOps as Record<string, unknown>).$pull = { [oldRating === 'helpful' ? 'upvotedBy' : 'downvotedBy']: email };
        (updateOps as Record<string, unknown>).$addToSet = { [rating === 'helpful' ? 'upvotedBy' : 'downvotedBy']: email };
      } else if (rating && !oldRating) {
        (updateOps as Record<string, unknown>).$addToSet = { [rating === 'helpful' ? 'upvotedBy' : 'downvotedBy']: email };
      }
      await this.faqModel.findByIdAndUpdate(id, updateOps).exec();
    }

    // Return fresh authoritative count values from the database document
    const updatedFaq = await this.faqModel.findById(id).exec();
    if (!updatedFaq) return null;

    return {
      helpful_count: updatedFaq.helpful_count,
      not_helpful_count: updatedFaq.not_helpful_count,
    };
  }
}
