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

const mockUseTheme = jest.fn(() => ({ theme: 'dark' }))

jest.mock('next-themes', () => ({
    useTheme: () => mockUseTheme()
}))

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({
        backgroundColor: '#2c2d2e',
        grid: {},
        legend: {},
        series: []
    }))
}))

jest.mock('@/tools/date', () => ({
    formatDateFromUTC: jest.fn(() => '01 Jan')
}))

jest.mock('@/tools/helpers', () => ({
    round: jest.fn((v: number) => v)
}))

const mockData = [
    {
        year: '2023',
        weather: [
            { date: '2023-06-15T12:00:00Z', temperature: 25 },
            { date: '2023-06-16T12:00:00Z', temperature: 22 }
        ]
    },
    {
        year: '2022',
        weather: [
            { date: '2022-06-15T12:00:00Z', temperature: 20 },
            { date: '2022-06-16T12:00:00Z', temperature: 18 }
        ]
    }
]

describe('Chart (widget-climate)', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue({ theme: 'dark' })
    })

    it('renders with data', () => {
        const { getByTestId } = render(
            <Chart
                data={mockData}
                height='450px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders without data', () => {
        const { getByTestId } = render(<Chart />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with empty data array', () => {
        const { getByTestId } = render(<Chart data={[]} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with custom height', () => {
        const { getByTestId } = render(
            <Chart
                data={mockData}
                height='600px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders with data containing items without date', () => {
        const dataWithoutDate = [
            {
                year: '2023',
                weather: [{ date: undefined, temperature: 25 }]
            }
        ]
        const { getByTestId } = render(<Chart data={dataWithoutDate} />)
        expect(getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders in light theme without crashing', () => {
        mockUseTheme.mockReturnValue({ theme: 'light' })
        const { getByTestId } = render(
            <Chart
                data={mockData}
                height='300px'
            />
        )
        expect(getByTestId('echarts')).toBeInTheDocument()
    })
})
