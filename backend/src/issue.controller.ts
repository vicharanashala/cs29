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
  authorEmail?: string;
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
  authorEmail: string;
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

    // Notify other users about the new query to resolve (fire-and-forget)
    this.userModel.find({ email: { $ne: dto.raisedBy } }, 'email').lean().exec()
      .then((users) => {
        const notifications = users.map((u) => ({
          recipientEmail: u.email,
          title: 'New query to resolve',
          body: `A new query has been posted: "${saved.title}". Can you help resolve it?`,
          type: 'new_query',
          issueId: saved.issueId,
          read: false,
        }));
        if (notifications.length > 0) {
          return this.notificationModel.insertMany(notifications);
        }
      })
      .catch((err) => console.error('Failed to broadcast new query notification:', err));

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
    @Body() body: {
   status: string;
   resolution?: string;
   awardPoints?: number;
    peerEmail?: string;
   peerPoints?: number;
   },
  ) {
    const statusMap: Record<string, ApprovalStatus> = {
      queue: ApprovalStatus.PENDING,
      review: ApprovalStatus.PENDING,
      resolved: ApprovalStatus.APPROVED,
    };

    // Atomic update: resolve status + mark spAwarded in ONE call.
    // The $set: { spAwarded: true } always runs, but if spAwarded was already
    // true the document won't match the filter — so we use a subdocument update
    // to track whether we actually performed the SP-awarding pass.
    const filter = { issueId: id };
    const updateBase: Record<string, unknown> = {
      status: statusMap[body.status] ?? ApprovalStatus.PENDING,
    };
    if (body.resolution) {
      (updateBase as any).resolution = body.resolution;
    }

    // Find doc BEFORE any spAwarded update so we know original state
    const doc = await this.issueModel.findOne({ issueId: id }).exec();
    if (!doc) return null;

    // Now apply status change (always)
    await this.issueModel.updateOne({ issueId: id }, { $set: updateBase }).exec();

    // Award SP only on first call where SP > 0 (idempotency guard).
    // spAwarded is ONLY set when we actually awarded SP — not on the
    // resolve-only call (awardPoints=0). This allows the 2-step flow:
    //   Step 1: resolve (awardPoints=0) → spAwarded stays false
    //   Step 2: publish FAQ (awardPoints=10) → SP awarded, spAwarded=true
    const spWasAwarded =
      (body.awardPoints != null && body.awardPoints > 0 && !!doc.raisedBy) ||
      (!!body.peerEmail && body.peerPoints != null && body.peerPoints > 0);

    if (doc.spAwarded !== true && spWasAwarded) {
      if (body.awardPoints && body.awardPoints > 0 && doc.raisedBy) {
        await this.userModel.updateOne(
          { email: doc.raisedBy },
          { $inc: { reward_points: body.awardPoints } },
          { upsert: true },
        );
      }
      if (body.peerEmail && body.peerPoints && body.peerPoints > 0) {
        await this.userModel.updateOne(
          { email: body.peerEmail },
          { $inc: { reward_points: body.peerPoints, answered_count: 1 } },
          { upsert: true },
        );
      }
      // Mark SP as awarded in DB — only set when we actually awarded
      await this.issueModel.updateOne(
        { issueId: id },
        { $set: { spAwarded: true } }
      );
    }

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
      authorEmail: dto.authorEmail,
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