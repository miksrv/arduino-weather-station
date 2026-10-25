import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import EChart from '@/components/echart'
import { getChartTokens, getChartTooltipStyle, getEChartBaseConfig } from '@/tools'
import { getColor } from '@/tools/colors'

import styles from './styles.module.sass'

interface WidgetMonthlyNormalsProps {
    normals?: ApiType.Climate.ClimateMonthlyNormal[]
    currentYearMonthly?: Array<{ month: number; avgTemp: number }>
    loading?: boolean
}

const WidgetMonthlyNormals: React.FC<WidgetMonthlyNormalsProps> = ({ normals, currentYearMonthly, loading }) => {
    const { t, i18n } = useTranslation()
    const { resolvedTheme: theme } = useTheme()
    const { gridLine: borderColor, textSecondary: textSecondaryColor } = getChartTokens(theme)

    const rangeColorTop = getColor('red', theme)[1]
    const rangeColorBottom = getColor('blue', theme)[1]
    const historicalColor = getColor('purple', theme)[0]
    const currentYearColor = getColor('green', theme)[0]

    const monthLabels = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2000, i, 1)
                return date.toLocaleString(i18n.language, { month: 'long' })
            }),
        [i18n.language]
    )

    const chartOption: EChartsOption = useMemo(() => {
        const sorted = [...(normals ?? [])].sort((a, b) => a.month - b.month)
        const minTemps = Array.from({ length: 12 }, (_, i) => sorted.find((m) => m.month === i + 1)?.minTemp ?? null)
        const maxTemps = Array.from({ length: 12 }, (_, i) => sorted.find((m) => m.month === i + 1)?.maxTemp ?? null)
        const avgTemps = Array.from({ length: 12 }, (_, i) => sorted.find((m) => m.month === i + 1)?.avgTemp ?? null)
        const currentTemps = Array.from({ length: 12 }, (_, i) => {
            const entry = currentYearMonthly?.find((m) => m.month === i + 1)
            return entry?.avgTemp ?? null
        })

        // Данные для области диапазона: [min, max] для каждого месяца
        const rangeData = minTemps.map((min, i) => {
            const max = maxTemps[i]
            return min != null && max != null ? [min, max] : null
        })

        return {
            ...getEChartBaseConfig(theme),
            legend: {
                ...getEChartBaseConfig(theme).legend,
                data: [t('historical-range'), t('historical-normal'), t('current-year')]
            },
            series: [
                {
                    type: 'custom',
                    name: t('historical-range'),
                    renderItem: (params, api) => {
                        if (params.dataIndex !== 0) {
                            return null
                        }

                        const points: number[][] = []

                        // Верхняя линия (max) слева направо
                        for (let i = 0; i < 12; i++) {
                            const item = rangeData[i]
                            if (item) {
                                const coord = api.coord([i, item[1]])
                                points.push(coord)
                            }
                        }

                        // Нижняя линия (min) справа налево
                        for (let i = 11; i >= 0; i--) {
                            const item = rangeData[i]
                            if (item) {
                                const coord = api.coord([i, item[0]])
                                points.push(coord)
                            }
                        }

                        return {
                            type: 'polygon',
                            shape: { points },
                            style: {
                                fill: {
                                    type: 'linear',
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: rangeColorTop },
                                        { offset: 1, color: rangeColorBottom }
                                    ]
                                }
                            }
                        }
                    },
                    data: [0],
                    z: 1
                },
                {
                    data: minTemps,
                    lineStyle: { opacity: 0 },
                    itemStyle: { color: getColor('blue', theme)[0] },
                    name: t('historical-min'),
                    showSymbol: false,
                    type: 'line',
                    z: 2
                },
                {
                    data: maxTemps,
                    lineStyle: { opacity: 0 },
                    itemStyle: { color: getColor('red', theme)[0] },
                    name: t('historical-max'),
                    showSymbol: false,
                    type: 'line',
                    z: 2
                },
                {
                    data: avgTemps,
                    lineStyle: { color: historicalColor, width: 2, type: 'dashed' },
                    itemStyle: { color: historicalColor },
                    name: t('historical-normal'),
                    showSymbol: false,
                    type: 'line',
                    z: 3
                },
                {
                    data: currentTemps,
                    lineStyle: { color: currentYearColor, width: 2 },
                    itemStyle: { color: currentYearColor },
                    name: t('current-year'),
                    showSymbol: true,
                    symbolSize: 6,
                    type: 'line',
                    z: 4
                }
            ],
            tooltip: {
                ...getChartTooltipStyle(theme),
                trigger: 'axis',
                formatter: (params: TopLevelFormatterParams) => {
                    const arr: CallbackDataParams[] = Array.isArray(params) ? params : [params]
                    const monthIndex = arr[0]?.dataIndex
                    const header = `<div class="${styles.chartTooltipTitle}">${monthLabels[monthIndex] ?? ''}</div>`

                    const rows = arr
                        .filter(
                            (item: CallbackDataParams) =>
                                item.value != null && item.seriesName !== t('historical-range')
                        )
                        // Sort to show max first, then min, then others
                        .sort((a: CallbackDataParams, b: CallbackDataParams) => {
                            const order = [
                                t('historical-max'),
                                t('historical-min'),
                                t('historical-normal'),
                                t('current-year')
                            ]
                            return order.indexOf(a.seriesName ?? '') - order.indexOf(b.seriesName ?? '')
                        })
                        .map((item: CallbackDataParams) => {
                            const dot = `<span class="${styles.icon}" style="background-color:${String(item.color ?? item.borderColor ?? '')};"></span>`
                            const numVal = item.value as number | null
                            const value =
                                numVal != null ? `${numVal > 0 ? '+' : ''}${Number(numVal).toFixed(1)}°C` : '---'
                            const val = `<span class="${styles.value}">${value}</span>`
                            return `<div class="${styles.chartTooltipItem}">${dot}<span class="${styles.label}">${item.seriesName ?? ''}${val}</span></div>`
                        })
                        .join('')

                    return header + rows
                }
            },
            xAxis: {
                axisLabel: { color: textSecondaryColor, fontSize: '11px' },
                axisLine: { lineStyle: { color: borderColor } },
                axisTick: { show: false },
                data: monthLabels,
                type: 'category'
            },
            yAxis: {
                axisLabel: {
                    color: textSecondaryColor,
                    fontSize: '11px',
                    formatter: (v: number) => `${v > 0 ? '+' : ''}${v}°C`
                },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: borderColor, width: 1 }, show: true },
                type: 'value'
            }
        }
    }, [
        normals,
        currentYearMonthly,
        theme,
        borderColor,
        textSecondaryColor,
        rangeColorTop,
        rangeColorBottom,
        historicalColor,
        currentYearColor,
        monthLabels,
        t
    ])

    return (
        <div className={styles.widget}>
            <div className={styles.title}>{t('monthly-normals')}</div>
            {loading ? (
                <Skeleton style={{ height: 260, width: '100%' }} />
            ) : (
                <EChart
                    option={chartOption}
                    style={{ height: '260px', width: '100%' }}
                />
            )}
        </div>
    )
}

export default WidgetMonthlyNormals
