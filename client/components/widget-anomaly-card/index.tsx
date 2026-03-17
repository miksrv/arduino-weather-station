import React from 'react'

import { useTranslation } from 'next-i18next'

import {
    anomalyIdToI18nKey,
    formatExtraMetricValue,
    getExtraMetricI18nKey,
    getZScoreInterpretation,
    getZScoreSign
} from './utils'

import styles from './styles.module.sass'

interface Props {
    anomalyId: string
    active: boolean
    triggeredAt?: string
    lastTriggered?: string
    currentZScore?: number
    extraMetric?: { label: string; value: number }
}

interface ZScoreBarProps {
    zScore: number
}

const ZScoreBar: React.FC<ZScoreBarProps> = ({ zScore }) => {
    const abs = Math.abs(zScore)
    const fillPct = Math.min(abs / 3.0, 1.0) * 50

    let colorVar = 'var(--color-green)'
    if (abs >= 2.0) {
        colorVar = 'var(--color-red)'
    } else if (abs >= 1.5) {
        colorVar = 'var(--color-orange)'
    }

    return (
        <div className={styles.zBar}>
            <div className={styles.zBarTrack}>
                {zScore < 0 ? (
                    <div
                        className={styles.zBarFillLeft}
                        style={{ width: `${fillPct}%`, backgroundColor: colorVar }}
                    />
                ) : (
                    <div className={styles.zBarSpacer} />
                )}
                <div className={styles.zBarMid} />
                {zScore >= 0 ? (
                    <div
                        className={styles.zBarFillRight}
                        style={{ width: `${fillPct}%`, backgroundColor: colorVar }}
                    />
                ) : (
                    <div className={styles.zBarSpacer} />
                )}
            </div>
        </div>
    )
}

const WidgetAnomalyCard: React.FC<Props> = ({
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

    return (
        <div className={active ? styles.cardActive : styles.card}>
            <div className={styles.header}>
                <span className={active ? styles.dotActive : styles.dot} />
                <span className={styles.label}>{label}</span>
            </div>
            <p className={styles.desc}>{desc}</p>
            {active && triggeredAt && (
                <div className={styles.meta}>{t('anomaly-active-since', { date: triggeredAt })}</div>
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
