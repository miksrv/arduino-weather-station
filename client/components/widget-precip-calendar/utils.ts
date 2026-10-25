export const isLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

/** Calendar cell colours: dry days on surface-2, then four shares of the precipitation hue (theme-aware CSS values). */
export const PRECIP_LEVEL_COLORS = {
    dry: 'var(--surface-2)',
    trace: 'color-mix(in srgb, var(--data-precipitation) 30%, var(--surface-2))',
    light: 'color-mix(in srgb, var(--data-precipitation) 60%, var(--surface-2))',
    moderate: 'var(--data-precipitation)',
    heavy: 'color-mix(in srgb, var(--data-precipitation) 65%, #001a3d)'
} as const

export const getCellColor = (total: number): string => {
    if (total <= 0) {
        return PRECIP_LEVEL_COLORS.dry
    }
    if (total <= 1) {
        return PRECIP_LEVEL_COLORS.trace
    }
    if (total <= 5) {
        return PRECIP_LEVEL_COLORS.light
    }
    if (total <= 20) {
        return PRECIP_LEVEL_COLORS.moderate
    }
    return PRECIP_LEVEL_COLORS.heavy
}
