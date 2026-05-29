import { auth } from './firebase';
import type { PaymentMethod, PaymentProvider } from '../types/models';

export type PaymentRequest = {
  amount: number;
  bookingId: string;
  method: PaymentMethod;
  phone?: string;
  provider: PaymentProvider;
};

export type PaymentResponse = {
  reference: string;
  status: 'pending' | 'success' | 'failed';
  checkoutUrl?: string;
};

export async function requestMobileMoneyPayment(request: PaymentRequest) {
  const endpoint = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;

  if (endpoint) {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        bookingId: request.bookingId,
        currency: 'XAF',
        method: request.method,
        phone: request.phone,
        provider: request.provider,
      }),
    });

    if (!response.ok) {
      throw new Error('Campay payment request failed');
    }

    return (await response.json()) as PaymentResponse;
  }

  // Mode demo tant que le backend CamPay n'est pas branche.
  return {
    reference: `CMR-${Date.now()}`,
    status: 'pending' as const,
  };
}
