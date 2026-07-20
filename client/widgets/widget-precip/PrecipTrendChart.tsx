import React, { useMemo } from 'react'

import { ApiModel } from '@/api'
import SparklineChart from '@/components/sparkline-chart'
import { statChartColor } from '@/tools/colors'
import { formatDate } from '@/tools/date'
import { findMaxValue } from '@/tools/weather'

interface PrecipTrendChartProps {
    data?: ApiModel.Weather[]
}

const formatOneDecimal = (value: number): string => value.toFixed(1)

const PrecipTrendChart: React.FC<PrecipTrendChartProps> = ({ data }) => {
    const categories = useMemo(() => data?.map((item) => formatDate(item?.date, 'HH:mm')) ?? [], [data])
    const values = useMemo(() => data?.map((item) => item?.precipitation ?? 0) ?? [], [data])

    // Give the tallest spike headroom instead of letting it touch the top of the chart,
    // and keep a sensible minimum scale so a dry period doesn't look like a broken chart.
    const rawMax = findMaxValue(data, 'precipitation') ?? 0
    const axisMax = Math.max(2, Math.ceil(rawMax * 2))

    return (
        <SparklineChart
            categories={categories}
            values={values}
            color={statChartColor[0]}
            yAxisMin={0}
            yAxisMax={axisMax}
            yAxisLabelFormatter={formatOneDecimal}
        />
    )
}

export default PrecipTrendChart
