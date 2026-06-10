import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { create } from 'zustand';

import { demoCars } from '../services/demoData';
import { db } from '../services/firebase';
import { hasFirebaseConfig } from '../services/firebase';
import type { Car } from '../types/models';

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

    const carsQuery = query(
      collection(db, 'cars'),
      where('isAvailable', '==', true),
      where('adminStatus', '==', 'approved'),
    );

    return onSnapshot(
      carsQuery,
      (snapshot) => {
        const cars = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Car);
        set({ cars, loading: false });
      },
      () => set({ error: 'Impossible de charger les voitures.', loading: false }),
    );
  },
}));
