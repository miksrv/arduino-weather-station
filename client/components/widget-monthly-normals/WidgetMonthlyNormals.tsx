import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'
import { colors } from '@/tools/colors'

import styles from './styles.module.sass'

interface WidgetMonthlyNormalsProps {
    normals?: ApiType.Climate.ClimateMonthlyNormal[]
    currentYearMonthly?: Array<{ month: number; avgTemp: number }>
    loading?: boolean
}

const WidgetMonthlyNormals: React.FC<WidgetMonthlyNormalsProps> = ({ normals, currentYearMonthly, loading }) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99'

    const rangeColorTop = colors['red'][1]
    const rangeColorBottom = colors['blue'][1]
    const historicalColor = colors['purple'][0]
    const currentYearColor = colors['green'][0]

    const monthLabels = useMemo(
        () => Array.from({ length: 12 }, (_, i) => t(`month-short-${i + 1}` as `month-short-${number}`)),
        [t]
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
                    itemStyle: { color: colors['blue'][0] },
                    name: t('historical-min'),
                    showSymbol: false,
                    type: 'line',
                    z: 2
                },
                {
                    data: maxTemps,
                    lineStyle: { opacity: 0 },
                    itemStyle: { color: colors['red'][0] },
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
                backgroundColor,
                borderColor,
                trigger: 'axis',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter: (params: any) => {
                    const arr = Array.isArray(params) ? params : [params]
                    const monthIndex = arr[0]?.dataIndex
                    const header = `<div class="${styles.chartTooltipTitle}">${monthLabels[monthIndex] ?? ''}</div>`

                    const rows = arr
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .filter((item: any) => item.value != null && item.seriesName !== t('historical-range'))
                        // Sort to show max first, then min, then others
                        .sort((a: { seriesName: string }, b: { seriesName: string }) => {
                            const order = [
                                t('historical-max'),
                                t('historical-min'),
                                t('historical-normal'),
                                t('current-year')
                            ]
                            return order.indexOf(a.seriesName) - order.indexOf(b.seriesName)
                        })
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((item: any) => {
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            const dot = `<span class="${styles.icon}" style="background-color:${item.color ?? item.borderColor};"></span>`
                            const value =
                                item.value != null
                                    ? `${item.value > 0 ? '+' : ''}${Number(item.value).toFixed(1)}°C`
                                    : '---'
                            const val = `<span class="${styles.value}">${value}</span>`
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            return `<div class="${styles.chartTooltipItem}">${dot}<span class="${styles.label}">${item.seriesName}${val}</span></div>`
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
        backgroundColor,
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
                <ReactECharts
                    option={chartOption}
                    style={{ height: '260px', width: '100%' }}
                />
            )}
        </div>
    )
}

export default WidgetMonthlyNormals
