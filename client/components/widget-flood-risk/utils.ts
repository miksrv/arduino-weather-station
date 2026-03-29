import { ApiType } from '@/api'

type RiskLevel = ApiType.Anomaly.RiskLevel

/**
 * Reads a CSS custom property value from :root at runtime.
 * Returns a fallback if called on the server (SSR) or if the variable is not set.
 */
export const resolveCssVar = (variable: string, fallback: string): string => {
    if (typeof window === 'undefined') {
        return fallback
    }
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback
}

/**
 * Returns the resolved colour value for a given flood-risk level.
 * Uses getComputedStyle so ECharts canvas rendering receives an actual hex/rgb value
 * rather than an unresolvable CSS custom property string.
 */
export const getRiskLevelColor = (level: RiskLevel): string => {
    const map: Record<RiskLevel, [string, string]> = {
        low: ['--color-green', '#4bb34b'],
        elevated: ['--color-orange', '#f8a01c'],
        high: ['--color-orange', '#f8a01c'],
        critical: ['--color-red', '#e64646']
    }
    const [cssVar, fallback] = map[level]
    return resolveCssVar(cssVar, fallback)
}

/**
 * Clamps a contribution value to the range [0, 100] for bar-width rendering.
 */
export const clampContribution = (contribution: number): number => Math.min(Math.max(contribution, 0), 100)
