import { getFilledDots, getZScoreColor } from './utils'

describe('getZScoreColor', () => {
    it('returns green for |z| < 1.5', () => {
        expect(getZScoreColor(0)).toBe('var(--color-green)')
        expect(getZScoreColor(1.4)).toBe('var(--color-green)')
        expect(getZScoreColor(-1.4)).toBe('var(--color-green)')
    })

    it('returns orange for |z| in [1.5, 2.0]', () => {
        expect(getZScoreColor(1.5)).toBe('var(--color-orange)')
        expect(getZScoreColor(2.0)).toBe('var(--color-orange)')
        expect(getZScoreColor(-1.8)).toBe('var(--color-orange)')
    })

    it('returns red for |z| > 2.0', () => {
        expect(getZScoreColor(2.1)).toBe('var(--color-red)')
        expect(getZScoreColor(-3.0)).toBe('var(--color-red)')
    })
})

describe('getFilledDots', () => {
    it('returns 0 dots for z = 0', () => {
        expect(getFilledDots(0)).toBe(0)
    })

    it('returns 5 dots for |z| = 2 (maximum)', () => {
        expect(getFilledDots(2)).toBe(5)
        expect(getFilledDots(-2)).toBe(5)
    })

    it('returns 5 dots for |z| > 2 (clamped)', () => {
        expect(getFilledDots(4)).toBe(5)
    })

    it('returns intermediate dots for |z| = 1', () => {
        // |1| / 2 * 5 = 2.5, rounds to 3
        expect(getFilledDots(1)).toBe(3)
        expect(getFilledDots(-1)).toBe(3)
    })

    it('returns 1 dot for |z| = 0.5', () => {
        // 0.5 / 2 * 5 = 1.25, rounds to 1
        expect(getFilledDots(0.5)).toBe(1)
    })
})
