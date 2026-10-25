import React, { useMemo } from 'react'

import { ApiModel } from '@/api'
import SparklineChart from '@/components/sparkline-chart'
import { statChartColor } from '@/tools/colors'
import { formatDate } from '@/tools/date'
import { findMaxValue, findMinValue } from '@/tools/weather'

interface StatTrendChartProps {
    data?: ApiModel.Weather[]
    source?: keyof ApiModel.Sensors
}

const roundYAxisLabel = (value: number): string => `${Math.round(value)}`

// Real values on the axis: the area is filled down to the bottom of the axis (SparklineChart),
// so negative temperatures don't need shifting
const StatTrendChart: React.FC<StatTrendChartProps> = ({ data: weatherData, source }) => {
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
