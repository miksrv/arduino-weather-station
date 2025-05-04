import React from 'react'
import { Icon, IconTypes, Skeleton } from 'simple-react-ui-kit'

import Link from 'next/link'

import { formatDate } from '@/tools/date'
import { MinMaxResult } from '@/tools/weather'

import styles from './styles.module.sass'

export interface WidgetSensorProps {
    title?: string
    unit?: string
    icon?: IconTypes
    loading?: boolean
    chartLoading?: boolean
    currentValue?: string | number
    link?: React.AnchorHTMLAttributes<HTMLAnchorElement>
    minMax?: MinMaxResult
    formatter?: (value: string | number | undefined) => string | number
    chart?: React.ReactNode
}

const WidgetSensor: React.FC<WidgetSensorProps> = ({
    title,
    icon,
    loading,
    chartLoading,
    currentValue,
    minMax,
    link,
    unit,
    formatter,
    chart
}) => (
    <div className={styles.widget}>
        <div className={styles.header}>
            <h3>
                {link ? (
                    <Link
                        href={link?.href || ''}
                        {...link}
                    >
                        {title}
                    </Link>
                ) : (
                    title
                )}
            </h3>
            {icon && <Icon name={icon} />}
        </div>
        <div className={styles.value}>
            {loading ? (
                <Skeleton style={{ width: 100, height: 35, marginTop: 10, marginBottom: 5 }} />
            ) : formatter ? (
                formatter(currentValue ?? '??')
            ) : (
                (currentValue ?? '??')
            )}
            {unit && !loading && <span>{unit}</span>}
        </div>
        {minMax && (
            <div className={styles.statsContainer}>
                <div className={styles.block}>
                    <span className={styles.title}>Min</span>
                    <span>
                        {chartLoading ? (
                            <Skeleton style={{ width: 40, height: 15, marginTop: 2 }} />
                        ) : (
                            <>
                                {formatter ? formatter(minMax?.min?.value ?? '??') : (minMax?.min?.value ?? '??')}
                                {unit && <span>{unit}</span>}
                            </>
                        )}
                    </span>
                    <span>
                        {chartLoading ? (
                            <Skeleton style={{ width: 40, height: 15, marginTop: 5 }} />
                        ) : (
                            formatDate(minMax?.min?.date, 'HH:mm')
                        )}
                    </span>
                </div>
                <div className={styles.block}>
                    <span className={styles.title}>Max</span>
                    <span>
                        {chartLoading ? (
                            <Skeleton style={{ width: 40, height: 15, marginTop: 2 }} />
                        ) : (
                            <>
                                {formatter ? formatter(minMax?.max?.value ?? '??') : (minMax?.max?.value ?? '??')}
                                {unit && <span>{unit}</span>}
                            </>
                        )}
                    </span>
                    <span>
                        {chartLoading ? (
                            <Skeleton style={{ width: 40, height: 15, marginTop: 5 }} />
                        ) : (
                            formatDate(minMax?.max?.date, 'HH:mm')
                        )}
                    </span>
                </div>
            </div>
        )}
        {chart && (
            <div className={styles.chart}>
                {chartLoading ? <Skeleton style={{ width: '100%', height: 54 }} /> : chart}
            </div>
        )}
    </div>
)

export default WidgetSensor
