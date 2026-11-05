import type { Review } from '@/types';

export interface RatingBar {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
  /** Share of reviews with this star count, 0 to 100, rounded. */
  percent: number;
}

export interface RatingSummary {
  average: number;
  count: number;
  /** Five bars ordered 5 stars first. */
  bars: RatingBar[];
}

/** Builds an average and star breakdown from reviews. Empty input gives zeros. */
export function summariseRatings(reviews: readonly Pick<Review, 'rating'>[]): RatingSummary {
  const count = reviews.length;
  const totals: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    totals[r.rating] += 1;
    sum += r.rating;
  }
  const average = count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
  const bars: RatingBar[] = ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: totals[stars],
    percent: count === 0 ? 0 : Math.round((totals[stars] / count) * 100),
  }));
  return { average, count, bars };
}
