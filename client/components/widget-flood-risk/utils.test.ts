import { clampContribution, getRiskLevelColor, resolveCssVar } from './utils'

describe('resolveCssVar', () => {
    it('returns fallback on the server (no window)', () => {
        const originalWindow = global.window
        // @ts-expect-error intentionally removing window to simulate SSR
        delete global.window
        expect(resolveCssVar('--color-green', '#4bb34b')).toBe('#4bb34b')
        global.window = originalWindow
    })

    it('returns fallback when CSS variable is not set', () => {
        // jsdom does not resolve CSS custom properties — getPropertyValue returns ''
        expect(resolveCssVar('--nonexistent-var', '#fallback')).toBe('#fallback')
    })
})

describe('getRiskLevelColor', () => {
    it('returns the fallback green hex for level low', () => {
        // jsdom returns '' for CSS vars, so the fallback is used
        expect(getRiskLevelColor('low')).toBe('#4bb34b')
    })

    it('returns the fallback orange hex for level elevated', () => {
        expect(getRiskLevelColor('elevated')).toBe('#f8a01c')
    })

    it('returns the fallback orange hex for level high', () => {
        expect(getRiskLevelColor('high')).toBe('#f8a01c')
    })

    it('returns the fallback red hex for level critical', () => {
        expect(getRiskLevelColor('critical')).toBe('#e64646')
    })
})

describe('clampContribution', () => {
    it('returns the value unchanged when within [0, 100]', () => {
        expect(clampContribution(50)).toBe(50)
        expect(clampContribution(0)).toBe(0)
        expect(clampContribution(100)).toBe(100)
    })

    it('clamps negative values to 0', () => {
        expect(clampContribution(-10)).toBe(0)
    })

    it('clamps values above 100 to 100', () => {
        expect(clampContribution(150)).toBe(100)
    })
})
