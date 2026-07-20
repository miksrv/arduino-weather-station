import React from 'react'
import type { EChartsOption } from 'echarts'

import { render } from '@testing-library/react'

import StatTrendChart from './StatTrendChart'

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
    statChartColor: ['#2c7eec', '#468de8'],
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback),
    hexToRgba: jest.fn((hex: string, alpha: number) => `rgba(${hex},${alpha})`)
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_date: unknown, _fmt: unknown) => '12:00'
}))

jest.mock('@/tools/weather', () => ({
    findMinValue: jest.fn(() => 10),
    findMaxValue: jest.fn(() => 30),
    invertData: jest.fn((data) => data)
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

    it('renders with temperature-like source that triggers invertData', () => {
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

    it('resolves axis colors to a literal value instead of an unresolvable CSS variable', () => {
        const { getByTestId } = render(
            <StatTrendChart
                data={mockData}
                source='temperature'
            />
        )
        const option = JSON.parse(getByTestId('echarts').getAttribute('data-option') ?? '{}')

        expect(option.xAxis.axisLine.lineStyle.color).toBe('rgba(#76787a,0.3)')
        expect(option.xAxis.axisLabel.color).toBe('#76787a')
        expect(option.yAxis.axisLabel.color).toBe('#76787a')
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
})
