import { ApiModel } from '@/api'

/**
 * Reads a CSS custom property value from :root at runtime.
 * Returns a fallback if called on the server (SSR) or if the variable is not set.
 * Needed because canvas-rendered charts (ECharts) can't resolve `var(--x)` themselves —
 * they need an actual resolved hex/rgb value.
 */
export const resolveCssVar = (variable: string, fallback: string): string => {
    if (typeof window === 'undefined') {
        return fallback
    }
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback
}

/** Converts a '#rrggbb' hex color to an 'rgba(...)' string with the given alpha, for ECharts gradient stops. */
export const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export type ColorName = keyof typeof colors

/**
 * Data hues of the charts: [line, area / lighter], tuned for the dark card (every hue ≥ 4.5:1 there).
 * The `--data-*` tokens of `styles/theme.css` mirror them; see client/DESIGN.md, "Data colours".
 */
export const colors = {
    brown: ['#8d6e63', '#a1887f'], // Brown
    navy: ['#6b7fe8', '#8b9bed'], // Navy: clouds
    violet: ['#a35ee0', '#b77ee8'], // Violet: UV
    purple: ['#9d6ee0', '#b28ce8'], // Purple: pressure
    magenta: ['#d6457f', '#e06b99'], // Magenta
    pink: ['#ec5f8a', '#f283a5'], // Pink
    red: ['#ef5359', '#f47a7f'], // Red: temperature
    orange: ['#f7802f', '#f99a5a'], // Orange: feels like
    yellow: ['#e9b51f', '#efc64f'], // Yellow: solar energy
    lime: ['#a8c43a', '#bbd25f'], // Lime: solar radiation
    olive: ['#9aa83e', '#adb961'], // Olive
    green: ['#3db67c', '#64c595'], // Green: wind
    teal: ['#20a596', '#4bb8ab'], // Teal: gusts
    blue: ['#3b8ced', '#62a3f0'], // Blue: precipitation
    lightblue: ['#55a3ea', '#78b6ee'], // Light blue: dew point
    cyan: ['#1fb3cc', '#4cc3d7'], // Cyan: humidity
    air: ['#8dbdef', '#a7cdf3'], // Air: visibility
    grey: ['#7d8896', '#98a1ad'] // Grey
}

/**
 * The light card needs deeper tones of the hues that are too pale on white: each line here is at least
 * 3:1 against #fff (WCAG 1.4.11 for graphics). Same hue, lower lightness; the rest of `colors` already passes.
 */
export const lightColors: Partial<Record<ColorName, string[]>> = {
    orange: ['#ec6509', '#f7802f'],
    yellow: ['#b28811', '#e9b51f'],
    lime: ['#83992d', '#a8c43a'],
    olive: ['#899537', '#9aa83e'],
    green: ['#36a16e', '#3db67c'],
    teal: ['#1f9f90', '#20a596'],
    lightblue: ['#3793e6', '#55a3ea'],
    cyan: ['#1b9cb1', '#1fb3cc'],
    air: ['#4392e5', '#8dbdef']
}

/**
 * A data hue for the given theme (`resolvedTheme` of next-themes): the light override when there is one,
 * the shared hue otherwise.
 */
export const getColor = (name: ColorName, theme?: string): string[] =>
    (theme === 'light' ? lightColors[name] : undefined) ?? colors[name]

export const getSensorColorType = (sensor?: keyof ApiModel.Sensors): keyof typeof colors => {
    switch (sensor) {
        case 'temperature':
            return 'red'
        case 'feelsLike':
            return 'orange'
        case 'pressure':
            return 'purple'
        case 'humidity':
            return 'cyan'
        case 'dewPoint':
            return 'lightblue'
        case 'visibility':
            return 'air'
        case 'uvIndex':
            return 'violet'
        case 'solEnergy':
            return 'yellow'
        case 'solRadiation':
            return 'lime'
        case 'clouds':
            return 'navy'
        case 'precipitation':
            return 'blue'
        case 'windSpeed':
            return 'green'
        case 'windGust':
            return 'teal'
        case 'windDeg':
            return 'olive'
        default:
            return 'grey'
        case undefined: {
            throw new Error('Not implemented yet: undefined case')
        }
    }
}

export const getSensorColor = (sensor?: keyof ApiModel.Sensors, theme?: string): string[] =>
    getColor(getSensorColorType(sensor), theme)

/** Shared trend chart color for the summary stat widgets (e.g. widget-sensor-stat) — always blue per design, regardless of sensor kind. */
export const statChartColor: string[] = colors.blue
