export type PaymentProvider = 'mtn-momo' | 'orange-money' | 'card';

export type PaymentMethod = 'MTN MoMo' | 'Orange Money' | 'Carte bancaire';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export type MobileMoneyPaymentRequest = {
  amount: number;
  bookingId: string;
  currency: 'XAF';
  method: PaymentMethod;
  phone?: string;
  provider: PaymentProvider;
};

export type ProviderPaymentRequest = {
  amount: number;
  bookingId: string;
  currency: 'XAF';
  customerEmail?: string;
  customerName?: string;
  phone?: string;
  reference: string;
};

export type ProviderPaymentResponse = {
  raw?: unknown;
  reference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
};

export type BookingDocument = {
  clientId: string;
  ownerId: string;
  totalPrice: number;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
};
