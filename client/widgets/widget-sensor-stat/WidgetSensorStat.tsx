import React, { useMemo } from 'react'
import { cn, Icon, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import StatBlock from '@/components/stat-block'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { formatDate } from '@/tools/date'
import { round, unitSuffix } from '@/tools/helpers'
import { getMeanValue, getMinMaxValues, getRecentDelta, isMinMaxEmpty } from '@/tools/weather'

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
    const mean = useMemo(() => getMeanValue(history, source), [history, source])
    const isHeatSource = source === 'temperature'

    // Readings to one decimal unless the widget formats them itself
    const formatValue = (value?: string | number) =>
        formatter ? formatter(value) : typeof value === 'number' ? round(value, 1) : value

    // A short unit (°C, %) follows each figure; a long one (мм рт. ст.) stays with the main value only, so the
    // three figures fit side by side on a phone
    const statUnit = unit && unit.length <= 3 ? unitSuffix(unit) : ''

    const statValue = (value?: number) =>
        chartLoading ? (
            <Skeleton style={{ width: 60, height: 16 }} />
        ) : value === undefined ? (
            '—'
        ) : (
            <>
                {formatValue(value)}
                {statUnit}
            </>
        )

    const hasMinMax = minMax && !isMinMaxEmpty(minMax)

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
                        <div className={cn(styles.delta, isHeatSource && styles[`delta--${delta.direction}`])}>
                            {delta.direction !== 'flat' && (
                                <Icon name={delta.direction === 'down' ? 'ArrowDown' : 'ArrowUp'} />
                            )}
                            <span>
                                {delta.value > 0 ? '+' : ''}
                                {formatValue(delta.value)}
                                {unitSuffix(unit)}
                            </span>{' '}
                            {t('change-last-hour')}
                        </div>
                    )}
                </div>

                <div className={styles.stats}>
                    <StatBlock
                        title={t('today-max-time', {
                            time: minMax?.max?.date ? formatDate(minMax.max.date, 'HH:mm') : '—'
                        })}
                        modifier={isHeatSource ? 'max' : undefined}
                        value={statValue(hasMinMax ? minMax.max?.value : undefined)}
                    />
                    <StatBlock
                        title={t('today-min-time', {
                            time: minMax?.min?.date ? formatDate(minMax.min.date, 'HH:mm') : '—'
                        })}
                        modifier={'min'}
                        value={statValue(hasMinMax ? minMax.min?.value : undefined)}
                    />
                    <StatBlock
                        title={t('average')}
                        value={statValue(mean)}
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
