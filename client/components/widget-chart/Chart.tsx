import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import { colors } from '@/tools/colors'
import { formatDate } from '@/tools/helpers'

interface ChartProps {
    type: 'temperature' | 'light' | 'clouds'
    data?: ApiModel.Weather[]
    height?: string | number
}

const Chart: React.FC<ChartProps> = ({ type, data, height }) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

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
                    const seriesValue = `<span class="${styles.value}">${item.value?.[1] ?? '---'}</span>`
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
                connectNulls: true
            }
        ]
    }

    const config: EChartsOption = useMemo(() => {
        switch (type) {
            default:
            case 'temperature':
                return {
                    ...baseConfig,
                    yAxis: [
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as any).axisLabel,
                                formatter: '{value}°C'
                            }
                        }
                    ],
                    series: [
                        {
                            ...(baseConfig.series as any)[0],
                            data: data?.map(({ date, temperature }) => [date, temperature]),
                            name: t('temperature'),
                            areaStyle: undefined,
                            lineStyle: {
                                color: colors.red[0],
                                width: 1
                            },
                            itemStyle: {
                                color: colors.red[0]
                            }
                        },
                        {
                            ...(baseConfig.series as any)[0],
                            data: data?.map(({ date, feelsLike }) => [date, feelsLike]),
                            name: t('feels-like'),
                            areaStyle: undefined,
                            lineStyle: {
                                color: colors.orange[0],
                                width: 1
                            },
                            itemStyle: {
                                color: colors.orange[0]
                            }
                        },
                        {
                            ...(baseConfig.series as any)[0],
                            data: data?.map(({ date, dewPoint }) => [date, dewPoint]),
                            name: t('dew-point'),
                            areaStyle: undefined,
                            lineStyle: {
                                color: colors.pink[0],
                                width: 1
                            },
                            itemStyle: {
                                color: colors.pink[0]
                            }
                        }
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
                                formatter: `{value}${t('meters-per-second')}`
                            }
                        }
                    ],
                    series: [
                        {
                            ...(baseConfig.series as any)[0],
                            data: data?.map(({ date, clouds }) => [date, clouds]),
                            name: t('cloudiness'),
                            lineStyle: {
                                color: colors.navy[0],
                                width: 1
                            },
                            itemStyle: {
                                color: colors.navy[0]
                            },
                            areaStyle: {
                                color: colors.navy[1]
                            }
                        },
                        {
                            ...(baseConfig.series as any)[0],
                            yAxisIndex: 1,
                            data: data?.map(({ date, windSpeed }) => [date, windSpeed]),
                            name: t('wind-speed'),
                            areaStyle: undefined,
                            lineStyle: {
                                color: colors.teal[0],
                                width: 1
                            },
                            itemStyle: {
                                color: colors.teal[0]
                            }
                        }
                    ]
                }
        }
    }, [type, data])

    return (
        <ReactECharts
            option={config}
            style={{ height: height ?? '260px', width: '100%' }}
        />
    )
}

export default Chart
