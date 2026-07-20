import { ApiType } from '@/api'
import { resolveCssVar } from '@/tools/colors'

type RiskLevel = ApiType.Anomaly.RiskLevel

export { resolveCssVar }

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
