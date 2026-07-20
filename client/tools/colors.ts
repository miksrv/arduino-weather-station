// Soft colors
// export const colors = {
//     violet: ['#b43dc6', '#c35adb'], // Violet
//     purple: ['#9b51e0', '#ae71e7'], // Purple
//     magenta: ['#d62d7c', '#e05799'],// Magenta
//     red: ['#ea5545', '#f16b63'],    // Red
//     pink: ['#f46a9b', '#f783b0'],   // Pink
//     orange: ['#ef9b1f', '#f1aa41'], // Orange
//     yellow: ['#ede15c', '#f1e877'], // Yellow
//     lime: ['#bdcf32', '#c6da4d'],   // Lime
//     green: ['#7cc42c', '#97d74a'],  // Green
//     teal: ['#27a69a', '#4db9b1'],   // Teal
//     blue: ['#25afef', '#4fbaf2'],   // Blue
//     cyan: ['#2f9cc3', '#59b3d5'],   // Cyan
//     olive: ['#a4a43d', '#b7b74d'],  // Olive
//     brown: ['#8b572a', '#a26b42'],  // Brown
//     navy: ['#34495e', '#4b6a7f'],   // Navy
//     grey: ['#7f8c8d', '#9ea4a5']    // Grey
// }

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

export const colors = {
    brown: ['#795548', '#8d6e63'], // Brown
    navy: ['#283593', '#3f51b5'], // Navy
    violet: ['#8c1fc9', '#a23de3'], // Violet
    purple: ['#7d2ae8', '#9146ff'], // Purple
    magenta: ['#c2185b', '#db3c7f'], // Magenta
    pink: ['#e91e63', '#ff5b85'], // Pink
    red: ['#e53935', '#f25755'], // Red
    orange: ['#ff5722', '#ff7043'], // Orange
    yellow: ['#ffeb3b', '#fff176'], // Yellow
    lime: ['#cddc39', '#d4e157'], // Lime
    olive: ['#8c9e35', '#a3b236'], // Olive
    green: ['#4caf50', '#66bb6a'], // Green
    teal: ['#009688', '#26a69a'], // Teal
    blue: ['#2c7eec', '#468de8'], // Blue
    lightblue: ['#2196f3', '#42a5f5'], // Light Blue
    cyan: ['#00bcd4', '#4dd0e1'], // Cyan
    air: ['#8dbdef', '#9bc4f5'], // Air
    grey: ['#607d8b', '#78909c'] // Grey
}

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

export const getSensorColor = (sensor?: keyof ApiModel.Sensors): string[] => {
    const sensorColor = getSensorColorType(sensor)

    return colors[sensorColor]
}

/** Shared trend chart color for the summary stat widgets (e.g. widget-sensor-stat) — always blue per design, regardless of sensor kind. */
export const statChartColor: string[] = colors.blue
