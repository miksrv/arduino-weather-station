import React, { useMemo } from 'react'

import { ApiModel } from '@/api'
import SparklineChart from '@/components/sparkline-chart'
import { statChartColor } from '@/tools/colors'
import { formatDate } from '@/tools/date'
import { findMaxValue, findMinValue, invertData } from '@/tools/weather'

interface StatTrendChartProps {
    data?: ApiModel.Weather[]
    source?: keyof ApiModel.Sensors
}

/** Sources that can dip negative, where the trend line is inverted so it never looks "flipped". */
const INVERTIBLE_SOURCES: Array<keyof ApiModel.Sensors> = ['temperature', 'feelsLike', 'dewPoint']

const roundYAxisLabel = (value: number): string => `${Math.round(value)}`

const StatTrendChart: React.FC<StatTrendChartProps> = ({ data, source }) => {
    const weatherData = useMemo(
        () => (source && INVERTIBLE_SOURCES.includes(source) ? invertData(data, source) : data),
        [data, source]
    )

    const categories = useMemo(() => weatherData?.map((item) => formatDate(item?.date, 'HH:mm')) ?? [], [weatherData])

    const values = useMemo(
        () => weatherData?.map((item) => (source ? item?.[source] : null)) ?? [],
        [weatherData, source]
    )

    return (
        <SparklineChart
            categories={categories}
            values={values}
            color={statChartColor[0]}
            yAxisMin={findMinValue(weatherData, source)}
            yAxisMax={findMaxValue(weatherData, source)}
            yAxisLabelFormatter={roundYAxisLabel}
            areaOpacity={0.45}
        />
    )
}

export default StatTrendChart
