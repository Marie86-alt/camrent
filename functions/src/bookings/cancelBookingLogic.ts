export function calculateCancellation(totalPrice: number, startDate: Date, now: Date) {
  const msBeforeStart = startDate.getTime() - now.getTime();
  const hoursBeforeStart = msBeforeStart / (1000 * 60 * 60);
  const isFree = hoursBeforeStart >= 48;
  const cancellationFee = isFree ? 0 : Math.round(totalPrice * 0.1);

  return {
    cancellationFee,
    cancellationPolicy: isFree ? 'free_before_48h' : 'late_10_percent',
    refundAmount: Math.max(0, totalPrice - cancellationFee),
  } as const;
}
