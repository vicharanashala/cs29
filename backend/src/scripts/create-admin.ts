// Run with: npx ts-node -r tsconfig-paths/register src/scripts/create-admin.ts
// Creates (or resets) the default admin user for the VINS FAQ Portal.
// Email: admin@vicharanashala.in  |  Password: Admin@2026
import 'dotenv/config';
import mongoose from 'mongoose';
import * as admin from 'firebase-admin';
import { UserSchema, UserRole } from '../users/schemas/user.schema';

const ADMIN_EMAIL    = 'admin@vicharanashala.in';
const ADMIN_PASSWORD = 'Admin@2026';
const ADMIN_NAME     = 'VINS Admin';

function initFirebase() {
  if (admin.apps.length === 0) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
    const privateKey = rawKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

async function createAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Error: MONGO_URI is not set in .env');
    process.exit(1);
  }

  initFirebase();

  try {
    // ── 1. Firebase: get or create the admin user ──────────────────────────
    console.log('Setting up Firebase admin user…');
    let firebaseUser: admin.auth.UserRecord;

    try {
      firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`Firebase user exists: ${firebaseUser.uid}`);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        firebaseUser = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: ADMIN_NAME,
          emailVerified: true,
        });
        console.log(`Firebase user created: ${firebaseUser.uid}`);
      } else {
        throw e;
      }
    }

    // ── 2. Set ADMIN custom claim ─────────────────────────────────────────
    await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'ADMIN' });
    console.log('ADMIN custom claim set on Firebase user.');

    // ── 3. MongoDB: upsert the admin record ───────────────────────────────
    console.log('Connecting to MongoDB…');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const UserModel =
      mongoose.models.User ?? mongoose.model('User', UserSchema, 'users');

    const result = await UserModel.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          firebaseUid: firebaseUser.uid,
          role: UserRole.ADMIN,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`Admin user ready: ${result.email} (role: ${result.role})`);
    console.log(`\nCredentials:\n  Email:    ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}\n`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

createAdmin();
