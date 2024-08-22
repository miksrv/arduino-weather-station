import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
// import { graphic } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { ApiModel } from '@/api'
import { formatDate } from '@/tools/helpers'

type Colors = 'orange' | 'blue'

interface Props {
    type: 'temperature' | 'light'
    data?: ApiModel.Weather[]
    color?: Colors
}

const Chart: React.FC<Props> = ({ type, data }) => {
    const config: EChartsOption = useMemo(() => {
        switch (type) {
            default:
            case 'temperature':
                return {
                    backgroundColor: '#2c2d2e',
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Фон всплывающих подсказок
                        textStyle: {
                            color: '#fff' // Цвет текста подсказок
                        }
                    },
                    legend: {
                        textStyle: {
                            color: '#ccc'
                        }
                    },
                    grid: {
                        left: 10,
                        right: 10,
                        top: 15,
                        bottom: 10,
                        containLabel: true,
                        borderColor: '#ccc'
                    },
                    xAxis: {
                        type: 'time',
                        boundaryGap: false,
                        axisLabel: {
                            show: true,
                            color: '#76787a', // Цвет меток оси X
                            formatter: function (value: string) {
                                return formatDate(value, 'HH:mm')
                            }
                        },
                        date: data?.map(({ date }) => new Date(date || '').getTime()),
                        axisTick: {
                            show: true
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#444546' // Цвет оси X
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                width: 1,
                                color: '#444546' // Цвет линий сетки
                            }
                        }
                    },
                    // visualMap: {
                    //     top: 10,
                    //     right: 10,
                    //     pieces: [{
                    //         gt: 0,
                    //         lte: 5,
                    //         color: '#096'
                    //     }, {
                    //         gt: 5,
                    //         lte: 10,
                    //         color: '#ffde33'
                    //     }, {
                    //         gt: 10,
                    //         lte: 15,
                    //         color: '#ff9933'
                    //     }, {
                    //         gt: 15,
                    //         lte: 20,
                    //         color: '#cc0033'
                    //     }, {
                    //         gt: 20,
                    //         lte: 30,
                    //         color: '#660099'
                    //     }, {
                    //         gt: 30,
                    //         color: '#7e0023'
                    //     }],
                    //     outOfRange: {
                    //         color: '#999'
                    //     }
                    // },
                    yAxis: {
                        type: 'value',
                        axisTick: {
                            show: true
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#444546' // Цвет оси Y
                            }
                        },
                        axisLabel: {
                            show: true,
                            color: '#76787a' // Цвет меток оси Y
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                width: 1,
                                color: '#444546' // Цвет линий сетки
                            }
                        }
                    },
                    series: [
                        {
                            data: data?.map(({ date, temperature }) => [date, temperature]),
                            type: 'line',
                            showSymbol: false,
                            smooth: false,
                            lineStyle: {
                                color: '#e65944',
                                width: 1
                            },
                            itemStyle: {
                                color: '#e65944'
                            }
                            // markLine: {
                            //     silent: true,
                            //     data: [{
                            //         yAxis: 5
                            //     }, {
                            //         yAxis: 10
                            //     }, {
                            //         yAxis: 15
                            //     }, {
                            //         yAxis: 20
                            //     }, {
                            //         yAxis: 30
                            //     }]
                            // }
                            // areaStyle: {
                            //     color: new graphic.LinearGradient(0, 0, 0, 1, [
                            //         {
                            //             offset: 0,
                            //             color: colorsData[0]
                            //         },
                            //         {
                            //             offset: 1,
                            //             color: colorsData[1]
                            //         }
                            //     ])
                            // }
                        },
                        {
                            data: data?.map(({ date, feelsLike }) => [date, feelsLike]),
                            type: 'line',
                            showSymbol: false,
                            smooth: false,
                            lineStyle: {
                                color: '#f9b54f',
                                width: 1
                            },
                            itemStyle: {
                                color: '#f9b54f'
                            }
                        },
                        {
                            data: data?.map(({ date, dewPoint }) => [date, dewPoint]),
                            type: 'line',
                            showSymbol: false,
                            smooth: false,
                            connectNulls: true,
                            lineStyle: {
                                color: '#3c85d9',
                                width: 1
                            },
                            itemStyle: {
                                color: '#3c85d9'
                            }
                        }
                    ]
                }

            case 'light':
                return {
                    backgroundColor: '#2c2d2e',
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Фон всплывающих подсказок
                        textStyle: {
                            color: '#fff' // Цвет текста подсказок
                        }
                    },
                    legend: {
                        textStyle: {
                            color: '#ccc'
                        }
                    },
                    grid: {
                        left: 10,
                        right: 10,
                        top: 15,
                        bottom: 10,
                        containLabel: true,
                        borderColor: '#ccc'
                    },
                    xAxis: {
                        type: 'time',
                        boundaryGap: false,
                        axisLabel: {
                            show: true,
                            color: '#76787a', // Цвет меток оси X
                            formatter: function (value: string) {
                                return formatDate(value, 'HH:mm')
                            }
                        },
                        date: data?.map(({ date }) => new Date(date || '').getTime()),
                        axisTick: {
                            show: true
                        },
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: '#444546' // Цвет оси X
                            }
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                width: 1,
                                color: '#444546' // Цвет линий сетки
                            }
                        }
                    },
                    visualMap: {
                        top: 0,
                        right: 0,
                        pieces: [
                            {
                                gt: 0,
                                lte: 1,
                                color: '#91c603'
                            },
                            {
                                gt: 1,
                                lte: 2,
                                color: '#91c603'
                            },
                            {
                                gt: 2,
                                lte: 3,
                                color: '#ffb800'
                            },
                            {
                                gt: 3,
                                lte: 4,
                                color: '#ffb800'
                            },
                            {
                                gt: 4,
                                lte: 5,
                                color: '#ffb800'
                            },
                            {
                                gt: 5,
                                lte: 6,
                                color: '#ff8d02'
                            },
                            {
                                gt: 6,
                                lte: 7,
                                color: '#ff8d02'
                            },
                            {
                                gt: 7,
                                lte: 8,
                                color: '#ff3b00'
                            },
                            {
                                gt: 8,
                                lte: 9,
                                color: '#ff3b00'
                            },
                            {
                                gt: 9,
                                lte: 10,
                                color: '#ff3b00'
                            },
                            {
                                gt: 10,
                                lte: 11,
                                color: '#ff3b00'
                            },
                            {
                                gt: 11,
                                lte: 11,
                                color: '#9a36d4'
                            }
                        ],
                        outOfRange: {
                            color: '#999'
                        }
                    },
                    yAxis: [
                        {
                            type: 'value',
                            axisTick: {
                                show: true
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#444546' // Цвет оси Y
                                }
                            },
                            axisLabel: {
                                show: true,
                                color: '#76787a' // Цвет меток оси Y
                            },
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    width: 1,
                                    color: '#444546' // Цвет линий сетки
                                }
                            }
                        },
                        {
                            type: 'value',
                            axisTick: {
                                show: true
                            },
                            axisLine: {
                                show: true,
                                lineStyle: {
                                    color: '#444546' // Цвет оси Y
                                }
                            },
                            axisLabel: {
                                show: true,
                                color: '#76787a' // Цвет меток оси Y
                            },
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    width: 1,
                                    color: '#444546' // Цвет линий сетки
                                }
                            }
                        }
                    ],
                    series: [
                        {
                            data: data?.map(({ date, solEnergy }) => [date, solEnergy]),
                            type: 'line',
                            showSymbol: false,
                            smooth: true,
                            connectNulls: true,
                            lineStyle: {
                                color: '#48ac4a',
                                width: 1
                            },
                            itemStyle: {
                                color: '#48ac4a'
                            }
                            // areaStyle: {
                            //     color: new graphic.LinearGradient(0, 0, 0, 1, [
                            //         {
                            //             offset: 0,
                            //             color: colorsData[0]
                            //         },
                            //         {
                            //             offset: 1,
                            //             color: colorsData[1]
                            //         }
                            //     ])
                            // }
                        },
                        {
                            yAxisIndex: 1,
                            data: data?.map(({ date, uvIndex }) => [date, uvIndex]),
                            type: 'line',
                            showSymbol: false,
                            smooth: true,
                            connectNulls: true,
                            lineStyle: {
                                width: 1
                            }
                            // markLine: {
                            //     precision: 1,
                            //     silent: true,
                            //     label: {
                            //         show: false
                            //     },
                            //     data: [
                            //         {
                            //             yAxis: 1
                            //         },
                            //         {
                            //             yAxis: 2
                            //         },
                            //         {
                            //             yAxis: 3
                            //         },
                            //         {
                            //             yAxis: 4
                            //         },
                            //         {
                            //             yAxis: 5
                            //         },
                            //         {
                            //             yAxis: 6
                            //         },
                            //         {
                            //             yAxis: 7
                            //         },
                            //         {
                            //             yAxis: 8
                            //         },
                            //         {
                            //             yAxis: 9
                            //         },
                            //         {
                            //             yAxis: 10
                            //         },
                            //         {
                            //             yAxis: 11
                            //         }
                            //     ]
                            // }
                        }
                        // {
                        //     data: data?.map(({ date, dewPoint }) => [date, dewPoint]),
                        //     type: 'line',
                        //     showSymbol: false,
                        //     smooth: false,
                        //     connectNulls: true,
                        //     lineStyle: {
                        //         color: '#3c85d9',
                        //         width: 1
                        //     },
                        //     itemStyle: {
                        //         color: '#3c85d9'
                        //     }
                        // }
                    ]
                }
        }
    }, [type, data])

    return (
        <ReactECharts
            option={config}
            style={{ height: '260px', width: '100%' }}
        />
    )
}

export default Chart