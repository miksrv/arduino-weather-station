import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'
import { getEChartBaseConfig } from '@/tools'

import { getRiskLevelColor, resolveCssVar } from './utils'

import styles from './styles.module.sass'

interface FloodRiskGaugeProps {
    score: number
    level: ApiType.Anomaly.RiskLevel
    theme: string | undefined
}

export const FloodRiskGauge: React.FC<FloodRiskGaugeProps> = ({ score, level, theme }) => {
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
