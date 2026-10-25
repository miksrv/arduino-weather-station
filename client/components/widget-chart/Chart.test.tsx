import React from 'react'

import { render } from '@testing-library/react'

import Chart from './Chart'

import '@testing-library/jest-dom'

jest.mock('@/components/echart', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

const mockUseTheme = jest.fn(() => ({ theme: 'dark', resolvedTheme: 'dark' }))

jest.mock('next-themes', () => ({
    useTheme: () => mockUseTheme()
}))

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools', () => ({
    ...jest.requireActual('@/tools'),
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
    ...jest.requireActual('@/tools/weather'),
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
    beforeEach(() => {
        mockUseTheme.mockReturnValue({ theme: 'dark', resolvedTheme: 'dark' })
    })

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

    it('shows pressure in mm Hg, not in hPa', () => {
        const { getByTestId } = render(
            <Chart
                type='pressure'
                data={mockData}
            />
        )
        const option = JSON.parse(getByTestId('echarts').getAttribute('data-option') ?? '{}')

        expect(option.series[0].data[0][1]).toBeCloseTo(759.8, 1)
        expect(option.yAxis[0].axisLabel.formatter).toBe('{value} mm-hg')
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

    it('renders in light theme without crashing', () => {
        mockUseTheme.mockReturnValue({ theme: 'light', resolvedTheme: 'light' })
        const { getByTestId } = render(
            <Chart
                type='temperature'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders clouds type in light theme', () => {
        mockUseTheme.mockReturnValue({ theme: 'light', resolvedTheme: 'light' })
        const { getByTestId } = render(
            <Chart
                type='clouds'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders pressure type in light theme', () => {
        mockUseTheme.mockReturnValue({ theme: 'light', resolvedTheme: 'light' })
        const { getByTestId } = render(
            <Chart
                type='pressure'
                data={mockData}
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
