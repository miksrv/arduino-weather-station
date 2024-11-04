import React, { useMemo } from 'react'
import { EChartsOption, graphic } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { ApiModel } from '@/api'
import { getSensorColor } from '@/tools/colors'
import { findMaxValue, findMinValue, invertData } from '@/tools/weather'

interface Props {
    data?: ApiModel.Weather[]
    source?: keyof ApiModel.Sensors
}

const WeatherChart: React.FC<Props> = ({ data, source }) => {
    const colorsData = getSensorColor(source)

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

    const option: EChartsOption = {
        tooltip: {
            show: false
        },
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
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                show: false
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            min: findMinValue(weatherData, source),
            max: findMaxValue(weatherData, source),
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                show: false
            },
            splitLine: {
                show: false
            }
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
                itemStyle: {
                    color: colorsData[0]
                },
                areaStyle: {
                    color: new graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: colorsData[0]
                        },
                        {
                            offset: 1,
                            color: colorsData[1]
                        }
                    ])
                }
            }
        ]
    }

    return (
        <ReactECharts
            option={option}
            style={{ height: '50px', width: '100%' }}
        />
    )
}

export default WeatherChart
