import { Controller, Get, Patch, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notifications/schemas/notification.schema';

@Controller('api/notifications')
export class NotificationsController {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /** Get all notifications for a user, newest first */
  @Get(':email')
  async getForUser(@Param('email') email: string) {
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
}
