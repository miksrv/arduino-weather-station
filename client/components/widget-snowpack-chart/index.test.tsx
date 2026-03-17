import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetSnowpackChart from './index'

import '@testing-library/jest-dom'

jest.mock('echarts', () => ({
    connect: jest.fn(),
    graphic: {
        LinearGradient: jest.fn(() => ({}))
    }
}))

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown; onChartReady?: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({}))
}))

const mockCurrentSeries = [
    { date: '2024-01-15', swe: 120 },
    { date: '2024-02-15', swe: 180 }
]

const mockComparisonYears = [
    { year: '2021-2022', maxSWE: 95, floodOccurred: false, series: [], peakDate: null, temperatureSeries: [] },
    { year: '2022-2023', maxSWE: 110, floodOccurred: false, series: [], peakDate: null, temperatureSeries: [] },
    {
        year: '2023-2024',
        maxSWE: 220,
        floodOccurred: true,
        series: [
            { date: '2024-02-01', swe: 180 },
            { date: '2024-03-01', swe: 220 }
        ],
        peakDate: '2024-03-01',
        temperatureSeries: [
            { date: '2024-02-01', temperature: -5 },
            { date: '2024-03-01', temperature: 2 }
        ]
    }
]

describe('WidgetSnowpackChart', () => {
    it('renders the chart wrapper', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={150}
                historicalAvgSWE={100}
            />
        )
        expect(screen.getAllByTestId('echarts')).toHaveLength(2)
    })

    it('renders the winter comparison table with the correct number of rows', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={150}
                historicalAvgSWE={100}
            />
        )
        // One row per comparison year
        const rows = screen.getAllByRole('row')
        // thead has 1 row, tbody has 3 rows
        expect(rows).toHaveLength(4)
    })

    it('renders year labels from comparison data', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={150}
                historicalAvgSWE={100}
            />
        )
        expect(screen.getByText('2021-2022')).toBeInTheDocument()
        expect(screen.getByText('2022-2023')).toBeInTheDocument()
        expect(screen.getByText('2023-2024')).toBeInTheDocument()
    })

    it('marks the flood-year row with a distinct class', () => {
        const { container } = render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={150}
                historicalAvgSWE={100}
            />
        )
        const floodRow = container.querySelector('tr.floodYearRow')
        expect(floodRow).toBeInTheDocument()
    })

    it('renders with empty series without crashing', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={[]}
                comparisonYears={[]}
                estimatedSWE={0}
                historicalAvgSWE={0}
            />
        )
        expect(screen.getAllByTestId('echarts')).toHaveLength(2)
    })
})
