import React from 'react'
import type { ECharts, EChartsOption } from 'echarts'
import type { Opts } from 'echarts-for-react/lib/types'

import dynamic from 'next/dynamic'

export interface EChartProps {
    option: EChartsOption
    style?: React.CSSProperties
    className?: string
    opts?: Opts
    notMerge?: boolean
    /** Charts of one group share the tooltip and the zoom (echarts.connect) */
    group?: string
    onChartReady?: (instance: ECharts) => void
}

// ECharts is canvas-only and heavy: it is loaded after hydration in its own chunk
const EChartCanvas = dynamic(() => import('./EChartCanvas'), { ssr: false })

/**
 * The one chart component of the site. The outer box takes the size from `style` on the server,
 * so the page does not jump when the chart arrives.
 */
const EChart: React.FC<EChartProps> = ({ style, className, ...props }) => (
    <div
        className={className}
        style={style}
    >
        <EChartCanvas {...props} />
    </div>
)

export default EChart
