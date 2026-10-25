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
import { getSensorColor, hexToRgba } from '@/tools/colors'
import { DiurnalHour, getHeatmapUnit } from '@/tools/heatmap'

import styles from './styles.module.sass'

export interface WidgetDiurnalProfileProps {
    type: ApiType.Heatmap.SensorType
    profile?: DiurnalHour[]
    loading?: boolean
}

const CHART_HEIGHT = 260

/**
 * The typical day of the period: the mean of each hour, and the band where 80% of that hour's values
 * fall. A band is drawn as a transparent base (10th percentile) with the 10–90 spread stacked on it.
 */
const WidgetDiurnalProfile: React.FC<WidgetDiurnalProfileProps> = ({ type, profile, loading }) => {
    const { t } = useTranslation()
    const { resolvedTheme: theme } = useTheme()
    const isChance = type === 'precipitation'

    const option: EChartsOption = useMemo(() => {
        const tokens = getChartTokens(theme)
        const color = getSensorColor(type, theme)[0]
        // Precipitation shows the chance of a wet hour, in %
        const unit = isChance ? '%' : getHeatmapUnit(type, t)
        const hours = (profile ?? []).map((item) => `${String(item.hour).padStart(2, '0')}:00`)

        return {
            backgroundColor: 'transparent',
            grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
            tooltip: {
                trigger: 'axis',
                ...getChartTooltipStyle(theme),
                formatter: (params: TopLevelFormatterParams) => {
                    const items = (Array.isArray(params) ? params : [params]) as CallbackDataParams[]
                    const item = profile?.[items[0]?.dataIndex ?? 0]
                    const row = (label: string, value?: number) =>
                        `<div class="${styles.chartTooltipItem}"><span class="${styles.label}">${label}<span class="${styles.value}">${value ?? '—'} ${unit}</span></span></div>`

                    const title = `<div class="${styles.chartTooltipTitle}">${hours[items[0]?.dataIndex ?? 0]}</div>`

                    return isChance
                        ? title + row(t('heatmap-chance'), item?.mean)
                        : title +
                              row(t('heatmap-profile-mean'), item?.mean) +
                              row(t('heatmap-profile-p90'), item?.p90) +
                              row(t('heatmap-profile-p10'), item?.p10)
                }
            },
            xAxis: {
                type: 'category',
                data: hours,
                boundaryGap: false,
                axisLine: { lineStyle: { color: tokens.border } },
                axisTick: { show: false },
                axisLabel: { color: tokens.textSecondary, fontSize: 11, interval: 2 }
            },
            yAxis: {
                type: 'value',
                scale: !isChance,
                ...(isChance && { min: 0 }),
                axisLabel: { color: tokens.textSecondary, fontSize: 11, formatter: `{value} ${unit}` },
                splitLine: { lineStyle: { color: tokens.gridLine } }
            },
            series: [
                {
                    type: 'line',
                    name: 'p10',
                    data: (profile ?? []).map((item) => item.p10 ?? null),
                    stack: 'band',
                    symbol: 'none',
                    lineStyle: { opacity: 0 },
                    silent: true
                },
                {
                    type: 'line',
                    name: 'band',
                    data: (profile ?? []).map((item) =>
                        item.p10 !== undefined && item.p90 !== undefined
                            ? Math.round((item.p90 - item.p10) * 10) / 10
                            : null
                    ),
                    stack: 'band',
                    symbol: 'none',
                    lineStyle: { opacity: 0 },
                    areaStyle: { color: hexToRgba(color, 0.18) },
                    silent: true
                },
                {
                    type: 'line',
                    name: t(isChance ? 'heatmap-chance' : 'heatmap-profile-mean'),
                    data: (profile ?? []).map((item) => item.mean ?? null),
                    smooth: 0.3,
                    ...(isChance && { areaStyle: { color: hexToRgba(color, 0.18) } }),
                    showSymbol: false,
                    lineStyle: { color, width: 2.5 },
                    itemStyle: { color }
                }
            ]
        } as EChartsOption
    }, [profile, type, theme, t, isChance])

    return (
        <WidgetCard
            title={t(isChance ? 'heatmap-chance-title' : 'heatmap-profile-title')}
            size={'x2'}
        >
            <p className={styles.subtitle}>{t(isChance ? 'heatmap-chance-subtitle' : 'heatmap-profile-subtitle')}</p>
            {loading || !profile?.some((item) => item.mean !== undefined) ? (
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

export default WidgetDiurnalProfile
