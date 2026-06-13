import AsyncStorage from '@react-native-async-storage/async-storage';

type CachedPayload<T> = {
  data: T;
  timestamp: number;
};

function isCachedPayload<T>(value: unknown): value is CachedPayload<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'timestamp' in value &&
    typeof (value as { timestamp?: unknown }).timestamp === 'number'
  );
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isCachedPayload<T>(parsed)) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    const payload: CachedPayload<T> = {
      data,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Cache failures should never break live Firestore data.
  }
}
