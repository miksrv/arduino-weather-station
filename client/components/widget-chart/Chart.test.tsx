import React from 'react'

import { render } from '@testing-library/react'

import Chart from './Chart'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'dark' }))
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({
        backgroundColor: '#2c2d2e',
        grid: {},
        legend: {},
        series: [{ type: 'line', showSymbol: false, smooth: false, connectNulls: true }]
    }))
}))

jest.mock('@/tools/date', () => ({
    formatDateFromUTC: jest.fn(() => 'Jan 01')
}))

jest.mock('@/tools/helpers', () => ({
    round: jest.fn((v: number) => v)
}))

jest.mock('@/tools/colors', () => ({
    getSensorColor: jest.fn(() => ['#e53935', '#f25755'])
}))

jest.mock('@/tools/weather', () => ({
    findMinValue: jest.fn(() => 0),
    findMaxValue: jest.fn(() => 100)
}))

const mockData = [
    {
        date: '2024-01-01T00:00:00Z',
        temperature: 20,
        feelsLike: 18,
        dewPoint: 15,
        clouds: 50,
        windSpeed: 5,
        pressure: 1013,
        precipitation: 2
    }
]

describe('Chart (widget-chart)', () => {
    it('renders for temperature type', () => {
        const { getByTestId } = render(
            <Chart
                type='temperature'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for clouds type', () => {
        const { getByTestId } = render(
            <Chart
                type='clouds'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders for pressure type', () => {
        const { getByTestId } = render(
            <Chart
                type='pressure'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<Chart type='temperature' />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
        const { getByTestId } = render(
            <Chart
                type='temperature'
                height='400px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with custom dateFormat', () => {
        const { getByTestId } = render(
            <Chart
                type='temperature'
                data={mockData}
                dateFormat='DD.MM'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
