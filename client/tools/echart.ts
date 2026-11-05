import type { EChartsOption } from 'echarts'

export type ChartTheme = 'light' | 'dark'

/** Colours of the chart chrome, mirroring the surface and text tokens of `styles/theme.css`. */
export interface ChartTokens {
    surface: string
    border: string
    borderStrong: string
    textPrimary: string
    textSecondary: string
    /** Split lines inside the plot: the border tone at low contrast */
    gridLine: string
}

const CHART_TOKENS: Record<ChartTheme, ChartTokens> = {
    light: {
        surface: '#ffffff', // --surface-1
        border: '#e6e4dc', // --border
        borderStrong: '#d3d0c6', // --border-strong
        textPrimary: '#141413', // --text-color-primary
        textSecondary: '#5f5e57', // --text-color-secondary
        gridLine: '#f1f0eb'
    },
    dark: {
        surface: '#141413',
        border: '#2a2926',
        borderStrong: '#3d3c38',
        textPrimary: '#faf9f5',
        textSecondary: '#a3a197',
        gridLine: '#1c1c1a'
    }
}

/**
 * Canvas charts can't resolve `var(--x)`, so they take the theme tokens from here.
 * Pass `resolvedTheme` of next-themes (the actual theme, never 'system').
 */
export const getChartTokens = (theme?: string): ChartTokens => CHART_TOKENS[theme === 'light' ? 'light' : 'dark']

/** A top-to-bottom linear gradient as a plain ECharts colour object (no runtime `graphic` import needed). */
export const verticalGradient = (stops: Array<{ offset: number; color: string }>) => ({
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: stops
})

/** Shared tooltip look: the card surface with the popout ring, the kit font. */
export const getChartTooltipStyle = (theme?: string) => {
    const tokens = getChartTokens(theme)

    return {
        backgroundColor: tokens.surface,
        borderColor: tokens.borderStrong,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: tokens.textPrimary, fontSize: 12 },
        extraCssText: 'border-radius: 8px; box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.35); font-family: inherit;'
    }
}

/** Common chart option: transparent background (the card shows through), grid and legend in theme colours. */
export const getEChartBaseConfig = (theme: string | undefined = 'dark'): Partial<EChartsOption> => {
    const tokens = getChartTokens(theme)

    return {
        backgroundColor: 'transparent',
        grid: {
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true,
            borderColor: tokens.border
        },
        legend: {
            type: 'plain',
            orient: 'horizontal',
            left: 5,
            bottom: 0,
            itemWidth: 12,
            itemHeight: 3,
            itemGap: 16,
            textStyle: {
                color: tokens.textSecondary,
                fontSize: '12px'
            },
            icon: 'roundRect'
        }
    }
}
