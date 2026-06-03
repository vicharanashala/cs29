import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './users/schemas/user.schema';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class LoginDto {
  email: string;
  role: 'student' | 'admin';
}

class SignupDto {
  name: string;
  email: string;
  role: 'student' | 'admin';
  cvFileName?: string;
}

class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  alternateEmail?: string;
  mobile?: string;
  collegeName?: string;
  collegeAddress?: string;
  collegeWebsite?: string;
  departmentName?: string;
  departmentWebpage?: string;
  programme?: string;
  branch?: string;
  gpa?: string;
}

// ── Auth Controller ────────────────────────────────────────────────────────────

@Controller('api/auth')
export class AuthController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    // Hardcoded mock admin — for prototype only
    if (dto.role === 'admin' && dto.email === 'admin@vins.in') {
      return {
        name: 'Super Admin',
        email: dto.email,
        role: 'admin' as const,
      };
    }

    if (dto.role === 'admin') {
      throw new Error('Invalid admin credentials');
    }

    // For students — find existing or create mock user
    let user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      user = await this.userModel.create({
        email: dto.email,
        name: dto.email.split('@')[0],
        role: UserRole.STUDENT,
        reward_points: 0,
        bookmarks: [],
      });
    }

    return {
      name: (user as any).name,
      email: user.email,
      role: (user as any).role?.toLowerCase() ?? 'student',
    };
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      // Return existing user
      return {
        name: (existing as any).name,
        email: existing.email,
        role: (existing as any).role?.toLowerCase() ?? 'student',
      };
    }

    const user = await this.userModel.create({
      email: dto.email,
      name: dto.name,
      role: UserRole.STUDENT,
      reward_points: 0,
      bookmarks: [],
      cvFileName: dto.cvFileName,
    });

    return {
      name: dto.name,
      email: dto.email,
      role: 'student',
    };
  }
}

// ── User Controller ────────────────────────────────────────────────────────────

@Controller('api/users')
export class UserController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Get(':email')
  async getUser(@Param('email') email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      // Return mock so frontend doesn't break
      return {
        name: email.split('@')[0],
        email,
        role: 'student',
        firstName: '',
        lastName: '',
        alternateEmail: '',
        mobile: '',
        collegeName: '',
        collegeAddress: '',
        collegeWebsite: '',
        departmentName: '',
        departmentWebpage: '',
        programme: '',
        branch: '',
        gpa: '',
      };
    }
    return {
      name: (user as any).name,
      email: user.email,
      role: (user as any).role?.toLowerCase() ?? 'student',
      firstName: (user as any).firstName ?? '',
      lastName: (user as any).lastName ?? '',
      alternateEmail: (user as any).alternateEmail ?? '',
      mobile: (user as any).mobile ?? '',
      collegeName: (user as any).collegeName ?? '',
      collegeAddress: (user as any).collegeAddress ?? '',
      collegeWebsite: (user as any).collegeWebsite ?? '',
      departmentName: (user as any).departmentName ?? '',
      departmentWebpage: (user as any).departmentWebpage ?? '',
      programme: (user as any).programme ?? '',
      branch: (user as any).branch ?? '',
      gpa: (user as any).gpa ?? '',
      reward_points: (user as any).reward_points ?? 0,
      bookmarks: (user as any).bookmarks ?? [],
    };
  }

  @Patch(':email')
  async updateUser(
    @Param('email') email: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      // Create with defaults
      const newUser = await this.userModel.create({
        email,
        name: email.split('@')[0],
        role: UserRole.STUDENT,
        reward_points: 0,
        bookmarks: [],
        ...dto,
      });
      return newUser;
    }

    const fields: Record<string, unknown> = {};
    if (dto.firstName !== undefined) (fields as any).firstName = dto.firstName;
    if (dto.lastName !== undefined) (fields as any).lastName = dto.lastName;
    if (dto.alternateEmail !== undefined) (fields as any).alternateEmail = dto.alternateEmail;
    if (dto.mobile !== undefined) (fields as any).mobile = dto.mobile;
    if (dto.collegeName !== undefined) (fields as any).collegeName = dto.collegeName;
    if (dto.collegeAddress !== undefined) (fields as any).collegeAddress = dto.collegeAddress;
    if (dto.collegeWebsite !== undefined) (fields as any).collegeWebsite = dto.collegeWebsite;
    if (dto.departmentName !== undefined) (fields as any).departmentName = dto.departmentName;
    if (dto.departmentWebpage !== undefined) (fields as any).departmentWebpage = dto.departmentWebpage;
    if (dto.programme !== undefined) (fields as any).programme = dto.programme;
    if (dto.branch !== undefined) (fields as any).branch = dto.branch;
    if (dto.gpa !== undefined) (fields as any).gpa = dto.gpa;

    const updated = await this.userModel
      .findOneAndUpdate({ email }, { $set: fields }, { returnDocument: 'after' })
      .exec();

    return updated
      ? {
          name: (updated as any).name,
          email: updated.email,
          role: (updated as any).role?.toLowerCase() ?? 'student',
          firstName: (updated as any).firstName ?? '',
          lastName: (updated as any).lastName ?? '',
          alternateEmail: (updated as any).alternateEmail ?? '',
          mobile: (updated as any).mobile ?? '',
          collegeName: (updated as any).collegeName ?? '',
          collegeAddress: (updated as any).collegeAddress ?? '',
          collegeWebsite: (updated as any).collegeWebsite ?? '',
          departmentName: (updated as any).departmentName ?? '',
          departmentWebpage: (updated as any).departmentWebpage ?? '',
          programme: (updated as any).programme ?? '',
          branch: (updated as any).branch ?? '',
          gpa: (updated as any).gpa ?? '',
          reward_points: (updated as any).reward_points ?? 0,
          bookmarks: (updated as any).bookmarks ?? [],
        }
      : null;
  }
}