import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PendingFaqDocument = PendingFaq & Document;

@Schema({ timestamps: false, collection: 'pending_faqs' })
export class PendingFaq {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  suggestedAnswer: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PendingFaqSchema = SchemaFactory.createForClass(PendingFaq);