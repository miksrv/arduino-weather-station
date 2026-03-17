import { dateToSeasonDay, isFloodYear } from './utils'

describe('widget-snowpack-chart/utils', () => {
    describe('dateToSeasonDay', () => {
        it('returns 0 for Oct 1 (season start)', () => {
            expect(dateToSeasonDay('2023-10-01')).toBe(0)
        })

        it('returns 31 for Nov 1 (after 31 days of October)', () => {
            expect(dateToSeasonDay('2023-11-01')).toBe(31)
        })

        it('returns 61 for Dec 1 (after October=31, November=30)', () => {
            expect(dateToSeasonDay('2023-12-01')).toBe(61)
        })

        it('returns 92 for Jan 1 (Oct+Nov+Dec = 31+30+31)', () => {
            expect(dateToSeasonDay('2024-01-01')).toBe(92)
        })

        it('returns correct index for Feb 1', () => {
            // Oct(31)+Nov(30)+Dec(31)+Jan(31) = 123
            expect(dateToSeasonDay('2024-02-01')).toBe(123)
        })

        it('returns correct index for Mar 1', () => {
            // Oct(31)+Nov(30)+Dec(31)+Jan(31)+Feb(28) = 151
            expect(dateToSeasonDay('2024-03-01')).toBe(151)
        })

        it('returns correct index for Apr 1', () => {
            // Oct(31)+Nov(30)+Dec(31)+Jan(31)+Feb(28)+Mar(31) = 182
            expect(dateToSeasonDay('2024-04-01')).toBe(182)
        })

        it('returns correct index for May 1', () => {
            // Oct(31)+Nov(30)+Dec(31)+Jan(31)+Feb(28)+Mar(31)+Apr(30) = 212
            expect(dateToSeasonDay('2024-05-01')).toBe(212)
        })

        it('returns correct index for May 31 (last season day)', () => {
            // May 1 = 212, so May 31 = 212 + 30 = 242
            expect(dateToSeasonDay('2024-05-31')).toBe(242)
        })

        it('handles Oct 15 correctly', () => {
            // Oct 1 = 0, Oct 15 = 14
            expect(dateToSeasonDay('2023-10-15')).toBe(14)
        })
    })

    describe('isFloodYear', () => {
        it('returns true when year matches flood year', () => {
            expect(isFloodYear('2023-2024', '2023-2024')).toBe(true)
        })

        it('returns false when year does not match flood year', () => {
            expect(isFloodYear('2022-2023', '2023-2024')).toBe(false)
        })

        it('returns false for an empty string', () => {
            expect(isFloodYear('', '2023-2024')).toBe(false)
        })

        it('returns true when both are the same custom year', () => {
            expect(isFloodYear('2021-2022', '2021-2022')).toBe(true)
        })
    })
})
