import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PendingApproval,
  PendingApprovalDocument,
  ApprovalStatus,
} from './pending-approvals/schemas/pending-approval.schema';
import { User, UserDocument } from './users/schemas/user.schema';
import { Notification, NotificationDocument } from './notifications/schemas/notification.schema';

export interface Reply {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
}

export interface IssueDocument extends Document {
  issueId: string;
  title: string;
  category: string;
  description: string;
  urgency: string;
  status: 'queue' | 'review' | 'resolved';
  raisedBy: string;
  raisedByName: string;
  date: string;
  replies: Reply[];
  resolution?: string;
}

class CreateIssueDto {
  title: string;
  category: string;
  description: string;
  urgency: string;
  raisedBy: string;
  raisedByName: string;
}

class PostReplyDto {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
}

@Controller('api/issues')
export class IssueController {
  constructor(
    @InjectModel(PendingApproval.name)
    private readonly issueModel: Model<PendingApprovalDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  private buildIssueId(): string {
    return `VINS-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private formatDate(): string {
    return new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  @Post()
  async createIssue(@Body() dto: CreateIssueDto) {
    const issue = new this.issueModel({
      issueId: this.buildIssueId(),
      title: dto.title,
      category: dto.category,
      description: dto.description,
      urgency: dto.urgency,
      status: ApprovalStatus.PENDING,
      raisedBy: dto.raisedBy,
      raisedByName: dto.raisedByName,
      date: this.formatDate(),
      replies: [],
    });
    const saved = await issue.save();
    // Increment questions_asked for the submitting user (fire-and-forget)
    this.userModel
      .updateOne({ email: dto.raisedBy }, { $inc: { questions_asked: 1 } })
      .exec()
      .catch(() => {});
    return this.toIssueDto(saved);
  }

  @Get()
  async getIssues(
    @Query('status') status?: string,
    @Query('raisedBy') raisedBy?: string,
  ) {
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') {
      const statusMap: Record<string, ApprovalStatus> = {
        queue: ApprovalStatus.PENDING,
        review: ApprovalStatus.PENDING,
        resolved: ApprovalStatus.APPROVED,
      };
      filter['status'] = statusMap[status] ?? ApprovalStatus.PENDING;
    }
    if (raisedBy) {
      filter['raisedBy'] = raisedBy;
    }
    const docs = await this.issueModel.find(filter).sort({ createdAt: -1 }).exec();
    return docs.map((d) => this.toIssueDto(d));
  }

  @Get(':id')
  async getIssue(@Param('id') id: string) {
    const doc = await this.issueModel.findOne({ issueId: id }).exec();
    if (!doc) return null;
    return this.toIssueDto(doc);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; resolution?: string },
  ) {
    const statusMap: Record<string, ApprovalStatus> = {
      queue: ApprovalStatus.PENDING,
      review: ApprovalStatus.PENDING,
      resolved: ApprovalStatus.APPROVED,
    };
    const update: Record<string, unknown> = {
      status: statusMap[body.status] ?? ApprovalStatus.PENDING,
    };
    if (body.resolution) {
      (update as any).resolution = body.resolution;
    }
    const doc = await this.issueModel
      .findOneAndUpdate({ issueId: id }, update, { new: true })
      .exec();
    if (!doc) return null;
    // Notify issue owner when resolved
    if (body.status === 'resolved' && doc.raisedBy) {
      this.notificationModel.create({
        recipientEmail: doc.raisedBy,
        title: 'Issue resolved',
        body: `Your issue "${(doc as any).title}" has been marked as resolved.`,
        type: 'issue_resolved',
        issueId: id,
        read: false,
      }).catch(() => {});
    }
    return this.toIssueDto(doc);
  }

  @Post(':id/replies')
  async addReply(@Param('id') id: string, @Body() dto: PostReplyDto) {
    const reply: Reply = {
      author: dto.author,
      role: dto.role,
      text: dto.text,
      time: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const doc = await this.issueModel
      .findOneAndUpdate(
        { issueId: id },
        {
          $push: { replies: reply },
          $set: { status: ApprovalStatus.PENDING },
        },
        { new: true },
      )
      .exec();
    if (!doc) return null;
    // Notify the issue owner about the new reply (fire-and-forget)
    if (doc.raisedBy) {
      this.notificationModel.create({
        recipientEmail: doc.raisedBy,
        title: 'New reply on your issue',
        body: `${dto.author} replied to your issue "${(doc as any).title}".`,
        type: 'reply_received',
        issueId: id,
        read: false,
      }).catch(() => {});
    }
    return this.toIssueDto(doc);
  }

  private toIssueDto(
    doc: PendingApprovalDocument & { issueId?: string; replies?: Reply[]; resolution?: string },
  ) {
    return {
      id: doc.issueId,
      title: (doc as any).title,
      category: (doc as any).category,
      description: (doc as any).description,
      urgency: (doc as any).urgency,
      status: (doc as any).status === ApprovalStatus.PENDING
        ? 'queue'
        : (doc as any).status === ApprovalStatus.APPROVED
        ? 'resolved'
        : 'queue',
      raisedBy: doc.raisedBy,
      raisedByName: (doc as any).raisedByName,
      date: (doc as any).date,
      replies: (doc as any).replies ?? [],
      resolution: (doc as any).resolution,
    };
  }
}