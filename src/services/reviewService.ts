import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

import { auth, db } from './firebase';
import { assertOnlineForAction } from './networkGuard';
import type { Review, ReviewTargetType } from '../types/models';

export type CreateReviewPayload = {
  authorId: string;
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment: string;
  bookingId: string;
};

function getReviewEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_SUBMIT_REVIEW_API_URL;
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/submitReview` : undefined;
}

export async function submitReview(payload: CreateReviewPayload): Promise<void> {
  await assertOnlineForAction();

  const endpoint = getReviewEndpoint();
  if (!endpoint) {
    throw new Error('Endpoint submitReview manquant.');
  }

  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookingId: payload.bookingId,
      comment: payload.comment,
      rating: payload.rating,
      targetId: payload.targetId,
      targetType: payload.targetType,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "L'avis n'a pas pu etre envoye.");
  }
}

export function markBookingReviewSubmitted(_bookingId: string): Promise<void> {
  return updateDoc(doc(db, 'bookings', _bookingId), { reviewSubmitted: true });
}

export function markDriverReviewSubmitted(_bookingId: string): Promise<void> {
  return updateDoc(doc(db, 'bookings', _bookingId), { driverReviewSubmitted: true });
}

export function subscribeToCarReviews(
  carId: string,
  onData: (reviews: Review[]) => void,
  onError: () => void,
) {
  return onSnapshot(
    query(
      collection(db, 'reviews'),
      where('targetId', '==', carId),
      where('targetType', '==', 'car'),
      where('status', '==', 'published'),
    ),
    (snap) => onData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Review)),
    onError,
  );
}
