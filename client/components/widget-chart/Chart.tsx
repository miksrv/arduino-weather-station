import React, { useMemo } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import { ChartTypes } from '@/components/widget-chart/WidgetChart'
import { getSensorColor } from '@/tools/colors'
import { formatDateFromUTC } from '@/tools/date'
import { round } from '@/tools/helpers'
import { findMaxValue, findMinValue } from '@/tools/weather'

interface ChartProps {
    type: ChartTypes
    data?: ApiModel.Weather[]
    height?: string | number
    dateFormat?: string
}

const Chart: React.FC<ChartProps> = ({ type, data, height, dateFormat }) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff' // --container-background-color
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd' // --input-border-color
    const textPrimaryColor = theme === 'dark' ? '#e1e3e6' : '#000000E5' // --text-color-primary
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
                // fontFamily: '-apple-system, system-ui, \'Helvetica Neue\', Roboto, sans-serif',
                color: textPrimaryColor, // Цвет текста легенды
                fontSize: '12px'
            },
            icon: 'rect' // Используем короткую линию в качестве значка
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    formatter: function (params) {
                        if (params?.axisDimension === 'x') {
                            return formatDateFromUTC(params?.value as number, t('date-chart-label'))
                        }

                        return round(Number(params?.value), 2)?.toString() ?? ''
                    }
                }
            },
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            formatter: function (params: any) {
                // An array of strings that will be concatenated and returned as the contents of the tooltip
                const tooltipContent: string[] = []

                //Format the header - let's assume it's a date (xAxis)
                if (params.length > 0) {
                    // const header = `<div class="${styles.chartTooltipTitle}">${formatDate(params[0].axisValueLabel, t('date-chart-tooltip'))}</div>`
                    const header = `<div class="${styles.chartTooltipTitle}">${params[0].axisValueLabel}</div>`
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
                hideOverlap: true,
                color: textSecondaryColor, // Color of X-axis labels
                fontSize: '11px',
                formatter: function (value: number) {
                    return formatDateFromUTC(value, dateFormat ?? t('date-only-hour'))
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
                color: textSecondaryColor, // Color of Y axis labels
                fontSize: '11px'
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

    const getChartLineConfig = (source: keyof ApiModel.Sensors, name?: string, axis?: number, area?: boolean) => ({
        ...(baseConfig.series as any)[0],
        data: data?.map(({ date, [source]: sensorData }) => [date, sensorData]),
        name: name ?? '',
        yAxisIndex: axis ?? 0,
        lineStyle: {
            color: getSensorColor(source)[0],
            width: 1
        },
        itemStyle: {
            color: getSensorColor(source)[0]
        },
        areaStyle: area
            ? {
                  color: getSensorColor(source)[1]
              }
            : undefined
    })

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
                        getChartLineConfig('temperature', t('temperature')),
                        getChartLineConfig('feelsLike', t('feels-like')),
                        getChartLineConfig('dewPoint', t('dew-point'))
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
                        getChartLineConfig('clouds', t('cloudiness'), 0, true),
                        getChartLineConfig('windSpeed', t('wind-speed'), 1)
                    ]
                }

            case 'pressure':
                return {
                    ...baseConfig,
                    yAxis: [
                        {
                            ...baseConfig.yAxis,
                            min: findMinValue(data, 'pressure'),
                            max: findMaxValue(data, 'pressure'),
                            axisLabel: {
                                ...(baseConfig.yAxis as any).axisLabel,
                                formatter: '{value}'
                            }
                        },
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as any).axisLabel,
                                formatter: `{value} ${t('millimeters')}`
                            }
                        }
                    ],
                    series: [
                        getChartLineConfig('pressure', t('pressure'), 0, false),
                        {
                            ...getChartLineConfig('precipitation', t('precipitation'), 1, false),
                            type: 'bar'
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
