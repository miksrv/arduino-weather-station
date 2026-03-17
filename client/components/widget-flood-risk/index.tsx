import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'

import { clampContribution, getRiskLevelColor, resolveCssVar } from './utils'

import styles from './styles.module.sass'

type RiskLevel = ApiType.Anomaly.RiskLevel
type RiskSeason = ApiType.Anomaly.RiskSeason
type FloodRisk = ApiType.Anomaly.FloodRisk

interface Props {
    score: number
    level: RiskLevel
    components: FloodRisk['components']
    season: RiskSeason
}

interface GaugeProps {
    score: number
    level: RiskLevel
    theme: string | undefined
}

const FloodRiskGauge: React.FC<GaugeProps> = ({ score, level, theme }) => {
    const { t } = useTranslation()

    const option: EChartsOption = useMemo(() => {
        const fillColor = getRiskLevelColor(level)
        const trackColor = resolveCssVar('--input-border-color', '#e0e0e0')
        const textColor = resolveCssVar('--text-color-secondary', '#888888')

        return {
            ...getEChartBaseConfig(theme),
            series: [
                {
                    type: 'gauge',
                    center: ['50%', '65%'],
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 5,
                    pointer: { show: false },
                    progress: {
                        show: true,
                        overlap: false,
                        roundCap: true,
                        clip: false,
                        itemStyle: { color: fillColor }
                    },
                    axisLine: {
                        lineStyle: {
                            width: 8,
                            color: [[1, trackColor]]
                        }
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: {
                        valueAnimation: true,
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: fillColor,
                        formatter: '{value}',
                        offsetCenter: [0, -10]
                    },
                    title: {
                        offsetCenter: [0, '35%'],
                        fontSize: 11,
                        color: textColor
                    },
                    data: [{ value: score, name: t('flood-risk-score') }]
                }
            ]
        }
    }, [score, level, theme, t])

    return (
        <div className={styles.gaugeWrapper}>
            <ReactECharts
                option={option}
                style={{ height: '180px', width: '100%' }}
                className={styles.gaugeChart}
            />
        </div>
    )
}

type ComponentKey = keyof FloodRisk['components']

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

interface BarsProps {
    components: FloodRisk['components']
    level: RiskLevel
}

const FloodRiskBars: React.FC<BarsProps> = ({ components, level }) => {
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

const WidgetFloodRisk: React.FC<Props> = ({ score, level, components, season }) => {
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
