import { Controller, Post, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './users/schemas/user.schema';

@Controller('api/rewards')
export class RewardsController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /** Award 10 points to a user when their answer gets approved */
  @Post('answer/:email')
  async awardAnswerPoints(@Param('email') email: string) {
    const user = await this.userModel.findOneAndUpdate(
      { email },
      { $inc: { reward_points: 10, answered_count: 1 } },
      { new: true, projection: { email: 1, name: 1, reward_points: 1, answered_count: 1 } },
    );
    if (!user) return { success: false, message: 'User not found' };
    return { success: true, reward_points: user.reward_points, answered_count: user.answered_count };
  }

  /** Top 10 students by reward points */
  @Get('leaderboard')
  async getLeaderboard() {
    const users = await this.userModel
      .find({ role: UserRole.STUDENT })
      .sort({ reward_points: -1 })
      .limit(10)
      .select('name email reward_points answered_count questions_asked')
      .lean();

    return users.map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      email: u.email,
      reward_points: u.reward_points ?? 0,
      answered_count: u.answered_count ?? 0,
      questions_asked: u.questions_asked ?? 0,
    }));
  }

  /** Get a user's current points and computed rank */
  @Get('my-points/:email')
  async getMyPoints(@Param('email') email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('name email reward_points answered_count questions_asked')
      .lean();

    if (!user) return { found: false };

    // Rank = count of students with strictly more points + 1
    const rank = await this.userModel.countDocuments({
      role: UserRole.STUDENT,
      reward_points: { $gt: user.reward_points ?? 0 },
    });

    return {
      found: true,
      name: user.name,
      email: user.email,
      reward_points: user.reward_points ?? 0,
      answered_count: user.answered_count ?? 0,
      questions_asked: user.questions_asked ?? 0,
      rank: rank + 1,
    };
  }
}
