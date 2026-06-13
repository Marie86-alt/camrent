import { useCallback, useEffect, useState } from 'react';

import { getCached, setCached } from '../services/cache';
import { demoCars } from '../services/demoData';
import { subscribeToAvailableCars, subscribeToOwnerCars } from '../services/carService';
import { hasFirebaseConfig } from '../services/firebase';
import type { Car } from '../types/models';

function getCarsCacheKey(ownerId?: string) {
  return ownerId ? `cars:owner:${ownerId}` : 'cars:available';
}

export function useCars(ownerId?: string) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setCars(ownerId ? demoCars.filter((car) => car.ownerId === ownerId) : demoCars);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;
    const cacheKey = getCarsCacheKey(ownerId);
    setLoading(true);

    void getCached<Car[]>(cacheKey).then((cachedCars) => {
      if (!active || !cachedCars) return;
      setCars(cachedCars);
      setLoading(false);
      setError(null);
    });

    const unsubscribe = ownerId
      ? subscribeToOwnerCars(
          ownerId,
          (items) => {
            setCars(items);
            void setCached(cacheKey, items);
            setError(null);
            setLoading(false);
          },
          () => {
            setError('Impossible de charger vos voitures.');
            setLoading(false);
          },
        )
      : subscribeToAvailableCars(
          (items) => {
            setCars(items);
            void setCached(cacheKey, items);
            setError(null);
            setLoading(false);
          },
          () => {
            setError('Impossible de charger les voitures.');
            setLoading(false);
          },
        );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [ownerId, retryToken]);

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  return {
    cars,
    error,
    loading,
    retry,
  };
}
