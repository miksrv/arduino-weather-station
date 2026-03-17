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
 * Returns true when the given season label matches the designated flood-reference year.
 */
export const isFloodYear = (year: string, floodYear: string): boolean => year === floodYear
