import React, { useMemo, useState } from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'

import { COLD_COLOR, getContrastColor, HOT_COLOR, MID_COLOR, tempToColor } from './utils'

import styles from './styles.module.sass'

interface WidgetWarmingStripesProps {
    data?: ApiType.Climate.ClimateYearStat[]
    loading?: boolean
}

const WidgetWarmingStripes: React.FC<WidgetWarmingStripesProps> = ({ data, loading }) => {
    const { t } = useTranslation()
    const [hoveredYear, setHoveredYear] = useState<number | null>(null)

    const { stripes, minTemp, maxTemp, avgTemp } = useMemo(() => {
        if (!data?.length) {
            return { stripes: [], minTemp: 0, maxTemp: 0, avgTemp: 0 }
        }

        // The running year misses the cold months: it is shown, but the scale and the extremes come from full years
        const complete = data.filter((d) => !d.isPartial)
        const temps = (complete.length ? complete : data).map((d) => d.avgTemp)
        const min = Math.min(...temps)
        const max = Math.max(...temps)
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length

        return {
            avgTemp: avg,
            maxTemp: max,
            minTemp: min,
            stripes: data.map((d) => ({
                avgTemp: d.avgTemp,
                color: d.isPartial ? undefined : tempToColor(d.avgTemp, min, max),
                textColor: d.isPartial ? undefined : getContrastColor(d.avgTemp, min, max),
                anomaly: d.avgTemp - avg,
                isPartial: !!d.isPartial,
                year: d.year
            }))
        }
    }, [data])

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.title}>{t('warming-stripes')}</div>
                <Skeleton style={{ height: 140, width: '100%', marginTop: 10 }} />
            </div>
        )
    }

    const fullYears = stripes.filter((s) => !s.isPartial)
    const coldestYear = fullYears.length ? fullYears.reduce((a, b) => (a.avgTemp < b.avgTemp ? a : b)) : null
    const hottestYear = fullYears.length ? fullYears.reduce((a, b) => (a.avgTemp > b.avgTemp ? a : b)) : null

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className={styles.title}>{t('warming-stripes')}</div>
                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        <span className={styles.statLabel}>{t('average')}:</span>
                        <span className={styles.statValue}>{avgTemp.toFixed(1)}°C</span>
                    </span>

                    {coldestYear && (
                        <span className={styles.statItem}>
                            <span className={styles.statLabel}>{t('coldest')}:</span>
                            <span
                                className={styles.statValue}
                                style={{ color: COLD_COLOR }}
                            >
                                {coldestYear.year} ({coldestYear.avgTemp.toFixed(1)}°C)
                            </span>
                        </span>
                    )}

                    {hottestYear && (
                        <span className={styles.statItem}>
                            <span className={styles.statLabel}>{t('hottest')}:</span>
                            <span
                                className={styles.statValue}
                                style={{ color: HOT_COLOR }}
                            >
                                {hottestYear.year} ({hottestYear.avgTemp.toFixed(1)}°C)
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <div
                className={styles.stripesContainer}
                onMouseLeave={() => setHoveredYear(null)}
            >
                {stripes.map((s) => (
                    <div
                        key={s.year}
                        className={cn(
                            styles.stripe,
                            hoveredYear === s.year && styles.stripeActive,
                            s.isPartial && styles.stripePartial
                        )}
                        style={{ backgroundColor: s.color }}
                        onMouseEnter={() => setHoveredYear(s.year)}
                    >
                        <span
                            className={styles.stripeYear}
                            style={{ color: s.textColor }}
                        >
                            {s.year}
                        </span>
                        <span
                            className={styles.stripeTemp}
                            style={{ color: s.textColor }}
                        >
                            {s.avgTemp.toFixed(1)}°
                        </span>
                        <span
                            className={styles.stripeAnomaly}
                            style={{ color: s.textColor }}
                        >
                            {s.isPartial ? (
                                t('year-to-date')
                            ) : (
                                <>
                                    {s.anomaly >= 0 ? '+' : ''}
                                    {s.anomaly.toFixed(1)}°
                                </>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.legend}>
                <span style={{ color: COLD_COLOR }}>{minTemp.toFixed(1)}°C</span>
                <div
                    className={styles.legendGradient}
                    style={{ background: `linear-gradient(to right, ${COLD_COLOR}, ${MID_COLOR}, ${HOT_COLOR})` }}
                />
                <span style={{ color: HOT_COLOR }}>{maxTemp.toFixed(1)}°C</span>
            </div>
        </div>
    )
}

export default WidgetWarmingStripes
