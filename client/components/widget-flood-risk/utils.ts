import { ApiType } from '@/api'
import { StatusTone } from '@/components/status-badge'
import { resolveCssVar } from '@/tools/colors'

type RiskLevel = ApiType.Anomaly.RiskLevel

export { resolveCssVar }

/**
 * The status tone of each flood-risk level: one map for the badge, the bars (a `.green`/`.orange`/`.red` modifier
 * class over the theme token, so the server and the browser render the same) and the gauge (`getRiskLevelColor`).
 */
export const RISK_LEVEL_TONES: Record<RiskLevel, StatusTone> = {
    low: 'green',
    elevated: 'orange',
    high: 'orange',
    critical: 'red'
}

/** Colours the canvas falls back to when the theme token can't be read (on the server) */
const TONE_FALLBACKS: Record<StatusTone, string> = {
    green: '#4bb34b',
    yellow: '#b28811',
    orange: '#f8a01c',
    red: '#e64646'
}

/**
 * Returns the resolved colour value for a given flood-risk level.
 * Uses getComputedStyle so ECharts canvas rendering receives an actual hex/rgb value
 * rather than an unresolvable CSS custom property string. Canvas only: HTML takes the tone's modifier class.
 */
export const getRiskLevelColor = (level: RiskLevel): string => {
    const tone = RISK_LEVEL_TONES[level]
    return resolveCssVar(`--color-${tone}`, TONE_FALLBACKS[tone])
}

/**
 * Clamps a contribution value to the range [0, 100] for bar-width rendering.
 */
export const clampContribution = (contribution: number): number => Math.min(Math.max(contribution, 0), 100)
