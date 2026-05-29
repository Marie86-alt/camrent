import type { Request, Response } from 'express';

import { adminAuth } from './firebase';

export function sendJson(response: Response, status: number, body: unknown) {
  response.status(status).json(body);
}

export async function getAuthenticatedUid(request: Request) {
  const authorization = request.header('authorization') ?? '';
  const match = authorization.match(/^Bearer (.+)$/);

  if (!match) {
    return null;
  }

  const decodedToken = await adminAuth.verifyIdToken(match[1]);
  return decodedToken.uid;
}

export function assertPost(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.set('Allow', 'POST');
    sendJson(response, 405, { error: 'Method not allowed' });
    return false;
  }

  return true;
}
