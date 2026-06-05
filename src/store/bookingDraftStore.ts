import { create } from 'zustand';

import type { AppUser } from '../types/models';

type BookingDraftStore = {
  selectedDriver: AppUser | null;
  setSelectedDriver: (driver: AppUser | null) => void;
  clearDriver: () => void;
};

export const useBookingDraftStore = create<BookingDraftStore>((set) => ({
  selectedDriver: null,
  setSelectedDriver: (driver) => set({ selectedDriver: driver }),
  clearDriver: () => set({ selectedDriver: null }),
}));
