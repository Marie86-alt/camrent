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

function getPaymentEndpoint() {
  const explicit = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const fallback = projectId ? `https://us-central1-${projectId}.cloudfunctions.net/mobileMoneyPayment` : undefined;

  if (!explicit) return fallback;

  // Cloud Run URLs are protected by IAM in this project. The app must call the public Firebase Functions URL.
  if (explicit.includes('.run.app') && fallback) {
    return fallback;
  }

  return explicit;
}

function cleanPaymentError(body: string) {
  if (body.includes('<title>401 Unauthorized</title>') || body.includes('Error: Unauthorized')) {
    return 'La Function de paiement est inaccessible. Verifiez EXPO_PUBLIC_PAYMENTS_API_URL.';
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Keep the raw body fallback below.
  }

  return body;
}

export async function requestMobileMoneyPayment(request: PaymentRequest) {
  const endpoint = getPaymentEndpoint();

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
      const body = await response.text();
      throw new Error(cleanPaymentError(body) || 'Campay payment request failed');
    }

    return (await response.json()) as PaymentResponse;
  }

  // Mode demo tant que le backend CamPay n'est pas branche.
  return {
    reference: `CMR-${Date.now()}`,
    status: 'pending' as const,
  };
}
