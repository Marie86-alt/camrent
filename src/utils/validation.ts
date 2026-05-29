import { PHONE_PREFIX } from '../constants/cameroon';

export function normalizeCameroonPhone(phone: string) {
  const compact = phone.replace(/\s/g, '');
  if (compact.startsWith(PHONE_PREFIX)) {
    return compact;
  }

  return `${PHONE_PREFIX}${compact.replace(/^0/, '')}`;
}

export function isValidCameroonPhone(phone: string) {
  return /^\+237[62-9]\d{8}$/.test(normalizeCameroonPhone(phone));
}
