import type { Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../firebase';
import { getAuthenticatedUid, sendJson } from '../http';

type NotificationAudience = 'all' | 'clients' | 'owners' | 'drivers';

type AdminNotification = {
  audience?: NotificationAudience;
  city?: string;
  message?: string;
  title?: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  data?: Record<string, string>;
};

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function assertAdmin(request: Request) {
  const uid = await getAuthenticatedUid(request);

  if (!uid) {
    throw new Error('Authentication required');
  }

  const userSnapshot = await db.collection('users').doc(uid).get();

  if (userSnapshot.data()?.role !== 'admin') {
    throw new Error('Admin role required');
  }

  return uid;
}

async function collectTargetTokens(notification: AdminNotification) {
  let usersQuery: FirebaseFirestore.Query = db.collection('users');

  if (notification.audience && notification.audience !== 'all') {
    const roleByAudience: Record<Exclude<NotificationAudience, 'all'>, string> = {
      clients: 'client',
      owners: 'owner',
      drivers: 'driver',
    };

    usersQuery = usersQuery.where('role', '==', roleByAudience[notification.audience]);
  }

  if (notification.city) {
    usersQuery = usersQuery.where('city', '==', notification.city);
  }

  const usersSnapshot = await usersQuery.get();
  const tokens = new Set<string>();

  usersSnapshot.forEach((userDocument) => {
    const expoPushTokens = userDocument.data().expoPushTokens;

    if (!Array.isArray(expoPushTokens)) {
      return;
    }

    expoPushTokens.forEach((token) => {
      if (typeof token === 'string' && token.startsWith('ExponentPushToken[')) {
        tokens.add(token);
      }
    });
  });

  return [...tokens];
}

async function sendExpoPushMessages(messages: ExpoPushMessage[]) {
  let sentCount = 0;
  let failedCount = 0;

  for (const messageChunk of chunk(messages, 100)) {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageChunk),
    });

    if (!response.ok) {
      failedCount += messageChunk.length;
      continue;
    }

    const payload = (await response.json()) as { data?: Array<{ status?: string }> };

    for (const ticket of payload.data ?? []) {
      if (ticket.status === 'ok') {
        sentCount += 1;
      } else {
        failedCount += 1;
      }
    }
  }

  return { failedCount, sentCount };
}

export async function handleSendAdminNotification(request: Request, response: Response) {
  const adminUid = await assertAdmin(request);
  const notificationId = request.body?.notificationId;

  if (typeof notificationId !== 'string' || notificationId.length < 5) {
    sendJson(response, 400, { error: 'notificationId is required' });
    return;
  }

  const notificationRef = db.collection('adminNotifications').doc(notificationId);
  const notificationSnapshot = await notificationRef.get();

  if (!notificationSnapshot.exists) {
    sendJson(response, 404, { error: 'Notification not found' });
    return;
  }

  const notification = notificationSnapshot.data() as AdminNotification;

  if (!notification.title || !notification.message) {
    sendJson(response, 400, { error: 'Notification title and message are required' });
    return;
  }

  await notificationRef.set(
    {
      sentBy: adminUid,
      status: 'sending',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const tokens = await collectTargetTokens(notification);
  const messages = tokens.map((token) => ({
    to: token,
    title: notification.title ?? 'CamRent',
    body: notification.message ?? '',
    sound: 'default' as const,
    data: {
      notificationId,
      type: 'admin_notification',
    },
  }));

  const result = await sendExpoPushMessages(messages);

  await notificationRef.set(
    {
      failedCount: result.failedCount,
      sentAt: FieldValue.serverTimestamp(),
      sentCount: result.sentCount,
      status: 'sent',
      targetTokenCount: tokens.length,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  sendJson(response, 200, result);
}
