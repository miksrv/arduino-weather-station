import { getCalendarDays, getCalendarToday, getIntensityClass, getMonthLabels } from './utils'

describe('getCalendarDays', () => {
    it('ends on the given today, oldest day first', () => {
        expect(getCalendarDays('2026-11-06', 3)).toStrictEqual(['2026-11-04', '2026-11-05', '2026-11-06'])
    })

    it('crosses month and year boundaries and a daylight-saving change by whole days', () => {
        const days = getCalendarDays('2026-01-02', 5)
        expect(days).toStrictEqual(['2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'])
        expect(getCalendarDays('2026-03-30', 3)).toStrictEqual(['2026-03-28', '2026-03-29', '2026-03-30'])
    })
})

describe('getCalendarToday', () => {
    it('ends the grid on the API last day, not the station clock', () => {
        const data = [{ date: '2026-11-05' }, { date: '2026-11-06' }]
        expect(getCalendarToday(data, '2026-11-07')).toBe('2026-11-06')
    })

    it('falls back to the given date without data', () => {
        expect(getCalendarToday([], '2026-11-07')).toBe('2026-11-07')
    })
})

describe('getMonthLabels', () => {
    it('labels the first week of each month by its column', () => {
        // Weeks start on 18 Jan, 25 Jan, 1 Feb and 8 Feb
        const days = getCalendarDays('2026-02-14', 28)
        expect(getMonthLabels(days, 7, 'en')).toStrictEqual([
            { label: 'Jan', weekIndex: 0 },
            { label: 'Feb', weekIndex: 2 }
        ])
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
