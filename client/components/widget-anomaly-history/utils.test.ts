import { getDuration, isActiveToday } from './utils'

describe('getDuration', () => {
    it('returns empty string when endDate is null', () => {
        expect(getDuration('2024-01-01', null)).toBe('')
    })

    it('calculates duration in days for a 1-day span', () => {
        expect(getDuration('2024-01-01', '2024-01-02')).toBe('1d')
    })

    it('calculates duration in days for a multi-day span', () => {
        expect(getDuration('2024-01-01', '2024-01-08')).toBe('7d')
    })

    it('returns 0d when start equals end', () => {
        expect(getDuration('2024-06-15', '2024-06-15')).toBe('0d')
    })
})

describe('isActiveToday', () => {
    it('returns true when endDate is null', () => {
        expect(isActiveToday(null)).toBe(true)
    })

    it('returns true when endDate matches today in local time', () => {
        // The function compares year/month/date using getFullYear/getMonth/getDate
        // which are local-time getters.  We must supply a value that new Date()
        // resolves to the correct local day.  ISO date-only strings ('YYYY-MM-DD')
        // are parsed as UTC midnight, which shifts to the previous local day in
        // positive UTC offsets.  Adding 'T12:00:00' (no Z) forces local-time parsing.
        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        expect(isActiveToday(`${yyyy}-${mm}-${dd}T12:00:00`)).toBe(true)
    })

    it('returns false when endDate is in the past', () => {
        expect(isActiveToday('2000-01-01')).toBe(false)
    })

    it('returns false when endDate is in the future', () => {
        expect(isActiveToday('2099-12-31')).toBe(false)
    })
})
