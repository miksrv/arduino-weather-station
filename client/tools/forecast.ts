import { ApiModel } from '@/api'

import { getDate } from './date'

export type PrecipitationLevel = 'none' | 'light' | 'moderate' | 'heavy'
export type WindLevel = 'calm' | 'light' | 'moderate' | 'strong' | 'storm'

/** Precipitation amount of a day or an hour, by the usual meteorological thresholds (mm) */
export const getPrecipitationLevel = (mm?: number): PrecipitationLevel => {
    if (!mm || mm < 0.1) {
        return 'none'
    }

    if (mm < 2.5) {
        return 'light'
    }

    return mm < 10 ? 'moderate' : 'heavy'
}

/** Wind speed (m/s) in words, by the Beaufort scale bands that matter on the ground */
export const getWindLevel = (speed?: number): WindLevel => {
    if (!speed || speed < 2) {
        return 'calm'
    }

    if (speed < 5) {
        return 'light'
    }

    if (speed < 8) {
        return 'moderate'
    }

    return speed < 14 ? 'strong' : 'storm'
}

/** Gusts are worth mentioning only when they are strong in absolute terms */
export const GUST_NOTICE_SPEED = 10

/**
 * The lowest and highest temperature over the given days (their own min and max), for a common
 * scale of the range bars: every day is drawn against the whole week.
 */
export const getTemperatureBounds = (days?: ApiModel.Forecast[]): { min: number; max: number } | undefined => {
    const values = (days ?? []).flatMap((day) =>
        [day.temperatureMin ?? day.temperature, day.temperatureMax ?? day.temperature].filter(
            (value): value is number => typeof value === 'number'
        )
    )

    if (!values.length) {
        return undefined
    }

    return { min: Math.min(...values), max: Math.max(...values) }
}

/**
 * Where a day's range sits on the common scale, in percent: `left` is the start, `width` the length.
 * A range of a single value still gets a visible dot.
 */
export const getRangePosition = (
    min: number,
    max: number,
    bounds: { min: number; max: number },
    minWidth: number = 4
): { left: number; width: number } => {
    const span = bounds.max - bounds.min || 1
    const left = ((min - bounds.min) / span) * 100
    const width = Math.max(((max - min) / span) * 100, minWidth)

    return { left: Math.min(left, 100 - width), width }
}

/** True when the forecast hour falls in the dark part of the day (the same 18:00–6:00 split as the icons) */
export const isNightHour = (date?: string): boolean => {
    if (!date) {
        return false
    }

    const hour = getDate(date).hour()

    return hour < 6 || hour >= 18
}

/**
 * Index ranges of the night hours in an hourly series, to shade them on a chart:
 * consecutive night hours are merged into one [start, end] pair.
 */
export const getNightRanges = (hours?: ApiModel.Forecast[]): Array<[number, number]> => {
    const ranges: Array<[number, number]> = []

    ;(hours ?? []).forEach((hour, index) => {
        if (!isNightHour(hour.date)) {
            return
        }

        const last = ranges[ranges.length - 1]

        if (last && last[1] === index - 1) {
            last[1] = index
        } else {
            ranges.push([index, index])
        }
    })

    return ranges
}

/** The forecast day of today in the station's time zone, if the list has it */
export const findToday = (
    days?: ApiModel.Forecast[],
    now: string = new Date().toISOString()
): ApiModel.Forecast | undefined => {
    const today = getDate(now).format('YYYY-MM-DD')

    return days?.find((day) => day.date && getDate(day.date).format('YYYY-MM-DD') === today)
}

/** Total precipitation of a list of hours, mm */
export const sumHourlyPrecipitation = (hours?: ApiModel.Forecast[]): number =>
    Math.round((hours ?? []).reduce((total, hour) => total + (hour.precipitation ?? 0), 0) * 10) / 10

/**
 * The phrases of a day summary, as i18n keys with their values, in reading order:
 * the condition, the temperature span, the precipitation, the wind. The component joins the translations.
 */
export const getDaySummary = (
    day: ApiModel.Forecast
): Array<{ key: string; values?: Record<string, string | number> }> => {
    const phrases: Array<{ key: string; values?: Record<string, string | number> }> = []

    if (day.temperatureMax !== undefined && day.temperatureMin !== undefined) {
        phrases.push({
            key: 'forecast-summary-temperature',
            values: { max: formatSigned(day.temperatureMax), min: formatSigned(day.temperatureMin) }
        })
    }

    const precipitation = getPrecipitationLevel(day.precipitation)
    phrases.push(
        precipitation === 'none'
            ? { key: 'forecast-summary-dry' }
            : { key: `forecast-summary-precip-${precipitation}`, values: { value: day.precipitation ?? 0 } }
    )

    const wind = getWindLevel(day.windSpeed)
    const gust = day.windGust ?? 0
    phrases.push(
        gust >= GUST_NOTICE_SPEED
            ? { key: `forecast-summary-wind-${wind}-gusts`, values: { gust: Math.round(gust) } }
            : { key: `forecast-summary-wind-${wind}` }
    )

    return phrases
}

/** A rounded temperature with an explicit sign: "+5°", "−3°", "0°" */
export const formatSigned = (value?: number): string => {
    if (value === undefined || value == null) {
        return '—'
    }

    const rounded = Math.round(value)

    if (rounded === 0) {
        return '0°'
    }

    return rounded > 0 ? `+${rounded}°` : `−${Math.abs(rounded)}°`
}

/** Temperature colour stops (°C → hue): mid tones that read on the light and the dark card */
export const TEMPERATURE_STOPS: Array<[number, string]> = [
    [-20, '#5b7fe0'],
    [0, '#2fa6d0'],
    [10, '#d9a516'],
    [20, '#f07d2c'],
    [30, '#e5484d']
]

const mix = (from: string, to: string, ratio: number): string => {
    const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16)
    const value = (index: number) =>
        Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * ratio)

    return `#${[0, 1, 2].map((index) => value(index).toString(16).padStart(2, '0')).join('')}`
}

/** The colour of a temperature on the {@link TEMPERATURE_STOPS} scale, clamped at its ends */
export const getTemperatureHue = (temperature: number): string => {
    const first = TEMPERATURE_STOPS[0]
    const last = TEMPERATURE_STOPS[TEMPERATURE_STOPS.length - 1]

    if (temperature <= first[0]) {
        return first[1]
    }

    if (temperature >= last[0]) {
        return last[1]
    }

    const upper = TEMPERATURE_STOPS.findIndex(([stop]) => stop >= temperature)
    const [fromValue, fromColor] = TEMPERATURE_STOPS[upper - 1]
    const [toValue, toColor] = TEMPERATURE_STOPS[upper]

    return mix(fromColor, toColor, (temperature - fromValue) / (toValue - fromValue))
}

/** The first letter in upper case: dayjs gives Russian weekdays in lower case ("вс") */
export const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)
