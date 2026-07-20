import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { hexToRgba, resolveCssVar } from '@/tools/colors'

import { WIND_ROSE_DIRECTIONS, WIND_SPEED_BINS } from './utils'

interface WindRoseChartProps {
    directionBins: number[][]
}

const WindRoseChart: React.FC<WindRoseChartProps> = ({ directionBins }) => {
    const option: EChartsOption = useMemo(() => {
        const textColor = resolveCssVar('--text-color-secondary', '#76787a')
        const gridColor = hexToRgba(textColor, 0.2)

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
    }, [directionBins])

    return (
        <ReactECharts
            option={option}
            style={{ height: '158px', width: '100%' }}
        />
    )
}

export default WindRoseChart
