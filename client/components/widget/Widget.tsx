import React from 'react'

import styles from './styles.module.sass'

interface WidgetProps {
    title: string;
    currentValue?: string | number;
    minValue?: string | number;
    maxValue?: string | number;
    minTime?: string;
    maxTime?: string;
    unit?: string;
    chart?: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ title, currentValue, minValue, maxValue, minTime, maxTime, unit, chart }) => {
    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h3>{title}</h3>
                <span>{currentValue || '??'}{unit && <span>{unit}</span>}</span>
            </div>
            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span>Min</span>
                    <span>{minValue}{unit && <span>{unit}</span>}</span>
                    <span>{minTime}</span>
                </div>
                <div className={styles.stat}>
                    <span>Max</span>
                    <span>{maxValue}{unit && <span>{unit}</span>}</span>
                    <span>{maxTime}</span>
                </div>
            </div>
            {chart && <div className={styles.chart}>{chart}</div>}
        </div>
    )
}

export default Widget
