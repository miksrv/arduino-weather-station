import { formatExtraMetricValue, getExtraMetricI18nKey, getZScoreInterpretation, getZScoreSign } from './utils'

describe('getZScoreInterpretation', () => {
    it('returns z-interp-normal for |z| < 0.5', () => {
        expect(getZScoreInterpretation(0.4)).toBe('z-interp-normal')
        expect(getZScoreInterpretation(-0.4)).toBe('z-interp-normal')
        expect(getZScoreInterpretation(0)).toBe('z-interp-normal')
    })

    it('returns z-interp-slight for |z| in [0.5, 1.0)', () => {
        expect(getZScoreInterpretation(0.5)).toBe('z-interp-slight')
        expect(getZScoreInterpretation(0.9)).toBe('z-interp-slight')
        expect(getZScoreInterpretation(-0.7)).toBe('z-interp-slight')
    })

    it('returns z-interp-moderate for |z| in [1.0, 1.5)', () => {
        expect(getZScoreInterpretation(1.0)).toBe('z-interp-moderate')
        expect(getZScoreInterpretation(1.4)).toBe('z-interp-moderate')
        expect(getZScoreInterpretation(-1.2)).toBe('z-interp-moderate')
    })

    it('returns z-interp-elevated for |z| in [1.5, 2.0)', () => {
        expect(getZScoreInterpretation(1.5)).toBe('z-interp-elevated')
        expect(getZScoreInterpretation(1.9)).toBe('z-interp-elevated')
        expect(getZScoreInterpretation(-1.8)).toBe('z-interp-elevated')
    })

    it('returns z-interp-extreme for |z| >= 2.0', () => {
        expect(getZScoreInterpretation(2.0)).toBe('z-interp-extreme')
        expect(getZScoreInterpretation(3.5)).toBe('z-interp-extreme')
        expect(getZScoreInterpretation(-2.1)).toBe('z-interp-extreme')
    })
})

describe('getZScoreSign', () => {
    it('returns empty string for near-zero values (|z| < 0.05)', () => {
        expect(getZScoreSign(0)).toBe('')
        expect(getZScoreSign(0.04)).toBe('')
        expect(getZScoreSign(-0.04)).toBe('')
    })

    it('returns + for positive z', () => {
        expect(getZScoreSign(1.0)).toBe('+')
        expect(getZScoreSign(0.05)).toBe('+')
    })

    it('returns − for negative z', () => {
        expect(getZScoreSign(-1.0)).toBe('−')
        expect(getZScoreSign(-0.05)).toBe('−')
    })
})

describe('formatExtraMetricValue', () => {
    it('formats temperature_c with sign and unit', () => {
        expect(formatExtraMetricValue('temperature_c', 5.5)).toBe('+5.5 °C')
        expect(formatExtraMetricValue('temperature_c', -3.2)).toBe('-3.2 °C')
        expect(formatExtraMetricValue('temperature_c', 0)).toBe('0.0 °C')
    })

    it('formats pressure_drop_hpa with sign and unit', () => {
        expect(formatExtraMetricValue('pressure_drop_hpa', 2.0)).toBe('+2.0 hPa')
        expect(formatExtraMetricValue('pressure_drop_hpa', -1.5)).toBe('-1.5 hPa')
    })

    it('formats dew_spread_c with delta prefix', () => {
        expect(formatExtraMetricValue('dew_spread_c', 3.2)).toBe('Δ3.2 °C')
    })

    it('formats wind_speed_ms with m/s unit', () => {
        expect(formatExtraMetricValue('wind_speed_ms', 7.3)).toBe('7.3 m/s')
    })

    it('formats heat_index_c with °C unit', () => {
        expect(formatExtraMetricValue('heat_index_c', 32.1)).toBe('32.1 °C')
    })

    it('formats precip7d with mm unit', () => {
        expect(formatExtraMetricValue('precip7d', 12.5)).toBe('12.5 mm')
    })

    it('formats SPI-30 as two decimal places', () => {
        expect(formatExtraMetricValue('SPI-30', -1.234)).toBe('-1.23')
    })

    it('falls back to String(value) for unknown labels', () => {
        expect(formatExtraMetricValue('unknown_metric', 42)).toBe('42')
    })
})

describe('getExtraMetricI18nKey', () => {
    it('maps known labels to i18n keys', () => {
        expect(getExtraMetricI18nKey('temperature_c')).toBe('metric-temperature')
        expect(getExtraMetricI18nKey('pressure_drop_hpa')).toBe('metric-pressure-drop')
        expect(getExtraMetricI18nKey('dew_spread_c')).toBe('metric-dew-spread')
        expect(getExtraMetricI18nKey('wind_speed_ms')).toBe('metric-wind-speed')
        expect(getExtraMetricI18nKey('heat_index_c')).toBe('metric-heat-index')
        expect(getExtraMetricI18nKey('precip7d')).toBe('metric-precip-7d')
        expect(getExtraMetricI18nKey('SPI-30')).toBe('metric-spi30')
    })

    it('returns the raw label for unknown keys', () => {
        expect(getExtraMetricI18nKey('custom_metric')).toBe('custom_metric')
    })
})
