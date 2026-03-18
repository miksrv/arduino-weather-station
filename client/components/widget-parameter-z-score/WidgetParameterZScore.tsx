import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Icon, IconTypes, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { getFilledDots, getZScoreColor } from './utils'

import styles from './styles.module.sass'

interface Props {
    loading?: boolean
    parameter: string
    zScore?: number
    sparklineData: number[]
}

const PARAMETER_ICONS: Record<string, IconTypes> = {
    temperature: 'Thermometer',
    pressure: 'Pressure',
    precipitation: 'WaterDrop',
    windSpeed: 'Wind',
    humidity: 'Water',
    uvIndex: 'Sun'
}

const PARAMETER_I18N: Record<string, string> = {
    temperature: 'temperature',
    pressure: 'pressure',
    precipitation: 'precipitation',
    windSpeed: 'wind-speed',
    humidity: 'humidity',
    uvIndex: 'uv-index'
}

const TOTAL_DOTS = 5

const WidgetParameterZScore: React.FC<Props> = ({ loading, parameter, zScore, sparklineData }) => {
    const { t } = useTranslation()

    const color = getZScoreColor(zScore ?? 0)
    const filledDots = getFilledDots(zScore ?? 0)
    const icon = PARAMETER_ICONS[parameter] ?? 'Thermometer'
    const i18nKey = PARAMETER_I18N[parameter] ?? parameter

    const sparkOption: EChartsOption = useMemo(
        () => ({
            backgroundColor: 'transparent',
            grid: { left: 0, right: 0, top: 2, bottom: 2 },
            xAxis: { type: 'category', show: false },
            yAxis: { type: 'value', show: false },
            series: [
                {
                    type: 'line',
                    data: sparklineData,
                    showSymbol: false,
                    lineStyle: { color, width: 1.5 },
                    itemStyle: { color }
                }
            ]
        }),
        [sparklineData, color]
    )

    if (loading) {
        return (
            <div className={styles.card}>
                <Skeleton style={{ width: '100%', height: 88 }} />
            </div>
        )
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <Icon
                    name={icon}
                    className={styles.icon}
                />
                <h3>{t(i18nKey)}</h3>
            </div>

            <div
                className={styles.zScore}
                style={{ color }}
            >
                {(zScore ?? 0) > 0 ? '+' : ''}
                {(zScore ?? 0).toFixed(2)}
            </div>

            <div className={styles.dots}>
                {Array.from({ length: TOTAL_DOTS }, (_, i) => (
                    <span
                        key={i}
                        className={i < filledDots ? styles.dotFilled : styles.dotEmpty}
                        style={i < filledDots ? { backgroundColor: color } : undefined}
                    />
                ))}
            </div>

            {sparklineData.length > 0 && (
                <ReactECharts
                    option={sparkOption}
                    style={{ height: '40px', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            )}
        </div>
    )
}

export default WidgetParameterZScore
