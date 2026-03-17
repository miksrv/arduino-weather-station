import React, { useCallback, useMemo } from 'react'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'

import { dateToSeasonDay, isFloodYear } from './utils'

import styles from './styles.module.sass'

type SnowpackPoint = ApiType.Anomaly.SnowpackPoint
type SeasonComparison = ApiType.Anomaly.SeasonComparison

interface Props {
    currentSeries: SnowpackPoint[]
    comparisonYears: SeasonComparison[]
    estimatedSWE: number
    historicalAvgSWE: number
}

const FLOOD_YEAR = '2023-2024'
const SEASON_COLORS = ['#5470c6', '#91cc75', '#fac858', '#73c0de', '#fc8452']
const MONTH_LABELS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
const DAYS_IN_SEASON_MONTHS = [31, 30, 31, 31, 28, 31, 30, 31]

const WidgetSnowpackChart: React.FC<Props> = ({ currentSeries, comparisonYears, estimatedSWE, historicalAvgSWE }) => {
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
                    const day = paramsArr[0].value[0]
                    const rows = paramsArr
                        .map((p) => `<div>${p.seriesName}: <b>${p.value[1]} ${t('swe-unit')}</b></div>`)
                        .join('')
                    return `<div>Day ${day}</div>${rows}`
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
                        label: { formatter: t('swe-historical-avg'), color: textSecondaryColor, fontSize: 10 }
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

                    const day = arr[0].value[0]
                    const rows = arr
                        .filter((p) => p.value[1] !== undefined)
                        .map((p) => `<div style="color:${p.color}">${p.seriesName}: <b>${p.value[1]} °C</b></div>`)
                        .join('')
                    return `<div>Day ${day}</div>${rows}`
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
                        label: { formatter: '0 °C', color: '#5470c6', fontSize: 10 }
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
                style={{ height: '180px', width: '100%' }}
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

interface ComparisonTableProps {
    rows: SeasonComparison[]
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows }) => {
    const { t } = useTranslation()

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>{t('winter-comparison')}</th>
                    <th>{t('swe-unit')}</th>
                    <th>{t('flood-occurred')}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr
                        key={row.year}
                        className={isFloodYear(row.year, FLOOD_YEAR) ? styles.floodYearRow : undefined}
                    >
                        <td>{row.year}</td>
                        <td>{row.maxSWE}</td>
                        <td>
                            {row.floodOccurred === true
                                ? t('flood-occurred')
                                : row.floodOccurred === false
                                  ? t('no-flood')
                                  : t('season-in-progress')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default WidgetSnowpackChart
