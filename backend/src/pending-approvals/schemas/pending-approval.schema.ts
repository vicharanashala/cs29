import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingApprovalDocument = HydratedDocument<PendingApproval>;

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Reply {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
}

@Schema({ timestamps: true, collection: 'pending_approvals' })
export class PendingApproval {
  @Prop({ required: true, type: String })
  issueId: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  urgency: string;

  @Prop({
    required: true,
    type: String,
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Prop({ required: true, type: String })
  raisedBy: string;

  @Prop({ required: true, type: String })
  raisedByName: string;

  @Prop({ required: true, type: String })
  date: string;

  @Prop({ type: Array, default: [] })
  replies: Reply[];

  @Prop({ type: String, default: '' })
  resolution: string;

  // Fallback fields for AI-generated drafts (from RAG)
  @Prop({ required: false, type: String })
  question?: string;

  @Prop({ required: false, type: String })
  draft_answer?: string;
}

export const PendingApprovalSchema = SchemaFactory.createForClass(PendingApproval);