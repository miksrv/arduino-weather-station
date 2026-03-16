import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
    currentDate,
    formatDate,
    formatDateFromUTC,
    getDate,
    getDateTimeFormat,
    halfYearDate,
    minutesAgo,
    timeAgo,
    yesterdayDate
} from './date'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

describe('date utilities', () => {
    it('should return the current date in the specified timezone', () => {
        // Compare only the date portion to avoid timing issues
        const expectedDate = dayjs().tz('Asia/Yekaterinburg').format('YYYY-MM-DD')
        const receivedDate = currentDate.format('YYYY-MM-DD')
        expect(receivedDate).toBe(expectedDate)
    })

    it('should return the date for yesterday', () => {
        expect(yesterdayDate).toStrictEqual(currentDate.subtract(1, 'day').toDate())
    })

    it('should return the date for half a year ago', () => {
        expect(halfYearDate).toStrictEqual(currentDate.subtract(6, 'month').toDate())
    })

    it('should parse a date string or Date object to Dayjs object in the specified timezone', () => {
        const date = new Date()
        expect(getDate(date).format()).toBe(dayjs(date).tz('Asia/Yekaterinburg').format())
    })

    it('should format a date to a string in the specified format', () => {
        const date = new Date()
        expect(formatDate(date)).toBe(dayjs(date).tz('Asia/Yekaterinburg').format('D MMMM YYYY, HH:mm'))
    })

    it('should return the minutes ago from the given date', () => {
        const date = new Date()
        expect(minutesAgo(date)).toBe(dayjs().diff(dayjs(date).tz('Asia/Yekaterinburg'), 'minute'))
    })

    it('should return the correct date time format based on the difference between start and end dates', () => {
        const startDate = dayjs().subtract(1, 'day').format()
        const endDate = dayjs().format()
        expect(getDateTimeFormat(startDate, endDate)).toBe('HH:mm')

        const startDateWeek = dayjs().subtract(5, 'day').format()
        expect(getDateTimeFormat(startDateWeek, endDate)).toBe('D MMM HH:00')

        const startDateMonth = dayjs().subtract(10, 'day').format()
        expect(getDateTimeFormat(startDateMonth, endDate)).toBe('D MMMM')
    })

    describe('formatDateFromUTC', () => {
        it('should return an empty string when called with no argument', () => {
            expect(formatDateFromUTC()).toBe('')
        })

        it('should return an empty string when called with undefined', () => {
            expect(formatDateFromUTC(undefined)).toBe('')
        })

        it('should return an empty string when called with zero', () => {
            expect(formatDateFromUTC(0)).toBe('')
        })

        it('should format a UTC millisecond timestamp using the default format', () => {
            // 2024-06-15 12:00:00 UTC — in milliseconds
            const utcMs = 1718452800000
            const expected = dayjs
                .unix(utcMs / 1000)
                .utc(true)
                .tz('Asia/Yekaterinburg')
                .format('D MMMM YYYY, HH:mm')
            expect(formatDateFromUTC(utcMs)).toBe(expected)
        })

        it('should format a UTC millisecond timestamp using a custom format', () => {
            const utcMs = 1718452800000
            const expected = dayjs
                .unix(utcMs / 1000)
                .utc(true)
                .tz('Asia/Yekaterinburg')
                .format('DD.MM.YYYY')
            expect(formatDateFromUTC(utcMs, 'DD.MM.YYYY')).toBe(expected)
        })
    })

    describe('timeAgo', () => {
        it('should return an empty string when called with no argument', () => {
            expect(timeAgo()).toBe('')
        })

        it('should return an empty string when called with undefined', () => {
            expect(timeAgo(undefined)).toBe('')
        })

        it('should return a relative time string for a recent date string', () => {
            const recentDate = dayjs().subtract(5, 'minute').toISOString()
            const result = timeAgo(recentDate)
            expect(typeof result).toBe('string')
            expect(result.length).toBeGreaterThan(0)
        })

        it('should return a relative time string for a Date object', () => {
            const date = dayjs().subtract(2, 'hour').toDate()
            const result = timeAgo(date)
            expect(typeof result).toBe('string')
            expect(result.length).toBeGreaterThan(0)
        })

        it('should omit the suffix when withoutSuffix is true', () => {
            const date = dayjs().subtract(5, 'minute').toISOString()
            const withSuffix = timeAgo(date, false)
            const withoutSuffix = timeAgo(date, true)
            // withoutSuffix removes "ago" / "in" — the two strings should differ
            expect(withSuffix).not.toBe(withoutSuffix)
        })
    })
})
