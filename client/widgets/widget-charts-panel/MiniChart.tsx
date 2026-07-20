import React, { useMemo } from 'react'

import { ApiModel } from '@/api'
import SparklineChart from '@/components/sparkline-chart'
import { formatDate } from '@/tools/date'

interface MiniChartProps {
    title: string
    data?: ApiModel.Weather[]
    source: keyof ApiModel.Sensors
    color: string
    dateFormat: string
    /** Forces the y-axis to start at 0, for sensors that can't go negative (wind speed, precipitation). */
    zeroBased?: boolean
}

const MiniChart: React.FC<MiniChartProps> = ({ title, data, source, color, dateFormat, zeroBased }) => {
    const categories = useMemo(() => data?.map((item) => formatDate(item?.date, dateFormat)) ?? [], [data, dateFormat])
    const values = useMemo(() => data?.map((item) => item?.[source] ?? null) ?? [], [data, source])

    return (
        <SparklineChart
            categories={categories}
            values={values}
            color={color}
            height={180}
            title={title}
            yAxisMin={zeroBased ? 0 : undefined}
            yAxisSplitNumber={3}
            areaOpacity={0.4}
            lineWidth={1.5}
        />
    )
}

export default MiniChart
