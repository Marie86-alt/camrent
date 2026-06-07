import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '../firebase';

type BookingNotificationPayload = {
  carBrand?: string;
  carModel?: string;
  clientId?: string;
  driverId?: string;
  ownerId?: string;
  totalDays?: number;
  totalPrice?: number;
};

async function sendExpoPush(userId: string, title: string, body: string) {
  const userSnapshot = await db.collection('users').doc(userId).get();
  const tokens = (userSnapshot.data()?.expoPushTokens ?? []) as string[];

  if (tokens.length === 0) {
    return;
  }

  const messages = tokens.map((token) => ({
    body,
    data: { type: 'booking_created' },
    sound: 'default',
    title,
    to: token,
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    body: JSON.stringify(messages),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}

export async function handleBookingCreated(snapshot: QueryDocumentSnapshot) {
  const booking = snapshot.data() as BookingNotificationPayload;
  const carLabel = `${booking.carBrand ?? 'Vehicule'} ${booking.carModel ?? ''}`.trim();
  const duration = `${booking.totalDays ?? 1} jour${(booking.totalDays ?? 1) > 1 ? 's' : ''}`;

  const tasks: Array<Promise<void>> = [];

  if (booking.ownerId) {
    tasks.push(
      sendExpoPush(
        booking.ownerId,
        'Nouvelle reservation',
        `${carLabel} a ete reserve pour ${duration}.`,
      ),
    );
  }

  if (booking.driverId) {
    tasks.push(
      sendExpoPush(
        booking.driverId,
        'Nouvelle mission chauffeur',
        `Mission demandee pour ${carLabel} sur ${duration}.`,
      ),
    );
  }

  await Promise.allSettled(tasks);
}
