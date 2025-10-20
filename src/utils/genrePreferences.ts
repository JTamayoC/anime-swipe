// Utility functions for genre preferences

/**
 * Normalizes genre weights so they sum to 1
 */
export function normalizeGenreWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  if (total === 0) return weights;

  const normalized: Record<string, number> = {};
  for (const [genreId, weight] of Object.entries(weights)) {
    normalized[genreId] = weight / total;
  }

  return normalized;
}

/**
 * Rounds a number to 4 decimal places
 */
export function roundToFourDecimals(num: number): number {
  return Math.round(num * 10000) / 10000;
}

/**
 * Normalizes and rounds genre weights
 */
export function normalizeAndRoundGenreWeights(
  weights: Record<string, number>
): Record<string, number> {
  const normalized = normalizeGenreWeights(weights);
  const rounded: Record<string, number> = {};

  for (const [genreId, weight] of Object.entries(normalized)) {
    rounded[genreId] = roundToFourDecimals(weight);
  }

  return rounded;
}
