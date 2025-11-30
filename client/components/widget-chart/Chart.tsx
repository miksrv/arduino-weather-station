import React, { useMemo } from 'react'
import { EChartsOption, SeriesOption } from 'echarts'
import { YAXisOption } from 'echarts/types/dist/shared'
import ReactECharts from 'echarts-for-react'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiModel } from '@/api'
import { ChartTypes } from '@/components/widget-chart/WidgetChart'
import { getEChartBaseConfig } from '@/tools'
import { getSensorColor } from '@/tools/colors'
import { formatDateFromUTC } from '@/tools/date'
import { round } from '@/tools/helpers'
import { findMaxValue, findMinValue } from '@/tools/weather'

import styles from './styles.module.sass'

interface ChartProps {
    type: ChartTypes
    data?: ApiModel.Weather[]
    height?: string | number
    dateFormat?: string
}

// TODO: formatter: function (params: any) - replace any with correct type
const Chart: React.FC<ChartProps> = ({ type, data, height, dateFormat }) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff' // --container-background-color
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd' // --input-border-color
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99' // --text-color-secondary

    const baseConfig: EChartsOption = {
        ...getEChartBaseConfig(theme),
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
            backgroundColor,
            borderColor,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                // An array of strings that will be concatenated and returned as the contents of the tooltip
                const tooltipContent: string[] = []

                //Format the header - let's assume it's a date (xAxis)
                if (params.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    const header = `<div class="${styles.chartTooltipTitle}">${params[0].axisValueLabel}</div>`
                    tooltipContent.push(header)
                }

                // Loop through each element in params to display the values (yAxis)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params.forEach((item: any) => {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    const colorSquare = `<span class="${styles.icon}" style="background-color: ${item.color};"></span>`
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    const seriesValue = `<span class="${styles.value}">${item.value?.[1] ?? '---'}</span>`
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
                formatter: (value: number) => formatDateFromUTC(value, dateFormat ?? t('date-only-hour'))
            },
            axisTick: { show: true },
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
            axisTick: { show: true },
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
        ...(baseConfig.series as SeriesOption[])[0],
        data: data?.map(({ date, [source]: sensorData }) => [date, sensorData]),
        name: name ?? '',
        yAxisIndex: axis ?? 0,
        lineStyle: {
            color: getSensorColor(source)[0],
            width: 1
        },
        itemStyle: { color: getSensorColor(source)[0] },
        areaStyle: area ? { color: getSensorColor(source)[1] } : undefined
    })

    const config: Omit<EChartsOption, 'type'> = useMemo(() => {
        switch (type) {
            default:
            case 'temperature':
                return {
                    ...baseConfig,
                    yAxis: [
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as YAXisOption).axisLabel,
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
                                ...(baseConfig.yAxis as YAXisOption).axisLabel,
                                formatter: '{value}%'
                            }
                        },
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as YAXisOption).axisLabel,
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
                                ...(baseConfig.yAxis as YAXisOption).axisLabel,
                                formatter: '{value}'
                            }
                        },
                        {
                            ...baseConfig.yAxis,
                            axisLabel: {
                                ...(baseConfig.yAxis as YAXisOption).axisLabel,
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
