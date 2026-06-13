import { assertDriverLicense, calculateTotalPrice, rangesOverlap, rentalDays } from './createBookingLogic';

// ─── helpers ────────────────────────────────────────────────────────────────

function d(iso: string) {
  return new Date(iso);
}

const VALID_LICENSE = {
  categories: 'B',
  expiryDate: '2099-12-31',
  fullName: 'Jean Kamga',
  issueDate: '2020-01-01',
  issuingCountry: 'CM',
  licenseNumber: 'CE12345',
};

// ─── rangesOverlap ───────────────────────────────────────────────────────────

describe('rangesOverlap', () => {
  it('A entièrement avant B → false', () => {
    expect(rangesOverlap(d('2024-01-01'), d('2024-01-05'), d('2024-01-10'), d('2024-01-15'))).toBe(false);
  });

  it('A entièrement après B → false', () => {
    expect(rangesOverlap(d('2024-01-10'), d('2024-01-15'), d('2024-01-01'), d('2024-01-05'))).toBe(false);
  });

  it('A se termine le jour où B commence → chevauchement (borne incluse)', () => {
    expect(rangesOverlap(d('2024-01-01'), d('2024-01-10'), d('2024-01-10'), d('2024-01-20'))).toBe(true);
  });

  it('A commence le jour où B se termine → chevauchement (borne incluse)', () => {
    expect(rangesOverlap(d('2024-01-10'), d('2024-01-20'), d('2024-01-01'), d('2024-01-10'))).toBe(true);
  });

  it('chevauchement partiel au milieu → true', () => {
    expect(rangesOverlap(d('2024-01-01'), d('2024-01-15'), d('2024-01-10'), d('2024-01-25'))).toBe(true);
  });

  it('A contient B → true', () => {
    expect(rangesOverlap(d('2024-01-01'), d('2024-01-30'), d('2024-01-10'), d('2024-01-20'))).toBe(true);
  });

  it('B contient A → true', () => {
    expect(rangesOverlap(d('2024-01-10'), d('2024-01-20'), d('2024-01-01'), d('2024-01-30'))).toBe(true);
  });

  it('A se termine la veille du début de B → false', () => {
    expect(rangesOverlap(d('2024-01-01'), d('2024-01-09'), d('2024-01-10'), d('2024-01-20'))).toBe(false);
  });
});

// ─── rentalDays ──────────────────────────────────────────────────────────────

describe('rentalDays', () => {
  it('même jour → 1 jour minimum', () => {
    expect(rentalDays(d('2024-01-10'), d('2024-01-10'))).toBe(1);
  });

  it('3 jours consécutifs → 3', () => {
    expect(rentalDays(d('2024-01-10'), d('2024-01-12'))).toBe(3);
  });

  it('7 jours → 7', () => {
    expect(rentalDays(d('2024-01-01'), d('2024-01-07'))).toBe(7);
  });

  it('résultat toujours ≥ 1 même si endDate < startDate', () => {
    expect(rentalDays(d('2024-01-10'), d('2024-01-09'))).toBeGreaterThanOrEqual(1);
  });
});

// ─── calculateTotalPrice ─────────────────────────────────────────────────────

describe('calculateTotalPrice', () => {
  it('sans chauffeur : pricePerDay × jours', () => {
    expect(calculateTotalPrice(30000, 0, 3)).toBe(90000);
  });

  it('avec chauffeur : (car + driver) × jours', () => {
    expect(calculateTotalPrice(30000, 10000, 3)).toBe(120000);
  });

  it('1 jour avec chauffeur', () => {
    expect(calculateTotalPrice(30000, 10000, 1)).toBe(40000);
  });

  it('tout à zéro → 0', () => {
    expect(calculateTotalPrice(0, 0, 5)).toBe(0);
  });
});

// ─── assertDriverLicense ─────────────────────────────────────────────────────

describe('assertDriverLicense', () => {
  it('permis valide → retourne les champs normalisés', () => {
    const result = assertDriverLicense(VALID_LICENSE);
    expect(result.fullName).toBe('Jean Kamga');
    expect(result.licenseNumber).toBe('CE12345');
    expect(result.categories).toBe('B'); // normalisé en majuscules
  });

  it('catégories converties en majuscules', () => {
    const result = assertDriverLicense({ ...VALID_LICENSE, categories: 'b' });
    expect(result.categories).toBe('B');
  });

  it('undefined → throw "Permis de conduire requis."', () => {
    expect(() => assertDriverLicense(undefined)).toThrow('Permis de conduire requis.');
  });

  it('null → throw "Permis de conduire requis."', () => {
    expect(() => assertDriverLicense(null)).toThrow('Permis de conduire requis.');
  });

  it('numéro de permis trop court (< 5 chars) → throw invalide', () => {
    expect(() => assertDriverLicense({ ...VALID_LICENSE, licenseNumber: 'AB1' })).toThrow(
      'Informations du permis invalides.',
    );
  });

  it('nom trop court (< 3 chars) → throw invalide', () => {
    expect(() => assertDriverLicense({ ...VALID_LICENSE, fullName: 'Jo' })).toThrow(
      'Informations du permis invalides.',
    );
  });

  it('date expirée → throw "Permis expire ou invalide."', () => {
    expect(() => assertDriverLicense({ ...VALID_LICENSE, expiryDate: '2000-01-01' })).toThrow(
      'Permis expire ou invalide.',
    );
  });

  it('date invalide (chaîne non parsable) → throw "Permis expire ou invalide."', () => {
    expect(() => assertDriverLicense({ ...VALID_LICENSE, expiryDate: 'not-a-date' })).toThrow(
      'Permis expire ou invalide.',
    );
  });

  it('champ manquant (fullName absent) → throw "fullName est requis."', () => {
    const { fullName: _, ...rest } = VALID_LICENSE;
    expect(() => assertDriverLicense(rest)).toThrow('fullName est requis.');
  });

  it('champ vide (licenseNumber vide) → throw "licenseNumber est requis."', () => {
    expect(() => assertDriverLicense({ ...VALID_LICENSE, licenseNumber: '   ' })).toThrow(
      'licenseNumber est requis.',
    );
  });
});
