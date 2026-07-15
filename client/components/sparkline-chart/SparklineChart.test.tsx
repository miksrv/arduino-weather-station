import React from 'react'
import type { EChartsOption } from 'echarts'

import { render } from '@testing-library/react'

import SparklineChart from './SparklineChart'

import '@testing-library/jest-dom'

let mockCapturedOption: EChartsOption | null = null

jest.mock('echarts-for-react', () => (props: { option: EChartsOption; style: unknown }) => {
    mockCapturedOption = props.option
    return (
        <div
            data-testid='echarts'
            data-option={JSON.stringify(props.option)}
        />
    )
})

jest.mock('echarts', () => ({
    graphic: {
        LinearGradient: jest.fn((_x0, _y0, _x1, _y1, stops) => ({ stops }))
    }
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('@/tools/colors', () => ({
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback),
    hexToRgba: jest.fn((hex: string, alpha: number) => `rgba(${hex},${alpha})`)
}))

const categories = ['00:00', '01:00', '02:00']
const values = [10, null, 20]

describe('SparklineChart', () => {
    it('renders the echarts component', () => {
        const { getByTestId } = render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('resolves axis colors to a literal value instead of an unresolvable CSS variable', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
            />
        )
        const xAxis = mockCapturedOption?.xAxis as {
            axisLine: { lineStyle: { color: string } }
            axisLabel: { color: string }
        }

        expect(xAxis.axisLine.lineStyle.color).toBe('rgba(#76787a,0.3)')
        expect(xAxis.axisLabel.color).toBe('#76787a')
    })

    it('omits the area style when areaOpacity is not given', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
            />
        )
        const series = mockCapturedOption?.series as Array<{ areaStyle?: unknown }>

        expect(series[0].areaStyle).toBeUndefined()
    })

    it('builds a gradient area style when areaOpacity is given', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
                areaOpacity={0.4}
            />
        )
        const series = mockCapturedOption?.series as Array<{ areaStyle?: unknown }>

        expect(series[0].areaStyle).toBeDefined()
    })

    it('reserves extra grid space and renders a title block when title is given', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
                title={'Температура (°C)'}
            />
        )
        const grid = mockCapturedOption?.grid as { top: number }
        const title = mockCapturedOption?.title as { text: string }

        expect(grid.top).toBe(32)
        expect(title.text).toBe('Температура (°C)')
    })

    it('omits the title block and uses a tighter grid when no title is given', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
            />
        )
        const grid = mockCapturedOption?.grid as { top: number }

        expect(mockCapturedOption?.title).toBeUndefined()
        expect(grid.top).toBe(8)
    })

    it('only shows an evenly spaced subset of x-axis labels', () => {
        const manyPoints = Array.from({ length: 12 }, (_, i) => String(i).padStart(2, '0') + ':00')
        render(
            <SparklineChart
                categories={manyPoints}
                values={manyPoints.map(() => 1)}
                color={'#2c7eec'}
            />
        )
        const xAxis = mockCapturedOption?.xAxis as { axisLabel: { interval: (index: number) => boolean } }
        const shownIndexes = Array.from({ length: 12 }, (_, i) => i).filter((i) => xAxis.axisLabel.interval(i))

        expect(shownIndexes).toEqual([0, 3, 6, 8, 11])
    })

    it('applies the given y-axis formatter and bounds', () => {
        render(
            <SparklineChart
                categories={categories}
                values={values}
                color={'#2c7eec'}
                yAxisMin={0}
                yAxisMax={30}
                yAxisLabelFormatter={(value) => value.toFixed(1)}
            />
        )
        const yAxis = mockCapturedOption?.yAxis as {
            min: number
            max: number
            axisLabel: { formatter: (v: number) => string }
        }

        expect(yAxis.min).toBe(0)
        expect(yAxis.max).toBe(30)
        expect(yAxis.axisLabel.formatter(1)).toBe('1.0')
    })
})
