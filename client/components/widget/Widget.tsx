import React from 'react'

import styles from './styles.module.sass'

import { formatDate } from '@/tools/helpers'
import { MinMaxResult } from '@/tools/weather'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'
import Skeleton from '@/ui/skeleton'

interface WidgetProps {
    title?: string
    unit?: string
    icon?: IconTypes
    loading?: boolean
    chartLoading?: boolean
    currentValue?: string | number
    minMax?: MinMaxResult
    chart?: React.ReactNode
}

const Widget: React.FC<WidgetProps> = ({ title, icon, loading, chartLoading, currentValue, minMax, unit, chart }) => (
    <div className={styles.widget}>
        <div className={styles.content}>
            <div className={styles.header}>
                <h3>{title}</h3>
                {icon && <Icon name={icon} />}
            </div>
            <div className={styles.value}>
                {loading ? (
                    <Skeleton style={{ width: 100, height: 35, marginTop: 10, marginBottom: 5 }} />
                ) : (
                    currentValue || '??'
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
                                    {minMax?.min?.value}
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
                                    {minMax?.max?.value}
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
    </div>
)

export default Widget
