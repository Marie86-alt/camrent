import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

import { getAuthenticatedUid, sendJson } from '../http';
import { requestCampayPayment } from './campayProvider';
import {
  createPaymentRecord,
  getOwnedBooking,
  getUserPaymentProfile,
  markBookingPaymentPending,
  markProviderPaymentStarted,
} from './paymentRepository';
import { validatePaymentPayload } from './validation';

export async function handleMobileMoneyPayment(request: Request, response: Response) {
  const uid = await getAuthenticatedUid(request);

  if (!uid) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const payload = validatePaymentPayload(request.body);
  const { booking } = await getOwnedBooking(payload.bookingId, uid);
  const profile = await getUserPaymentProfile(uid);
  const amount = booking.totalPrice;
  const reference = uuidv4();

  await createPaymentRecord({
    amount,
    bookingId: payload.bookingId,
    clientId: uid,
    currency: 'XAF',
    method: payload.method,
    phone: payload.phone,
    provider: payload.provider,
    reference,
  });

  const providerRequest = {
    amount,
    bookingId: payload.bookingId,
    currency: 'XAF' as const,
    customerEmail: profile.email,
    customerName: profile.fullName,
    phone: payload.phone,
    method: payload.method,
    provider: payload.provider,
    reference,
  };

  const providerResponse = await requestCampayPayment(providerRequest);

  await markProviderPaymentStarted({
    checkoutUrl: providerResponse.checkoutUrl,
    providerReference: providerResponse.reference,
    raw: providerResponse.raw,
    reference,
  });

  await markBookingPaymentPending(payload.bookingId);

  sendJson(response, 200, {
    checkoutUrl: providerResponse.checkoutUrl,
    reference,
    status: providerResponse.status,
  });
}
