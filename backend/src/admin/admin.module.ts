import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { FAQ, FAQSchema } from '../faqs/schemas/faq.schema';
import { PendingFaq, PendingFaqSchema } from '../faqs/schemas/pending-faq.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: FAQ.name, schema: FAQSchema },
      { name: PendingFaq.name, schema: PendingFaqSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
