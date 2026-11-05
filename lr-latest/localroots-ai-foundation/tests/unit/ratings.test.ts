import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summariseRatings } from '@/lib/utils/ratings';

describe('summariseRatings', () => {
  it('returns zeros for no reviews', () => {
    const s = summariseRatings([]);
    assert.equal(s.average, 0);
    assert.equal(s.count, 0);
    assert.ok(s.bars.every((b) => b.count === 0 && b.percent === 0));
  });

  it('computes average, counts and percentages', () => {
    const s = summariseRatings([{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 1 }]);
    assert.equal(s.count, 4);
    assert.equal(s.average, 3.8); // 15 / 4 = 3.75, rounded to one decimal
    assert.deepEqual(
      s.bars.map((b) => [b.stars, b.count, b.percent]),
      [[5, 2, 50], [4, 1, 25], [3, 0, 0], [2, 0, 0], [1, 1, 25]],
    );
  });
});
