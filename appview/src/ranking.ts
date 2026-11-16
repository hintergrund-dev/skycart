/**
 * SQL expression for `sort=relevance` (lower is better; use in ORDER BY ... ASC).
 * FTS5 bm25 score, minus a small boost for the shop's average rating from
 * verified-purchase reviews: 0 for a 1-star average up to 0.5 for a 5-star average,
 * and no boost below three such reviews. Nothing else influences ranking.
 * Requires `search` (FTS table) and `vs` (verified_stats) in the query.
 */
export const relevance = () =>
  'bm25(search) - CASE WHEN vs.n >= 3 THEN 0.5 * (vs.avg - 1) / 4 ELSE 0 END';
