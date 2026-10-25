import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import EChart from '@/components/echart'
import WidgetCard from '@/components/widget-card'
import { getChartTokens, getChartTooltipStyle } from '@/tools'
import { getSensorColor } from '@/tools/colors'
import { getHeatmapUnit, HistogramBin } from '@/tools/heatmap'

import styles from './styles.module.sass'

export interface WidgetValueDistributionProps {
    type: ApiType.Heatmap.SensorType
    bins?: HistogramBin[]
    loading?: boolean
}

const CHART_HEIGHT = 260

/** How the period's time splits between ranges of values: the share of hours in each bin */
const WidgetValueDistribution: React.FC<WidgetValueDistributionProps> = ({ type, bins, loading }) => {
    const { t } = useTranslation()
    const { resolvedTheme: theme } = useTheme()

    const option: EChartsOption = useMemo(() => {
        const tokens = getChartTokens(theme)
        const unit = getHeatmapUnit(type, t)
        const total = (bins ?? []).reduce((sum, bin) => sum + bin.count, 0) || 1
        const labels = (bins ?? []).map((bin) => `${bin.from}…${bin.to}`)

        return {
            backgroundColor: 'transparent',
            grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...getChartTooltipStyle(theme),
                formatter: (params: TopLevelFormatterParams) => {
                    const item = (Array.isArray(params) ? params[0] : params) as CallbackDataParams
                    const bin = bins?.[item.dataIndex ?? 0]

                    return `<div class="${styles.chartTooltipTitle}">${labels[item.dataIndex ?? 0]} ${unit}</div><div class="${styles.chartTooltipItem}"><span class="${styles.label}">${t('heatmap-distribution-share')}<span class="${styles.value}">${String(item.value)}% · ${bin?.count ?? 0} ${t('heatmap-hours-short')}</span></span></div>`
                }
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLine: { lineStyle: { color: tokens.border } },
                axisTick: { show: false },
                axisLabel: { color: tokens.textSecondary, fontSize: 11, hideOverlap: true }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: tokens.textSecondary, fontSize: 11, formatter: '{value}%' },
                splitLine: { lineStyle: { color: tokens.gridLine } }
            },
            series: [
                {
                    type: 'bar',
                    data: (bins ?? []).map((bin) => Math.round((bin.count / total) * 1000) / 10),
                    barCategoryGap: '12%',
                    itemStyle: { color: getSensorColor(type, theme)[0], borderRadius: [4, 4, 0, 0] }
                }
            ]
        } as EChartsOption
    }, [bins, type, theme, t])

    return (
        <WidgetCard
            title={t('heatmap-distribution-title')}
            size={'x2'}
        >
            <p className={styles.subtitle}>
                {t(type === 'precipitation' ? 'heatmap-distribution-subtitle-wet' : 'heatmap-distribution-subtitle')}
            </p>
            {loading || !bins?.length ? (
                <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
            ) : (
                <EChart
                    option={option}
                    notMerge={true}
                    style={{ height: CHART_HEIGHT, width: '100%' }}
                />
            )}
        </WidgetCard>
    )
}

export default WidgetValueDistribution
