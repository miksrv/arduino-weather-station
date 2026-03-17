/**
 * Converts an anomaly ID (underscore-separated) to the corresponding i18n key
 * segment (hyphen-separated).
 *
 * @example anomalyIdToI18nKey('heat_wave') // 'heat-wave'
 * @example anomalyIdToI18nKey('drought_spi30') // 'drought-spi30'
 */
export const anomalyIdToI18nKey = (id: string): string => id.replace(/_/g, '-')

/**
 * Returns an i18n key describing the Z-score deviation in plain language.
 */
export const getZScoreInterpretation = (z: number): string => {
    const abs = Math.abs(z)
    if (abs < 0.5) {
        return 'z-interp-normal'
    }
    if (abs < 1.0) {
        return 'z-interp-slight'
    }
    if (abs < 1.5) {
        return 'z-interp-moderate'
    }
    if (abs < 2.0) {
        return 'z-interp-elevated'
    }
    return 'z-interp-extreme'
}

/**
 * Returns '+' for positive Z-scores, '−' (real minus sign) for negative,
 * and '' for near-zero values (|z| < 0.05).
 */
export const getZScoreSign = (z: number): string => {
    if (Math.abs(z) < 0.05) {
        return ''
    }
    return z > 0 ? '+' : '−'
}

/**
 * Formats an extraMetric value with appropriate units for display.
 */
export const formatExtraMetricValue = (label: string, value: number): string => {
    switch (label) {
        case 'temperature_c':
            return `${value > 0 ? '+' : ''}${value.toFixed(1)} °C`
        case 'pressure_drop_hpa':
            return `${value >= 0 ? '+' : ''}${value.toFixed(1)} hPa`
        case 'dew_spread_c':
            return `Δ${value.toFixed(1)} °C`
        case 'wind_speed_ms':
            return `${value.toFixed(1)} m/s`
        case 'heat_index_c':
            return `${value.toFixed(1)} °C`
        case 'precip7d':
            return `${value.toFixed(1)} mm`
        case 'SPI-30':
            return value.toFixed(2)
        default:
            return String(value)
    }
}

/**
 * Returns an i18n key for the given extraMetric label.
 * Falls back to the raw label string if not found in the map.
 */
export const getExtraMetricI18nKey = (label: string): string => {
    const map: Record<string, string> = {
        temperature_c: 'metric-temperature',
        pressure_drop_hpa: 'metric-pressure-drop',
        dew_spread_c: 'metric-dew-spread',
        wind_speed_ms: 'metric-wind-speed',
        heat_index_c: 'metric-heat-index',
        precip7d: 'metric-precip-7d',
        'SPI-30': 'metric-spi30'
    }
    return map[label] ?? label
}
