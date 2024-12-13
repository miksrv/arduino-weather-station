import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { currentDate, formatDate, getDate, getDateTimeFormat, halfYearDate, minutesAgo, yesterdayDate } from './date'

dayjs.extend(utc)
dayjs.extend(timezone)

describe('date utilities', () => {
    it('should return the current date in the specified timezone', () => {
        expect(currentDate.format()).toBe(dayjs().tz('Asia/Yekaterinburg').format())
    })

    it('should return the date for yesterday', () => {
        expect(yesterdayDate).toEqual(currentDate.subtract(1, 'day').toDate())
    })

    it('should return the date for half a year ago', () => {
        expect(halfYearDate).toEqual(currentDate.subtract(6, 'month').toDate())
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
})
