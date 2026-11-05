import React from 'react'
import type { EChartsOption } from 'echarts'

import { render } from '@testing-library/react'

import StatTrendChart, { getYAxisLabelFormatter } from './StatTrendChart'

import '@testing-library/jest-dom'

let mockCapturedOption: EChartsOption | null = null

jest.mock('@/components/echart', () => (props: { option: EChartsOption; style: unknown }) => {
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
    useTheme: jest.fn(() => ({ theme: 'light', resolvedTheme: 'light' }))
}))

jest.mock('@/tools/colors', () => ({
    getSensorColor: jest.fn((sensor: string) => [sensor === 'precipitation' ? '#3b8ced' : '#ef5359']),
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback),
    hexToRgba: jest.fn((hex: string, alpha: number) => `rgba(${hex},${alpha})`)
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_date: unknown, _fmt: unknown) => '12:00'
}))

jest.mock('@/tools/weather', () => ({
    findMinValue: jest.fn(() => 10),
    findMaxValue: jest.fn(() => 30)
}))

const mockData = [
    { date: '2024-01-01T00:00:00Z', temperature: 20 },
    { date: '2024-01-01T01:00:00Z', temperature: 22 }
]

describe('StatTrendChart', () => {
    it('renders echarts component', () => {
        const { getByTestId } = render(<StatTrendChart data={mockData} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<StatTrendChart />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with source prop', () => {
        const { getByTestId } = render(
            <StatTrendChart
                data={mockData}
                source='temperature'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with a temperature-like source', () => {
        const { getByTestId } = render(
            <StatTrendChart
                data={mockData}
                source='feelsLike'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with non-temperature source', () => {
        const { getByTestId } = render(
            <StatTrendChart
                data={mockData}
                source='humidity'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('takes the axis colors from the chart tokens, not from CSS variables', () => {
        const { getByTestId } = render(
            <StatTrendChart
                data={mockData}
                source='temperature'
            />
        )
        const option = JSON.parse(getByTestId('echarts').getAttribute('data-option') ?? '{}')

        expect(option.xAxis.axisLine.lineStyle.color).toBe('#e6e4dc')
        expect(option.xAxis.axisLabel.color).toBe('#5f5e57')
        expect(option.yAxis.axisLabel.color).toBe('#5f5e57')
        expect(JSON.stringify(option)).not.toContain('var(--text-color-secondary)')
    })

    it('rounds y-axis labels to whole numbers', () => {
        render(
            <StatTrendChart
                data={mockData}
                source='temperature'
            />
        )
        const yAxis = mockCapturedOption?.yAxis as { axisLabel: { formatter: (value: number) => string } }

        expect(yAxis.axisLabel.formatter(28.684)).toBe('29')
        expect(yAxis.axisLabel.formatter(14.2)).toBe('14')
    })

    it('only shows an evenly spaced subset of x-axis labels', () => {
        const manyPoints = Array.from({ length: 12 }, (_, i) => ({
            date: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
            temperature: 20
        }))
        render(
            <StatTrendChart
                data={manyPoints}
                source='temperature'
            />
        )
        const xAxis = mockCapturedOption?.xAxis as { axisLabel: { interval: (index: number) => boolean } }
        const shownIndexes = Array.from({ length: 12 }, (_, i) => i).filter((i) => xAxis.axisLabel.interval(i))

        expect(shownIndexes).toEqual([0, 3, 6, 8, 11])
        expect(shownIndexes).toHaveLength(5)
    })

    it('draws the line in the hue of the quantity', () => {
        render(
            <StatTrendChart
                data={mockData}
                source={'temperature'}
            />
        )
        expect(JSON.stringify(mockCapturedOption)).toContain('#ef5359')
    })

    it('labels a narrow range in tenths so the ticks differ', () => {
        expect(getYAxisLabelFormatter(760.6, 761.3)(760.95)).toBe('761.0')
        expect(getYAxisLabelFormatter(1, 8.2)(4.6)).toBe('5')
    })
})
