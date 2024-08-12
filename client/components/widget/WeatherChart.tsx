import React from 'react'
import { graphic } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { ApiModel } from '@/api'

type Colors = 'orange' | 'blue'

interface Props {
    color?: Colors
    data?: ApiModel.Weather[]
    yAxisField?: keyof ApiModel.Weather
}

const colors = {
    orange: ['#f59a02', '#eb9405'],
    blue: ['#3c85d9', '#3a80d3'],
    green: ['#48ac4a', '#45a64a'],
    peach: ['#f9b54f', '#e5a84e'],
    fire: ['#e65944', '#dd5643'],
    purple: ['#6e59df', '#6a56d8'],
    violet: ['#742dbb', '#6f2cb6'],
    raspberry: ['#e03fab', '#ce3ba2']
}

const WeatherChart: React.FC<Props> = ({ color, data, yAxisField }) => {
    const formatData = () => {
        return data?.map((item) => ({
            date: new Date(item?.date || '').toLocaleString(),
            value: yAxisField ? item?.[yAxisField] : ''
        }))
    }

    const chartData = formatData()
    const colorsData = color ? colors[color] : colors['orange']

    const option = {
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
            data: chartData?.map((item) => item.date),
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
                data: chartData?.map((item) => item.value),
                type: 'line',
                smooth: false,
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
