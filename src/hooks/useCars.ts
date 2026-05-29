import { useEffect, useState } from 'react';

import { demoCars } from '../services/demoData';
import { subscribeToAvailableCars, subscribeToOwnerCars } from '../services/carService';
import { hasFirebaseConfig } from '../services/firebase';
import type { Car } from '../types/models';

export function useCars(ownerId?: string) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setCars(ownerId ? demoCars.filter((car) => car.ownerId === ownerId) : demoCars);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = ownerId
      ? subscribeToOwnerCars(ownerId, setCars, () => setError('Impossible de charger vos voitures.'))
      : subscribeToAvailableCars(setCars, () => setError('Impossible de charger les voitures.'));

    setLoading(false);
    return unsubscribe;
  }, [ownerId]);

  return { cars, error, loading };
}
