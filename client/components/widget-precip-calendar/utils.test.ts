import { getCellColor, isLeapYear } from './utils'

describe('isLeapYear', () => {
    it('returns true for year divisible by 400 (2000)', () => {
        expect(isLeapYear(2000)).toBe(true)
    })

    it('returns false for year divisible by 100 but not 400 (1900)', () => {
        expect(isLeapYear(1900)).toBe(false)
    })

    it('returns true for year divisible by 4 but not 100 (2024)', () => {
        expect(isLeapYear(2024)).toBe(true)
    })

    it('returns false for non-divisible-by-4 year (2023)', () => {
        expect(isLeapYear(2023)).toBe(false)
    })

    it('returns false for year divisible by 100 but not 400 (2100)', () => {
        expect(isLeapYear(2100)).toBe(false)
    })
})

describe('getCellColor', () => {
    it('returns border color for total = 0', () => {
        expect(getCellColor(0)).toBe('var(--input-border-color)')
    })

    it('returns border color for total = -1', () => {
        expect(getCellColor(-1)).toBe('var(--input-border-color)')
    })

    it('returns #cce5ff for total = 0.5 (0 < x ≤ 1)', () => {
        expect(getCellColor(0.5)).toBe('#cce5ff')
    })

    it('returns #cce5ff for total = 1.0 (boundary ≤ 1)', () => {
        expect(getCellColor(1.0)).toBe('#cce5ff')
    })

    it('returns #66b2ff for total = 1.1 (1 < x ≤ 5)', () => {
        expect(getCellColor(1.1)).toBe('#66b2ff')
    })

    it('returns #66b2ff for total = 5.0 (boundary ≤ 5)', () => {
        expect(getCellColor(5.0)).toBe('#66b2ff')
    })

    it('returns #1a7fd4 for total = 5.1 (5 < x ≤ 20)', () => {
        expect(getCellColor(5.1)).toBe('#1a7fd4')
    })

    it('returns #1a7fd4 for total = 20.0 (boundary ≤ 20)', () => {
        expect(getCellColor(20.0)).toBe('#1a7fd4')
    })

    it('returns #004080 for total = 20.1 (> 20)', () => {
        expect(getCellColor(20.1)).toBe('#004080')
    })
})
