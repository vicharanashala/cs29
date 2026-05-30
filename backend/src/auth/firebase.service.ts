import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    if (admin.apps.length === 0) {
      try {
        const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
        const privateKey = rawKey.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });

        this.logger.log('Firebase Admin SDK initialized');
      } catch (err) {
        // Missing or invalid Firebase credentials — admin auth guard will reject requests
        // but the rest of the application continues to operate normally.
        this.logger.warn(
          'Firebase Admin SDK initialization failed (admin routes will return 401): ' +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUser(uid);
  }

  async setAdminClaim(uid: string): Promise<void> {
    await admin.auth().setCustomUserClaims(uid, { role: 'ADMIN' });
    this.logger.log(`Set ADMIN custom claim on Firebase user: ${uid}`);
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return admin.auth().getUserByEmail(email);
  }

  async createUser(params: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<admin.auth.UserRecord> {
    return admin.auth().createUser(params);
  }
}
