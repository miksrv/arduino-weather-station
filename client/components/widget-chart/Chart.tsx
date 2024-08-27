import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import { formatDate } from '@/tools/helpers'

type Colors = 'orange' | 'blue'

interface Props {
    type: 'temperature' | 'light' | 'clouds'
    data?: ApiModel.Weather[]
    color?: Colors
}

const colors = {
    'green': '#4bb34b',
    'orange': '#ea5d2e',
    'red': '#e64646',
    'blue': '#4a90e2',
    'purple': '#8e44ad',
    'amber': '#f39c12',
    'emerald': '#27ae60',
    'navy': '#2c3e50',
    'pumpkin': '#d35400',
    'aqua': '#16a085',
    'royal': '#2980b9',
    'garnet': '#e74c3c',
    'raspberry': '#c0392b',
    'evening': '#34495e',
    'gray': '#7f8c8d'
}

const Chart: React.FC<Props> = ({ type, data }) => {
    const { theme } = useTheme()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff' // --modal-background
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd' // --input-border-color
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99' // --text-color-secondary

    const baseConfig: EChartsOption = {
        backgroundColor: backgroundColor,
        grid: {
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true,
            borderColor: borderColor
        },
        legend: {
            type: 'plain',
            orient: 'horizontal', // Горизонтальное расположение легенды
            left: 5, // Выравнивание по левому краю
            bottom: 0, // Размещение легенды под графиком
            itemWidth: 20, // Ширина значка линии в легенде
            itemHeight: 2, // Высота значка линии в легенде (делает линию тоньше)
            textStyle: {
                color: textSecondaryColor // Цвет текста легенды
            },
            icon: 'rect' // Используем короткую линию в качестве значка
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            formatter: function (params: any) {
                // An array of strings that will be concatenated and returned as the contents of the tooltip
                const tooltipContent: string[] = []

                //Format the header - let's assume it's a date (xAxis)
                if (params.length > 0) {
                    const header = `<div class="${styles.chartTooltipTitle}">${formatDate(params[0].axisValueLabel, 'dddd, DD MMM YYYY, HH:mm')}</div>`
                    tooltipContent.push(header)
                }

                // Loop through each element in params to display the values (yAxis)
                params.forEach((item: any) => {
                    const colorSquare = `<span class="${styles.icon}" style="background-color: ${item.color};"></span>`
                    const seriesValue = `<span class="${styles.value}">${item.value?.[1]}</span>`
                    const seriesName = `<span class="${styles.label}">${item.seriesName}${seriesValue}</span>`

                    const row = `<div class="${styles.chartTooltipItem}">${colorSquare} ${seriesName}</div>`
                    tooltipContent.push(row)
                })

                // Return the merged contents of the tooltip
                return tooltipContent.join('')
            }
        },
        xAxis: {
            type: 'time',
            axisLabel: {
                show: true,
                color: textSecondaryColor, // Color of X-axis labels
                formatter: function (value: number) {
                    return formatDate(value.toString(), 'HH:mm')
                }
            },
            axisTick: {
                show: true
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: borderColor // X axis color
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: borderColor // Grid line color
                }
            }
        },
        yAxis: {
            type: 'value',
            nameGap: 50,
            axisTick: {
                show: true
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: borderColor // Y axis color
                }
            },
            axisLabel: {
                show: true,
                formatter: '{value}%',
                color: textSecondaryColor // Color of Y axis labels
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: borderColor // Grid line color
                }
            }
        },
        series: [
            {
                type: 'line',
                showSymbol: false,
                smooth: false,
                lineStyle: {
                    color: '#3a80d3',
                    width: 1
                },
                itemStyle: {
                    color: '#3a80d3'
                },
                areaStyle: {
                    color: '#6aa7ef'
                }
            }
        ]
    }

    const config: EChartsOption = useMemo(() => {
        switch (type) {
            default:
            case 'temperature':
                return {
                    backgroundColor: '#2c2d2e',
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross'
                        },
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        // position: function (pos, params, el, elRect, size) {
                        //     const obj = { top: 10 }
                        //     // @ts-ignore
                        //     obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
                        //     return obj
                        // },
                        extraCssText: 'width: 170px'
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
                            color: '#76787a', // Цвет меток оси Y
                            formatter: '{value}°C'
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
                            name: 'Температура',
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
                    // visualMap: {
                    //     top: 0,
                    //     right: 0,
                    //     pieces: [
                    //         {
                    //             gt: 0,
                    //             lte: 1,
                    //             color: '#91c603'
                    //         },
                    //         {
                    //             gt: 1,
                    //             lte: 2,
                    //             color: '#91c603'
                    //         },
                    //         {
                    //             gt: 2,
                    //             lte: 3,
                    //             color: '#ffb800'
                    //         },
                    //         {
                    //             gt: 3,
                    //             lte: 4,
                    //             color: '#ffb800'
                    //         },
                    //         {
                    //             gt: 4,
                    //             lte: 5,
                    //             color: '#ffb800'
                    //         },
                    //         {
                    //             gt: 5,
                    //             lte: 6,
                    //             color: '#ff8d02'
                    //         },
                    //         {
                    //             gt: 6,
                    //             lte: 7,
                    //             color: '#ff8d02'
                    //         },
                    //         {
                    //             gt: 7,
                    //             lte: 8,
                    //             color: '#ff3b00'
                    //         },
                    //         {
                    //             gt: 8,
                    //             lte: 9,
                    //             color: '#ff3b00'
                    //         },
                    //         {
                    //             gt: 9,
                    //             lte: 10,
                    //             color: '#ff3b00'
                    //         },
                    //         {
                    //             gt: 10,
                    //             lte: 11,
                    //             color: '#ff3b00'
                    //         },
                    //         {
                    //             gt: 11,
                    //             lte: 11,
                    //             color: '#9a36d4'
                    //         }
                    //     ],
                    //     outOfRange: {
                    //         color: '#999'
                    //     }
                    // },
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

            case 'clouds':
                return {
                    ...baseConfig,
                    yAxis: [
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as any).axisLabel,
                                formatter: '{value}%'
                            }
                        },
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as any).axisLabel,
                                formatter: '{value}м/с'
                            }
                        }
                    ],
                    series: [
                        {
                            ...(baseConfig.series as any)[0],
                            data: data?.map(({ date, clouds }) => [date, clouds]),
                            name: 'Облачность'
                        },
                        {
                            ...(baseConfig.series as any)[0],
                            yAxisIndex: 1,
                            data: data?.map(({ date, windSpeed }) => [date, windSpeed]),
                            name: 'Скорость ветра',
                            areaStyle: undefined,
                            lineStyle: {
                                color: colors.green,
                                width: 1
                            },
                            itemStyle: {
                                color: colors.green
                            }
                        }
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
