export type UserRole = 'client' | 'owner';

export type CameroonCity = 'Yaounde' | 'Douala' | 'Bafoussam' | 'Bamenda' | 'Garoua';

export type PaymentMethod = 'MTN MoMo' | 'Orange Money' | 'Carte bancaire';

export type PaymentProvider = 'mtn-momo' | 'orange-money' | 'card';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

export type DriverLicense = {
  fullName: string;
  licenseNumber: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  categories: string;
};

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  city: CameroonCity;
  createdAt: Date;
};

export type Car = {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  city: CameroonCity;
  pricePerDay: number;
  imageUrl: string;
  seats: number;
  transmission: 'Automatique' | 'Manuelle';
  fuelType: 'Essence' | 'Diesel' | 'Hybride' | 'Electrique';
  isAvailable: boolean;
  description: string;
};

export type Booking = {
  id: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  ownerId: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  driverLicense: DriverLicense;
  status: BookingStatus;
  createdAt: Date;
};
