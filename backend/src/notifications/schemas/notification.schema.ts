import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType = 'issue_resolved' | 'reply_received' | 'answer_approved' | 'announcement';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, type: String })
  recipientEmail: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  body: string;

  @Prop({ required: true, type: String })
  type: NotificationType;

  @Prop({ type: String })
  issueId?: string;

  @Prop({ default: false, type: Boolean })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
