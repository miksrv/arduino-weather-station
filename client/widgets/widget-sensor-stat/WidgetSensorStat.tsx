import React, { useMemo } from 'react'
import { cn, Icon, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { formatDate } from '@/tools/date'
import { getMinMaxValues, getRecentDelta, isMinMaxEmpty } from '@/tools/weather'

import StatTrendChart from './StatTrendChart'

import styles from './styles.module.sass'

export type WidgetSensorStatProps = Pick<WidgetCardProps, 'title' | 'icon' | 'size' | 'link'> & {
    source: keyof ApiModel.Sensors
    unit?: string
    loading?: boolean
    chartLoading?: boolean
    currentValue?: string | number
    history?: ApiModel.Weather[]
    formatter?: (value: string | number | undefined) => string | number
}

const WidgetSensorStat: React.FC<WidgetSensorStatProps> = ({
    title,
    icon,
    size,
    link,
    source,
    unit,
    loading,
    chartLoading,
    currentValue,
    history,
    formatter
}) => {
    const { t } = useTranslation()

    const minMax = useMemo(() => getMinMaxValues(history, source), [history, source])
    const delta = useMemo(() => getRecentDelta(history, source, 1), [history, source])
    const isHeatSource = source === 'temperature'

    const formatValue = (value?: string | number) => (formatter ? formatter(value) : value)

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
                            (formatValue(currentValue ?? t('no-data')) ?? t('no-data'))
                        )}
                        {unit && !loading && <span>{unit}</span>}
                    </div>

                    {!loading && delta && (
                        <div className={cn(styles.delta, styles[`delta--${delta.direction}`])}>
                            {delta.direction !== 'flat' && (
                                <Icon name={delta.direction === 'down' ? 'ArrowDown' : 'ArrowUp'} />
                            )}
                            <span>
                                {delta.value > 0 ? '+' : ''}
                                {formatValue(delta.value)}
                                {unit}
                            </span>{' '}
                            {t('change-last-hour')}
                        </div>
                    )}
                </div>

                <div className={styles.statsColumn}>
                    <StatBlock
                        title={t('today-max-time', {
                            time: minMax?.max?.date ? formatDate(minMax.max.date, 'HH:mm') : '—'
                        })}
                        modifier={isHeatSource ? 'max' : undefined}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : !minMax || isMinMaxEmpty(minMax) || minMax.max?.value === undefined ? (
                                '—'
                            ) : (
                                <>
                                    {formatValue(minMax.max.value)}
                                    {unit}
                                </>
                            )
                        }
                    />
                    <StatBlock
                        title={t('today-min-time', {
                            time: minMax?.min?.date ? formatDate(minMax.min.date, 'HH:mm') : '—'
                        })}
                        modifier={'min'}
                        value={
                            chartLoading ? (
                                <Skeleton style={{ width: 60, height: 16 }} />
                            ) : !minMax || isMinMaxEmpty(minMax) || minMax.min?.value === undefined ? (
                                '—'
                            ) : (
                                <>
                                    {formatValue(minMax.min.value)}
                                    {unit}
                                </>
                            )
                        }
                    />
                </div>
            </div>

            <div className={styles.chart}>
                {chartLoading ? (
                    <Skeleton style={{ width: '100%', height: 110 }} />
                ) : (
                    <StatTrendChart
                        data={history}
                        source={source}
                    />
                )}
            </div>
        </WidgetCard>
    )
}

export default WidgetSensorStat
