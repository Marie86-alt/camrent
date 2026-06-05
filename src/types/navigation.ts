import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppUser, Booking, Car } from './models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type ClientTabParamList = {
  Home: undefined;
  Search: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type ClientStackParamList = {
  Tabs: undefined;
  CarDetail: { car: Car };
  Booking: { car: Car };
  DriverList: { carCity: string; carId: string; startDate?: string; endDate?: string; selectable?: boolean };
  DriverDetail: { driver: AppUser };
  Payment: { amount: number; bookingId: string; paymentMethod: import('./models').PaymentMethod };
  Contract: { booking: Booking };
  Review: { booking: Booking };
};

export type PublicTabParamList = {
  Home: undefined;
  Search: undefined;
};

export type PublicStackParamList = {
  PublicTabs: undefined;
  CarDetail: { car: Car };
  Booking: { car: Car };
  DriverList: { carCity: string; carId: string; startDate?: string; endDate?: string; selectable?: boolean };
  DriverDetail: { driver: AppUser };
  AuthPrompt: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type DriverTabParamList = {
  DriverMissions: undefined;
  DriverCalendar: undefined;
  DriverOwnProfile: undefined;
};

export type DriverStackParamList = {
  DriverTabs: undefined;
  DriverReviewClient: { booking: Booking };
};

export type DriverReviewClientScreenProps = NativeStackScreenProps<DriverStackParamList, 'DriverReviewClient'>;

export type OwnerTabParamList = {
  Dashboard: undefined;
  ManageCars: undefined;
  Reservations: undefined;
  OwnerProfile: undefined;
};

export type OwnerStackParamList = {
  OwnerTabs: undefined;
  AddCar: undefined;
  EditCar: { car: Car };
  DriverProfile: undefined;
  OwnerDrivers: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminFinanceDetail: undefined;
  AdminReviewsDetail: undefined;
  AdminContentDetail: undefined;
  AdminSecurityDetail: undefined;
};

export type AdminTabParamList = {
  AdminHome: undefined;
  AdminVehicles: undefined;
  AdminDrivers: undefined;
  AdminBookings: undefined;
  AdminMore: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export type CarDetailScreenProps = NativeStackScreenProps<ClientStackParamList, 'CarDetail'>;
export type BookingScreenProps = NativeStackScreenProps<ClientStackParamList, 'Booking'>;
export type PaymentScreenProps = NativeStackScreenProps<ClientStackParamList, 'Payment'>;
export type ContractScreenProps = NativeStackScreenProps<ClientStackParamList, 'Contract'>;
export type DriverListScreenProps = NativeStackScreenProps<ClientStackParamList, 'DriverList'>;
export type ReviewScreenProps = NativeStackScreenProps<ClientStackParamList, 'Review'>;
