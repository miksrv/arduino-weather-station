import { formatAnomalyPeriod, getAnomalyDays, getAnomalyMetric, getRecentAnomalies, isActiveToday } from './utils'

const entry = (id: string, startDate: string, endDate: string | null) => ({
    id,
    type: 'fog_risk',
    startDate,
    endDate,
    peakValue: null,
    description: ''
})

describe('isActiveToday', () => {
    it('is true for an open episode or one that ends today', () => {
        expect(isActiveToday(null, '2026-11-05')).toBe(true)
        expect(isActiveToday('2026-11-05', '2026-11-05')).toBe(true)
    })

    it('is false for an episode that ended before today', () => {
        expect(isActiveToday('2026-11-04', '2026-11-05')).toBe(false)
    })
})

describe('getRecentAnomalies', () => {
    it('keeps episodes that ended since the date and open ones, newest start first', () => {
        const rows = [
            entry('old', '2026-08-01', '2026-08-03'),
            entry('edge', '2026-10-01', '2026-10-05'),
            entry('open', '2026-11-03', null),
            entry('recent', '2026-10-20', '2026-10-21')
        ]

        expect(getRecentAnomalies(rows, '2026-10-05').map((row) => row.id)).toStrictEqual(['open', 'recent', 'edge'])
    })
})

describe('getAnomalyDays', () => {
    it('counts both ends of the episode', () => {
        expect(getAnomalyDays('2026-11-03', '2026-11-03', '2026-11-05')).toBe(1)
        expect(getAnomalyDays('2026-10-18', '2026-10-20', '2026-11-05')).toBe(3)
    })

    it('runs an open episode to today', () => {
        expect(getAnomalyDays('2026-11-03', null, '2026-11-05')).toBe(3)
    })
})

describe('formatAnomalyPeriod', () => {
    it('names one day once', () => {
        expect(formatAnomalyPeriod('2026-11-03', '2026-11-03')).toBe('3 Nov')
    })

    it('names the month once within a month', () => {
        expect(formatAnomalyPeriod('2026-10-18', '2026-10-20')).toBe('18–20 Oct')
    })

    it('names both months across a month boundary', () => {
        expect(formatAnomalyPeriod('2026-10-28', '2026-11-02')).toBe('28 Oct – 2 Nov')
    })
})

describe('getAnomalyMetric', () => {
    it('reads the peak of z-score anomalies as a signed deviation from the norm', () => {
        expect(getAnomalyMetric('heat_wave', 2.34)).toStrictEqual({ key: 'anomaly-metric-zscore', value: '+2.3' })
        expect(getAnomalyMetric('cold_snap', -1.96)).toStrictEqual({ key: 'anomaly-metric-zscore', value: '-2.0' })
    })

    it('converts a pressure drop from hPa to mm Hg', () => {
        expect(getAnomalyMetric('pressure_collapse', 5)).toStrictEqual({
            key: 'anomaly-metric-pressure-drop',
            value: '3.8'
        })
    })

    it('gives the measured quantity of the other anomalies', () => {
        expect(getAnomalyMetric('fog_risk', 0.1)?.key).toBe('anomaly-metric-dew-spread')
        expect(getAnomalyMetric('fire_risk', 0.4)).toStrictEqual({ key: 'anomaly-metric-precip-7d', value: '0.4' })
        expect(getAnomalyMetric('drought_spi30', -1.756)).toStrictEqual({ key: 'anomaly-metric-spi', value: '-1.76' })
    })

    it('has nothing to show without a peak', () => {
        expect(getAnomalyMetric('heat_wave', null)).toBeUndefined()
    })
})
