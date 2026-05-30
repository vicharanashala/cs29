import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('api/admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending')
  getPending() {
    return this.adminService.getPending();
  }

  @Patch('pending/:id/approve')
  approvePending(@Param('id') id: string) {
    return this.adminService.approvePending(id);
  }

  @Patch('pending/:id/reject')
  rejectPending(@Param('id') id: string) {
    return this.adminService.rejectPending(id);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('faqs')
  getAllFaqs() {
    return this.adminService.getAllFaqs();
  }

  @Post('faqs')
  createFaq(
    @Body() body: { question: string; answer: string; category: string },
  ) {
    return this.adminService.createFaq(body);
  }

  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.adminService.deleteFaq(id);
  }
}
