import React from 'react'
import type { EChartsOption } from 'echarts'

import { render } from '@testing-library/react'

import PrecipTrendChart from './PrecipTrendChart'

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
    findMaxValue: jest.fn()
}))

const { findMaxValue } = jest.requireMock('@/tools/weather') as { findMaxValue: jest.Mock }

const mockData = [
    { date: '2024-01-01T00:00:00Z', precipitation: 0 },
    { date: '2024-01-01T01:00:00Z', precipitation: 1 }
]

describe('PrecipTrendChart', () => {
    beforeEach(() => {
        findMaxValue.mockReset()
    })

    it('renders echarts component', () => {
        findMaxValue.mockReturnValue(1)
        const { getByTestId } = render(<PrecipTrendChart data={mockData} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        findMaxValue.mockReturnValue(undefined)
        const { getByTestId } = render(<PrecipTrendChart />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('defaults missing precipitation readings to 0', () => {
        findMaxValue.mockReturnValue(1)
        render(<PrecipTrendChart data={[{ date: '2024-01-01T00:00:00Z' }]} />)
        const series = mockCapturedOption?.series as Array<{ data: unknown[] }>

        expect(series[0].data).toStrictEqual([0])
    })

    it('renders as a plain line with no area fill', () => {
        findMaxValue.mockReturnValue(1)
        render(<PrecipTrendChart data={mockData} />)
        const series = mockCapturedOption?.series as Array<{ areaStyle?: unknown }>

        expect(series[0].areaStyle).toBeUndefined()
    })

    it('starts the y-axis at 0 and gives the tallest spike headroom', () => {
        findMaxValue.mockReturnValue(1)
        render(<PrecipTrendChart data={mockData} />)
        const yAxis = mockCapturedOption?.yAxis as { min: number; max: number }

        expect(yAxis.min).toBe(0)
        expect(yAxis.max).toBe(2)
    })

    it('keeps a minimum y-axis scale of 2 during a dry period', () => {
        findMaxValue.mockReturnValue(0)
        render(<PrecipTrendChart data={mockData} />)
        const yAxis = mockCapturedOption?.yAxis as { max: number }

        expect(yAxis.max).toBe(2)
    })

    it('formats y-axis labels with one decimal place', () => {
        findMaxValue.mockReturnValue(1)
        render(<PrecipTrendChart data={mockData} />)
        const yAxis = mockCapturedOption?.yAxis as { axisLabel: { formatter: (value: number) => string } }

        expect(yAxis.axisLabel.formatter(1)).toBe('1.0')
        expect(yAxis.axisLabel.formatter(0)).toBe('0.0')
    })

    it('only shows an evenly spaced subset of x-axis labels', () => {
        findMaxValue.mockReturnValue(1)
        const manyPoints = Array.from({ length: 12 }, (_, i) => ({
            date: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
            precipitation: 0
        }))
        render(<PrecipTrendChart data={manyPoints} />)
        const xAxis = mockCapturedOption?.xAxis as { axisLabel: { interval: (index: number) => boolean } }
        const shownIndexes = Array.from({ length: 12 }, (_, i) => i).filter((i) => xAxis.axisLabel.interval(i))

        expect(shownIndexes).toStrictEqual([0, 3, 6, 8, 11])
    })
})
