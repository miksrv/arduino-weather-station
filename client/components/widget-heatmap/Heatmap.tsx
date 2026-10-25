import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import EChart from '@/components/echart'
import { getChartTokens, getChartTooltipStyle } from '@/tools'
import { formatDate, getDate } from '@/tools/date'
import { getHeatmapUnit, HeatmapPoint, PRECIPITATION_EDGES } from '@/tools/heatmap'

import styles from './styles.module.sass'

interface HeatmapChartProps {
    type: ApiType.Heatmap.SensorType
    points: HeatmapPoint[]
    height?: string | number
}

/**
 * Sequential palettes from low to high. Temperature diverges around the middle (cold blue → warm red);
 * the others go from a pale tint to the deep tone of the quantity's hue.
 */
const PALETTES: Record<ApiType.Heatmap.SensorType, string[]> = {
    temperature: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#ffffbf', '#fee090', '#f46d43', '#d73027', '#a50026'],
    pressure: ['#f3e5f5', '#ce93d8', '#ab47bc', '#8e24aa', '#6a1b9a', '#4a148c'],
    precipitation: ['#bbdefb', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0', '#0d47a1'],
    clouds: ['#e8eaf6', '#9fa8da', '#5c6bc0', '#3f51b5', '#303f9f', '#1a237e'],
    humidity: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f', '#006064']
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
        const values = points.map((point) => point.value)

        // Rain is rare and skewed: steps by thresholds, the dry hours blend into the card
        const edges = [0, ...PRECIPITATION_EDGES]
        const precipitationScale = {
            type: 'piecewise',
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            itemWidth: 14,
            itemHeight: 10,
            itemGap: 12,
            textStyle: { color: tokens.textSecondary, fontSize: 11 },
            pieces: edges.map((from, index) => {
                const to = edges[index + 1]
                const color = index === 0 ? tokens.gridLine : PALETTES.precipitation[index - 1]

                return to === undefined
                    ? { gte: from, label: `${from}+ ${unit}`, color }
                    : { gte: from, lt: to, label: index === 0 ? t('heatmap-dry') : `${from}–${to}`, color }
            })
        }

        return {
            backgroundColor: 'transparent',
            animation: false,
            grid: { left: 8, right: 8, top: 8, bottom: 56, containLabel: true },
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
                    : {
                          min: Math.floor(Math.min(...values)),
                          max: Math.ceil(Math.max(...values)),
                          calculable: true,
                          orient: 'horizontal',
                          left: 'center',
                          bottom: 0,
                          itemHeight: 240,
                          itemWidth: 10,
                          inRange: { color: PALETTES[type] },
                          // The handles carry the range with its unit; drag them to highlight a band of values
                          formatter: (value: unknown) => `${Math.round(Number(value) * 10) / 10} ${unit}`,
                          textStyle: { color: tokens.textSecondary, fontSize: 11 }
                      },
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
