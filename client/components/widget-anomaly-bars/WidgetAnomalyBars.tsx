import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'
import { colors } from '@/tools/colors'

import { linearRegression } from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyBarsProps {
    data?: ApiType.Climate.ClimateYearStat[]
    baselineAvgTemp?: number
    loading?: boolean
}

const WidgetAnomalyBars: React.FC<WidgetAnomalyBarsProps> = ({ data, baselineAvgTemp, loading }) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99'

    const chartOption: EChartsOption = useMemo(() => {
        const years = data?.map((d) => d.year) ?? []
        const anomalies = data?.map((d) => d.tempAnomaly) ?? []
        const trendValues = linearRegression(anomalies)

        return {
            ...getEChartBaseConfig(theme),
            series: [
                {
                    data: anomalies.map((v) => ({
                        itemStyle: { color: v >= 0 ? colors['red'][0] : colors['blue'][1] },
                        value: v
                    })),
                    markLine: {
                        data: [{ type: 'average', yAxis: 0 }],
                        lineStyle: { color: borderColor, type: 'dashed', width: 1 },
                        symbol: 'none',
                        label: {
                            position: 'insideEndTop'
                        }
                    },
                    name: t('temp-anomaly'),
                    type: 'bar'
                },
                {
                    data: trendValues,
                    lineStyle: { color: '#ffeb3b', width: 1 },
                    name: t('trend-warming'),
                    showSymbol: false,
                    smooth: true,
                    type: 'line'
                }
            ],
            tooltip: {
                backgroundColor,
                borderColor,
                formatter: (params: TopLevelFormatterParams) => {
                    const arr: CallbackDataParams[] = Array.isArray(params) ? params : [params]
                    const header = `<div class="${styles.chartTooltipTitle}">${years[arr[0].dataIndex] ?? ''}</div>`
                    const rows = arr
                        .map((item: CallbackDataParams) => {
                            const dot = `<span class="${styles.icon}" style="background-color:${String(item.color ?? item.borderColor ?? '')};"></span>`
                            const numVal = item.value as number | null
                            const val = `<span class="${styles.value}">${numVal != null ? `${numVal > 0 ? '+' : ''}${numVal}°C` : '---'}</span>`
                            return `<div class="${styles.chartTooltipItem}">${dot}<span class="${styles.label}">${item.seriesName ?? ''}${val}</span></div>`
                        })
                        .join('')
                    return header + rows
                },
                trigger: 'axis'
            },
            xAxis: {
                axisLabel: { color: textSecondaryColor, fontSize: '11px' },
                axisLine: { lineStyle: { color: borderColor } },
                axisTick: { show: false },
                data: years,
                type: 'category'
            },
            yAxis: {
                axisLabel: {
                    color: textSecondaryColor,
                    formatter: (v: number) => (v > 0 ? `+${v}°C` : `${v}°C`),
                    fontSize: '11px'
                },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: borderColor, width: 1 }, show: true },
                type: 'value'
            }
        }
    }, [data, baselineAvgTemp, backgroundColor, borderColor, textSecondaryColor, t])

    return (
        <div className={styles.widget}>
            <div className={styles.title}>{t('temp-anomaly')}</div>
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

export default WidgetAnomalyBars
