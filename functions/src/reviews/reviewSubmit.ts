import { FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';

const MIN_REVIEWS_FOR_AUTOSUSPEND = 3;
const AUTO_SUSPEND_THRESHOLD = 2;

type SubmitReviewRequest = {
  bookingId?: string;
  comment?: string;
  rating?: number;
  targetId?: string;
  targetType?: 'car' | 'driver';
};

function assertRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('La note doit etre comprise entre 1 et 5.');
  }
  return rating;
}

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} est requis.`);
  }
  return value.trim();
}

async function recalculateDriverRating(driverId: string) {
  const snap = await db
    .collection('reviews')
    .where('targetId', '==', driverId)
    .where('targetType', '==', 'driver')
    .where('status', '==', 'published')
    .get();

  const ratings = snap.docs.map((doc) => Number(doc.data().rating)).filter((rating) => Number.isFinite(rating));
  if (ratings.length === 0) return;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const rounded = Math.round(average * 10) / 10;
  const update: Record<string, unknown> = {
    missionsCount: ratings.length,
    ratingAverage: rounded,
  };

  if (ratings.length >= MIN_REVIEWS_FOR_AUTOSUSPEND && average <= AUTO_SUSPEND_THRESHOLD) {
    update.status = 'suspended';
    update.adminLastActionReason = `Suspension automatique : note moyenne ${rounded}/5 sur ${ratings.length} avis`;
  }

  await db.collection('users').doc(driverId).update(update);
}

export async function handleSubmitReview(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const body = request.body as SubmitReviewRequest;
  const bookingId = assertString(body.bookingId, 'bookingId');
  const targetId = assertString(body.targetId, 'targetId');
  const targetType = assertString(body.targetType, 'targetType') as 'car' | 'driver';
  const rating = assertRating(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

  if (targetType !== 'car' && targetType !== 'driver') {
    throw new Error('Type d avis invalide.');
  }

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnapshot = await bookingRef.get();
  if (!bookingSnapshot.exists) {
    throw new Error('Reservation introuvable.');
  }

  const booking = bookingSnapshot.data() ?? {};
  if (booking.clientId !== uid) {
    throw new Error('Seul le client de la reservation peut laisser un avis.');
  }

  if (booking.status !== 'completed') {
    throw new Error('La reservation doit etre terminee pour laisser un avis.');
  }

  if (targetType === 'car' && booking.carId !== targetId) {
    throw new Error('Voiture invalide pour cette reservation.');
  }

  if (targetType === 'driver' && booking.driverId !== targetId) {
    throw new Error('Chauffeur invalide pour cette reservation.');
  }

  const existingReviewSnapshot = await db
    .collection('reviews')
    .where('bookingId', '==', bookingId)
    .where('targetId', '==', targetId)
    .where('targetType', '==', targetType)
    .limit(1)
    .get();

  if (!existingReviewSnapshot.empty) {
    throw new Error('Un avis existe deja pour cette reservation.');
  }

  await db.collection('reviews').add({
    authorId: uid,
    bookingId,
    comment,
    createdAt: FieldValue.serverTimestamp(),
    rating,
    status: 'published',
    targetId,
    targetType,
  });

  if (targetType === 'driver') {
    await recalculateDriverRating(targetId);
    await bookingRef.update({ driverReviewSubmitted: true });
  } else {
    await bookingRef.update({ reviewSubmitted: true });
  }

  sendJson(response, 201, { status: 'published' });
}
