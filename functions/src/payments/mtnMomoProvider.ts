import { v4 as uuidv4 } from 'uuid';

import { mobileMoneyEnv, optionalEnv, requiredEnv } from '../config';
import type { ProviderPaymentRequest, ProviderPaymentResponse } from '../types';

const MTN_COLLECTION_BASE_URL =
  process.env.MTN_MOMO_COLLECTION_BASE_URL ?? 'https://sandbox.momodeveloper.mtn.com/collection';

function getMtnSubscriptionKey() {
  const primaryKey = optionalEnv('MTN_MOMO_SUBSCRIPTION_KEY');
  const secondaryKey = optionalEnv('MTN_MOMO_SECONDARY_SUBSCRIPTION_KEY');

  if (!primaryKey && !secondaryKey) {
    throw new Error('Missing environment variable: MTN_MOMO_SUBSCRIPTION_KEY');
  }

  return primaryKey || secondaryKey;
}

async function getMtnAccessToken() {
  const subscriptionKey = getMtnSubscriptionKey();
  const apiUser = requiredEnv('MTN_MOMO_API_USER');
  const apiKey = requiredEnv('MTN_MOMO_API_KEY');
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

  const response = await fetch(`${MTN_COLLECTION_BASE_URL}/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    throw new Error(`MTN token request failed: ${response.status}`);
  }

  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

export async function requestMtnMomoPayment(
  request: ProviderPaymentRequest,
): Promise<ProviderPaymentResponse> {
  if (!request.phone) {
    throw new Error('MTN MoMo payment requires a phone number');
  }

  const subscriptionKey = getMtnSubscriptionKey();
  const callbackUrl = requiredEnv('MTN_MOMO_CALLBACK_URL');
  const token = await getMtnAccessToken();
  const reference = request.reference || uuidv4();

  const response = await fetch(`${MTN_COLLECTION_BASE_URL}/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'X-Callback-Url': callbackUrl,
      'X-Reference-Id': reference,
      'X-Target-Environment': mobileMoneyEnv(),
    },
    body: JSON.stringify({
      amount: String(request.amount),
      currency: request.currency,
      externalId: request.bookingId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: request.phone.replace('+', ''),
      },
      payerMessage: 'Paiement CamRent',
      payeeNote: `Reservation ${request.bookingId}`,
    }),
  });

  if (response.status !== 202) {
    throw new Error(`MTN requestToPay failed: ${response.status}`);
  }

  return {
    reference,
    status: 'pending',
  };
}
