import { formatDateStr, getIntensityClass, isFutureDate } from './utils'

describe('formatDateStr', () => {
    it('formats a date as YYYY-MM-DD', () => {
        const date = new Date(2024, 0, 5) // Jan 5, 2024
        expect(formatDateStr(date)).toBe('2024-01-05')
    })

    it('pads single-digit month and day', () => {
        const date = new Date(2024, 8, 3) // Sep 3, 2024
        expect(formatDateStr(date)).toBe('2024-09-03')
    })

    it('handles December (month 11)', () => {
        const date = new Date(2024, 11, 31)
        expect(formatDateStr(date)).toBe('2024-12-31')
    })
})

describe('isFutureDate', () => {
    it('returns true when cellDate is strictly after today', () => {
        const today = new Date(2024, 5, 10)
        const future = new Date(2024, 5, 11)
        expect(isFutureDate(future, today)).toBe(true)
    })

    it('returns false when cellDate equals today', () => {
        const today = new Date(2024, 5, 10)
        expect(isFutureDate(today, today)).toBe(false)
    })

    it('returns false when cellDate is before today', () => {
        const today = new Date(2024, 5, 10)
        const past = new Date(2024, 5, 9)
        expect(isFutureDate(past, today)).toBe(false)
    })
})

describe('getIntensityClass', () => {
    it('returns cellIntensity1 for count 1', () => {
        expect(getIntensityClass(1)).toBe('cellIntensity1')
    })

    it('returns cellIntensity2 for count 2', () => {
        expect(getIntensityClass(2)).toBe('cellIntensity2')
    })

    it('returns cellIntensity3 for count 3', () => {
        expect(getIntensityClass(3)).toBe('cellIntensity3')
    })

    it('returns cellIntensity3 for counts greater than 3', () => {
        expect(getIntensityClass(10)).toBe('cellIntensity3')
    })
})
