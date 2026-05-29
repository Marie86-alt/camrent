import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

import { getAuthenticatedUid, sendJson } from '../http';
import { requestCardPayment } from './cardProvider';
import { requestMtnMomoPayment } from './mtnMomoProvider';
import { requestOrangeMoneyPayment } from './orangeMoneyProvider';
import { createPaymentRecord, getOwnedBooking, getUserPaymentProfile, markBookingPaymentPending } from './paymentRepository';
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
    reference,
  };

  const providerResponse =
    payload.provider === 'mtn-momo'
      ? await requestMtnMomoPayment(providerRequest)
      : payload.provider === 'orange-money'
        ? await requestOrangeMoneyPayment(providerRequest)
        : await requestCardPayment(providerRequest);

  await markBookingPaymentPending(payload.bookingId);

  sendJson(response, 200, {
    checkoutUrl: providerResponse.checkoutUrl,
    reference: providerResponse.reference,
    status: providerResponse.status,
  });
}
