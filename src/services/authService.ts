import { createUserWithEmailAndPassword, deleteUser, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { findDemoUser } from './demoData';
import { auth, db } from './firebase';
import { hasFirebaseConfig } from './firebase';
import { useAuthStore } from '../store/authStore';
import type { CameroonCity, UserRole } from '../types/models';
import { normalizeCameroonPhone } from '../utils/validation';

export type RegisterPayload = {
  city: CameroonCity;
  email: string;
  fullName: string;
  password: string;
  phone: string;
  role: UserRole;
};

export async function loginWithEmail(email: string, password: string) {
  if (!hasFirebaseConfig) {
    const demoUser = findDemoUser(email, password);
    if (!demoUser) {
      throw new Error('Invalid demo credentials');
    }

    return { user: demoUser };
  }

  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithEmail(payload: RegisterPayload) {
  if (!hasFirebaseConfig) {
    return {
      id: `demo-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: normalizeCameroonPhone(payload.phone),
      role: payload.role,
      city: payload.city,
      createdAt: new Date(),
    };
  }

  const credentials = await createUserWithEmailAndPassword(auth, payload.email.trim(), payload.password);
  const normalizedPhone = normalizeCameroonPhone(payload.phone);

  await setDoc(doc(db, 'users', credentials.user.uid), {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: normalizedPhone,
    role: payload.role,
    city: payload.city,
    createdAt: serverTimestamp(),
  });

  return {
    id: credentials.user.uid,
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: normalizedPhone,
    role: payload.role,
    city: payload.city,
    createdAt: new Date(),
  };
}

export function resetPassword(email: string) {
  if (!hasFirebaseConfig) {
    return Promise.resolve(email);
  }

  return sendPasswordResetEmail(auth, email.trim());
}

export function logout() {
  if (!hasFirebaseConfig) {
    useAuthStore.getState().setUser(null);
    return Promise.resolve();
  }

  return signOut(auth);
}

export async function deleteAccount(userId: string) {
  if (!hasFirebaseConfig) {
    useAuthStore.getState().setUser(null);
    return;
  }

  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  await deleteDoc(doc(db, 'users', userId));
  await deleteUser(auth.currentUser);
}
