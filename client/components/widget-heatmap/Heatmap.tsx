import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import EChart from '@/components/echart'
import { getChartTokens, getChartTooltipStyle } from '@/tools'
import { formatDate, getDate } from '@/tools/date'
import {
    getHeatmapRange,
    getHeatmapUnit,
    getPrecipitationPieces,
    HEATMAP_PALETTES,
    HeatmapPoint
} from '@/tools/heatmap'

import styles from './styles.module.sass'

interface HeatmapChartProps {
    type: ApiType.Heatmap.SensorType
    points: HeatmapPoint[]
    height?: string | number
}

/** Hours of the day (rows, midnight at the top) by days (columns), one cell per hour, coloured by value */
const HeatmapChart: React.FC<HeatmapChartProps> = ({ type, points, height }) => {
    const { resolvedTheme: theme } = useTheme()
    const { t } = useTranslation()

    const option: EChartsOption = useMemo(() => {
        const tokens = getChartTokens(theme)
        const unit = getHeatmapUnit(type, t)
        const days = [...new Set(points.map((point) => point.day))]
        const dayIndex = new Map(days.map((day, index) => [day, index]))
        const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
        const [min, max] = getHeatmapRange(points)

        // Rain is rare and skewed: steps by thresholds, the dry hours blend into the card.
        // The scales only colour the cells: their legend is HTML, in the card header (`HeatmapLegend`)
        const precipitationScale = {
            type: 'piecewise',
            show: false,
            pieces: getPrecipitationPieces(unit, t('heatmap-dry')).map((piece) => ({
                ...piece,
                color: piece.color ?? tokens.gridLine
            }))
        }

        return {
            backgroundColor: 'transparent',
            animation: false,
            grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: true },
            tooltip: {
                ...getChartTooltipStyle(theme),
                formatter: (params: TopLevelFormatterParams) => {
                    const item = (Array.isArray(params) ? params[0] : params) as CallbackDataParams
                    const [x, y, value] = (item.value as [number, number, number]) ?? []
                    const title = `${formatDate(`${days[x]} 12:00`, 'dddd, D MMMM YYYY')} · ${hours[y]}`
                    const dot = `<span class="${styles.icon}" style="background-color: ${String(item.color ?? '')};"></span>`

                    return `<div class="${styles.chartTooltipTitle}">${title}</div><div class="${styles.chartTooltipItem}">${dot}<span class="${styles.label}">${t(type)}<span class="${styles.value}">${value} ${unit}</span></span></div>`
                }
            },
            xAxis: {
                type: 'category',
                data: days,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    hideOverlap: true,
                    color: tokens.textSecondary,
                    fontSize: 11,
                    // The day string is a local date: read it as such, not as UTC
                    formatter: (value: string) => getDate(`${value} 12:00`).format('D MMM')
                }
            },
            yAxis: {
                type: 'category',
                data: hours,
                inverse: true,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: tokens.textSecondary, fontSize: 11, interval: 2 }
            },
            visualMap:
                type === 'precipitation'
                    ? precipitationScale
                    : { type: 'continuous', show: false, min, max, inRange: { color: HEATMAP_PALETTES[type] } },
            series: [
                {
                    type: 'heatmap',
                    data: points.map((point) => [dayIndex.get(point.day) ?? 0, point.hour, point.value]),
                    emphasis: { itemStyle: { borderColor: tokens.textPrimary, borderWidth: 1 } },
                    progressive: 2000
                }
            ]
        } as EChartsOption
    }, [points, type, theme, t])

    return (
        <EChart
            option={option}
            notMerge={true}
            style={{ height, width: '100%' }}
        />
    )
}

export default HeatmapChart
