import React, { useCallback, useMemo } from 'react'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'
import { formatDate } from '@/tools/date'

import { ComparisonTable } from './ComparisonTable'
import { DAYS_IN_SEASON_MONTHS, FLOOD_YEAR, MONTH_LABELS, SEASON_COLORS } from './constants'
import { dateToSeasonDay, isFloodYear, seasonDayToDate } from './utils'

import styles from './styles.module.sass'

type SnowpackPoint = ApiType.Anomaly.SnowpackPoint
type SeasonComparison = ApiType.Anomaly.SeasonComparison

interface WidgetSnowpackChartProps {
    loading?: boolean
    currentSeries: SnowpackPoint[]
    comparisonYears: SeasonComparison[]
    estimatedSWE: number
    historicalAvgSWE: number
}

const WidgetSnowpackChart: React.FC<WidgetSnowpackChartProps> = ({
    loading,
    currentSeries,
    comparisonYears,
    estimatedSWE,
    historicalAvgSWE
}) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99'

    const currentData = useMemo(() => currentSeries.map((p) => [dateToSeasonDay(p.date), p.swe]), [currentSeries])

    const comparisonSeries = useMemo(
        () =>
            comparisonYears.map((cy, idx) => {
                const floodYear = isFloodYear(cy.year, FLOOD_YEAR)
                const seriesColor = floodYear ? '#ee6666' : SEASON_COLORS[idx % SEASON_COLORS.length]
                const opacity = floodYear ? 1 : 0.5

                const data = (cy.series ?? []).map((p) => [dateToSeasonDay(p.date), p.swe])

                const markPoint =
                    floodYear && cy.peakDate
                        ? {
                              data: [
                                  {
                                      coord: [dateToSeasonDay(cy.peakDate), cy.maxSWE],
                                      name: t('flood-occurred'),
                                      label: { formatter: '▲', color: '#ffffff', fontSize: 12 },
                                      itemStyle: { color: '#ee6666' }
                                  }
                              ]
                          }
                        : undefined

                return {
                    type: 'line' as const,
                    name: cy.year,
                    data,
                    lineStyle: {
                        width: floodYear ? 2 : 1,
                        color: seriesColor,
                        opacity,
                        type: floodYear ? ('dashed' as const) : ('solid' as const)
                    },
                    itemStyle: { color: seriesColor, opacity },
                    showSymbol: false,
                    markPoint
                }
            }),
        [comparisonYears, t]
    )

    const comparisonTempSeries = useMemo(
        () =>
            comparisonYears.map((cy, idx) => {
                const floodYear = isFloodYear(cy.year, FLOOD_YEAR)
                const seriesColor = floodYear ? '#ee6666' : SEASON_COLORS[idx % SEASON_COLORS.length]
                const opacity = floodYear ? 1 : 0.5
                const data = (cy.temperatureSeries ?? []).map((p) => [dateToSeasonDay(p.date), p.temperature])

                return {
                    type: 'line' as const,
                    name: cy.year,
                    data,
                    lineStyle: {
                        width: floodYear ? 2 : 1,
                        color: seriesColor,
                        opacity,
                        type: floodYear ? ('dashed' as const) : ('solid' as const)
                    },
                    itemStyle: { color: seriesColor, opacity },
                    showSymbol: false
                }
            }),
        [comparisonYears]
    )

    const xAxisLabels = useMemo(() => {
        const labels: Array<{ value: number; label: string }> = []
        let dayCount = 0
        MONTH_LABELS.forEach((label, i) => {
            labels.push({ value: dayCount, label })
            dayCount += DAYS_IN_SEASON_MONTHS[i]
        })
        return labels
    }, [])

    const option: echarts.EChartsOption = useMemo(
        () => ({
            ...getEChartBaseConfig(theme),
            grid: {
                left: 27,
                right: 20,
                top: 0,
                bottom: 50
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: theme === 'dark' ? '#2c2d2e' : '#ffffff',
                borderColor,
                axisPointer: {
                    type: 'line' as const,
                    lineStyle: { color: textSecondaryColor, type: 'dashed' as const }
                },
                formatter: (params: unknown) => {
                    const paramsArr = params as Array<{ seriesName: string; value: [number, number]; color: string }>
                    if (!paramsArr.length) {
                        return ''
                    }

                    const tooltipContent: string[] = []
                    const day = paramsArr[0].value[0]
                    const dateStr = seasonDayToDate(day)

                    tooltipContent.push(
                        `<div class="${styles.chartTooltipTitle}">${t('swe-day')}: ${day} (${formatDate(dateStr, 'D MMMM')})</div>`
                    )

                    paramsArr.forEach((item) => {
                        const colorSquare = `<span class="${styles.icon}" style="background-color: ${item.color};"></span>`
                        const seriesValue = `<span class="${styles.value}">${item.value?.[1] !== undefined ? Math.round(item.value[1] * 100) / 100 : '---'} ${t('swe-unit')}</span>`
                        const seriesName = `<span class="${styles.label}">${item.seriesName}${seriesValue}</span>`
                        const row = `<div class="${styles.chartTooltipItem}">${colorSquare} ${seriesName}</div>`
                        tooltipContent.push(row)
                    })

                    return tooltipContent.join('')
                }
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 242,
                axisLabel: {
                    color: textSecondaryColor,
                    fontSize: 11,
                    formatter: (value: number) => {
                        const found = xAxisLabels.find((l) => Math.abs(l.value - value) < 15)
                        return found ? found.label : ''
                    }
                },
                axisLine: { lineStyle: { color: borderColor } },
                splitLine: { lineStyle: { color: borderColor, width: 1 } }
            },
            yAxis: {
                type: 'value',
                name: t('swe-unit'),
                nameTextStyle: { color: textSecondaryColor, fontSize: 11 },
                axisLabel: { color: textSecondaryColor, fontSize: 11 },
                axisLine: { lineStyle: { color: borderColor } },
                splitLine: { lineStyle: { color: borderColor, width: 1 } }
            },
            series: [
                {
                    type: 'line',
                    name: t('swe-current'),
                    data: currentData,
                    lineStyle: { width: 3, color: 'var(--color-main)' },
                    itemStyle: { color: 'var(--color-main)' },
                    showSymbol: false,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        lineStyle: { type: 'dashed', color: textSecondaryColor },
                        data: [{ yAxis: historicalAvgSWE, name: t('swe-historical-avg') }],
                        label: {
                            position: 'insideEndTop',
                            formatter: t('swe-historical-avg'),
                            color: textSecondaryColor,
                            fontSize: 10
                        }
                    }
                },
                ...comparisonSeries
            ]
        }),
        [theme, borderColor, textSecondaryColor, currentData, comparisonSeries, historicalAvgSWE, xAxisLabels, t]
    )

    const tempOption: echarts.EChartsOption = useMemo(
        () => ({
            ...getEChartBaseConfig(theme),
            grid: {
                left: 0,
                right: 20,
                top: 30,
                bottom: 10
            },
            legend: {
                show: false
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: theme === 'dark' ? '#2c2d2e' : '#ffffff',
                borderColor,
                axisPointer: {
                    type: 'line' as const,
                    lineStyle: { color: textSecondaryColor, type: 'dashed' as const }
                },
                formatter: (params: unknown) => {
                    const arr = params as Array<{ seriesName: string; value: [number, number]; color: string }>

                    if (!arr.length) {
                        return ''
                    }

                    const tooltipContent: string[] = []
                    const day = arr[0].value[0]
                    const dateStr = seasonDayToDate(day)

                    tooltipContent.push(
                        `<div class="${styles.chartTooltipTitle}">${t('swe-day')}: ${day} (${formatDate(dateStr, 'D MMMM')})</div>`
                    )

                    arr.filter((p) => p.value[1] !== undefined).forEach((item) => {
                        const colorSquare = `<span class="${styles.icon}" style="background-color: ${item.color};"></span>`
                        const seriesValue = `<span class="${styles.value}">${item.value?.[1] ?? '---'} °C</span>`
                        const seriesName = `<span class="${styles.label}">${item.seriesName}${seriesValue}</span>`
                        const row = `<div class="${styles.chartTooltipItem}">${colorSquare} ${seriesName}</div>`
                        tooltipContent.push(row)
                    })

                    return tooltipContent.join('')
                }
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 242,
                axisLabel: {
                    show: false
                },
                axisLine: { lineStyle: { color: borderColor } },
                splitLine: { lineStyle: { color: borderColor, width: 1 } }
            },
            yAxis: {
                type: 'value',
                name: '°C',
                nameTextStyle: { color: textSecondaryColor, fontSize: 11 },
                axisLabel: { color: textSecondaryColor, fontSize: 11 },
                axisLine: { lineStyle: { color: borderColor } },
                splitLine: { lineStyle: { color: borderColor, width: 1 } }
            },
            series: [
                {
                    type: 'line' as const,
                    name: '0°C',
                    data: [],
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        lineStyle: { type: 'dashed' as const, color: '#5470c6', width: 1 },
                        data: [{ yAxis: 0 }],
                        label: {
                            position: 'insideEndTop',
                            formatter: '0 °C',
                            color: '#5470c6',
                            fontSize: 10
                        }
                    }
                },
                ...comparisonTempSeries
            ]
        }),
        [theme, borderColor, textSecondaryColor, comparisonTempSeries, xAxisLabels]
    )

    const handleSweReady = useCallback((instance: echarts.ECharts) => {
        instance.group = 'snowpack'
        echarts.connect('snowpack')
    }, [])

    const handleTempReady = useCallback((instance: echarts.ECharts) => {
        instance.group = 'snowpack'
        echarts.connect('snowpack')
    }, [])

    if (loading) {
        return (
            <div className={styles.widget}>
                <Skeleton style={{ width: '100%', height: 460 }} />
            </div>
        )
    }

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <span className={styles.title}>{t('swe-chart-title')}</span>
                <span className={styles.sweValue}>
                    {t('swe-current')}: <strong>{Math.round(estimatedSWE)}</strong> {t('swe-unit')}
                </span>
            </div>

            <ReactECharts
                onChartReady={handleTempReady}
                option={tempOption}
                style={{ height: '180px', width: '100%', marginBottom: '-20px' }}
            />

            <ReactECharts
                onChartReady={handleSweReady}
                option={option}
                style={{ height: '280px', width: '100%' }}
            />

            <ComparisonTable rows={comparisonYears} />
        </div>
    )
}

export default WidgetSnowpackChart
