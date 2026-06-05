import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from './firebase';
import type { AppUser } from '../types/models';

function withId(snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AppUser);
}

export function subscribeToOwnerDrivers(
  ownerId: string,
  onData: (drivers: AppUser[]) => void,
  onError: () => void,
) {
  const ownerDriversQuery = query(
    collection(db, 'users'),
    where('role', '==', 'driver'),
    where('ownerId', '==', ownerId),
  );

  return onSnapshot(ownerDriversQuery, (snapshot) => onData(withId(snapshot)), onError);
}
