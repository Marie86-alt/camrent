import { requiredEnv } from '../config';
import type { ProviderPaymentRequest, ProviderPaymentResponse } from '../types';

type OrangePaymentResponse = {
  reference?: string;
  payToken?: string;
  payment_url?: string;
  paymentUrl?: string;
  status?: string;
};

async function getOrangeAccessToken() {
  const tokenUrl = requiredEnv('ORANGE_MONEY_TOKEN_URL');
  const clientId = requiredEnv('ORANGE_MONEY_CLIENT_ID');
  const clientSecret = requiredEnv('ORANGE_MONEY_CLIENT_SECRET');
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Orange token request failed: ${response.status}`);
  }

  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

export async function requestOrangeMoneyPayment(
  request: ProviderPaymentRequest,
): Promise<ProviderPaymentResponse> {
  const paymentUrl = requiredEnv('ORANGE_MONEY_PAYMENT_URL');
  const merchantKey = requiredEnv('ORANGE_MONEY_MERCHANT_KEY');
  const callbackUrl = requiredEnv('ORANGE_MONEY_CALLBACK_URL');
  const token = await getOrangeAccessToken();

  const response = await fetch(paymentUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: request.amount,
      currency: request.currency,
      customer_msisdn: request.phone,
      merchant_key: merchantKey,
      notif_url: callbackUrl,
      order_id: request.bookingId,
      reference: request.reference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Orange payment request failed: ${response.status}`);
  }

  const body = (await response.json()) as OrangePaymentResponse;

  return {
    raw: body,
    reference: body.reference ?? body.payToken ?? request.reference,
    status: 'pending',
    checkoutUrl: body.payment_url ?? body.paymentUrl,
  };
}
