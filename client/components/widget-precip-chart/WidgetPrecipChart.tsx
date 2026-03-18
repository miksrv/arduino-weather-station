import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import styles from './styles.module.sass'

interface WidgetPrecipChartProps {
    loading?: boolean
    monthlyTotals?: Array<{ month: number; total: number }>
    locale?: string
}

const MONTH_KEYS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

const WidgetPrecipChart: React.FC<WidgetPrecipChartProps> = ({ loading, monthlyTotals, locale }) => {
    const { t } = useTranslation()

    const monthlyChartOption: EChartsOption = useMemo(() => {
        const totals = monthlyTotals ?? []
        const values = MONTH_KEYS.map((_, idx) => {
            const entry = totals.find((m) => m.month === idx + 1)
            return entry ? entry.total : 0
        })
        const labels = MONTH_KEYS.map((_, idx) => new Date(2000, idx, 1).toLocaleString(locale, { month: 'short' }))
        return {
            grid: { bottom: 20, containLabel: true, left: 0, right: 0, top: 10 },
            series: [
                {
                    barMaxWidth: 32,
                    data: values,
                    itemStyle: { borderRadius: [3, 3, 0, 0], color: '#1a7fd4' },
                    type: 'bar'
                }
            ],
            tooltip: { formatter: '{b}: {c} mm', trigger: 'axis' },
            xAxis: {
                axisLabel: { fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
                data: labels,
                type: 'category'
            },
            yAxis: {
                axisLabel: { fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { opacity: 0.3 } },
                type: 'value'
            }
        }
    }, [monthlyTotals, locale])

    return (
        <div className={styles.widget}>
            <div className={styles.chartTitle}>{t('monthly-totals')}</div>
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
