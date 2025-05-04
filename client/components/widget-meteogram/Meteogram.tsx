import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams, EChartsOption } from 'echarts'
import { CustomSeriesRenderItemReturn } from 'echarts/types/dist/echarts'
import { LabelOption } from 'echarts/types/src/util/types'
import ReactECharts from 'echarts-for-react'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { ApiModel } from '@/api'
import { getWeatherIconUrl } from '@/components/weather-icon/WeatherIcon'
import { colors, getSensorColor } from '@/tools/colors'
import { formatDate, formatDateFromUTC } from '@/tools/date'
import { findMaxValue, findMinValue, getSampledData } from '@/tools/weather'

import styles from '@/components/widget-chart/styles.module.sass'

const WEATHER_ICON_SIZE = 40
const WEATHER_ICON_SPACING = 40
const WIND_ARROW_SIZE = 12
const DATA_INDEXES = {
    date: 0,
    windSpeed: 1,
    windDeg: 2,
    weatherId: 3
}

export interface MeteogramProps {
    data?: ApiModel.Weather[]
    height?: string | number
}

// TODO: formatter: (params: any) - set correct type
// TODO: params.forEach((item: any) - set correct type
const Meteogram: React.FC<MeteogramProps> = ({ data, height }) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    const containerRef = useRef<HTMLDivElement>(null)

    const [weatherIconsCount, setWeatherIconsCount] = useState(10) // Default value

    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff'
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd' // --input-border-color
    const textPrimaryColor = theme === 'dark' ? '#e1e3e6' : '#000000E5' // --text-color-primary
    const containerStyles: CSSProperties = { height: height || '400px', width: '100%' }

    useEffect(() => {
        const updateIconCount = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth
                const count = Math.floor(containerWidth / (WEATHER_ICON_SIZE + WEATHER_ICON_SPACING))
                setWeatherIconsCount(count)
            }
        }

        updateIconCount()
        window.addEventListener('resize', updateIconCount)
        return () => window.removeEventListener('resize', updateIconCount)
    }, [containerRef.current])

    const renderArrow = (
        _: CustomSeriesRenderItemParams,
        api: CustomSeriesRenderItemAPI
    ): CustomSeriesRenderItemReturn & LabelOption => {
        const point = api.coord([api.value(DATA_INDEXES.date), api.value(DATA_INDEXES.windSpeed)])

        const windSpeed = api.value(DATA_INDEXES.windSpeed) as number
        let color = '#555'

        if (windSpeed >= 7) {
            color = colors.magenta[0]
        } else if (windSpeed >= 4) {
            color = colors.orange[0]
        } else {
            color = colors.green[0]
        }

        return {
            type: 'path',
            shape: {
                pathData: 'M31 16l-15-15v9h-26v12h26v9z',
                x: -WIND_ARROW_SIZE / 2,
                y: -WIND_ARROW_SIZE / 2,
                width: WIND_ARROW_SIZE,
                height: WIND_ARROW_SIZE
            },
            rotation: Number(api.value(DATA_INDEXES.windDeg)),
            position: point,
            style: api.style({
                stroke: color,
                fill: color,
                lineWidth: 1
            })
        }
    }

    const axisBaseConfig = {
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
    }

    const config: EChartsOption = useMemo(
        () => ({
            backgroundColor,
            grid: {
                left: 10,
                right: 10,
                top: 45,
                bottom: 8,
                containLabel: true,
                borderColor: borderColor
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor,
                borderColor,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter: (params: any) => {
                    // An array of strings that will be concatenated and returned as the contents of the tooltip
                    const tooltipContent: string[] = []

                    //Format the header - let's assume it's a date (xAxis)
                    if (params.length > 0) {
                        const header = `<div class="${styles.chartTooltipTitle}">${formatDate(params[0].axisValueLabel, t('date-chart-tooltip'))}</div>`
                        // const header = `<div class="${styles.chartTooltipTitle}">${params[0].axisValueLabel}</div>`
                        tooltipContent.push(header)
                    }

                    // Loop through each element in params to display the values (yAxis)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    params.forEach((item: any) => {
                        if (item.seriesIndex === 5) {
                            return
                        }

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
                ...axisBaseConfig,
                axisLabel: {
                    formatter: (value: number) => formatDateFromUTC(value, t('date-only-hour')),
                    color: textPrimaryColor
                }
            },
            yAxis: [
                // Wind
                {
                    type: 'value',
                    ...axisBaseConfig
                },
                // Temperature
                {
                    type: 'value',
                    min: findMinValue(data, 'temperature'),
                    max: findMaxValue(data, 'temperature'),
                    ...axisBaseConfig
                },
                // Pressure
                {
                    type: 'value',
                    min: findMinValue(data, 'pressure'),
                    max: findMaxValue(data, 'pressure'),
                    ...axisBaseConfig
                },
                // Precipitation
                {
                    type: 'value',
                    ...axisBaseConfig
                },
                // Clouds
                {
                    min: 0,
                    max: 100,
                    type: 'value',
                    ...axisBaseConfig
                }
            ],
            series: [
                {
                    name: t('wind-speed'),
                    type: 'custom',
                    renderItem: renderArrow,
                    encode: {
                        x: DATA_INDEXES.date,
                        y: DATA_INDEXES.windSpeed
                    },
                    z: 10,
                    data: getSampledData(data || [], 50)?.map((item) => [item.date, item.windSpeed, item.windDeg])
                },
                {
                    name: t('temperature'),
                    type: 'line',
                    showSymbol: false,
                    smooth: false,
                    connectNulls: true,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: getSensorColor('temperature')[0],
                        width: 1
                    },
                    itemStyle: { color: getSensorColor('temperature')[0] },
                    data: data?.map((item) => [item.date, item.temperature])
                },
                {
                    name: t('pressure'),
                    type: 'line',
                    showSymbol: false,
                    smooth: false,
                    connectNulls: true,
                    yAxisIndex: 2,
                    lineStyle: {
                        color: getSensorColor('pressure')[0],
                        width: 1
                    },
                    itemStyle: { color: getSensorColor('pressure')[0] },
                    data: data?.map((item) => [item.date, item.pressure])
                },
                {
                    name: t('precipitation'),
                    type: 'bar',
                    yAxisIndex: 3,
                    lineStyle: {
                        color: getSensorColor('precipitation')[0],
                        width: 1
                    },
                    itemStyle: { color: getSensorColor('precipitation')[0] },
                    data: data?.map((item) => [item.date, item.precipitation])
                },
                {
                    name: t('clouds'),
                    type: 'line',
                    showSymbol: false,
                    smooth: false,
                    connectNulls: true,
                    yAxisIndex: 4,
                    z: 0,
                    lineStyle: {
                        color: getSensorColor('clouds')[0],
                        width: 1,
                        opacity: 0.3
                    },
                    itemStyle: {
                        opacity: 0.3,
                        color: getSensorColor('clouds')[0]
                    },
                    areaStyle: {
                        opacity: 0.3,
                        color: getSensorColor('clouds')[1]
                    },
                    data: data?.map((item) => [item.date, item.clouds])
                },
                {
                    name: t('weather-icon'),
                    type: 'custom',
                    renderItem: (params, api) => {
                        if (params.dataIndex === params.dataInsideLength - 1) {
                            return
                        }

                        const point = api.coord([api.value(DATA_INDEXES.date), 0])
                        const weatherIconUrl = getWeatherIconUrl(api.value(DATA_INDEXES.weatherId) as number)

                        return {
                            type: 'image',
                            style: {
                                image: weatherIconUrl,
                                x: point[0],
                                y: 0,
                                width: WEATHER_ICON_SIZE,
                                height: WEATHER_ICON_SIZE
                            }
                        }
                    },
                    data: getSampledData(data || [], weatherIconsCount)?.map((item) => [
                        item.date,
                        0,
                        0,
                        item.weatherId,
                        item.temperature
                    ])
                }
            ]
        }),
        [data, backgroundColor, textPrimaryColor, t, weatherIconsCount]
    )

    return (
        <div
            ref={containerRef}
            style={containerStyles}
        >
            <ReactECharts
                option={config}
                style={containerStyles}
            />
        </div>
    )
}

export default Meteogram
