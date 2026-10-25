import React, { useCallback, useMemo } from 'react'
import type { ECharts } from 'echarts'
import ReactEChartsCore from 'echarts-for-react/lib/core'

import type { EChartProps } from './EChart'
import echarts from './registry'

/** The page font (Geist, under its next/font name) for the canvas text, which can't read CSS variables */
const getPageFont = (): string | undefined =>
    typeof document === 'undefined' ? undefined : getComputedStyle(document.body).fontFamily || undefined

const EChartCanvas: React.FC<EChartProps> = ({ group, onChartReady, option, ...props }) => {
    const fontFamily = useMemo(getPageFont, [])
    const themedOption = useMemo(
        () => (fontFamily ? { ...option, textStyle: { fontFamily, ...option.textStyle } } : option),
        [option, fontFamily]
    )

    const handleReady = useCallback(
        (instance: ECharts) => {
            if (group) {
                instance.group = group
                echarts.connect(group)
            }

            onChartReady?.(instance)
        },
        [group, onChartReady]
    )

    return (
        <ReactEChartsCore
            {...props}
            option={themedOption}
            echarts={echarts}
            style={{ height: '100%', width: '100%' }}
            onChartReady={handleReady}
        />
    )
}

export default EChartCanvas
