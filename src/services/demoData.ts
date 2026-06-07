import type { AppUser, Car } from '../types/models';

export const DEMO_PASSWORD = 'password123';

export const demoUsers: AppUser[] = [
  {
    id: 'demo-client',
    fullName: 'Client Demo',
    email: 'client@autofixpro.cm',
    phone: '+237699000001',
    role: 'client',
    city: 'Douala',
    createdAt: new Date(),
  },
  {
    id: 'demo-owner',
    fullName: 'Proprietaire Demo',
    email: 'owner@autofixpro.cm',
    phone: '+237699000002',
    role: 'owner',
    city: 'Yaounde',
    createdAt: new Date(),
  },
];

export const demoCars: Car[] = [
  {
    id: 'demo-car-1',
    ownerId: 'demo-owner',
    brand: 'Toyota',
    model: 'RAV4',
    year: 2021,
    city: 'Douala',
    pricePerDay: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1549924231-f129b911e442',
    seats: 5,
    transmission: 'Automatique',
    fuelType: 'Essence',
    isAvailable: true,
    description: 'SUV confortable pour les trajets en ville et les routes interurbaines.',
  },
  {
    id: 'demo-car-2',
    ownerId: 'demo-owner',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2020,
    city: 'Yaounde',
    pricePerDay: 30000,
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
    seats: 5,
    transmission: 'Automatique',
    fuelType: 'Diesel',
    isAvailable: true,
    description: 'Vehicule spacieux avec climatisation, ideal pour les deplacements professionnels.',
  },
  {
    id: 'demo-car-3',
    ownerId: 'demo-owner',
    brand: 'Suzuki',
    model: 'Swift',
    year: 2019,
    city: 'Bafoussam',
    pricePerDay: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    seats: 5,
    transmission: 'Manuelle',
    fuelType: 'Essence',
    isAvailable: true,
    description: 'Citadine economique et facile a conduire.',
  },
];

export function findDemoUser(email: string, password: string) {
  if (password !== DEMO_PASSWORD) {
    return null;
  }

  return demoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}
