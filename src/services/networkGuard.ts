import NetInfo from '@react-native-community/netinfo';

export const OFFLINE_ACTION_MESSAGE = 'Pas de connexion internet, réessaie quand tu es connecté.';

export class OfflineActionError extends Error {
  constructor() {
    super(OFFLINE_ACTION_MESSAGE);
    this.name = 'OfflineActionError';
  }
}

export function isOfflineError(error: unknown): error is OfflineActionError {
  return error instanceof OfflineActionError;
}

export async function assertOnlineForAction() {
  const state = await NetInfo.fetch();

  if (state.isConnected === false || state.isInternetReachable === false) {
    throw new OfflineActionError();
  }
}
