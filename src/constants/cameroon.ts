import type { CameroonCity, PaymentMethod, PaymentProvider } from '../types/models';

export const CAMEROON_CITIES: CameroonCity[] = [
  'Yaounde',
  'Douala',
  'Bafoussam',
  'Bamenda',
  'Garoua',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];

export const PAYMENT_PROVIDER_BY_METHOD: Record<PaymentMethod, PaymentProvider> = {
  'MTN MoMo': 'mtn-momo',
  'Orange Money': 'orange-money',
  'Carte bancaire': 'card',
};

export const PHONE_PREFIX = '+237';
