import React from 'react'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'

import { FloodRiskBars } from './FloodRiskBars'
import { FloodRiskGauge } from './FloodRiskGauge'

import styles from './styles.module.sass'

interface WidgetFloodRiskProps {
    score: number
    level: ApiType.Anomaly.RiskLevel
    components: ApiType.Anomaly.FloodRisk['components']
    season: ApiType.Anomaly.RiskSeason
}

const WidgetFloodRisk: React.FC<WidgetFloodRiskProps> = ({ score, level, components, season }) => {
    const { t } = useTranslation()
    const { theme } = useTheme()

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
                <span className={`${styles.levelBadge} ${styles[`levelBadge--${level}`]}`}>
                    {t(`flood-risk-${level}`)}
                </span>
            </div>
            <FloodRiskGauge
                score={score}
                level={level}
                theme={theme}
            />
            <FloodRiskBars
                components={components}
                level={level}
            />
            <p className={styles.disclaimer}>{t('flood-risk-disclaimer')}</p>
        </div>
    )
}

export default WidgetFloodRisk
