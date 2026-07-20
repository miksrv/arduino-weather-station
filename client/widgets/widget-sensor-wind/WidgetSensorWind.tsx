import React, { useMemo } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { findMaxValue, formatWindDirection, getAverageWindDirection, getRecentAverage } from '@/tools/weather'

import WindCompass from './WindCompass'

import styles from './styles.module.sass'

export type WidgetSensorWindProps = Pick<WidgetCardProps, 'title' | 'icon' | 'size' | 'link'> & {
    loading?: boolean
    chartLoading?: boolean
    windSpeed?: number
    windDeg?: number
    windGust?: number
    history?: ApiModel.Weather[]
}

const WidgetSensorWind: React.FC<WidgetSensorWindProps> = ({
    title,
    icon,
    size,
    link,
    loading,
    chartLoading,
    windSpeed,
    windDeg,
    windGust,
    history
}) => {
    const { t } = useTranslation()
    const unit = t('meters-per-second')

    const avgSpeed = useMemo(() => getRecentAverage(history, 'windSpeed', 10), [history])
    const maxSpeed = useMemo(() => findMaxValue(history, 'windSpeed'), [history])
    const avgDirection = useMemo(() => getAverageWindDirection(history, 10), [history])

    return (
        <WidgetCard
            title={title}
            icon={icon}
            size={size}
            link={link}
        >
            <div className={styles.container}>
                <div className={styles.valueBlock}>
                    <div className={styles.value}>
                        {loading ? (
                            <Skeleton style={{ width: 100, height: 35, marginTop: 10, marginBottom: 5 }} />
                        ) : (
                            (windSpeed ?? t('no-data'))
                        )}
                        {!loading && <span>{unit}</span>}
                    </div>

                    {!loading && <div className={styles.direction}>{formatWindDirection(t, windDeg)}</div>}

                    <div className={styles.gust}>
                        <span>{t('wind-gust-short')}:</span>{' '}
                        <span className={styles.gustValue}>
                            {loading ? (
                                <Skeleton style={{ width: 50, height: 14, display: 'inline-block' }} />
                            ) : windGust !== undefined ? (
                                `${windGust} ${unit}`
                            ) : (
                                '—'
                            )}
                        </span>
                    </div>
                </div>

                <div className={styles.compassWrapper}>
                    {loading ? (
                        <Skeleton style={{ width: 160, height: 160, borderRadius: '50%' }} />
                    ) : (
                        <WindCompass direction={windDeg} />
                    )}
                </div>

                <div className={styles.statsColumn}>
                    <StatBlock
                        title={t('wind-avg-speed')}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : avgSpeed !== undefined ? (
                                `${avgSpeed} ${unit}`
                            ) : (
                                '—'
                            )
                        }
                    />
                    <StatBlock
                        title={t('wind-max-speed')}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : maxSpeed !== undefined ? (
                                `${maxSpeed} ${unit}`
                            ) : (
                                '—'
                            )
                        }
                    />
                    <StatBlock
                        title={t('wind-avg-direction')}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : (
                                formatWindDirection(t, avgDirection)
                            )
                        }
                    />
                </div>
            </div>
        </WidgetCard>
    )
}

export default WidgetSensorWind
