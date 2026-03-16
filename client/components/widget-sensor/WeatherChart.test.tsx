import React from 'react'

import { render } from '@testing-library/react'

import WeatherChart from './WeatherChart'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('echarts', () => ({
    graphic: {
        LinearGradient: jest.fn((_x0, _y0, _x1, _y1, stops) => ({ stops }))
    }
}))

jest.mock('@/tools/colors', () => ({
    getSensorColor: jest.fn(() => ['#e53935', '#f25755'])
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

describe('WeatherChart', () => {
    it('renders echarts component', () => {
        const { getByTestId } = render(<WeatherChart data={mockData} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<WeatherChart />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with source prop', () => {
        const { getByTestId } = render(
            <WeatherChart
                data={mockData}
                source='temperature'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with temperature-like source that triggers invertData', () => {
        const { getByTestId } = render(
            <WeatherChart
                data={mockData}
                source='feelsLike'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with non-temperature source', () => {
        const { getByTestId } = render(
            <WeatherChart
                data={mockData}
                source='humidity'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
