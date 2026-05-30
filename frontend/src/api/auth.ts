import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import apiClient from './client';

export interface SyncedUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

/** Email + password sign-in via Firebase */
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

/** Register a new account, set display name, send verification email */
export const registerWithEmail = async (
  name: string,
  email: string,
  password: string,
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user);
  return cred;
};

/** Google OAuth popup sign-in */
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

/** Sign out of Firebase */
export const logout = () => signOut(auth);

/** Send password-reset email via Firebase */
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

/**
 * POST /api/auth/sync
 * Called after every Firebase sign-in to upsert the user in MongoDB
 * and get back the canonical user object (including role).
 */
export const syncUser = async (
  firebaseUser: FirebaseUser,
): Promise<{ user: SyncedUser }> => {
  const idToken = await firebaseUser.getIdToken();
  const name =
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'User';

  const { data } = await apiClient.post<{ user: SyncedUser }>(
    '/api/auth/sync',
    { name },
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  return data;
};
