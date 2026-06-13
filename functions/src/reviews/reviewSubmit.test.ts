import { computeDriverRatingUpdate } from './reviewLogic';

describe('computeDriverRatingUpdate', () => {
  describe('tableau vide', () => {
    it('retourne null (pas de mise à jour)', () => {
      expect(computeDriverRatingUpdate([])).toBeNull();
    });
  });

  describe('pas de suspension (< 3 avis)', () => {
    it('1 avis à 1 étoile → pas de suspension', () => {
      const result = computeDriverRatingUpdate([1]);
      expect(result?.status).toBeUndefined();
      expect(result?.missionsCount).toBe(1);
    });

    it('2 avis, moyenne 1.0 → pas de suspension (seuil non atteint)', () => {
      const result = computeDriverRatingUpdate([1, 1]);
      expect(result?.status).toBeUndefined();
      expect(result?.missionsCount).toBe(2);
    });
  });

  describe('suspension automatique (≥ 3 avis ET moyenne ≤ 2)', () => {
    it('3 avis, moyenne exactement 2.0 → suspension', () => {
      const result = computeDriverRatingUpdate([1, 2, 3]); // moyenne 2.0
      expect(result?.status).toBe('suspended');
      expect(result?.adminLastActionReason).toContain('2/5');
    });

    it('3 avis tous à 1 → suspension', () => {
      const result = computeDriverRatingUpdate([1, 1, 1]);
      expect(result?.status).toBe('suspended');
    });

    it('4 avis, moyenne 1.5 → suspension', () => {
      const result = computeDriverRatingUpdate([1, 1, 2, 2]);
      expect(result?.status).toBe('suspended');
    });
  });

  describe('pas de suspension (≥ 3 avis ET moyenne > 2)', () => {
    it('3 avis, moyenne 2.33 → pas de suspension', () => {
      const result = computeDriverRatingUpdate([2, 3, 2]); // 7/3 ≈ 2.33
      expect(result?.status).toBeUndefined();
    });

    it('3 avis, moyenne 3.0 → pas de suspension', () => {
      const result = computeDriverRatingUpdate([3, 3, 3]);
      expect(result?.status).toBeUndefined();
    });

    it('3 avis, moyenne 5.0 → pas de suspension', () => {
      const result = computeDriverRatingUpdate([5, 5, 5]);
      expect(result?.status).toBeUndefined();
    });
  });

  describe('calcul ratingAverage', () => {
    it('arrondi à 1 décimale', () => {
      // [1, 2, 3, 4, 5] → moyenne 3.0 → 3.0
      const result = computeDriverRatingUpdate([1, 2, 3, 4, 5]);
      expect(result?.ratingAverage).toBe(3);
    });

    it('2 avis [3, 4] → moyenne 3.5', () => {
      const result = computeDriverRatingUpdate([3, 4]);
      expect(result?.ratingAverage).toBe(3.5);
    });

    it('missionsCount correspond au nombre d\'avis', () => {
      const result = computeDriverRatingUpdate([4, 5, 3, 2, 5]);
      expect(result?.missionsCount).toBe(5);
    });
  });
});
