import React, { useMemo, useState } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'
import { formatDate } from '@/tools/date'

import { getCellColor, isLeapYear } from './utils'

import styles from './styles.module.sass'

interface TooltipState {
    x: number
    y: number
    date: string
    total: number
}

interface WidgetPrecipCalendarProps {
    loading?: boolean
    year?: number
    days?: ApiType.Precipitation.PrecipDay[]
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const DAY_NUMBERS = Array.from({ length: 31 }, (_, i) => i + 1)

const WidgetPrecipCalendar: React.FC<WidgetPrecipCalendarProps> = ({ loading, year, days }) => {
    const { i18n, t } = useTranslation()

    const monthAbbrs = useMemo(
        () => Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString(i18n.language, { month: 'short' })),
        [i18n.language]
    )
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, dateKey: string, cellTotal: number) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date: dateKey, total: cellTotal })
    }

    const handleMouseLeave = () => {
        setTooltip(null)
    }

    const dayMap = useMemo<Map<string, number>>(() => {
        const map = new Map<string, number>()
        if (!days) {
            return map
        }

        for (const d of days) {
            map.set(d.date, d.total)
        }

        return map
    }, [days])

    if (loading) {
        return (
            <div className={styles.widget}>
                <Skeleton style={{ width: '100%', height: 260 }} />
            </div>
        )
    }

    const currentYear = year ?? new Date().getFullYear()
    const febDays = isLeapYear(currentYear) ? 29 : 28
    const daysInMonth = [...MONTH_DAYS]
    daysInMonth[1] = febDays

    return (
        <div className={styles.widget}>
            <div className={styles.grid}>
                <div className={styles.headerRow}>
                    <div className={styles.monthLabel} />
                    {DAY_NUMBERS.map((d) => (
                        <div
                            key={d}
                            className={styles.dayHeader}
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {monthAbbrs.map((abbr, monthIndex) => {
                    const maxDays = daysInMonth[monthIndex]
                    return (
                        <div
                            key={abbr}
                            className={styles.monthRow}
                        >
                            <div className={styles.monthLabel}>{abbr}</div>
                            {DAY_NUMBERS.map((day) => {
                                if (day > maxDays) {
                                    return (
                                        <div
                                            key={day}
                                            className={styles.cellEmpty}
                                        />
                                    )
                                }
                                const mm = String(monthIndex + 1).padStart(2, '0')
                                const dd = String(day).padStart(2, '0')
                                const dateKey = `${currentYear}-${mm}-${dd}`
                                const total = dayMap.get(dateKey)
                                const hasData = total != null
                                const cellTotal = total ?? 0
                                const color = hasData ? getCellColor(cellTotal) : 'var(--input-border-color)'

                                return (
                                    <div
                                        key={day}
                                        className={styles.cell}
                                        style={{ backgroundColor: color }}
                                        onMouseEnter={(e) => handleMouseEnter(e, dateKey, cellTotal)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: 'var(--input-border-color)' }}
                    />
                    <span className={styles.legendLabel}>{t('dry-days')}</span>
                </div>

                <div className={styles.legendItem}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: '#cce5ff' }}
                    />
                    <span className={styles.legendLabel}>{t('precip-level-trace')}</span>
                </div>

                <div className={styles.legendItem}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: '#66b2ff' }}
                    />
                    <span className={styles.legendLabel}>{t('precip-level-light')}</span>
                </div>

                <div className={styles.legendItem}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: '#1a7fd4' }}
                    />
                    <span className={styles.legendLabel}>{t('precip-level-moderate')}</span>
                </div>

                <div className={styles.legendItem}>
                    <span
                        className={styles.legendSwatch}
                        style={{ backgroundColor: '#004080' }}
                    />
                    <span className={styles.legendLabel}>{t('precip-level-heavy')}</span>
                </div>
            </div>

            {tooltip && (
                <div
                    className={styles.tooltip}
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className={styles.tooltipDate}>{formatDate(tooltip.date, t('date-no-time'))}</div>
                    <div className={styles.tooltipValue}>{tooltip.total.toFixed(1)} mm</div>
                </div>
            )}
        </div>
    )
}

export default WidgetPrecipCalendar
