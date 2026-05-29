export function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

export function mobileMoneyEnv() {
  return optionalEnv('MOBILE_MONEY_ENV', 'sandbox');
}

export function webhookSecret(provider: 'mtn-momo' | 'orange-money' | 'flutterwave') {
  if (provider === 'mtn-momo') {
    return optionalEnv('MTN_MOMO_WEBHOOK_SECRET');
  }

  if (provider === 'orange-money') {
    return optionalEnv('ORANGE_MONEY_WEBHOOK_SECRET');
  }

  return optionalEnv('FLUTTERWAVE_WEBHOOK_SECRET_HASH');
}
