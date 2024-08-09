import React from 'react'

import styles from './styles.module.sass'

import { formatDate } from '@/tools/helpers'
import { MinMaxResult } from '@/tools/weather'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'

interface WidgetProps {
    title?: string
    unit?: string
    icon?: IconTypes
    currentValue?: string | number
    minMax?: MinMaxResult
    chart?: React.ReactNode
}

const Widget: React.FC<WidgetProps> = ({ title, icon, currentValue, minMax, unit, chart }) => (
    <div className={styles.widget}>
        <div className={styles.content}>
            <div className={styles.header}>
                <h3>{title}</h3>
                {icon && <Icon name={icon} />}
            </div>
            <div className={styles.value}>
                {currentValue || '??'}
                {unit && <span>{unit}</span>}
            </div>
            {minMax && (
                <div className={styles.statsContainer}>
                    <div className={styles.block}>
                        <span className={styles.title}>Min</span>
                        <span>
                                {minMax?.min?.value}
                            {unit && <span>{unit}</span>}
                            </span>
                        <span>{formatDate(minMax?.min?.date, 'HH:mm')}</span>
                    </div>
                    <div className={styles.block}>
                        <span className={styles.title}>Max</span>
                        <span>
                                {minMax?.max?.value}
                            {unit && <span>{unit}</span>}
                            </span>
                        <span>{formatDate(minMax?.min?.date, 'HH:mm')}</span>
                    </div>
                </div>
            )}
            {chart && <div className={styles.chart}>{chart}</div>}
        </div>
    </div>
)

export default Widget
