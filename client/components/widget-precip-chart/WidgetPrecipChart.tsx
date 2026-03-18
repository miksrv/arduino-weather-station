import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

interface WidgetPrecipChartProps {
    loading?: boolean
    monthlyTotals?: Array<{ month: number; total: number }>
}

const WidgetPrecipChart: React.FC<WidgetPrecipChartProps> = ({ loading, monthlyTotals }) => {
    const { i18n, t } = useTranslation()
    const { theme } = useTheme()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99' // --text-color-secondary

    const monthlyChartOption: EChartsOption = useMemo(() => {
        const totals = monthlyTotals ?? []
        const labels = Array.from({ length: 12 }, (_, idx) =>
            new Date(2000, idx, 1).toLocaleString(i18n.language, { month: 'short' })
        )
        const values = Array.from({ length: 12 }, (_, idx) => {
            const entry = totals.find((m) => m.month === idx + 1)
            return entry ? entry.total : 0
        })

        return {
            grid: { bottom: 0, containLabel: true, left: 0, right: 0, top: 10 },
            series: [
                {
                    barMaxWidth: 32,
                    data: values,
                    itemStyle: { borderRadius: [3, 3, 0, 0], color: '#1a7fd4' },
                    type: 'bar'
                }
            ],
            tooltip: {
                trigger: 'axis',
                backgroundColor,
                borderColor,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter: (params: any) => {
                    const tooltipContent: string[] = []

                    if (params.length > 0) {
                        const monthName = params[0].name as string
                        const header = `<div class="${styles.chartTooltipTitle}">${monthName}</div>`
                        tooltipContent.push(header)
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    params.forEach((item: any) => {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        const colorSquare = `<span class="${styles.icon}" style="background-color: ${item.color};"></span>`
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        const seriesValue = `<span class="${styles.value}">${item.value ?? '---'} ${t('millimeters')}</span>`
                        const seriesName = `<span class="${styles.label}">${t('precipitation')}${seriesValue}</span>`

                        const row = `<div class="${styles.chartTooltipItem}">${colorSquare} ${seriesName}</div>`
                        tooltipContent.push(row)
                    })

                    return tooltipContent.join('')
                }
            },
            xAxis: {
                axisLabel: {
                    color: textSecondaryColor, // Color of X-axis labels
                    fontSize: '11px'
                },
                axisLine: { show: false },
                axisTick: { show: false },
                data: labels,
                type: 'category'
            },
            yAxis: {
                axisLabel: {
                    color: textSecondaryColor, // Color of X-axis labels
                    fontSize: '11px'
                },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: {
                    show: true,
                    lineStyle: {
                        width: 1,
                        color: borderColor // Grid line color
                    }
                },
                type: 'value'
            }
        }
    }, [monthlyTotals, i18n.language, backgroundColor, borderColor, t])

    return (
        <div className={styles.widget}>
            <div className={styles.title}>{t('monthly-totals')}</div>
            {loading ? (
                <Skeleton style={{ width: '100%', height: 220 }} />
            ) : (
                <ReactECharts
                    option={monthlyChartOption}
                    style={{ height: '220px', width: '100%' }}
                />
            )}
        </div>
    )
}

export default WidgetPrecipChart
