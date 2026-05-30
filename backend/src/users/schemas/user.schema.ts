import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, type: String, unique: true })
  email: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({
    required: true,
    type: String,
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Prop({ default: 0, type: Number })
  reward_points: number;

  @Prop({ default: 0, type: Number })
  answered_count: number;

  @Prop({ default: 0, type: Number })
  questions_asked: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'FAQ' }] })
  bookmarks: Types.ObjectId[];

  // Profile fields
  @Prop({ type: String, default: '' })
  firstName: string;

  @Prop({ type: String, default: '' })
  lastName: string;

  @Prop({ type: String, default: '' })
  alternateEmail: string;

  @Prop({ type: String, default: '' })
  mobile: string;

  @Prop({ type: String, default: '' })
  collegeName: string;

  @Prop({ type: String, default: '' })
  collegeAddress: string;

  @Prop({ type: String, default: '' })
  collegeWebsite: string;

  @Prop({ type: String, default: '' })
  departmentName: string;

  @Prop({ type: String, default: '' })
  departmentWebpage: string;

  @Prop({ type: String, default: '' })
  programme: string;

  @Prop({ type: String, default: '' })
  branch: string;

  @Prop({ type: String, default: '' })
  gpa: string;

  @Prop({ type: String, default: '' })
  cvFileName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);