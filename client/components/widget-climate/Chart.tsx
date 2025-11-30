import React, { useMemo } from 'react'
import { EChartsOption, SeriesOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { useTheme } from 'next-themes'

import { getEChartBaseConfig } from '@/tools'
import { formatDateFromUTC } from '@/tools/date'
import { round } from '@/tools/helpers'

import { ClimateType } from './type'

import styles from './styles.module.sass'

interface ChartProps {
    data?: ClimateType[]
    height?: string | number
}

const Chart: React.FC<ChartProps> = ({ data, height }) => {
    const { theme } = useTheme()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99'

    const baseConfig: EChartsOption = {
        ...getEChartBaseConfig(theme),
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    formatter: function (params) {
                        if (params.axisDimension === 'x') {
                            return formatDateFromUTC(params?.value as number, 'DD MMMM')
                        }
                        return round(Number(params.value), 2)?.toString() ?? ''
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
                    const seriesValue = `<span class="${styles.value}">${item.value?.[1] ?? '---'} °C</span>`
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
                color: textSecondaryColor,
                fontSize: 11,
                formatter: (value: number) => formatDateFromUTC(value, 'DD MMM')
            },
            axisTick: { show: true },
            axisLine: {
                show: true,
                lineStyle: {
                    color: borderColor
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: borderColor
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
                    color: borderColor
                }
            },
            axisLabel: {
                show: true,
                formatter: '{value}°C',
                color: textSecondaryColor,
                fontSize: 11
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: borderColor
                }
            }
        },
        series: []
    }

    const config: Omit<EChartsOption, 'type'> = useMemo(() => {
        if (!data?.length) {
            return baseConfig
        }

        return {
            ...baseConfig,
            series: data.map((item) => ({
                ...(baseConfig.series as SeriesOption[])[0],
                name: item.year,
                type: 'line',
                showSymbol: false,
                connectNulls: false,
                lineStyle: {
                    width: 1
                },
                data: item.weather?.map(({ date, temperature }) => [normalizeDateToBaseYear(date), temperature])
            }))
        }
    }, [data, theme])

    return (
        <ReactECharts
            option={config}
            style={{ height: height ?? '260px', width: '100%' }}
        />
    )
}

const normalizeDateToBaseYear = (dateString?: string, baseYear = 1970): number => {
    if (!dateString) {
        return 0
    }

    const d = new Date(dateString)
    const base = new Date(baseYear, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())
    return base.getTime()
}

export default Chart
