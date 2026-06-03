import type { CameroonCity, PaymentMethod, PaymentProvider } from '../types/models';

export const CAMEROON_CITIES: CameroonCity[] = [
  'Yaounde',
  'Douala',
  'Bafoussam',
  'Bamenda',
  'Garoua',
  'Maroua',
  'Ngaoundere',
  'Bertoua',
  'Ebolowa',
  'Kribi',
  'Limbe',
  'Buea',
  'Kumba',
  'Dschang',
  'Foumban',
  'Nkongsamba',
  'Edea',
  'Loum',
  'Mbouda',
  'Mbalmayo',
  'Sangmelima',
  'Bafang',
  'Bangangte',
  'Meiganga',
  'Kousseri',
  'Mokolo',
  'Guider',
  'Yagoua',
  'Batouri',
  'Bafia',
  'Obala',
  'Ebebda',
  'Tiko',
  'Mamfe',
  'Wum',
  'Kumbo',
];

export const PAYMENT_METHODS: PaymentMethod[] = ['MTN MoMo', 'Orange Money', 'Carte bancaire'];

export const PAYMENT_PROVIDER_BY_METHOD: Record<PaymentMethod, PaymentProvider> = {
  'MTN MoMo': 'mtn-momo',
  'Orange Money': 'orange-money',
  'Carte bancaire': 'card',
};

export const PHONE_PREFIX = '+237';

export const CAR_PHOTO_SLOTS = [
  { key: 'front', label: 'Avant', icon: 'arrow-up-circle-outline' },
  { key: 'rear', label: 'Arri\u00e8re', icon: 'arrow-down-circle-outline' },
  { key: 'left', label: 'Gauche', icon: 'arrow-back-circle-outline' },
  { key: 'right', label: 'Droite', icon: 'arrow-forward-circle-outline' },
  { key: 'interior', label: 'Int\u00e9rieur', icon: 'people-outline' },
  { key: 'dashboard', label: 'Tableau de bord', icon: 'speedometer-outline' },
] as const satisfies { key: string; label: string; icon: string }[];
