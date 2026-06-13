const MIN_REVIEWS_FOR_AUTOSUSPEND = 3;
const AUTO_SUSPEND_THRESHOLD = 2;

export function computeDriverRatingUpdate(ratings: number[]): Record<string, unknown> | null {
  if (ratings.length === 0) return null;

  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  const rounded = Math.round(average * 10) / 10;
  const update: Record<string, unknown> = {
    missionsCount: ratings.length,
    ratingAverage: rounded,
  };

  if (ratings.length >= MIN_REVIEWS_FOR_AUTOSUSPEND && average <= AUTO_SUSPEND_THRESHOLD) {
    update.status = 'suspended';
    update.adminLastActionReason = `Suspension automatique : note moyenne ${rounded}/5 sur ${ratings.length} avis`;
  }

  return update;
}
