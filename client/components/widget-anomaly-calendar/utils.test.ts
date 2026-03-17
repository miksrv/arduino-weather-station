import { formatDateStr, getIntensityClass, isFutureDate } from './utils'

describe('widget-anomaly-calendar/utils', () => {
    describe('formatDateStr', () => {
        it('formats a date as YYYY-MM-DD', () => {
            const d = new Date(2024, 0, 5) // Jan 5, 2024 (local time)
            expect(formatDateStr(d)).toBe('2024-01-05')
        })

        it('pads month and day with leading zeros', () => {
            const d = new Date(2024, 2, 9) // March 9
            expect(formatDateStr(d)).toBe('2024-03-09')
        })

        it('handles December 31', () => {
            const d = new Date(2023, 11, 31)
            expect(formatDateStr(d)).toBe('2023-12-31')
        })

        it('handles Jan 1 of the first day of a year', () => {
            const d = new Date(2025, 0, 1)
            expect(formatDateStr(d)).toBe('2025-01-01')
        })
    })

    describe('isFutureDate', () => {
        it('returns true when cellDate is after today', () => {
            const today = new Date(2024, 5, 15)
            const future = new Date(2024, 5, 16)
            expect(isFutureDate(future, today)).toBe(true)
        })

        it('returns false when cellDate equals today', () => {
            const today = new Date(2024, 5, 15)
            expect(isFutureDate(today, today)).toBe(false)
        })

        it('returns false when cellDate is before today', () => {
            const today = new Date(2024, 5, 15)
            const past = new Date(2024, 5, 14)
            expect(isFutureDate(past, today)).toBe(false)
        })
    })

    describe('getIntensityClass', () => {
        it('returns cellIntensity1 for count === 1', () => {
            expect(getIntensityClass(1)).toBe('cellIntensity1')
        })

        it('returns cellIntensity2 for count === 2', () => {
            expect(getIntensityClass(2)).toBe('cellIntensity2')
        })

        it('returns cellIntensity3 for count === 3', () => {
            expect(getIntensityClass(3)).toBe('cellIntensity3')
        })

        it('returns cellIntensity3 for count === 5 (above threshold)', () => {
            expect(getIntensityClass(5)).toBe('cellIntensity3')
        })

        it('returns cellIntensity3 for large counts', () => {
            expect(getIntensityClass(100)).toBe('cellIntensity3')
        })
    })
})
