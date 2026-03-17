const TOTAL_DOTS = 5

/**
 * Returns the CSS colour variable for a given Z-score value.
 * |Z| > 2.0  → red
 * |Z| >= 1.5 → orange
 * otherwise  → green
 */
export const getZScoreColor = (zScore: number): string => {
    const abs = Math.abs(zScore)
    if (abs > 2.0) {
        return 'var(--color-red)'
    }
    if (abs >= 1.5) {
        return 'var(--color-orange)'
    }
    return 'var(--color-green)'
}

/**
 * Returns the number of filled severity dots (0–TOTAL_DOTS) for a Z-score.
 * Scales linearly so |Z| = 2 → 5 dots.
 */
export const getFilledDots = (zScore: number): number => Math.round(Math.min(Math.abs(zScore) / 2, 1) * TOTAL_DOTS)
