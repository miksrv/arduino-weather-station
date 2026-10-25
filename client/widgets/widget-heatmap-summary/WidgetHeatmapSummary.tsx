import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import { formatDate } from '@/tools/date'
import { getHeatmapUnit, HeatmapStats } from '@/tools/heatmap'
import { unitSuffix } from '@/tools/helpers'

import styles from './styles.module.sass'

export interface WidgetHeatmapSummaryProps {
    type: ApiType.Heatmap.SensorType
    stats?: HeatmapStats
    loading?: boolean
}

interface Figure {
    label: string
    value: string
    note?: string
    accent?: 'max' | 'min'
}

/**
 * The period in four figures above the map. A level (temperature, pressure, humidity, clouds) reads as
 * mean, extremes with their time and the typical daily swing; precipitation as totals and the wettest day.
 */
const WidgetHeatmapSummary: React.FC<WidgetHeatmapSummaryProps> = ({ type, stats, loading }) => {
    const { t } = useTranslation()

    const unit = unitSuffix(getHeatmapUnit(type, t))
    const when = (date: string) => formatDate(date, t('heatmap-extreme-date-format'))

    const figures: Figure[] = !stats
        ? []
        : type === 'precipitation'
          ? [
                { label: t('heatmap-total'), value: `${stats.total}${unit}` },
                { label: t('heatmap-max-hour'), value: `${stats.max.value}${unit}`, note: when(stats.max.date) },
                { label: t('heatmap-wet-days'), value: `${stats.wetDays}` },
                {
                    label: t('heatmap-wettest-day'),
                    value: stats.wettestDay ? `${stats.wettestDay.value}${unit}` : '—',
                    note: stats.wettestDay ? formatDate(stats.wettestDay.date, t('date-day-month')) : undefined
                }
            ]
          : [
                { label: t('heatmap-mean'), value: `${stats.mean}${unit}` },
                {
                    label: t('heatmap-max'),
                    value: `${stats.max.value}${unit}`,
                    note: when(stats.max.date),
                    accent: 'max'
                },
                {
                    label: t('heatmap-min'),
                    value: `${stats.min.value}${unit}`,
                    note: when(stats.min.date),
                    accent: 'min'
                },
                {
                    label: t('heatmap-daily-range'),
                    value: `${stats.meanDailyRange}${unit}`,
                    note: t('heatmap-daily-range-note')
                }
            ]

    return (
        <>
            {(loading || !stats ? Array.from({ length: 4 }, () => undefined) : figures).map((figure, index) => (
                <div
                    key={figure?.label ?? index}
                    className={styles.card}
                >
                    {figure ? (
                        <>
                            <span className={styles.label}>{figure.label}</span>
                            <span className={figure.accent ? styles[figure.accent] : styles.value}>{figure.value}</span>
                            <span className={styles.note}>{figure.note ?? ' '}</span>
                        </>
                    ) : (
                        <Skeleton style={{ width: '100%', height: 64 }} />
                    )}
                </div>
            ))}
        </>
    )
}

export default WidgetHeatmapSummary
