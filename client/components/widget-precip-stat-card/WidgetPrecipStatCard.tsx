import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

interface StatCardProps {
    loading: boolean
    title: string
    value: string | number
    sub?: string
}

const WidgetPrecipStatCard: React.FC<StatCardProps> = ({ loading, title, value, sub }) => (
    <div className={styles.statCard}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: 80 }} />
        ) : (
            <>
                <div className={styles.statTitle}>{title}</div>
                <div className={styles.statValue}>{value}</div>
                {sub && <div className={styles.statSub}>{sub}</div>}
            </>
        )}
    </div>
)

export default WidgetPrecipStatCard
