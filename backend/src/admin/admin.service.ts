import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQ, FAQDocument } from '../faqs/schemas/faq.schema';
import { PendingFaq, PendingFaqDocument } from '../faqs/schemas/pending-faq.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(FAQ.name) private faqModel: Model<FAQDocument>,
    @InjectModel(PendingFaq.name) private pendingFaqModel: Model<PendingFaqDocument>,
  ) {}

  getPending() {
    return this.pendingFaqModel.find().sort({ createdAt: -1 }).exec();
  }

  async approvePending(id: string) {
    const pending = await this.pendingFaqModel.findById(id);
    if (!pending) throw new NotFoundException('Pending FAQ not found');

    const faq = await this.faqModel.create({
      question: pending.question,
      answer: pending.suggestedAnswer,
      category: pending.category,
      view_count: 0,
    });

    await this.pendingFaqModel.findByIdAndDelete(id);
    return faq;
  }

  async rejectPending(id: string) {
    const result = await this.pendingFaqModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Pending FAQ not found');
    return { message: 'Rejected and removed' };
  }

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalFaqs, pendingCount, resolvedToday] = await Promise.all([
      this.faqModel.countDocuments(),
      this.pendingFaqModel.countDocuments(),
      this.faqModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return { totalFaqs, pendingCount, resolvedToday };
  }

  createFaq(body: { question: string; answer: string; category: string }) {
    return this.faqModel.create({ ...body, view_count: 0 });
  }

  async deleteFaq(id: string) {
    const result = await this.faqModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('FAQ not found');
    return { message: 'Deleted' };
  }

  getAllFaqs() {
    return this.faqModel.find().sort({ createdAt: -1 }).exec();
  }
}
