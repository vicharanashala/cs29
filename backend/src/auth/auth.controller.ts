import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

interface AuthRequest {
  user: { uid: string; email: string; role: string };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/sync
   * Called by the frontend after every Firebase sign-in (email/password or Google).
   * Requires a valid Firebase ID token in the Authorization header.
   * Upserts the user in MongoDB and returns the canonical user object with role.
   */
  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  sync(
    @Request() req: AuthRequest,
    @Body() body: { name?: string },
  ) {
    const name = body.name?.trim() || req.user.email.split('@')[0];
    return this.authService.syncUser(req.user.uid, req.user.email, name);
  }
}
