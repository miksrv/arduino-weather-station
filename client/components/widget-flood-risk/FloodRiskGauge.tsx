import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import EChart from '@/components/echart'
import { getChartTokens, getEChartBaseConfig } from '@/tools'

import { getRiskLevelColor } from './utils'

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
        const { border: trackColor, textSecondary: textColor } = getChartTokens(theme)

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
                        fontWeight: 600,
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
            <EChart
                option={option}
                style={{ height: '180px', width: '100%' }}
                className={styles.gaugeChart}
            />
        </div>
    )
}
