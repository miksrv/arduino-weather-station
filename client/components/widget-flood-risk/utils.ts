import { ApiType } from '@/api'
import { resolveCssVar } from '@/tools/colors'

type RiskLevel = ApiType.Anomaly.RiskLevel

export { resolveCssVar }

const RISK_LEVEL_COLORS: Record<RiskLevel, [string, string]> = {
    low: ['--color-green', '#4bb34b'],
    elevated: ['--color-orange', '#f8a01c'],
    high: ['--color-orange', '#f8a01c'],
    critical: ['--color-red', '#e64646']
}

/**
 * The status token of a flood-risk level, for HTML: `var(<token>)` renders the same on the server and in the
 * browser, while a colour read with getComputedStyle exists only in the browser (the server took the fallback,
 * and React never patches a mismatched style attribute, so the bars kept the fallback colour).
 */
export const getRiskLevelCssVar = (level: RiskLevel): string => RISK_LEVEL_COLORS[level][0]

/**
 * Returns the resolved colour value for a given flood-risk level.
 * Uses getComputedStyle so ECharts canvas rendering receives an actual hex/rgb value
 * rather than an unresolvable CSS custom property string. Canvas only: for HTML use getRiskLevelCssVar.
 */
export const getRiskLevelColor = (level: RiskLevel): string => {
    const [cssVar, fallback] = RISK_LEVEL_COLORS[level]
    return resolveCssVar(cssVar, fallback)
}

/**
 * Clamps a contribution value to the range [0, 100] for bar-width rendering.
 */
export const clampContribution = (contribution: number): number => Math.min(Math.max(contribution, 0), 100)
