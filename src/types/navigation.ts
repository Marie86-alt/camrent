import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Car } from './models';

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
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export type CarDetailScreenProps = NativeStackScreenProps<ClientStackParamList, 'CarDetail'>;
export type BookingScreenProps = NativeStackScreenProps<ClientStackParamList, 'Booking'>;
export type PaymentScreenProps = NativeStackScreenProps<ClientStackParamList, 'Payment'>;
