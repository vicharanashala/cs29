import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { FirebaseService } from './firebase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Upserts a MongoDB user record after successful Firebase authentication.
   * The role is sourced from the Firebase custom claim `role`; defaults to STUDENT.
   */
  async syncUser(
    uid: string,
    email: string,
    name: string,
  ): Promise<{ user: { id: string; name: string; email: string; role: UserRole } }> {
    const firebaseUser = await this.firebaseService.getUser(uid);
    const claimedRole = (firebaseUser.customClaims as Record<string, unknown> | null)?.role;
    const role = claimedRole === 'ADMIN' ? UserRole.ADMIN : UserRole.STUDENT;

    const user = await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { firebaseUid: uid, name, role } },
      { upsert: true, new: true },
    );

    return {
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
