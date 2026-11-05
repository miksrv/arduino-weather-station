import React, { useMemo } from 'react'

import { useTheme } from 'next-themes'

import { ApiModel } from '@/api'
import SparklineChart from '@/components/sparkline-chart'
import { getSensorColor } from '@/tools/colors'
import { formatDate } from '@/tools/date'
import { findMaxValue, findMinValue } from '@/tools/weather'

interface StatTrendChartProps {
    data?: ApiModel.Weather[]
    source?: keyof ApiModel.Sensors
}

/** Whole numbers on the axis, or tenths when the day's range is too narrow for whole numbers to differ */
export const getYAxisLabelFormatter =
    (min?: number, max?: number) =>
    (value: number): string =>
        min !== undefined && max !== undefined && max - min < 3 ? value.toFixed(1) : `${Math.round(value)}`

// Real values on the axis: the area is filled down to the bottom of the axis (SparklineChart),
// so negative temperatures don't need shifting. The line is in the hue of the quantity, as on every chart
const StatTrendChart: React.FC<StatTrendChartProps> = ({ data: weatherData, source }) => {
    const { resolvedTheme: theme } = useTheme()

    const categories = useMemo(() => weatherData?.map((item) => formatDate(item?.date, 'HH:mm')) ?? [], [weatherData])

    const values = useMemo(
        () => weatherData?.map((item) => (source ? item?.[source] : null)) ?? [],
        [weatherData, source]
    )

    const min = findMinValue(weatherData, source)
    const max = findMaxValue(weatherData, source)

    return (
        <SparklineChart
            categories={categories}
            values={values}
            color={getSensorColor(source, theme)[0]}
            yAxisMin={min}
            yAxisMax={max}
            yAxisLabelFormatter={getYAxisLabelFormatter(min, max)}
            areaOpacity={0.45}
        />
    )
}

export default StatTrendChart
