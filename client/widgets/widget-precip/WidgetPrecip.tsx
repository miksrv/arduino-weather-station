import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'

import PrecipTrendChart from './PrecipTrendChart'

import styles from './styles.module.sass'

export type WidgetPrecipProps = Pick<WidgetCardProps, 'title' | 'icon' | 'size' | 'link'> & {
    loading?: boolean
    chartLoading?: boolean
    todayTotal?: number
    last24hTotal?: number
    last7dTotal?: number
    history?: ApiModel.Weather[]
}

const WidgetPrecip: React.FC<WidgetPrecipProps> = ({
    title,
    icon,
    size,
    link,
    loading,
    chartLoading,
    todayTotal,
    last24hTotal,
    last7dTotal,
    history
}) => {
    const { t } = useTranslation()
    const unit = t('millimeters')

    return (
        <WidgetCard
            title={title}
            icon={icon}
            size={size}
            link={link}
        >
            <div className={styles.valueRow}>
                <div className={styles.valueBlock}>
                    <div className={styles.value}>
                        {loading ? (
                            <Skeleton style={{ width: 100, height: 35, marginTop: 10, marginBottom: 5 }} />
                        ) : (
                            (todayTotal ?? t('no-data'))
                        )}
                        {!loading && <span>{unit}</span>}
                    </div>
                    {!loading && <div className={styles.todayLabel}>{t('today')}</div>}
                </div>

                <div className={styles.statsColumn}>
                    <StatBlock
                        title={t('precip-24h')}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : last24hTotal !== undefined ? (
                                `${last24hTotal} ${unit}`
                            ) : (
                                '—'
                            )
                        }
                    />
                    <StatBlock
                        title={t('precip-7d')}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : last7dTotal !== undefined ? (
                                `${last7dTotal} ${unit}`
                            ) : (
                                '—'
                            )
                        }
                    />
                </div>
            </div>

            <div className={styles.chart}>
                {chartLoading ? (
                    <Skeleton style={{ width: '100%', height: 110 }} />
                ) : (
                    <PrecipTrendChart data={history} />
                )}
            </div>
        </WidgetCard>
    )
}

export default WidgetPrecip
