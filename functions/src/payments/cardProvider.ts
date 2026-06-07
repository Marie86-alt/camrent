import { optionalEnv, requiredEnv } from '../config';
import type { ProviderPaymentRequest, ProviderPaymentResponse } from '../types';

type FlutterwaveCheckoutResponse = {
  status: string;
  message?: string;
  data?: {
    link?: string;
  };
};

export async function requestCardPayment(request: ProviderPaymentRequest): Promise<ProviderPaymentResponse> {
  const secretKey = optionalEnv('FLUTTERWAVE_SECRET_KEY') || requiredEnv('FLUTTERWAVE_CLIENT_SECRET');
  const checkoutUrl = optionalEnv('FLUTTERWAVE_CHECKOUT_URL', 'https://api.flutterwave.com/v3/payments');
  const redirectUrl = optionalEnv('FLUTTERWAVE_REDIRECT_URL', 'https://flutterwave.com');

  const response = await fetch(checkoutUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: request.amount,
      currency: request.currency,
      customer: {
        email: request.customerEmail ?? 'client@autofix-pro.local',
        name: request.customerName ?? 'Client Autofix Pro',
        phonenumber: request.phone,
      },
      customizations: {
        description: `Reservation Autofix Pro ${request.bookingId}`,
        logo: optionalEnv('FLUTTERWAVE_LOGO_URL'),
        title: 'Autofix Pro',
      },
      meta: {
        bookingId: request.bookingId,
      },
      payment_options: 'card',
      redirect_url: redirectUrl,
      tx_ref: request.reference,
    }),
  });

  const body = (await response.json()) as FlutterwaveCheckoutResponse;

  if (!response.ok || body.status !== 'success' || !body.data?.link) {
    throw new Error(`Flutterwave checkout failed: ${response.status} ${body.message ?? body.status}`);
  }

  return {
    raw: body,
    reference: request.reference,
    status: 'pending',
    checkoutUrl: body.data.link,
  };
}
