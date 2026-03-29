import React from 'react'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'

import { clampContribution, getRiskLevelColor } from './utils'

import styles from './styles.module.sass'

type ComponentKey = keyof ApiType.Anomaly.FloodRisk['components']

const COMPONENT_I18N_KEYS: Record<ComponentKey, string> = {
    sweAnomaly: 'risk-component-swe-anomaly',
    meltRate: 'risk-component-melt-rate',
    rainOnSnowDays: 'risk-component-rain-on-snow',
    precipAnomaly: 'risk-component-precip-anomaly',
    temperatureTrend: 'risk-component-temp-trend'
}

const COMPONENT_ORDER: ComponentKey[] = [
    'sweAnomaly',
    'meltRate',
    'rainOnSnowDays',
    'precipAnomaly',
    'temperatureTrend'
]

interface FloodRiskBarsProps {
    components: ApiType.Anomaly.FloodRisk['components']
    level: ApiType.Anomaly.RiskLevel
}

export const FloodRiskBars: React.FC<FloodRiskBarsProps> = ({ components, level }) => {
    const { t } = useTranslation()
    const colorVar = getRiskLevelColor(level)

    return (
        <div className={styles.bars}>
            {COMPONENT_ORDER.map((key) => {
                const comp = components[key]
                const widthPct = clampContribution(comp.contribution)
                return (
                    <div
                        key={key}
                        className={styles.barRow}
                    >
                        <span className={styles.barLabel}>{t(COMPONENT_I18N_KEYS[key])}</span>
                        <div className={styles.barTrack}>
                            <div
                                className={styles.barFill}
                                style={{ width: `${widthPct}%`, backgroundColor: colorVar }}
                            />
                        </div>
                        <span className={styles.barValue}>+{comp.contribution}</span>
                    </div>
                )
            })}
        </div>
    )
}
