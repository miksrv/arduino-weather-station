import { minutesAgo } from './date'

/**
 * Encodes an object into a query string.
 *
 * @param data - The data object to be encoded.
 * @returns The encoded query string.
 */
export const encodeQueryData = <T extends Record<keyof T, string | number | boolean>>(
    data?: T | null | void
): string => {
    if (!data) {
        return ''
    }

    const ret = []

    for (const key in data) {
        if (data[key] !== undefined && data[key] != null) {
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        }
    }

    return ret.length ? '?' + ret.join('&') : ''
}

/**
 * Rounds a number to a specified number of digits.
 *
 * @param value - The number to be rounded.
 * @param digits - The number of digits to round to. Defaults to 4.
 * @returns The rounded number or undefined if the value is undefined.
 */
export const round = (value?: number, digits: number = 4): number | undefined =>
    value !== undefined && value != null ? Number(value.toFixed(digits)) : undefined

/**
 * Checks if a given string is a valid JSON.
 *
 * @param string - The string to be checked.
 * @returns `true` if the string is a valid JSON, otherwise `false`.
 */
export const isValidJSON = (string: string) => {
    if (!string || !string.length) {
        return true
    }

    try {
        JSON.parse(string)
    } catch {
        return false
    }

    return true
}

/**
 * The unit as it follows a number: symbols stick to the number ("21°C", "58%"), words get a space ("780 мм рт. ст.").
 *
 * @param unit - The unit label, may be empty.
 * @returns The unit with the right separator, or an empty string.
 */
export const unitSuffix = (unit?: string): string => {
    if (!unit) {
        return ''
    }

    return /^[°%‰]/.test(unit) ? unit : ` ${unit}`
}

/** The station as the app bar shows it: fresh data, data that may be outdated, or no data for a long time */
export type StationStatus = 'online' | 'stale' | 'offline'

/** The server's freshness window (`EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES`): older data may be outdated */
export const STATION_STALE_MINUTES = 15

/** Past this many minutes without a reading, outdated data turns into a station that is offline */
export const STATION_OFFLINE_MINUTES = 60

/**
 * The server's `isStale`, plus the age of the last reading counted here: when polling fails, the last answer
 * stays in the cache with its old `isStale: false`, so the age is what turns a silent API yellow and then red.
 * No reading at all is offline.
 */
export const getStationStatus = (isStale?: boolean, lastUpdated?: string): StationStatus => {
    const age = lastUpdated ? minutesAgo(lastUpdated) : Infinity

    if (age > STATION_OFFLINE_MINUTES) {
        return 'offline'
    }

    return isStale || age > STATION_STALE_MINUTES ? 'stale' : 'online'
}
