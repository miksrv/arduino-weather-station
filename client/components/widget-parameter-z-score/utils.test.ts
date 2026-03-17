import { getFilledDots, getZScoreColor } from './utils'

describe('widget-parameter-z-score/utils', () => {
    describe('getZScoreColor', () => {
        it('returns green for Z = 0 (no anomaly)', () => {
            expect(getZScoreColor(0)).toBe('var(--color-green)')
        })

        it('returns green for |Z| < 1.5', () => {
            expect(getZScoreColor(1.0)).toBe('var(--color-green)')
            expect(getZScoreColor(-1.0)).toBe('var(--color-green)')
            expect(getZScoreColor(1.49)).toBe('var(--color-green)')
        })

        it('returns orange at the 1.5 boundary', () => {
            expect(getZScoreColor(1.5)).toBe('var(--color-orange)')
            expect(getZScoreColor(-1.5)).toBe('var(--color-orange)')
        })

        it('returns orange for 1.5 <= |Z| <= 2.0', () => {
            expect(getZScoreColor(1.8)).toBe('var(--color-orange)')
            expect(getZScoreColor(-1.8)).toBe('var(--color-orange)')
            expect(getZScoreColor(2.0)).toBe('var(--color-orange)')
        })

        it('returns red for |Z| > 2.0', () => {
            expect(getZScoreColor(2.01)).toBe('var(--color-red)')
            expect(getZScoreColor(-2.01)).toBe('var(--color-red)')
            expect(getZScoreColor(3.0)).toBe('var(--color-red)')
            expect(getZScoreColor(-3.0)).toBe('var(--color-red)')
        })
    })

    describe('getFilledDots', () => {
        it('returns 0 dots for Z = 0', () => {
            expect(getFilledDots(0)).toBe(0)
        })

        it('returns 3 dots for Z = 1 (|1|/2 * 5 = 2.5 → rounds to 3)', () => {
            expect(getFilledDots(1)).toBe(3)
        })

        it('returns 5 dots for Z = 2 (|2|/2 * 5 = 5)', () => {
            expect(getFilledDots(2)).toBe(5)
        })

        it('returns 5 dots for Z = -2', () => {
            expect(getFilledDots(-2)).toBe(5)
        })

        it('clamps at 5 for Z = 3 (beyond max)', () => {
            expect(getFilledDots(3)).toBe(5)
        })

        it('clamps at 5 for Z = -3', () => {
            expect(getFilledDots(-3)).toBe(5)
        })

        it('returns 0 dots for Z = 0.1 (rounds down)', () => {
            expect(getFilledDots(0.1)).toBe(0)
        })

        it('returns correct dots for Z = 1.5', () => {
            // |1.5| / 2 * 5 = 3.75 → rounds to 4
            expect(getFilledDots(1.5)).toBe(4)
        })
    })
})
