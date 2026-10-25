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

import { linearRegression } from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyBarsProps {
    data?: ApiType.Climate.ClimateYearStat[]
    baselineAvgTemp?: number
    loading?: boolean
}

const WidgetAnomalyBars: React.FC<WidgetAnomalyBarsProps> = ({ data, baselineAvgTemp, loading }) => {
    const { t } = useTranslation()
    const { resolvedTheme: theme } = useTheme()
    const { gridLine: borderColor, textSecondary: textSecondaryColor } = getChartTokens(theme)

    const chartOption: EChartsOption = useMemo(() => {
        const years = data?.map((d) => d.year) ?? []
        const anomalies = data?.map((d) => d.tempAnomaly) ?? []
        // The trend is fitted to full years only; the running year is drawn faded and without a trend point
        const completeCount = data?.filter((d) => !d.isPartial).length ?? 0
        const trendValues = [
            ...linearRegression(anomalies.slice(0, completeCount)),
            ...Array<null>(anomalies.length - completeCount).fill(null)
        ]
        const warmColor = getColor('red', theme)[0]
        const coldColor = getColor('blue', theme)[1]
        const trendColor = getColor('orange', theme)[0]

        return {
            ...getEChartBaseConfig(theme),
            series: [
                {
                    data: anomalies.map((v, i) => ({
                        itemStyle: {
                            color: v >= 0 ? warmColor : coldColor,
                            opacity: data?.[i]?.isPartial ? 0.4 : 1,
                            borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]
                        },
                        value: v
                    })),
                    // The legend takes the series colour, not the per-bar ones
                    itemStyle: { color: warmColor },
                    markLine: {
                        data: [{ yAxis: 0 }],
                        lineStyle: { color: borderColor, type: 'dashed', width: 1 },
                        symbol: 'none',
                        label: { show: false },
                        silent: true
                    },
                    name: t('temp-anomaly'),
                    type: 'bar'
                },
                {
                    data: trendValues,
                    itemStyle: { color: trendColor },
                    lineStyle: { color: trendColor, width: 2 },
                    name: t('trend-warming'),
                    showSymbol: false,
                    smooth: true,
                    type: 'line'
                }
            ],
            tooltip: {
                ...getChartTooltipStyle(theme),
                formatter: (params: TopLevelFormatterParams) => {
                    const arr: CallbackDataParams[] = Array.isArray(params) ? params : [params]
                    const index = arr[0].dataIndex
                    const partial = data?.[index]?.isPartial ? ` (${t('year-to-date')})` : ''
                    const header = `<div class="${styles.chartTooltipTitle}">${years[index] ?? ''}${partial}</div>`
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
    }, [data, baselineAvgTemp, borderColor, textSecondaryColor, t, theme])

    return (
        <div className={styles.widget}>
            <div className={styles.title}>{t('temp-anomaly')}</div>
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

export default WidgetAnomalyBars
