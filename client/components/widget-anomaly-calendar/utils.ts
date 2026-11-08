import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

/**
 * The calendar's days as 'YYYY-MM-DD', oldest first, ending on `today` — the station's date, which the server
 * render and every browser share. Counted in UTC from the date string, so neither the browser's time zone nor a
 * daylight-saving change can shift a day (the grid used to come from the browser's clock and could differ from the
 * server render by a day).
 */
export const getCalendarDays = (today: string, total: number): string[] => {
    const end = dayjs.utc(today)

    return Array.from({ length: total }, (_, i) => end.subtract(total - 1 - i, 'day').format('YYYY-MM-DD'))
}

/**
 * The calendar's last day: the date of the server's last point, so the grid ends on the same day the API counts as
 * today (the API works in UTC, the station in UTC+5 — taken from the browser's clock, the last cell would be a day
 * the API has not produced yet for five hours a day). Without data, the station's own today.
 */
export const getCalendarToday = (data: Array<{ date: string }>, fallback: string): string =>
    data.length ? data[data.length - 1].date : fallback

/**
 * The month labels above the weeks: the short month name at the first week (column) that starts in a new month.
 * Formatted in UTC from the date string, so the server and the browser print the same month.
 */
export const getMonthLabels = (
    days: string[],
    daysPerWeek: number,
    language: string
): Array<{ label: string; weekIndex: number }> => {
    const labels: Array<{ label: string; weekIndex: number }> = []
    let prevMonth = ''

    for (let w = 0; w * daysPerWeek < days.length; w++) {
        const day = days[w * daysPerWeek]
        const month = day.slice(0, 7)

        if (month !== prevMonth) {
            labels.push({
                label: new Date(`${day}T00:00:00Z`).toLocaleString(language, { month: 'short', timeZone: 'UTC' }),
                weekIndex: w
            })
            prevMonth = month
        }
    }

    return labels
}

/**
 * Maps an activeCount to one of three CSS Module intensity class keys.
 * count === 1 → 'cellIntensity1'
 * count === 2 → 'cellIntensity2'
 * count >= 3  → 'cellIntensity3'
 */
export const getIntensityClass = (count: number): 'cellIntensity1' | 'cellIntensity2' | 'cellIntensity3' => {
    if (count === 1) {
        return 'cellIntensity1'
    }
    if (count === 2) {
        return 'cellIntensity2'
    }
    return 'cellIntensity3'
}
