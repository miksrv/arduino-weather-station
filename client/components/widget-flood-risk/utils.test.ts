import { clampContribution, getRiskLevelColor, resolveCssVar } from './utils'

describe('widget-flood-risk/utils', () => {
    describe('resolveCssVar', () => {
        it('returns fallback when window is undefined (SSR)', () => {
            const originalWindow = global.window
            // @ts-expect-error — simulating SSR environment
            delete global.window
            expect(resolveCssVar('--color-green', '#4bb34b')).toBe('#4bb34b')
            global.window = originalWindow
        })

        it('returns resolved value from getComputedStyle', () => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (prop: string) => (prop === '--color-green' ? ' #4bb34b' : '')
            } as unknown as CSSStyleDeclaration)

            expect(resolveCssVar('--color-green', '#000000')).toBe('#4bb34b')
            jest.restoreAllMocks()
        })

        it('returns fallback when getComputedStyle returns empty string', () => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: () => ''
            } as unknown as CSSStyleDeclaration)

            expect(resolveCssVar('--color-green', '#4bb34b')).toBe('#4bb34b')
            jest.restoreAllMocks()
        })
    })

    describe('getRiskLevelColor', () => {
        beforeEach(() => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (prop: string) => {
                    const map: Record<string, string> = {
                        '--color-green': '#4bb34b',
                        '--color-orange': '#f8a01c',
                        '--color-red': '#e64646'
                    }
                    return map[prop] ?? ''
                }
            } as unknown as CSSStyleDeclaration)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('returns resolved green colour for low', () => {
            expect(getRiskLevelColor('low')).toBe('#4bb34b')
        })

        it('returns resolved orange colour for elevated', () => {
            expect(getRiskLevelColor('elevated')).toBe('#f8a01c')
        })

        it('returns resolved orange colour for high', () => {
            expect(getRiskLevelColor('high')).toBe('#f8a01c')
        })

        it('returns resolved red colour for critical', () => {
            expect(getRiskLevelColor('critical')).toBe('#e64646')
        })

        it('returns a non-empty string for all levels', () => {
            const levels = ['low', 'elevated', 'high', 'critical'] as const
            levels.forEach((level) => {
                expect(getRiskLevelColor(level)).toBeTruthy()
            })
        })
    })

    describe('clampContribution', () => {
        it('returns 0 when contribution is 0', () => {
            expect(clampContribution(0)).toBe(0)
        })

        it('returns the value unchanged for a mid-range input', () => {
            expect(clampContribution(50)).toBe(50)
        })

        it('clamps to 100 when contribution exceeds 100', () => {
            expect(clampContribution(150)).toBe(100)
        })

        it('clamps to 0 when contribution is negative', () => {
            expect(clampContribution(-10)).toBe(0)
        })

        it('returns 100 exactly at the boundary', () => {
            expect(clampContribution(100)).toBe(100)
        })

        it('returns the value at 99', () => {
            expect(clampContribution(99)).toBe(99)
        })
    })
})
