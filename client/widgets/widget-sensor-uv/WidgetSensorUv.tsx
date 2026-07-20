import React, { useMemo } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { formatDate } from '@/tools/date'
import { getMinMaxValues, getUvCategory } from '@/tools/weather'

import UvScale from './UvScale'

import styles from './styles.module.sass'

export type WidgetSensorUvProps = Pick<WidgetCardProps, 'title' | 'icon' | 'size' | 'link'> & {
    loading?: boolean
    chartLoading?: boolean
    value?: number
    history?: ApiModel.Weather[]
}

const WidgetSensorUv: React.FC<WidgetSensorUvProps> = ({
    title,
    icon,
    size,
    link,
    loading,
    chartLoading,
    value,
    history
}) => {
    const { t } = useTranslation()

    const category = useMemo(() => getUvCategory(value), [value])
    const todayMax = useMemo(() => getMinMaxValues(history, 'uvIndex').max, [history])

    return (
        <WidgetCard
            title={title}
            icon={icon}
            size={size}
            link={link}
        >
            <div className={styles.value}>
                {loading ? (
                    <Skeleton style={{ width: 60, height: 35, marginTop: 10, marginBottom: 5 }} />
                ) : (
                    (value ?? t('no-data'))
                )}
            </div>

            {!loading && <div className={styles.category}>{t(`uv-category-${category}`)}</div>}

            <div className={styles.scale}>
                {chartLoading ? <Skeleton style={{ width: '100%', height: 30 }} /> : <UvScale value={value} />}
            </div>

            <div className={styles.statsRow}>
                <StatBlock
                    align={'start'}
                    title={t('today-max')}
                    value={
                        chartLoading ? (
                            <Skeleton style={{ width: 30, height: 16 }} />
                        ) : todayMax?.value !== undefined ? (
                            todayMax.value
                        ) : (
                            '—'
                        )
                    }
                />
                <StatBlock
                    align={'start'}
                    title={t('uv-peak-time')}
                    value={
                        chartLoading ? (
                            <Skeleton style={{ width: 50, height: 16 }} />
                        ) : todayMax?.date ? (
                            formatDate(todayMax.date, 'HH:mm')
                        ) : (
                            '—'
                        )
                    }
                />
            </div>
        </WidgetCard>
    )
}

export default WidgetSensorUv
