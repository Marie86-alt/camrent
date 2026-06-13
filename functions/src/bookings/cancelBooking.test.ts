import { calculateCancellation } from './cancelBookingLogic';

const NOW = new Date('2024-06-01T12:00:00.000Z');

function startAt(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000);
}

describe('calculateCancellation', () => {
  describe('annulation gratuite (≥ 48 h)', () => {
    it('remboursement total à 72 h', () => {
      const result = calculateCancellation(30000, startAt(72), NOW);
      expect(result.cancellationFee).toBe(0);
      expect(result.cancellationPolicy).toBe('free_before_48h');
      expect(result.refundAmount).toBe(30000);
    });

    it('remboursement total exactement à 48 h (borne inclusive)', () => {
      const result = calculateCancellation(30000, startAt(48), NOW);
      expect(result.cancellationFee).toBe(0);
      expect(result.cancellationPolicy).toBe('free_before_48h');
    });
  });

  describe('frais 10 % (< 48 h)', () => {
    it('frais à 47 h', () => {
      const result = calculateCancellation(30000, startAt(47), NOW);
      expect(result.cancellationFee).toBe(3000);
      expect(result.cancellationPolicy).toBe('late_10_percent');
      expect(result.refundAmount).toBe(27000);
    });

    it('frais à 24 h', () => {
      const result = calculateCancellation(30000, startAt(24), NOW);
      expect(result.cancellationFee).toBe(3000);
      expect(result.cancellationPolicy).toBe('late_10_percent');
    });

    it('frais à 1 h (annulation tardive)', () => {
      const result = calculateCancellation(30000, startAt(1), NOW);
      expect(result.cancellationFee).toBe(3000);
    });
  });

  describe('calcul refundAmount', () => {
    it('refundAmount = totalPrice − cancellationFee', () => {
      const price = 15000;
      const result = calculateCancellation(price, startAt(10), NOW);
      expect(result.refundAmount).toBe(price - result.cancellationFee);
    });

    it('arrondi Math.round sur les frais', () => {
      // 10 % de 15 001 = 1500.1 → arrondi à 1500
      const result = calculateCancellation(15001, startAt(10), NOW);
      expect(result.cancellationFee).toBe(1500);
    });

    it('refundAmount ne peut pas être négatif (Math.max guard)', () => {
      // totalPrice 0 → fee 0 → refund 0
      const result = calculateCancellation(0, startAt(10), NOW);
      expect(result.refundAmount).toBe(0);
    });
  });
});
