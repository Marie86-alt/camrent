import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { create } from 'zustand';

import { getCached, setCached } from '../services/cache';
import { demoCars } from '../services/demoData';
import { db } from '../services/firebase';
import { hasFirebaseConfig } from '../services/firebase';
import type { Car } from '../types/models';

const AVAILABLE_CARS_CACHE_KEY = 'cars:available';

type CarsState = {
  cars: Car[];
  loading: boolean;
  error: string | null;
  subscribeToAvailableCars: () => () => void;
};

export const useCarsStore = create<CarsState>((set) => ({
  cars: [],
  loading: false,
  error: null,
  subscribeToAvailableCars: () => {
    if (!hasFirebaseConfig) {
      set({ cars: demoCars, loading: false, error: null });
      return () => undefined;
    }

    set({ loading: true, error: null });

    let disposed = false;
    let unsubscribe: () => void = () => undefined;

    void getCached<Car[]>(AVAILABLE_CARS_CACHE_KEY).then((cachedCars) => {
      if (disposed || !cachedCars) return;
      set({ cars: cachedCars, loading: false, error: null });
    });

    const carsQuery = query(
      collection(db, 'cars'),
      where('adminStatus', '==', 'approved'),
    );

    unsubscribe = onSnapshot(
      carsQuery,
      (snapshot) => {
        const cars = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Car)
          .filter((car) => car.isAvailable !== false);
        void setCached(AVAILABLE_CARS_CACHE_KEY, cars);
        set({ cars, loading: false });
      },
      () => set({ error: 'Impossible de charger les voitures.', loading: false }),
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  },
}));
