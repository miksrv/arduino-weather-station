import React, { useMemo } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'

import { getCellColor, isLeapYear } from './utils'

import styles from './styles.module.sass'

interface WidgetPrecipCalendarProps {
    loading?: boolean
    year?: number
    days?: ApiType.Precipitation.PrecipDay[]
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_NUMBERS = Array.from({ length: 31 }, (_, i) => i + 1)

const WidgetPrecipCalendar: React.FC<WidgetPrecipCalendarProps> = ({ loading, year, days }) => {
    const { t } = useTranslation()

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

                {MONTH_ABBRS.map((abbr, monthIndex) => {
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
                                const title = hasData ? `${dateKey}: ${cellTotal.toFixed(1)} mm` : dateKey

                                return (
                                    <div
                                        key={day}
                                        className={styles.cell}
                                        style={{ backgroundColor: color }}
                                        title={title}
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
        </div>
    )
}

export default WidgetPrecipCalendar
