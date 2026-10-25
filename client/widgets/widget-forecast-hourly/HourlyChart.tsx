import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { ApiModel } from '@/api'
import EChart from '@/components/echart'
import { getChartTokens, getChartTooltipStyle, verticalGradient } from '@/tools'
import { getColor, getSensorColor, hexToRgba } from '@/tools/colors'
import { formatDate } from '@/tools/date'
import { capitalize, getNightRanges } from '@/tools/forecast'

import styles from './styles.module.sass'

export type HourlyMode = 'temperature' | 'precipitation' | 'wind'

interface HourlyChartProps {
    hours: ApiModel.Forecast[]
    mode: HourlyMode
}

export const CHART_HEIGHT = 240

/**
 * One quantity of the hourly forecast at a time, with its unit on the axis: night hours are shaded,
 * the axis labels every third hour and the weekday at midnight.
 */
const HourlyChart: React.FC<HourlyChartProps> = ({ hours, mode }) => {
    const { t } = useTranslation()
    const { resolvedTheme: theme } = useTheme()

    const option: EChartsOption = useMemo(() => {
        const tokens = getChartTokens(theme)
        // Categories are the unique hour timestamps (two days repeat every "HH:mm"); labels are formatted from them
        const categories = hours.map((hour, index) => hour.date ?? String(index))
        const nightShade = hexToRgba(tokens.textSecondary, theme === 'light' ? 0.07 : 0.06)

        const axis = (formatter: string, extra: Record<string, unknown> = {}) => ({
            type: 'value' as const,
            axisLabel: { color: tokens.textSecondary, fontSize: 11, formatter },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: tokens.gridLine } },
            ...extra
        })

        const line = (source: keyof ApiModel.Sensors, name: string, options: Record<string, unknown> = {}) => {
            const color = getSensorColor(source, theme)[0]

            return {
                type: 'line' as const,
                name,
                data: hours.map((hour) => hour[source] ?? null),
                showSymbol: false,
                smooth: 0.3,
                connectNulls: true,
                lineStyle: { color, width: 2 },
                itemStyle: { color },
                ...options
            }
        }

        const area = (source: keyof ApiModel.Sensors) => ({
            origin: 'start' as const,
            color: verticalGradient([
                { offset: 0, color: hexToRgba(getSensorColor(source, theme)[0], 0.3) },
                { offset: 1, color: hexToRgba(getSensorColor(source, theme)[0], 0) }
            ])
        })

        const nightArea = {
            silent: true,
            itemStyle: { color: nightShade },
            data: getNightRanges(hours).map(([start, end]) => [
                { xAxis: categories[start] },
                { xAxis: categories[end] }
            ])
        }

        const series =
            mode === 'temperature'
                ? [
                      line('temperature', t('temperature'), { areaStyle: area('temperature'), markArea: nightArea }),
                      line('feelsLike', t('feels-like'), { lineStyle: { width: 1.5, type: 'dashed' } })
                  ]
                : mode === 'precipitation'
                  ? [
                        {
                            type: 'bar' as const,
                            name: t('precipitation'),
                            data: hours.map((hour) => hour.precipitation ?? 0),
                            barMaxWidth: 10,
                            itemStyle: { color: getColor('blue', theme)[0], borderRadius: [3, 3, 0, 0] },
                            markArea: nightArea
                        },
                        line('clouds', t('clouds'), { yAxisIndex: 1, lineStyle: { width: 1.5 } })
                    ]
                  : [
                        line('windSpeed', t('wind-speed'), { areaStyle: area('windSpeed'), markArea: nightArea }),
                        line('windGust', t('wind-gust'), { lineStyle: { width: 1.5, type: 'dashed' } })
                    ]

        // The unit of each series, by the series index (the tooltip shows "2.4 мм", not a bare number)
        const seriesUnits =
            mode === 'temperature'
                ? ['°C', '°C']
                : mode === 'precipitation'
                  ? [t('millimeters'), '%']
                  : [t('meters-per-second'), t('meters-per-second')]

        const yAxis =
            mode === 'temperature'
                ? [axis('{value}°', { scale: true })]
                : mode === 'precipitation'
                  ? [
                        axis(`{value} ${t('millimeters')}`, { min: 0, minInterval: 0.5 }),
                        axis('{value}%', { min: 0, max: 100, splitLine: { show: false } })
                    ]
                  : [axis(`{value} ${t('meters-per-second')}`, { min: 0 })]

        return {
            backgroundColor: 'transparent',
            animationDuration: 400,
            grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
            legend: { show: false },
            tooltip: {
                trigger: 'axis',
                ...getChartTooltipStyle(theme),
                axisPointer: { type: 'line', lineStyle: { color: tokens.borderStrong } },
                formatter: (params: TopLevelFormatterParams) => {
                    const items = (Array.isArray(params) ? params : [params]) as CallbackDataParams[]
                    const hour = hours[items[0]?.dataIndex ?? 0]
                    const title = `<div class="${styles.chartTooltipTitle}">${formatDate(hour?.date, 'dddd, HH:mm')}</div>`
                    const rows = items.map((item) => {
                        const unit = seriesUnits[item.seriesIndex ?? 0] ?? ''
                        const value = item.value == null ? '—' : `${String(item.value)} ${unit}`
                        const dot = `<span class="${styles.icon}" style="background-color: ${String(item.color ?? '')};"></span>`

                        return `<div class="${styles.chartTooltipItem}">${dot}<span class="${styles.label}">${String(item.seriesName ?? '')}<span class="${styles.value}">${value}</span></span></div>`
                    })

                    return title + rows.join('')
                }
            },
            xAxis: {
                type: 'category',
                data: categories,
                boundaryGap: mode === 'precipitation',
                axisLine: { lineStyle: { color: tokens.border } },
                axisTick: { show: false },
                axisLabel: {
                    color: tokens.textSecondary,
                    fontSize: 11,
                    interval: 2,
                    hideOverlap: true,
                    formatter: (value: string) => {
                        const time = formatDate(value, 'HH:mm')

                        return time === '00:00' ? capitalize(formatDate(value, 'dd')) : time
                    }
                }
            },
            yAxis,
            series
        } as EChartsOption
    }, [hours, mode, theme, t])

    return (
        <EChart
            option={option}
            notMerge={true}
            style={{ height: CHART_HEIGHT, width: '100%' }}
        />
    )
}

export default HourlyChart
