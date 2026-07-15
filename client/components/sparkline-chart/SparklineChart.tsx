import React, { useMemo } from 'react'
import { EChartsOption, graphic } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { useTheme } from 'next-themes'

import { hexToRgba, resolveCssVar } from '@/tools/colors'

/** Maximum number of evenly spaced x-axis labels shown, regardless of point count. */
const MAX_X_AXIS_LABELS = 5

export interface SparklineChartProps {
    /** Pre-formatted x-axis category labels (e.g. "14:00" or "12.03"), one per data point. */
    categories: string[]
    /** Series values, one per category; null/undefined points leave a gap bridged by connectNulls. */
    values: Array<number | null | undefined>
    /** Line and area fill color, as a '#rrggbb' hex string. */
    color: string
    /** Chart height in pixels. */
    height?: number
    /** Optional title rendered above the chart; reserves extra grid space when set. */
    title?: string
    /** Explicit y-axis minimum; omit to let ECharts auto-scale. */
    yAxisMin?: number
    /** Explicit y-axis maximum; omit to let ECharts auto-scale. */
    yAxisMax?: number
    /** Formats y-axis tick labels; omit for ECharts' default number formatting. */
    yAxisLabelFormatter?: (value: number) => string
    /** Number of y-axis gridlines/ticks. */
    yAxisSplitNumber?: number
    /** Gradient fill opacity under the line (0-1); omit for a plain line with no area fill. */
    areaOpacity?: number
    /** Line stroke width. */
    lineWidth?: number
}

/**
 * Shared small line-chart building block for the sensor/dashboard widgets (stat trend, precipitation
 * trend, mini charts panel). Centralizes the ECharts option boilerplate — grid, x-axis label thinning,
 * axis styling, area gradient — that was previously duplicated across those widgets.
 */
const SparklineChart: React.FC<SparklineChartProps> = ({
    categories,
    values,
    color,
    height = 110,
    title,
    yAxisMin,
    yAxisMax,
    yAxisLabelFormatter,
    yAxisSplitNumber = 2,
    areaOpacity,
    lineWidth = 2
}) => {
    const { theme } = useTheme()

    const option: EChartsOption = useMemo(() => {
        const textColor = resolveCssVar('--text-color-secondary', '#76787a')

        const xAxisLength = categories.length
        const labelCount = Math.min(MAX_X_AXIS_LABELS, xAxisLength)
        const labelIndexes = new Set(
            Array.from({ length: labelCount }, (_, i) => Math.round((i * (xAxisLength - 1)) / (labelCount - 1 || 1)))
        )

        return {
            tooltip: { show: false },
            ...(title && {
                title: {
                    text: title,
                    top: 0,
                    left: 'center',
                    textStyle: { color: textColor, fontSize: 12, fontWeight: 500 }
                }
            }),
            grid: {
                left: 4,
                right: 8,
                top: title ? 32 : 8,
                bottom: 4,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLine: { lineStyle: { color: hexToRgba(textColor, 0.3) } },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: textColor,
                    fontSize: 11,
                    interval: (index: number) => labelIndexes.has(index)
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                min: yAxisMin,
                max: yAxisMax,
                splitNumber: yAxisSplitNumber,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: textColor,
                    fontSize: 11,
                    ...(yAxisLabelFormatter && { formatter: yAxisLabelFormatter })
                },
                splitLine: { show: false }
            },
            series: [
                {
                    data: values,
                    type: 'line',
                    smooth: false,
                    showSymbol: false,
                    connectNulls: true,
                    lineStyle: { color, width: lineWidth },
                    itemStyle: { color },
                    ...(areaOpacity && {
                        areaStyle: {
                            color: new graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: hexToRgba(color, areaOpacity) },
                                { offset: 1, color: hexToRgba(color, 0) }
                            ])
                        }
                    })
                }
            ]
        }
    }, [
        categories,
        values,
        color,
        title,
        yAxisMin,
        yAxisMax,
        yAxisLabelFormatter,
        yAxisSplitNumber,
        areaOpacity,
        lineWidth,
        theme
    ])

    return (
        <ReactECharts
            option={option}
            style={{ height, width: '100%' }}
        />
    )
}

export default SparklineChart
