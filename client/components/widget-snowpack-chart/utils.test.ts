import { dateToSeasonDay, isFloodYear, seasonDayToDate } from './utils'

describe('dateToSeasonDay', () => {
    it('returns 0 for October 1 (season start)', () => {
        expect(dateToSeasonDay('2023-10-01')).toBe(0)
    })

    it('returns 30 for October 31', () => {
        expect(dateToSeasonDay('2023-10-31')).toBe(30)
    })

    it('returns 31 for November 1', () => {
        expect(dateToSeasonDay('2023-11-01')).toBe(31)
    })

    it('returns 61 for December 1', () => {
        // 31 (Oct) + 30 (Nov) = 61
        expect(dateToSeasonDay('2023-12-01')).toBe(61)
    })

    it('returns correct value for January 1', () => {
        // 31 (Oct) + 30 (Nov) + 31 (Dec) = 92
        expect(dateToSeasonDay('2024-01-01')).toBe(92)
    })

    it('returns correct value for March 1', () => {
        // 31 + 30 + 31 + 31 + 28 = 151
        expect(dateToSeasonDay('2024-03-01')).toBe(151)
    })
})

describe('seasonDayToDate', () => {
    it('converts day 0 back to October 1', () => {
        expect(seasonDayToDate(0)).toBe('10-01-2000')
    })

    it('converts day 31 back to November 1', () => {
        expect(seasonDayToDate(31)).toBe('11-01-2000')
    })

    it('converts day 61 back to December 1', () => {
        expect(seasonDayToDate(61)).toBe('12-01-2000')
    })

    it('converts day 92 back to January 1', () => {
        expect(seasonDayToDate(92)).toBe('01-01-2000')
    })

    it('round-trips correctly for an arbitrary date', () => {
        const day = dateToSeasonDay('2024-02-15')
        const result = seasonDayToDate(day)
        // February is month index 4 → calendar month 2
        expect(result).toBe('02-15-2000')
    })
})

describe('isFloodYear', () => {
    it('returns true when year matches floodYear', () => {
        expect(isFloodYear('2023-2024', '2023-2024')).toBe(true)
    })

    it('returns false when year does not match', () => {
        expect(isFloodYear('2022-2023', '2023-2024')).toBe(false)
    })

    it('returns false for empty strings', () => {
        expect(isFloodYear('', '2023-2024')).toBe(false)
    })
})
