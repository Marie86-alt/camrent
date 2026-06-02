import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Booking, Car } from './models';

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
  Payment: { amount: number; bookingId: string; paymentMethod: import('./models').PaymentMethod };
  Contract: { booking: Booking };
};

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
