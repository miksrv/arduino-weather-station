import React, { useMemo, useState } from 'react'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'
import { formatDate } from '@/tools/date'

import { formatDateStr, getIntensityClass, isFutureDate } from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyCalendarProps {
    data: ApiType.Anomaly.AnomalyCalendarPoint[]
}

const WEEKS = 52
const DAYS_PER_WEEK = 7
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK

interface TooltipState {
    x: number
    y: number
    date: string
    count: number
    types: string[]
}

const WidgetAnomalyCalendar: React.FC<WidgetAnomalyCalendarProps> = ({ data }) => {
    const { t } = useTranslation()
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)

    const today = useMemo(() => new Date(), [])

    const dataMap = useMemo(() => {
        const map = new Map<string, { count: number; types: string[] }>()
        data.forEach((d) => map.set(d.date, { count: d.activeCount, types: d.types }))
        return map
    }, [data])

    const gridStart = useMemo(() => {
        const start = new Date(today)
        start.setDate(start.getDate() - TOTAL_DAYS + 1)
        return start
    }, [today])

    const cells = useMemo(() => {
        return Array.from({ length: TOTAL_DAYS }, (_, i) => {
            const cellDate = new Date(gridStart)
            cellDate.setDate(gridStart.getDate() + i)
            const dateStr = formatDateStr(cellDate)
            const future = isFutureDate(cellDate, today)
            const entry = dataMap.get(dateStr)
            const count = future ? 0 : (entry?.count ?? 0)
            const types = future ? [] : (entry?.types ?? [])
            return { dateStr, count, types, isFuture: future }
        })
    }, [gridStart, today, dataMap])

    const monthLabels = useMemo(() => {
        const labels: Array<{ label: string; weekIndex: number }> = []
        let prevMonth = -1
        for (let w = 0; w < WEEKS; w++) {
            const cellIndex = w * DAYS_PER_WEEK
            const cellDate = new Date(gridStart)
            cellDate.setDate(gridStart.getDate() + cellIndex)
            const month = cellDate.getMonth()
            if (month !== prevMonth) {
                labels.push({
                    label: cellDate.toLocaleString('en', { month: 'short' }),
                    weekIndex: w
                })
                prevMonth = month
            }
        }
        return labels
    }, [gridStart])

    const handleMouseEnter = (
        e: React.MouseEvent<HTMLDivElement>,
        dateStr: string,
        count: number,
        types: string[],
        future: boolean
    ) => {
        if (future) {
            return
        }
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date: dateStr, count, types })
    }

    const handleMouseLeave = () => {
        setTooltip(null)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.monthLabels}>
                {monthLabels.map(({ label, weekIndex }) => (
                    <span
                        key={`${label}-${weekIndex}`}
                        className={styles.monthLabel}
                        style={{ gridColumnStart: weekIndex + 1 }}
                    >
                        {label}
                    </span>
                ))}
            </div>

            <div className={styles.grid}>
                {cells.map(({ dateStr, count, types, isFuture }) => (
                    <div
                        key={dateStr}
                        className={isFuture || count === 0 ? styles.cell : styles[getIntensityClass(count)]}
                        onMouseEnter={(e) => handleMouseEnter(e, dateStr, count, types, isFuture)}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}
            </div>

            {tooltip && (
                <div
                    className={styles.tooltip}
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className={styles.tooltipDate}>{formatDate(tooltip.date, t('date-no-time'))}</div>
                    <div className={styles.tooltipCount}>
                        {t('anomaly-calendar-tooltip')}
                        {': '}
                        {tooltip.count}
                    </div>

                    {tooltip.types.length > 0 && (
                        <ul className={styles.tooltipList}>
                            {tooltip.types.map((type, idx) => (
                                <li key={idx}>{t(`anomaly-${anomalyTypeToI18nKey(type as string)}`, type)}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

export const anomalyTypeToI18nKey = (type: string): string => type.replace(/_/g, '-')

export default WidgetAnomalyCalendar
