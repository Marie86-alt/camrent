import { mobileMoneyEnv, optionalEnv, requiredEnv } from '../config';
import type { PaymentProvider, ProviderPaymentRequest, ProviderPaymentResponse } from '../types';

type CampayPaymentRequest = ProviderPaymentRequest & {
  method: string;
  provider: PaymentProvider;
};

type CampayTokenResponse = {
  token?: string;
  message?: string;
};

type CampayLinkResponse = {
  external_reference?: string;
  link?: string;
  message?: string;
  reference?: string;
  status?: string;
};

function campayHost() {
  const configuredHost = optionalEnv('CAMPAY_BASE_URL');

  if (configuredHost) {
    return configuredHost.replace(/\/$/, '');
  }

  return mobileMoneyEnv() === 'production' || mobileMoneyEnv() === 'prod'
    ? 'https://www.campay.net'
    : 'https://demo.campay.net';
}

function normalizeCampayStatus(status: unknown) {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized === 'SUCCESSFUL' || normalized === 'SUCCESS') {
    return 'success' as const;
  }

  if (normalized === 'FAILED' || normalized === 'FAILURE') {
    return 'failed' as const;
  }

  return 'pending' as const;
}

function splitCustomerName(fullName?: string) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: 'Client', lastName: 'Autofix Pro' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || 'Autofix Pro',
  };
}

function paymentOptions(provider: PaymentProvider) {
  const configured = optionalEnv('CAMPAY_PAYMENT_OPTIONS');

  if (configured) {
    return configured;
  }

  return provider === 'card' ? 'CARD' : 'MOMO';
}

function campayAmount(amount: number) {
  if (mobileMoneyEnv() === 'production' || mobileMoneyEnv() === 'prod') {
    return amount;
  }

  return Math.min(amount, 25);
}

function formatCampayPhone(phone?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('237') ? digits : `237${digits.replace(/^0/, '')}`;
}

async function getCampayToken() {
  const accessToken = optionalEnv('CAMPAY_ACCESS_TOKEN');

  if (accessToken) {
    return accessToken;
  }

  const response = await fetch(`${campayHost()}/api/token/`, {
    body: JSON.stringify({
      password: requiredEnv('CAMPAY_APP_PASSWORD'),
      username: requiredEnv('CAMPAY_APP_USERNAME'),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const body = (await response.json().catch(() => ({}))) as CampayTokenResponse;

  if (!response.ok || !body.token) {
    throw new Error(body.message ?? 'Campay token request failed');
  }

  return body.token;
}

export async function requestCampayPayment(request: CampayPaymentRequest): Promise<ProviderPaymentResponse> {
  const token = await getCampayToken();
  const { firstName, lastName } = splitCustomerName(request.customerName);
  const from = request.provider === 'card' ? undefined : formatCampayPhone(request.phone);
  const response = await fetch(`${campayHost()}/api/get_payment_link/`, {
    body: JSON.stringify({
      amount: String(campayAmount(request.amount)),
      currency: request.currency,
      description: `Reservation Autofix Pro ${request.bookingId}`,
      email: request.customerEmail ?? '',
      external_reference: request.reference,
      failure_redirect_url: optionalEnv('CAMPAY_FAILURE_REDIRECT_URL', optionalEnv('CAMPAY_REDIRECT_URL')),
      first_name: firstName,
      ...(from ? { from } : {}),
      last_name: lastName,
      payment_options: paymentOptions(request.provider),
      redirect_url: optionalEnv('CAMPAY_REDIRECT_URL', 'https://campay.net'),
    }),
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const body = (await response.json().catch(() => ({}))) as CampayLinkResponse;

  if (!response.ok || !body.link) {
    throw new Error(body.message ?? 'Campay payment link request failed');
  }

  return {
    checkoutUrl: body.link,
    raw: body,
    reference: body.reference ?? request.reference,
    status: normalizeCampayStatus(body.status),
  };
}
