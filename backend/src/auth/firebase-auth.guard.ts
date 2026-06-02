import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string; 'x-user-email'?: string };
      user?: { uid?: string; email: string; role: string };
    }>();

    const authHeader = request.headers.authorization;
    const userEmailHeader = request.headers['x-user-email'];

    // ── Prototype bypass: allow local mock admin account ──────────────────
    // Frontend sends Authorization: <email> (no "Bearer " prefix) when
    // logged in without Firebase. Guard also receives x-user-email header.
    if (
      authHeader &&
      !authHeader.startsWith('Bearer ') &&
      userEmailHeader === 'admin@vins.in' &&
      authHeader.trim() === 'admin@vins.in'
    ) {
      request.user = { email: 'admin@vins.in', role: 'admin' };
      return true;
    }
    // ─────────────────────────────────────────────────────────────────────

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const idToken = authHeader.slice(7);

    try {
      const decoded = await this.firebaseService.verifyIdToken(idToken);
      request.user = {
        uid: decoded.uid,
        email: decoded.email ?? '',
        role: (decoded['role'] as string) ?? 'STUDENT',
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }
}