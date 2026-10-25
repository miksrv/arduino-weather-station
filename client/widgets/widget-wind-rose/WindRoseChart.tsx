import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

import { useTheme } from 'next-themes'

import EChart from '@/components/echart'
import { getChartTokens } from '@/tools/echart'

import { WIND_ROSE_DIRECTIONS, WIND_SPEED_BINS } from './utils'

interface WindRoseChartProps {
    directionBins: number[][]
}

const WindRoseChart: React.FC<WindRoseChartProps> = ({ directionBins }) => {
    const { resolvedTheme: theme } = useTheme()

    const option: EChartsOption = useMemo(() => {
        const { textSecondary: textColor, border: gridColor } = getChartTokens(theme)

        return {
            tooltip: { show: false },
            polar: {
                radius: '78%'
            },
            angleAxis: {
                type: 'category',
                data: [...WIND_ROSE_DIRECTIONS],
                startAngle: 90,
                clockwise: true,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: textColor, fontSize: 10 },
                splitLine: { show: true, lineStyle: { color: gridColor } }
            },
            radiusAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: true, lineStyle: { color: gridColor } }
            },
            series: WIND_SPEED_BINS.map((bin, binIndex) => ({
                type: 'bar',
                coordinateSystem: 'polar',
                stack: 'speed',
                data: directionBins.map((bins) => bins[binIndex]),
                itemStyle: { color: bin.color }
            }))
        }
    }, [directionBins, theme])

    return (
        <EChart
            option={option}
            style={{ height: '158px', width: '100%' }}
        />
    )
}

export default WindRoseChart
