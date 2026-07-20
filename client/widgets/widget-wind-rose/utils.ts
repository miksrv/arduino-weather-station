import { ApiModel } from '@/api'
import { round } from '@/tools/helpers'

export const WIND_ROSE_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

export type WindRoseDirection = (typeof WIND_ROSE_DIRECTIONS)[number]

const DIRECTION_DEGREES: Record<WindRoseDirection, number> = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315
}

export interface WindSpeedBin {
    /** Upper (inclusive) bound of the bin, in m/s. The last bin is open-ended. */
    max: number
    color: string
}

/** Speed bins used to stack each direction's wedge, coloured from calm (blue) to strong (red). */
export const WIND_SPEED_BINS: WindSpeedBin[] = [
    { max: 2, color: '#3a7bd7' },
    { max: 4, color: '#3fa88f' },
    { max: 6, color: '#6cb33f' },
    { max: 8, color: '#e6b31d' },
    { max: 10, color: '#e8771f' },
    { max: Infinity, color: '#c0392b' }
]

/** Readings below this speed are considered calm and excluded from the directional wedges. */
const CALM_THRESHOLD_MS = 0.5

export interface WindRoseResult {
    /** Percentage (0-100) of readings for each direction, split into WIND_SPEED_BINS, in WIND_ROSE_DIRECTIONS order. */
    directionBins: number[][]
    /** Percentage (0-100) of readings with near-zero wind speed. */
    calmPercent: number
    /** The direction with the highest total frequency, or undefined when there's no directional data. */
    prevailingDirection?: WindRoseDirection
    /** The prevailing direction's representative angle, e.g. 315 for 'NW'. */
    prevailingDegrees?: number
    /** Mean wind speed across all valid readings (including calm ones). */
    averageSpeed?: number
}

/**
 * Bins historical wind speed/direction readings into a wind rose: a percentage breakdown by
 * one of 8 compass directions, each further split by speed range.
 *
 * @param data Weather readings to bin (order doesn't matter).
 */
export const computeWindRose = (data?: ApiModel.Weather[]): WindRoseResult => {
    const directionBins: number[][] = WIND_ROSE_DIRECTIONS.map(() => WIND_SPEED_BINS.map(() => 0))

    const validItems = (data ?? []).filter(
        (item): item is ApiModel.Weather & { windSpeed: number; windDeg: number } =>
            item.windSpeed !== undefined && item.windSpeed != null && item.windDeg !== undefined && item.windDeg != null
    )

    if (!validItems.length) {
        return { directionBins, calmPercent: 0 }
    }

    const directionCounts = WIND_ROSE_DIRECTIONS.map(() => 0)
    let calmCount = 0
    let speedSum = 0

    validItems.forEach((item) => {
        speedSum += item.windSpeed

        if (item.windSpeed < CALM_THRESHOLD_MS) {
            calmCount++
            return
        }

        const directionIndex = Math.round((item.windDeg % 360) / 45) % WIND_ROSE_DIRECTIONS.length
        const binIndex = WIND_SPEED_BINS.findIndex((bin) => item.windSpeed <= bin.max)

        directionCounts[directionIndex]++
        directionBins[directionIndex][binIndex]++
    })

    const total = validItems.length
    const percentBins = directionBins.map((bins) => bins.map((count) => round((count / total) * 100, 1) ?? 0))

    const hasWindData = directionCounts.some((count) => count > 0)
    const prevailingIndex = directionCounts.reduce(
        (bestIndex, count, index) => (count > directionCounts[bestIndex] ? index : bestIndex),
        0
    )
    const prevailingDirection = hasWindData ? WIND_ROSE_DIRECTIONS[prevailingIndex] : undefined

    return {
        directionBins: percentBins,
        calmPercent: round((calmCount / total) * 100, 1) ?? 0,
        prevailingDirection,
        prevailingDegrees: prevailingDirection ? DIRECTION_DEGREES[prevailingDirection] : undefined,
        averageSpeed: round(speedSum / total, 1)
    }
}
