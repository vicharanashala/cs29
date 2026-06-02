import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FaqController } from './faq.controller';
import { ChatController } from './chat.controller';
import { IssueController } from './issue.controller';
import { AuthController as LaganAuthController, UserController } from './auth.controller';
import { RewardsController } from './rewards.controller';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from './notifications/schemas/notification.schema';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { FAQ, FAQSchema } from './faqs/schemas/faq.schema';
import { PendingFaq, PendingFaqSchema } from './faqs/schemas/pending-faq.schema';
import { PendingApproval, PendingApprovalSchema } from './pending-approvals/schemas/pending-approval.schema';
import { User, UserSchema } from './users/schemas/user.schema';
import { AiService } from './ai/ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    MongooseModule.forFeature([
      { name: FAQ.name, schema: FAQSchema },
      { name: PendingFaq.name, schema: PendingFaqSchema },
      { name: PendingApproval.name, schema: PendingApprovalSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
    AdminModule,
  ],
  controllers: [
    AppController,
    FaqController,
    ChatController,
    IssueController,
    LaganAuthController,
    UserController,
    RewardsController,
    NotificationsController,
  ],
  providers: [AppService, AiService],
})
export class AppModule {}
