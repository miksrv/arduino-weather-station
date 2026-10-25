import { ApiModel, ApiType } from '@/api'

import { getDate } from './date'
import { convertHpaToMmHg } from './weather'

type SensorType = ApiType.Heatmap.SensorType

/** One reading of the chosen quantity, at its hour in the station's time zone */
export interface HeatmapPoint {
    /** "YYYY-MM-DD" of the local day */
    day: string
    /** 0–23, local */
    hour: number
    /** The original timestamp (UTC) */
    date: string
    value: number
}

/**
 * The readings of one quantity as points of the hour × day grid, in the station's time zone,
 * and in the units the site shows (pressure in mm Hg). Rows without a value are dropped.
 */
export const toHeatmapPoints = (data: ApiModel.Weather[] | undefined, type: SensorType): HeatmapPoint[] =>
    (data ?? []).flatMap((item) => {
        const raw = item[type]

        if (!item.date || raw === undefined || raw == null) {
            return []
        }

        const value = type === 'pressure' ? convertHpaToMmHg(raw) : Number(raw)

        if (value === undefined || Number.isNaN(value)) {
            return []
        }

        const local = getDate(item.date)

        return [{ day: local.format('YYYY-MM-DD'), hour: local.hour(), date: item.date, value }]
    })

export interface ExtremePoint {
    value: number
    date: string
}

export interface HeatmapStats {
    count: number
    mean: number
    min: ExtremePoint
    max: ExtremePoint
    /** The mean of each day's max − min */
    meanDailyRange: number
    /** Sum of all values (meaningful for precipitation) */
    total: number
    /** Days with at least 0.1 (mm) in total */
    wetDays: number
    /** The day with the largest total */
    wettestDay?: ExtremePoint
}

const round1 = (value: number) => Math.round(value * 10) / 10

/** The figures of the summary cards for a period */
export const getHeatmapStats = (points: HeatmapPoint[]): HeatmapStats | undefined => {
    if (!points.length) {
        return undefined
    }

    let min = points[0]
    let max = points[0]
    let total = 0

    const days = new Map<string, { min: number; max: number; total: number; date: string }>()

    points.forEach((point) => {
        if (point.value < min.value) {
            min = point
        }

        if (point.value > max.value) {
            max = point
        }

        total += point.value

        const day = days.get(point.day)

        if (day) {
            day.min = Math.min(day.min, point.value)
            day.max = Math.max(day.max, point.value)
            day.total += point.value
        } else {
            days.set(point.day, { min: point.value, max: point.value, total: point.value, date: point.date })
        }
    })

    const dayList = [...days.values()]
    const wettest = dayList.reduce((best, day) => (day.total > best.total ? day : best), dayList[0])

    return {
        count: points.length,
        mean: round1(total / points.length),
        min: { value: round1(min.value), date: min.date },
        max: { value: round1(max.value), date: max.date },
        meanDailyRange: round1(dayList.reduce((sum, day) => sum + (day.max - day.min), 0) / dayList.length),
        total: round1(total),
        wetDays: dayList.filter((day) => day.total >= 0.1).length,
        wettestDay: wettest.total >= 0.1 ? { value: round1(wettest.total), date: wettest.date } : undefined
    }
}

/** The p-th percentile (0–100) of sorted values, linear between ranks */
export const percentile = (sorted: number[], p: number): number => {
    if (!sorted.length) {
        return 0
    }

    const rank = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(rank)
    const upper = Math.ceil(rank)

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower)
}

export interface DiurnalHour {
    hour: number
    mean?: number
    p10?: number
    p90?: number
}

/** Precipitation thresholds (mm in an hour) of the heatmap scale and the histogram */
export const PRECIPITATION_EDGES = [0.1, 0.5, 1, 2.5, 5, 10]

/**
 * The typical day: for each hour of the day, the mean of that hour over the period and the band
 * where 80% of its values fall (10th–90th percentile). For precipitation a mean of tenths of a
 * millimetre says little, so the hour gets the chance of precipitation instead: the share (%) of
 * that hour's readings with at least 0.1 mm, and no band.
 */
export const getDiurnalProfile = (points: HeatmapPoint[], type?: SensorType): DiurnalHour[] =>
    Array.from({ length: 24 }, (_, hour) => {
        const values = points
            .filter((point) => point.hour === hour)
            .map((point) => point.value)
            .sort((a, b) => a - b)

        if (!values.length) {
            return { hour }
        }

        if (type === 'precipitation') {
            return { hour, mean: Math.round((values.filter((value) => value >= 0.1).length / values.length) * 100) }
        }

        return {
            hour,
            mean: round1(values.reduce((sum, value) => sum + value, 0) / values.length),
            p10: round1(percentile(values, 10)),
            p90: round1(percentile(values, 90))
        }
    })

export interface HistogramBin {
    from: number
    to: number
    count: number
}

/**
 * How often each range of values occurs: `bins` equal bins between the min and the max, on round
 * edges (whole units). Precipitation leaves the dry hours out (they would dwarf the rest) and uses the
 * {@link PRECIPITATION_EDGES} thresholds.
 */
export const getHistogram = (points: HeatmapPoint[], type: SensorType, bins: number = 12): HistogramBin[] => {
    const values = points
        .map((point) => point.value)
        .filter((value) => (type === 'precipitation' ? value >= 0.1 : true))

    if (!values.length) {
        return []
    }

    // Rain is skewed (many drizzly hours, few downpours): fixed thresholds instead of equal bins
    if (type === 'precipitation') {
        const edges = [...PRECIPITATION_EDGES, Math.max(Math.ceil(Math.max(...values)), 11)]

        const last = edges.length - 2

        return edges.slice(0, -1).map((from, index) => ({
            from,
            to: edges[index + 1],
            // The last bin holds its upper edge too: the period's maximum belongs somewhere
            count: values.filter(
                (value) => value >= from && (index === last ? value <= edges[index + 1] : value < edges[index + 1])
            ).length
        }))
    }

    const min = Math.floor(Math.min(...values))
    const max = Math.ceil(Math.max(...values))
    const step = Math.max(Math.ceil((max - min) / bins), 1)
    const count = Math.max(Math.ceil((max - min) / step), 1)

    const result: HistogramBin[] = Array.from({ length: count }, (_, index) => ({
        from: round1(min + index * step),
        to: round1(min + (index + 1) * step),
        count: 0
    }))

    values.forEach((value) => {
        const index = Math.min(Math.floor((value - min) / step), count - 1)
        result[index].count++
    })

    return result
}

/** The unit of a heatmap quantity as the site shows it */
export const getHeatmapUnit = (type: SensorType, t: (key: string) => string): string => {
    switch (type) {
        case 'temperature':
            return '°C'
        case 'pressure':
            return t('mm-hg')
        case 'precipitation':
            return t('millimeters')
        case 'humidity':
        case 'clouds':
            return '%'
    }
}
