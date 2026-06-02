import { Controller, Get, Patch, Param, Post, Body } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notifications/schemas/notification.schema';
import { User, UserDocument, UserRole } from './users/schemas/user.schema';

@Controller('api/notifications')
export class NotificationsController {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Get all notifications for a user, newest first */
  @Get(':email')
  async getForUser(@Param('email') email: string) {
    // Automatically ensure this user exists in MongoDB so they receive broadcasts (Issue fix)
    if (email && email.includes('@') && email !== 'admin@vins.in') {
      const userExists = await this.userModel.exists({ email });
      if (!userExists) {
        try {
          await this.userModel.create({
            email,
            name: email.split('@')[0],
            role: UserRole.STUDENT,
            reward_points: 0,
            bookmarks: [],
          });
          // Optimistically copy any existing announcements so they get them immediately
          const recentAnnouncements = await this.notificationModel
            .find({ type: 'announcement' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
          if (recentAnnouncements.length > 0) {
            const newNotifs = recentAnnouncements.map((ann) => ({
              recipientEmail: email,
              title: ann.title,
              body: ann.body,
              type: 'announcement',
              read: false,
            }));
            await this.notificationModel.insertMany(newNotifs);
          }
        } catch (err) {
          console.error('Failed to auto-create user on notification poll:', err);
        }
      }
    }

    return this.notificationModel
      .find({ recipientEmail: email })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  /** Mark all notifications as read for a user — MUST be declared before :id/read to avoid route clash */
  @Patch('read-all/:email')
  async markAllRead(@Param('email') email: string) {
    await this.notificationModel.updateMany(
      { recipientEmail: email, read: false },
      { read: true },
    );
    return { success: true };
  }

  /** Mark a single notification as read */
  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationModel
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .lean();
  }

  /** Broadcast a notification to all users */
  @Post('broadcast')
  async broadcast(@Body() body: { title: string; body: string; type: any; issueId?: string }) {
    const users = await this.userModel.find({}, 'email').lean();
    const notifications = users.map((u) => ({
      recipientEmail: u.email,
      title: body.title,
      body: body.body,
      type: body.type,
      issueId: body.issueId,
      read: false,
    }));
    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
    return { success: true, count: notifications.length };
  }
}
