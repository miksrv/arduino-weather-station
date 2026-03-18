import React from 'react'
import { Icon, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { formatDate } from '@/tools/date'

import styles from './styles.module.sass'

interface WidgetStreakCardProps {
    loading?: boolean
    type: 'wet' | 'dry'
    days: number
    start: string
    end: string
}

const WidgetStreakCard: React.FC<WidgetStreakCardProps> = ({ loading, type, days, start, end }) => {
    const { t } = useTranslation()

    if (loading) {
        return (
            <div className={styles.card}>
                <Skeleton style={{ width: '100%', height: 80 }} />
            </div>
        )
    }

    const title = type === 'wet' ? t('longest-wet-streak') : t('longest-dry-streak')
    const icon = type === 'wet' ? 'WaterDrop' : 'Sun'
    const startFormatted = formatDate(start, 'DD MMM')
    const endFormatted = formatDate(end, 'DD MMM')

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.iconWrapper}>
                    <Icon name={icon} />
                </span>
                <span className={styles.title}>{title}</span>
            </div>
            <div className={styles.value}>{t('days-count', { count: days })}</div>
            <div className={styles.range}>
                {startFormatted} – {endFormatted}
            </div>
        </div>
    )
}

export default WidgetStreakCard
