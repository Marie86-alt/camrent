import type { MobileMoneyPaymentRequest } from '../types';

export function normalizeCameroonPhone(phone: string) {
  const compact = phone.replace(/\s/g, '');

  if (compact.startsWith('+237')) {
    return compact;
  }

  return `+237${compact.replace(/^0/, '')}`;
}

export function isValidCameroonPhone(phone: string) {
  return /^\+237[62-9]\d{8}$/.test(normalizeCameroonPhone(phone));
}

export function validatePaymentPayload(payload: Partial<MobileMoneyPaymentRequest>) {
  if (!payload.bookingId || typeof payload.bookingId !== 'string') {
    throw new Error('bookingId is required');
  }

  if (payload.currency !== 'XAF') {
    throw new Error('currency must be XAF');
  }

  if (payload.provider !== 'mtn-momo' && payload.provider !== 'orange-money' && payload.provider !== 'card') {
    throw new Error('provider must be mtn-momo, orange-money or card');
  }

  if (payload.method !== 'MTN MoMo' && payload.method !== 'Orange Money' && payload.method !== 'Carte bancaire') {
    throw new Error('method must be MTN MoMo, Orange Money or Carte bancaire');
  }

  if (payload.provider !== 'card' && (!payload.phone || !isValidCameroonPhone(payload.phone))) {
    throw new Error('phone must be a Cameroon number in +237 format');
  }

  return {
    amount: Number(payload.amount ?? 0),
    bookingId: payload.bookingId,
    currency: payload.currency,
    method: payload.method,
    phone: payload.phone ? normalizeCameroonPhone(payload.phone) : undefined,
    provider: payload.provider,
  } satisfies MobileMoneyPaymentRequest;
}
