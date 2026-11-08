import React, { useMemo, useState } from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import { anomalyTypeToI18nKey } from '@/tools/conditions'
import { formatDate, getCurrentDate } from '@/tools/date'

import { getCalendarDays, getIntensityClass, getMonthLabels } from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyCalendarProps {
    loading?: boolean
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

const WidgetAnomalyCalendar: React.FC<WidgetAnomalyCalendarProps> = ({ loading, data }) => {
    const { i18n, t } = useTranslation()
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)

    // The station's today, as on the server: both renders build the same grid
    const today = getCurrentDate().format('YYYY-MM-DD')

    const dataMap = useMemo(() => {
        const map = new Map<string, { count: number; types: string[] }>()
        data.forEach((d) => map.set(d.date, { count: d.activeCount, types: d.types }))
        return map
    }, [data])

    const days = useMemo(() => getCalendarDays(today, TOTAL_DAYS), [today])

    const cells = useMemo(
        () =>
            days.map((dateStr) => {
                const entry = dataMap.get(dateStr)
                return { dateStr, count: entry?.count ?? 0, types: entry?.types ?? [] }
            }),
        [days, dataMap]
    )

    const monthLabels = useMemo(() => getMonthLabels(days, DAYS_PER_WEEK, i18n.language), [days, i18n.language])

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, dateStr: string, count: number, types: string[]) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date: dateStr, count, types })
    }

    const handleMouseLeave = () => {
        setTooltip(null)
    }

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <Skeleton style={{ width: '100%', height: 120 }} />
            </div>
        )
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
                {cells.map(({ dateStr, count, types }) => (
                    <div
                        key={dateStr}
                        className={cn(count === 0 ? styles.cell : styles[getIntensityClass(count)])}
                        onMouseEnter={(e) => handleMouseEnter(e, dateStr, count, types)}
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

export default WidgetAnomalyCalendar
