import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import type { AppUser, Booking, CameroonCity, PaymentFlow, PromoBanner, Review } from '../types/models';

function withId<T>(snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export function subscribeToAllUsers(onData: (users: AppUser[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => onData(withId<AppUser>(snapshot)), onError);
}

export function subscribeToAllBookings(onData: (bookings: Booking[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'bookings'), (snapshot) => onData(withId<Booking>(snapshot)), onError);
}

export function subscribeToPaymentFlows(onData: (payments: PaymentFlow[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'payments'), (snapshot) => onData(withId<PaymentFlow>(snapshot)), onError);
}

export function subscribeToReviews(onData: (reviews: Review[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'reviews'), (snapshot) => onData(withId<Review>(snapshot)), onError);
}

export function subscribeToPromoBanners(onData: (banners: PromoBanner[]) => void, onError: () => void) {
  return onSnapshot(collection(db, 'promoBanners'), (snapshot) => onData(withId<PromoBanner>(snapshot)), onError);
}

export function updateUserAdminStatus(userId: string, payload: Partial<AppUser>) {
  return updateDoc(doc(db, 'users', userId), payload);
}

export function updateBookingAdminFields(bookingId: string, payload: Partial<Booking>) {
  return updateDoc(doc(db, 'bookings', bookingId), payload);
}

export function updateReviewModeration(reviewId: string, payload: Partial<Review>) {
  return updateDoc(doc(db, 'reviews', reviewId), payload);
}

export function createPromoBanner(payload: Omit<PromoBanner, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'promoBanners'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export function updatePromoBanner(bannerId: string, payload: Partial<PromoBanner>) {
  return updateDoc(doc(db, 'promoBanners', bannerId), payload);
}

export function createAdminNotification(payload: {
  audience: 'all' | 'clients' | 'owners' | 'drivers';
  city?: CameroonCity;
  message: string;
  title: string;
}) {
  return addDoc(collection(db, 'adminNotifications'), {
    ...payload,
    status: 'draft',
    createdAt: serverTimestamp(),
  });
}

export async function sendAdminNotification(notificationId: string) {
  const endpoint = process.env.EXPO_PUBLIC_NOTIFICATIONS_API_URL;

  if (!endpoint) {
    throw new Error('EXPO_PUBLIC_NOTIFICATIONS_API_URL manquant.');
  }

  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notificationId }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "L'envoi de notification a echoue.");
  }

  return response.json() as Promise<{ failedCount: number; sentCount: number }>;
}

export function updatePlatformFinanceSettings(payload: { commissionRate: number }) {
  return setDoc(doc(db, 'adminSettings', 'finance'), payload, { merge: true });
}

export function updatePlatformSecuritySettings(payload: { defaultDepositAmount?: number; rentalCommissionRate?: number }) {
  return setDoc(doc(db, 'adminSettings', 'security'), payload, { merge: true });
}

export function updateCoveredCities(cities: CameroonCity[]) {
  return setDoc(doc(db, 'adminSettings', 'coverage'), { cities }, { merge: true });
}
