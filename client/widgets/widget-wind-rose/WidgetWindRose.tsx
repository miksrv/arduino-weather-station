import React, { useMemo } from 'react'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { findMaxValue, formatWindDirection } from '@/tools/weather'

import { computeWindRose } from './utils'
import WindRoseChart from './WindRoseChart'
import WindSpeedLegend from './WindSpeedLegend'

import styles from './styles.module.sass'

export type WidgetWindRoseProps = Pick<WidgetCardProps, 'title' | 'icon' | 'size' | 'link'> & {
    loading?: boolean
    history?: ApiModel.Weather[]
}

const WidgetWindRose: React.FC<WidgetWindRoseProps> = ({ title, icon, size, link, loading, history }) => {
    const { t } = useTranslation()
    const unit = t('meters-per-second')

    const windRose = useMemo(() => computeWindRose(history), [history])
    const maxGust = useMemo(() => findMaxValue(history, 'windGust'), [history])

    return (
        <WidgetCard
            title={title}
            icon={icon}
            size={size}
            link={link}
            loading={loading}
            loadingHeight={170}
        >
            <div className={styles.container}>
                <div className={styles.chartColumn}>
                    <WindRoseChart directionBins={windRose.directionBins} />
                </div>

                <div className={styles.statsColumn}>
                    <StatBlock
                        align={'start'}
                        title={t('wind-prevailing-direction')}
                        value={formatWindDirection(t, windRose.prevailingDegrees)}
                    />
                    <StatBlock
                        align={'start'}
                        title={t('wind-average-speed-24h')}
                        value={windRose.averageSpeed !== undefined ? `${windRose.averageSpeed} ${unit}` : '—'}
                    />
                    <StatBlock
                        align={'start'}
                        title={t('wind-max-gust')}
                        value={maxGust !== undefined ? `${maxGust} ${unit}` : '—'}
                    />

                    <WindSpeedLegend unit={unit} />
                </div>
            </div>
        </WidgetCard>
    )
}

export default WidgetWindRose
