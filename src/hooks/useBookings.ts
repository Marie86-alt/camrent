import { useCallback, useEffect, useState } from 'react';

import { subscribeToClientBookings, subscribeToOwnerBookings } from '../services/bookingService';
import { getCached, setCached } from '../services/cache';
import { hasFirebaseConfig } from '../services/firebase';
import type { Booking } from '../types/models';
import { toJsDate } from '../utils/firestoreDate';

function getBookingsCacheKey(userId: string, role: 'client' | 'owner') {
  return `bookings:${role}:${userId}`;
}

function cacheDate(value: Booking['startDate'] | undefined): Booking['startDate'] | undefined {
  if (!value) return undefined;

  const date = toJsDate(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString() as unknown as Booking['startDate'];
}

function normalizeBookingForCache(booking: Booking): Booking {
  return {
    ...booking,
    cancelledAt: cacheDate(booking.cancelledAt),
    contractSignedAt: cacheDate(booking.contractSignedAt),
    createdAt: cacheDate(booking.createdAt) ?? booking.createdAt,
    endDate: cacheDate(booking.endDate) ?? booking.endDate,
    startDate: cacheDate(booking.startDate) ?? booking.startDate,
  };
}

export function useBookings(userId?: string, role: 'client' | 'owner' = 'client') {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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

    let active = true;
    const cacheKey = getBookingsCacheKey(userId, role);
    setLoading(true);

    void getCached<Booking[]>(cacheKey).then((cachedBookings) => {
      if (!active || !cachedBookings) return;
      setBookings(cachedBookings);
      setLoading(false);
      setError(null);
    });

    const subscribe = role === 'owner' ? subscribeToOwnerBookings : subscribeToClientBookings;
    const unsubscribe = subscribe(
      userId,
      (items) => {
        setBookings(items);
        void setCached(cacheKey, items.map(normalizeBookingForCache));
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Impossible de charger les reservations.');
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [role, retryToken, userId]);

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  return {
    bookings,
    error,
    loading,
    retry,
  };
}
