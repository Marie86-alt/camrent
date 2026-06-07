import { createUserWithEmailAndPassword, deleteUser, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { findDemoUser } from './demoData';
import { auth, db } from './firebase';
import { hasFirebaseConfig } from './firebase';
import { useAuthStore } from '../store/authStore';
import type { AppUser, CameroonCity, UserRole } from '../types/models';
import { normalizeCameroonPhone } from '../utils/validation';

export type RegisterPayload = {
  city: CameroonCity;
  documents?: AppUser['documents'];
  driverProfile?: AppUser['driverProfile'];
  email: string;
  fullName: string;
  password: string;
  phone: string;
  role: UserRole;
  status?: AppUser['status'];
  kycStatus?: AppUser['kycStatus'];
};

export async function loginWithEmail(email: string, password: string) {
  if (!hasFirebaseConfig) {
    const demoUser = findDemoUser(email, password);
    if (!demoUser) {
      throw new Error('Invalid demo credentials');
    }

    return { user: demoUser };
  }

  const credentials = await signInWithEmailAndPassword(auth, email.trim(), password);
  const userSnapshot = await getDoc(doc(db, 'users', credentials.user.uid));

  if (!userSnapshot.exists()) {
    throw new Error('user-profile-not-found');
  }

  return {
    user: {
      id: credentials.user.uid,
      ...userSnapshot.data(),
    } as AppUser,
  };
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

  const userData = {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: normalizedPhone,
    role: payload.role,
    city: payload.city,
    createdAt: serverTimestamp(),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.kycStatus ? { kycStatus: payload.kycStatus } : {}),
    ...(payload.documents ? { documents: payload.documents } : {}),
    ...(payload.driverProfile ? { driverProfile: payload.driverProfile } : {}),
  };

  await setDoc(doc(db, 'users', credentials.user.uid), userData);

  return {
    id: credentials.user.uid,
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: normalizedPhone,
    role: payload.role,
    city: payload.city,
    createdAt: new Date(),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.kycStatus ? { kycStatus: payload.kycStatus } : {}),
    ...(payload.documents ? { documents: payload.documents } : {}),
    ...(payload.driverProfile ? { driverProfile: payload.driverProfile } : {}),
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

export function updateUserProfile(userId: string, payload: Partial<AppUser>) {
  return updateDoc(doc(db, 'users', userId), payload);
}
