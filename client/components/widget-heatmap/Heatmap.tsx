import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import { ApiModel, ApiType } from '@/api'
import { formatDate } from '@/tools/date'
import useClientOnly from '@/tools/hooks/useClientOnly'

interface ChartProps {
    type: ApiType.Heatmap.SensorType
    data?: ApiModel.Weather[]
    title?: string
    subTitle?: string
    height?: string | number
}

const HeatmapChart: React.FC<ChartProps> = ({ type, data, title, subTitle, height }) => {
    const isClient = useClientOnly()
    const { theme } = useTheme()
    const { t } = useTranslation()

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd'
    const textPrimaryColor = theme === 'dark' ? '#e1e3e6' : '#000000E5'
    const textSecondaryColor = theme === 'dark' ? '#76787a' : '#818c99' // --text-color-secondary

    const isMobile = isClient && !!(window?.innerWidth && window?.innerWidth < 500)

    const xData = useMemo(() => {
        return data ? Array.from(new Set(data.map((d) => dayjs(d.date).format('YYYY-MM-DD')))) : []
    }, [data, type])

    const yData = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => `${i}:00`)
    }, [])

    const chartData = useMemo(() => {
        return data
            ? data.map((item) => {
                  const dayIndex = xData.indexOf(dayjs(item.date).format('YYYY-MM-DD'))
                  const hour = dayjs(item.date).hour()
                  return [dayIndex, 23 - hour, item[type]]
              })
            : []
    }, [data, type, xData])

    const chartUnit = useMemo(() => {
        switch (type) {
            case 'temperature':
                return '°С'
            case 'pressure':
                return t('mm-hg')
            case 'precipitation':
                return t('millimeters')
            case 'humidity':
            case 'clouds':
                return '%'
        }
    }, [type])

    const chartColors = useMemo(() => {
        switch (type) {
            case 'temperature':
                return [
                    '#313695',
                    '#4575b4',
                    '#74add1',
                    '#abd9e9',
                    '#ffffbf',
                    '#fee090',
                    '#f46d43',
                    '#d73027',
                    '#a50026'
                ]

            case 'pressure':
                return [
                    '#4a148c',
                    '#6a1b9a',
                    '#7d2ae8',
                    '#8e24aa',
                    '#9c27b0',
                    '#ab47bc',
                    '#ce93d8',
                    '#f3e5f5'
                ].reverse()

            case 'precipitation':
                return [
                    '#0d47a1',
                    '#1565c0',
                    '#1976d2',
                    '#1e88e5',
                    '#2c7eec',
                    '#42a5f5',
                    '#90caf9',
                    '#e3f2fd'
                ].reverse()

            case 'clouds':
                return [
                    '#1a237e',
                    '#283593',
                    '#303f9f',
                    '#3949ab',
                    '#3f51b5',
                    '#5c6bc0',
                    '#9fa8da',
                    '#e8eaf6'
                ].reverse()

            case 'humidity':
                return [
                    '#006064',
                    '#00838f',
                    '#00bcd4',
                    '#26c6da',
                    '#4dd0e1',
                    '#80deea',
                    '#b2ebf2',
                    '#e0f7fa'
                ].reverse()
        }
    }, [type])

    const option: EChartsOption = {
        title: {
            show: !isMobile,
            text: title,
            subtext: subTitle,
            padding: 0,
            top: 10,
            left: 10,
            itemGap: 5,
            textStyle: {
                fontWeight: 400,
                color: textPrimaryColor
            },
            subtextStyle: {
                color: textSecondaryColor
            }
        },
        tooltip: {
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            formatter: (params: any) => {
                const tooltipContent: string[] = []
                const colorSquare = `<span class="${styles.icon}" style="background-color: ${params.color};"></span>`
                const seriesValue = `<span class="${styles.value}">${params.value?.[2]} ${chartUnit}</span>`
                const seriesName = `<span class="${styles.label}">${t(type)}${seriesValue}</span>`

                tooltipContent.push(
                    `<div class="${styles.chartTooltipTitle}">${formatDate(params.name, 'dddd, DD MMM YYYY')}</div>`
                )
                tooltipContent.push(`<div class="${styles.chartTooltipItem}">${colorSquare} ${seriesName}</div>`)

                return tooltipContent.join('')
            }
        },
        grid: {
            left: 10,
            right: 10,
            top: 55,
            bottom: 10,
            containLabel: true,
            borderColor: borderColor
        },
        xAxis: {
            type: 'category',
            data: xData,
            splitArea: {
                show: true
            },
            axisLabel: {
                show: true,
                hideOverlap: true,
                color: textSecondaryColor,
                fontSize: '11px',
                formatter: (value: string) => dayjs(value).format('MMM D')
            }
        },
        yAxis: {
            type: 'category',
            data: yData,
            splitArea: {
                show: true
            },
            axisLabel: {
                show: true,
                formatter: '{value}',
                color: textSecondaryColor,
                fontSize: '11px'
            }
        },
        visualMap: {
            min: Math.min(...(data?.map((item) => item[type] ?? 0) || [0])),
            max: Math.max(...(data?.map((item) => item[type] ?? 0) || [1])),
            calculable: true,
            orient: 'horizontal',
            right: 10,
            top: 5,
            padding: 0,
            inRange: {
                color: chartColors
            },
            textStyle: {
                color: textPrimaryColor,
                fontSize: '10px'
            }
        },
        series: [
            {
                type: 'heatmap',
                data: chartData,
                emphasis: {
                    itemStyle: {
                        borderColor: '#333',
                        borderWidth: 1
                    }
                },
                progressive: 1000,
                animation: false
            }
        ],
        backgroundColor: backgroundColor,
        textStyle: {
            color: textPrimaryColor
        }
    }

    return (
        <ReactECharts
            option={option}
            style={{ height }}
        />
    )
}

export default HeatmapChart
