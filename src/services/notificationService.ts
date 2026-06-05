import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'CamRent',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B63D4',
  });
}

export async function getExpoPushToken() {
  if (!Device.isDevice) {
    return null;
  }

  await ensureAndroidNotificationChannel();

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (finalStatus !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = getEasProjectId();

  if (!projectId) {
    throw new Error('EAS projectId introuvable pour les notifications push.');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function registerUserPushToken(userId: string) {
  const token = await getExpoPushToken();

  if (!token) {
    return null;
  }

  await updateDoc(doc(db, 'users', userId), {
    expoPushTokens: arrayUnion(token),
    pushTokenUpdatedAt: serverTimestamp(),
  });

  return token;
}

export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return;

  const tokens: string[] = snap.data().expoPushTokens ?? [];
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({ to: token, title, body, sound: 'default' }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  });
}
