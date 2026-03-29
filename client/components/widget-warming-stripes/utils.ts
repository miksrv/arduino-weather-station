import { colors } from '@/tools/colors'

export const COLD_COLOR = colors['blue'][0]
export const MID_COLOR = '#f7f7f7'
export const HOT_COLOR = colors['red'][0]

/** Interpolate between two hex colors by factor t in [0, 1] */
export const lerpColor = (a: string, b: string, t: number): string => {
    const parse = (hex: string) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ]

    const ca = parse(a)
    const cb = parse(b)

    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t)
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t)
    const bVal = Math.round(ca[2] + (cb[2] - ca[2]) * t)

    return `rgb(${r},${g},${bVal})`
}

/** Convert temperature to color based on min/max range */
export const tempToColor = (temp: number, minTemp: number, maxTemp: number): string => {
    const range = maxTemp - minTemp
    if (range === 0) {
        return MID_COLOR
    }

    const t = (temp - minTemp) / range

    if (t <= 0.5) {
        return lerpColor(COLD_COLOR, MID_COLOR, t * 2)
    }

    return lerpColor(MID_COLOR, HOT_COLOR, (t - 0.5) * 2)
}

/** Get contrasting text color (black or white) based on background */
export const getContrastColor = (temp: number, minTemp: number, maxTemp: number): string => {
    const range = maxTemp - minTemp
    if (range === 0) {
        return '#000'
    }

    const t = (temp - minTemp) / range
    // Use white text for extreme colors (cold blue or hot red), black for middle
    return t < 0.25 || t > 0.75 ? '#fff' : '#000'
}
