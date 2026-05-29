import { useEffect, useState } from 'react';

import { subscribeToClientBookings, subscribeToOwnerBookings } from '../services/bookingService';
import { hasFirebaseConfig } from '../services/firebase';
import type { Booking } from '../types/models';

export function useBookings(userId?: string, role: 'client' | 'owner' = 'client') {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setBookings([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    if (!userId) {
      setBookings([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const subscribe = role === 'owner' ? subscribeToOwnerBookings : subscribeToClientBookings;
    const unsubscribe = subscribe(userId, setBookings, () => setError('Impossible de charger les reservations.'));
    setLoading(false);

    return unsubscribe;
  }, [role, userId]);

  return { bookings, error, loading };
}
