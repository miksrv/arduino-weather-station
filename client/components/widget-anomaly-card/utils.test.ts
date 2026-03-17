import {
    anomalyIdToI18nKey,
    formatExtraMetricValue,
    getExtraMetricI18nKey,
    getZScoreInterpretation,
    getZScoreSign
} from './utils'

describe('widget-anomaly-card/utils', () => {
    describe('anomalyIdToI18nKey', () => {
        it('converts heat_wave to heat-wave', () => {
            expect(anomalyIdToI18nKey('heat_wave')).toBe('heat-wave')
        })

        it('converts cold_snap to cold-snap', () => {
            expect(anomalyIdToI18nKey('cold_snap')).toBe('cold-snap')
        })

        it('converts drought_spi30 to drought-spi30', () => {
            expect(anomalyIdToI18nKey('drought_spi30')).toBe('drought-spi30')
        })

        it('returns the same string when there are no underscores', () => {
            expect(anomalyIdToI18nKey('flooding')).toBe('flooding')
        })

        it('converts multiple underscores', () => {
            expect(anomalyIdToI18nKey('heavy_rain_event')).toBe('heavy-rain-event')
        })

        it('handles an empty string', () => {
            expect(anomalyIdToI18nKey('')).toBe('')
        })

        it('converts leading underscore', () => {
            expect(anomalyIdToI18nKey('_frost')).toBe('-frost')
        })
    })

    describe('getZScoreInterpretation', () => {
        it('returns z-interp-normal for |z| < 0.5', () => {
            expect(getZScoreInterpretation(0)).toBe('z-interp-normal')
            expect(getZScoreInterpretation(0.4)).toBe('z-interp-normal')
            expect(getZScoreInterpretation(-0.4)).toBe('z-interp-normal')
        })

        it('returns z-interp-slight for 0.5 <= |z| < 1.0', () => {
            expect(getZScoreInterpretation(0.5)).toBe('z-interp-slight')
            expect(getZScoreInterpretation(0.9)).toBe('z-interp-slight')
            expect(getZScoreInterpretation(-0.9)).toBe('z-interp-slight')
        })

        it('returns z-interp-moderate for 1.0 <= |z| < 1.5', () => {
            expect(getZScoreInterpretation(1.0)).toBe('z-interp-moderate')
            expect(getZScoreInterpretation(1.4)).toBe('z-interp-moderate')
            expect(getZScoreInterpretation(-1.4)).toBe('z-interp-moderate')
        })

        it('returns z-interp-elevated for 1.5 <= |z| < 2.0', () => {
            expect(getZScoreInterpretation(1.5)).toBe('z-interp-elevated')
            expect(getZScoreInterpretation(1.9)).toBe('z-interp-elevated')
            expect(getZScoreInterpretation(-1.9)).toBe('z-interp-elevated')
        })

        it('returns z-interp-extreme for |z| >= 2.0', () => {
            expect(getZScoreInterpretation(2.0)).toBe('z-interp-extreme')
            expect(getZScoreInterpretation(2.5)).toBe('z-interp-extreme')
            expect(getZScoreInterpretation(-3.0)).toBe('z-interp-extreme')
        })
    })

    describe('getZScoreSign', () => {
        it('returns empty string for near-zero values', () => {
            expect(getZScoreSign(0)).toBe('')
            expect(getZScoreSign(0.04)).toBe('')
            expect(getZScoreSign(-0.04)).toBe('')
        })

        it('returns + for positive values above threshold', () => {
            expect(getZScoreSign(0.05)).toBe('+')
            expect(getZScoreSign(1.5)).toBe('+')
            expect(getZScoreSign(3.0)).toBe('+')
        })

        it('returns real minus sign for negative values below threshold', () => {
            expect(getZScoreSign(-0.05)).toBe('−')
            expect(getZScoreSign(-1.5)).toBe('−')
            expect(getZScoreSign(-3.0)).toBe('−')
        })
    })

    describe('formatExtraMetricValue', () => {
        it('formats temperature_c with sign and one decimal', () => {
            expect(formatExtraMetricValue('temperature_c', -3.1)).toBe('-3.1 °C')
            expect(formatExtraMetricValue('temperature_c', 0.4)).toBe('+0.4 °C')
            expect(formatExtraMetricValue('temperature_c', 0.0)).toBe('0.0 °C')
        })

        it('formats pressure_drop_hpa with sign and one decimal', () => {
            expect(formatExtraMetricValue('pressure_drop_hpa', 3.2)).toBe('+3.2 hPa')
            expect(formatExtraMetricValue('pressure_drop_hpa', -1.5)).toBe('-1.5 hPa')
            expect(formatExtraMetricValue('pressure_drop_hpa', 0.0)).toBe('+0.0 hPa')
        })

        it('formats dew_spread_c with delta prefix', () => {
            expect(formatExtraMetricValue('dew_spread_c', 1.8)).toBe('Δ1.8 °C')
        })

        it('formats wind_speed_ms with m/s unit', () => {
            expect(formatExtraMetricValue('wind_speed_ms', 13.2)).toBe('13.2 m/s')
        })

        it('formats heat_index_c with one decimal', () => {
            expect(formatExtraMetricValue('heat_index_c', 38.5)).toBe('38.5 °C')
        })

        it('formats precip7d with mm unit', () => {
            expect(formatExtraMetricValue('precip7d', 0.16)).toBe('0.2 mm')
        })

        it('formats SPI-30 with two decimals and no unit', () => {
            expect(formatExtraMetricValue('SPI-30', 0.57)).toBe('0.57')
        })

        it('falls back to string conversion for unknown labels', () => {
            expect(formatExtraMetricValue('unknown_metric', 42)).toBe('42')
        })
    })

    describe('getExtraMetricI18nKey', () => {
        it('maps temperature_c', () => {
            expect(getExtraMetricI18nKey('temperature_c')).toBe('metric-temperature')
        })

        it('maps pressure_drop_hpa', () => {
            expect(getExtraMetricI18nKey('pressure_drop_hpa')).toBe('metric-pressure-drop')
        })

        it('maps dew_spread_c', () => {
            expect(getExtraMetricI18nKey('dew_spread_c')).toBe('metric-dew-spread')
        })

        it('maps wind_speed_ms', () => {
            expect(getExtraMetricI18nKey('wind_speed_ms')).toBe('metric-wind-speed')
        })

        it('maps heat_index_c', () => {
            expect(getExtraMetricI18nKey('heat_index_c')).toBe('metric-heat-index')
        })

        it('maps precip7d', () => {
            expect(getExtraMetricI18nKey('precip7d')).toBe('metric-precip-7d')
        })

        it('maps SPI-30', () => {
            expect(getExtraMetricI18nKey('SPI-30')).toBe('metric-spi30')
        })

        it('falls back to the raw label for unknown keys', () => {
            expect(getExtraMetricI18nKey('some_unknown_label')).toBe('some_unknown_label')
        })
    })
})
