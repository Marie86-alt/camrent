import type { Request, Response } from 'express';

import { webhookSecret } from '../config';
import { sendJson } from '../http';
import type { PaymentStatus } from '../types';
import { updatePaymentFromProvider } from './paymentRepository';

function normalizeMtnStatus(status: unknown): PaymentStatus {
  if (status === 'SUCCESSFUL') {
    return 'success';
  }

  if (status === 'FAILED') {
    return 'failed';
  }

  return 'pending';
}

function normalizeOrangeStatus(status: unknown): PaymentStatus {
  const normalized = String(status ?? '').toLowerCase();

  if (['success', 'successful', 'paid', 'completed'].includes(normalized)) {
    return 'success';
  }

  if (['failed', 'cancelled', 'canceled', 'expired'].includes(normalized)) {
    return 'failed';
  }

  return 'pending';
}

function normalizeFlutterwaveStatus(status: unknown): PaymentStatus {
  const normalized = String(status ?? '').toLowerCase();

  if (['successful', 'success', 'completed'].includes(normalized)) {
    return 'success';
  }

  if (['failed', 'cancelled', 'canceled'].includes(normalized)) {
    return 'failed';
  }

  return 'pending';
}

function validateWebhookSecret(request: Request, provider: 'mtn-momo' | 'orange-money' | 'flutterwave') {
  const expectedSecret = webhookSecret(provider);

  if (!expectedSecret) {
    return true;
  }

  if (provider === 'flutterwave') {
    return request.header('verif-hash') === expectedSecret;
  }

  return request.header('x-camrent-webhook-secret') === expectedSecret;
}

export async function handleMtnMomoWebhook(request: Request, response: Response) {
  if (!validateWebhookSecret(request, 'mtn-momo')) {
    sendJson(response, 401, { error: 'Invalid webhook secret' });
    return;
  }

  const reference =
    request.header('x-reference-id') ??
    request.body?.referenceId ??
    request.body?.reference ??
    request.body?.externalId ??
    request.body?.financialTransactionId;

  if (!reference) {
    sendJson(response, 400, { error: 'Missing MTN payment reference' });
    return;
  }

  await updatePaymentFromProvider({
    provider: 'mtn-momo',
    raw: request.body,
    reference,
    status: normalizeMtnStatus(request.body?.status),
  });

  sendJson(response, 200, { ok: true });
}

export async function handleOrangeMoneyWebhook(request: Request, response: Response) {
  if (!validateWebhookSecret(request, 'orange-money')) {
    sendJson(response, 401, { error: 'Invalid webhook secret' });
    return;
  }

  const reference = request.body?.reference ?? request.body?.payToken ?? request.body?.order_id ?? request.body?.orderId;

  if (!reference) {
    sendJson(response, 400, { error: 'Missing Orange payment reference' });
    return;
  }

  await updatePaymentFromProvider({
    provider: 'orange-money',
    raw: request.body,
    reference,
    status: normalizeOrangeStatus(request.body?.status),
  });

  sendJson(response, 200, { ok: true });
}

export async function handleFlutterwaveWebhook(request: Request, response: Response) {
  if (!validateWebhookSecret(request, 'flutterwave')) {
    sendJson(response, 401, { error: 'Invalid webhook secret' });
    return;
  }

  const data = request.body?.data ?? request.body;
  const reference = data?.tx_ref ?? data?.txRef ?? data?.reference;

  if (!reference) {
    sendJson(response, 400, { error: 'Missing Flutterwave payment reference' });
    return;
  }

  await updatePaymentFromProvider({
    provider: 'card',
    raw: request.body,
    reference,
    status: normalizeFlutterwaveStatus(data?.status ?? request.body?.status),
  });

  sendJson(response, 200, { ok: true });
}
