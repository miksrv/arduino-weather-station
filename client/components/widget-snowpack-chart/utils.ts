const SEASON_START_MONTH = 9 // October (0-indexed)
const DAYS_IN_SEASON_MONTHS = [31, 30, 31, 31, 28, 31, 30, 31] // Oct…May

/**
 * Converts an ISO date string (YYYY-MM-DD) to a 0-based day index within the
 * snow season (Oct 1 = 0, Nov 1 = 31, …, May 31 = 241).
 *
 * Parses the year/month/day components directly from the string to avoid
 * timezone-induced date shifts.
 */
export const dateToSeasonDay = (dateStr: string): number => {
    const parts = dateStr.split('-')
    const month = parseInt(parts[1], 10) - 1 // convert to 0-indexed
    const day = parseInt(parts[2], 10)
    const monthOffset = month >= SEASON_START_MONTH ? month - SEASON_START_MONTH : month + (12 - SEASON_START_MONTH)
    let dayCount = 0
    for (let i = 0; i < monthOffset; i++) {
        dayCount += DAYS_IN_SEASON_MONTHS[i]
    }
    return dayCount + day - 1
}

/**
 * Converts a 0-based day index within the snow season back to a date string (DD.MM format).
 * Oct 1 = 0, Nov 1 = 31, …, May 31 = 241.
 */
export const seasonDayToDate = (dayIndex: number): string => {
    let remaining = dayIndex
    let monthIdx = 0

    while (monthIdx < DAYS_IN_SEASON_MONTHS.length && remaining >= DAYS_IN_SEASON_MONTHS[monthIdx]) {
        remaining -= DAYS_IN_SEASON_MONTHS[monthIdx]
        monthIdx++
    }

    const dayOfMonth = remaining + 1
    // Convert month index back to calendar month (0=Oct, 1=Nov, ..., 4=Feb, 5=Mar, 6=Apr, 7=May)
    const calendarMonth = monthIdx < 3 ? SEASON_START_MONTH + monthIdx + 1 : monthIdx - 3 + 1

    return `${String(calendarMonth).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}-2000`
}

/**
 * Returns true when the given season label matches the designated flood-reference year.
 */
export const isFloodYear = (year: string, floodYear: string): boolean => year === floodYear
