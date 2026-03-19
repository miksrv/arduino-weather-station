import React from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'

import { FloodRiskBars } from './FloodRiskBars'
import { FloodRiskGauge } from './FloodRiskGauge'

import styles from './styles.module.sass'

interface WidgetFloodRiskProps {
    loading?: boolean
    score?: number
    level?: ApiType.Anomaly.RiskLevel
    components?: ApiType.Anomaly.FloodRisk['components']
    season?: ApiType.Anomaly.RiskSeason
}

const WidgetFloodRisk: React.FC<WidgetFloodRiskProps> = ({ loading, score, level, components, season }) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

    if (loading) {
        return (
            <div className={styles.widget}>
                <Skeleton style={{ width: '100%', height: 325 }} />
            </div>
        )
    }

    if (season === 'offseason') {
        return (
            <div className={styles.widget}>
                <div className={styles.offseason}>{t('flood-risk-offseason')}</div>
                <p className={styles.disclaimer}>{t('flood-risk-disclaimer')}</p>
            </div>
        )
    }

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <span className={styles.title}>{t('flood-risk')}</span>
                <span className={cn(styles.levelBadge, styles[`levelBadge--${level}`])}>
                    {t(`flood-risk-${level}`)}
                </span>
            </div>
            <FloodRiskGauge
                score={score ?? 0}
                level={level ?? 'low'}
                theme={theme}
            />
            <FloodRiskBars
                components={components!}
                level={level ?? 'low'}
            />
            <p className={styles.disclaimer}>{t('flood-risk-disclaimer')}</p>
        </div>
    )
}

export default WidgetFloodRisk
