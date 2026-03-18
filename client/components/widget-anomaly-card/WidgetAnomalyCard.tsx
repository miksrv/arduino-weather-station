import React from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { formatDate } from '@/tools/date'

import {
    anomalyIdToI18nKey,
    formatExtraMetricValue,
    getExtraMetricI18nKey,
    getZScoreInterpretation,
    getZScoreSign
} from './utils'
import { ZScoreBar } from './ZSCoreBar'

import styles from './styles.module.sass'

interface WidgetAnomalyCardProps {
    loading?: boolean
    fullWidth?: boolean
    anomalyId: string
    active: boolean
    triggeredAt?: string
    lastTriggered?: string
    currentZScore?: number
    extraMetric?: { label: string; value: number }
}

const WidgetAnomalyCard: React.FC<WidgetAnomalyCardProps> = ({
    loading,
    fullWidth,
    anomalyId,
    active,
    triggeredAt,
    lastTriggered,
    currentZScore,
    extraMetric
}) => {
    const { t } = useTranslation()
    const i18nKey = anomalyIdToI18nKey(anomalyId)
    const label = t(`anomaly-${i18nKey}`)
    const desc = t(`anomaly-${i18nKey}-desc`)

    if (loading) {
        return (
            <div className={cn(styles.card, fullWidth && styles.fullWidth)}>
                <Skeleton style={{ width: '100%', height: 80 }} />
            </div>
        )
    }

    return (
        <div className={cn(active ? styles.cardActive : styles.card, fullWidth && styles.fullWidth)}>
            <div className={styles.header}>
                <span className={active ? styles.dotActive : styles.dot} />
                <span className={styles.label}>{label}</span>
            </div>

            <p className={styles.desc}>{desc}</p>

            {active && triggeredAt && (
                <div className={styles.meta}>
                    {t('anomaly-active-since', { date: formatDate(triggeredAt, t('date-no-time')) })}
                </div>
            )}

            {active && extraMetric != null && (
                <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>{t(getExtraMetricI18nKey(extraMetric.label))}</span>
                    <span className={styles.metricValue}>
                        {formatExtraMetricValue(extraMetric.label, extraMetric.value)}
                    </span>
                </div>
            )}

            {!active && currentZScore != null && (
                <div className={styles.zScoreSection}>
                    <ZScoreBar zScore={currentZScore} />
                    <div className={styles.zScoreMeta}>
                        <span className={styles.zScoreInterp}>{t(getZScoreInterpretation(currentZScore))}</span>
                        <span className={styles.zScoreValue}>
                            {getZScoreSign(currentZScore)}
                            {Math.abs(currentZScore).toFixed(2)}σ
                        </span>
                    </div>
                </div>
            )}

            {!active && extraMetric != null && (
                <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>{t(getExtraMetricI18nKey(extraMetric.label))}</span>
                    <span className={styles.metricValue}>
                        {formatExtraMetricValue(extraMetric.label, extraMetric.value)}
                    </span>
                </div>
            )}

            {!active && lastTriggered && (
                <div className={styles.lastTriggered}>{t('anomaly-last-triggered', { date: lastTriggered })}</div>
            )}
        </div>
    )
}

export default WidgetAnomalyCard
