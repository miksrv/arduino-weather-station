import dayjs from 'dayjs'

import { ApiType } from '@/api'

export { anomalyTypeToI18nKey } from '@/tools/conditions'

type AnomalyHistoryEntry = ApiType.Anomaly.AnomalyHistoryEntry

/** hPa → mm Hg, the pressure unit of the site */
const HPA_TO_MMHG = 0.750062

/** Anomalies whose stored peak is a z-score (the detector keeps the z-score when it has one) */
const Z_SCORE_TYPES = new Set(['heat_wave', 'cold_snap', 'extreme_uv', 'pressure_high', 'strong_wind', 'late_frost'])

/** An open episode (no end yet) or one that ended today is still going on */
export const isActiveToday = (endDate: string | null, today: string = dayjs().format('YYYY-MM-DD')): boolean =>
    endDate == null || endDate === today

/** The episodes of the last month (by their last day) and every open one, newest first */
export const getRecentAnomalies = (rows: AnomalyHistoryEntry[], since: string): AnomalyHistoryEntry[] =>
    rows
        .filter((row) => row.endDate == null || row.endDate >= since)
        .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0))

/** Days of an episode, both ends included (the detector works in whole days); an open one runs to `today` */
export const getAnomalyDays = (startDate: string, endDate: string | null, today: string): number =>
    Math.max(1, dayjs(endDate ?? today).diff(dayjs(startDate), 'day') + 1)

/**
 * The period of a closed episode in words, without the year (the table covers a month):
 * "3 нояб.", "18–20 окт.", "28 окт. – 2 нояб.". Month names follow the active dayjs locale.
 */
export const formatAnomalyPeriod = (startDate: string, endDate: string): string => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    if (start.isSame(end, 'day')) {
        return start.format('D MMM')
    }

    if (start.isSame(end, 'month')) {
        return `${start.format('D')}–${end.format('D MMM')}`
    }

    return `${start.format('D MMM')} – ${end.format('D MMM')}`
}

export interface AnomalyMetric {
    /** i18n key of the label, with `{{value}}` */
    key: string
    value: string
}

/**
 * What the stored peak of an episode means, by type: a z-score (deviation from the climate norm of the day)
 * or the measured quantity behind the alert, with its unit.
 */
export const getAnomalyMetric = (type: string, peak: number | null): AnomalyMetric | undefined => {
    if (peak == null) {
        return undefined
    }

    if (Z_SCORE_TYPES.has(type)) {
        return { key: 'anomaly-metric-zscore', value: `${peak > 0 ? '+' : ''}${peak.toFixed(1)}` }
    }

    switch (type) {
        case 'pressure_collapse':
            return { key: 'anomaly-metric-pressure-drop', value: (Math.abs(peak) * HPA_TO_MMHG).toFixed(1) }
        case 'freezing_rain':
            return { key: 'anomaly-metric-temperature', value: peak.toFixed(1) }
        case 'fog_risk':
            return { key: 'anomaly-metric-dew-spread', value: peak.toFixed(1) }
        case 'drought_spi30':
            return { key: 'anomaly-metric-spi', value: peak.toFixed(2) }
        case 'fire_risk':
            return { key: 'anomaly-metric-precip-7d', value: peak.toFixed(1) }
        case 'heat_stress':
            return { key: 'anomaly-metric-heat-index', value: peak.toFixed(1) }
        default:
            return { key: 'anomaly-metric-value', value: peak.toFixed(1) }
    }
}
