import React, { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

import { useTheme } from 'next-themes'

import { ApiModel } from '@/api'
import EChart from '@/components/echart'
import { getSensorColor, hexToRgba } from '@/tools/colors'
import { verticalGradient } from '@/tools/echart'
import { findMaxValue, findMinValue, invertData } from '@/tools/weather'

interface WeatherChartProps {
    data?: ApiModel.Weather[]
    source?: keyof ApiModel.Sensors
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data, source }) => {
    const { resolvedTheme: theme } = useTheme()

    const weatherData = useMemo(
        () => (source && ['temperature', 'feelsLike', 'dewPoint'].includes(source) ? invertData(data, source) : data),
        [data, source]
    )

    const weatherFormatedData = useMemo(
        () =>
            weatherData?.map((item) => ({
                date: new Date(item?.date || '').toLocaleString(),
                value: source ? item?.[source] : null
            })),
        [weatherData]
    )

    const option: EChartsOption = useMemo(() => {
        const colorsData = getSensorColor(source, theme)

        return {
            tooltip: { show: false },
            grid: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: weatherFormatedData?.map((item) => item.date),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                min: findMinValue(weatherData, source),
                max: findMaxValue(weatherData, source),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            },
            series: [
                {
                    data: weatherFormatedData?.map((item) => item.value),
                    type: 'line',
                    smooth: false,
                    showSymbol: false,
                    connectNulls: true,
                    lineStyle: {
                        color: colorsData[0],
                        width: 2
                    },
                    itemStyle: { color: colorsData[0] },
                    areaStyle: {
                        color: verticalGradient([
                            { offset: 0, color: hexToRgba(colorsData[0], 0.45) },
                            { offset: 1, color: hexToRgba(colorsData[0], 0.05) }
                        ])
                    }
                }
            ]
        }
    }, [weatherFormatedData, weatherData, source, theme])

    return (
        <EChart
            option={option}
            style={{ height: '50px', width: '100%' }}
        />
    )
}

export default WeatherChart
