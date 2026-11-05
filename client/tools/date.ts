import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

export const TIME_ZONE = 'Asia/Yekaterinburg'

// Functions, not constants: a module-level "now" would freeze at server start (SSR) or at page load
// (a tab left open past midnight would keep asking for yesterday's range)
export const getCurrentDate = (): Dayjs => dayjs().utc(false).tz(TIME_ZONE)
export const getYesterdayDate = (): Date => getCurrentDate().subtract(1, 'day').toDate()
export const getHalfYearDate = (): Date => getCurrentDate().subtract(6, 'month').toDate()

/**
 * The `start_date` / `end_date` of the last `days` days up to today, in the station's time zone.
 * Day-granular, so a server render and the browser ask for the same range (and share the cache).
 */
export const getRecentDateRange = (days: number): { start_date: string; end_date: string } => {
    const now = getCurrentDate()

    return {
        start_date: now.subtract(days, 'day').format('YYYY-MM-DD'),
        end_date: now.format('YYYY-MM-DD')
    }
}

export const getDate = (date: string | Date): Dayjs => dayjs.utc(date).tz(TIME_ZONE)

export const isValidDateString = (value?: string | string[]): value is string =>
    typeof value === 'string' && dayjs(value, 'YYYY-MM-DD', true).isValid()

export const formatDateFromUTC = (utc?: number, format: string = 'D MMMM YYYY, HH:mm'): string =>
    utc
        ? dayjs
              .unix(utc / 1000)
              .utc(true)
              .tz(TIME_ZONE)
              .format(format)
        : ''

export const formatDate = (date?: string | number | Date, format: string = 'D MMMM YYYY, HH:mm'): string =>
    date ? getDate(typeof date === 'number' ? new Date(date) : date).format(format) : ''

/**
 * A period of local calendar days ('YYYY-MM-DD') in words: "6 мая – 6 ноября 2026", or with both years when
 * they differ: "6 ноября 2025 – 6 мая 2026". The month names follow the active dayjs locale.
 */
export const formatDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) {
        return ''
    }

    const start = dayjs(startDate, 'YYYY-MM-DD')
    const end = dayjs(endDate, 'YYYY-MM-DD')

    return `${start.format(start.year() === end.year() ? 'D MMMM' : 'D MMMM YYYY')} – ${end.format('D MMMM YYYY')}`
}

export const timeAgo = (date?: string | Date, withoutSuffix?: boolean): string =>
    date ? getDate(date).fromNow(withoutSuffix) : ''

export const minutesAgo = (date?: string | Date): number => (date ? dayjs().diff(getDate(date), 'minute') : 99999999)

/**
 *
 * @param startDate
 * @param endDate
 * @param enLocale
 */
export const getDateTimeFormat = (startDate?: string, endDate?: string, enLocale?: boolean): string => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    const diffInDays = end.diff(start, 'day')

    if (diffInDays <= 1) {
        // If the difference is 1 day or less, format by hours and minutes
        return enLocale ? 'h:mm a' : 'HH:mm'
    } else if (diffInDays > 1 && diffInDays <= 7) {
        // If the difference is greater than 1 day but less than or equal to 7 days, format by date and hour
        return enLocale ? 'D MMM h:00 a' : 'D MMM HH:00'
    }

    // If the difference is more than 7 days, format by days
    return 'D MMMM'
}
