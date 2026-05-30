import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FAQDocument = HydratedDocument<FAQ>;

@Schema({ timestamps: true, collection: 'faqs' })
export class FAQ {
  @Prop({ required: true, type: String })
  question: string;

  @Prop({ required: true, type: String })
  answer: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ default: 0, type: Number })
  view_count: number;

  @Prop({ default: 0, type: Number })
  helpful_count: number;

  @Prop({ default: 0, type: Number })
  not_helpful_count: number;

  @Prop({ type: String, required: false })
  actionUrl?: string;

  @Prop({ type: String, required: false })
  refNumber?: string;

  /**
   * Pre-computed Gemini embedding vector (gemini-embedding-001, 3072 dims).
   * Used exclusively by $vectorSearch in AiService.
   * select: false keeps it out of regular .find() results for bandwidth efficiency.
   */
  @Prop({ type: [Number], select: false, default: undefined })
  embedding?: number[];
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);
