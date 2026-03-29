import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetSnowpackChart from './WidgetSnowpackChart'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('echarts-for-react', () =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ onChartReady, style }: { onChartReady?: () => void; style?: React.CSSProperties }) => (
        <div
            data-testid='echarts'
            style={style}
        />
    )
)

jest.mock('echarts', () => ({
    connect: jest.fn(),
    ECharts: {}
}))

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({}))
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_date: string, _fmt: string) => 'formatted-date'
}))

const mockCurrentSeries = [
    { date: '2023-11-01', swe: 10 },
    { date: '2023-12-01', swe: 50 }
]

const mockComparisonYears = [
    {
        year: '2022-2023',
        maxSWE: 120,
        floodOccurred: false,
        series: [{ date: '2022-11-01', swe: 15 }],
        peakDate: null,
        temperatureSeries: [{ date: '2022-11-01', temperature: -5 }]
    },
    {
        year: '2023-2024',
        maxSWE: 200,
        floodOccurred: true,
        series: [{ date: '2023-11-01', swe: 80 }],
        peakDate: '2024-03-15',
        temperatureSeries: [{ date: '2023-11-01', temperature: -2 }]
    }
]

describe('WidgetSnowpackChart', () => {
    it('renders Skeleton when loading', () => {
        render(
            <WidgetSnowpackChart
                loading={true}
                currentSeries={[]}
                comparisonYears={[]}
                estimatedSWE={0}
                historicalAvgSWE={0}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })

    it('renders without crashing', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={95.7}
                historicalAvgSWE={110}
            />
        )
        expect(screen.getByText('swe-chart-title')).toBeInTheDocument()
    })

    it('renders two echarts (SWE + temperature)', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={95.7}
                historicalAvgSWE={110}
            />
        )
        expect(screen.getAllByTestId('echarts')).toHaveLength(2)
    })

    it('renders estimated SWE rounded to nearest integer', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={95.7}
                historicalAvgSWE={110}
            />
        )
        expect(screen.getByText('96')).toBeInTheDocument()
    })

    it('renders the comparison table', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={100}
                historicalAvgSWE={110}
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('renders with empty series and comparison years', () => {
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

    it('renders swe-current i18n label in the header', () => {
        render(
            <WidgetSnowpackChart
                currentSeries={mockCurrentSeries}
                comparisonYears={mockComparisonYears}
                estimatedSWE={50}
                historicalAvgSWE={70}
            />
        )
        // The sweValue span has mixed content: 'swe-current: <strong>50</strong> swe-unit'
        // Use regex to match the combined text of the parent span
        expect(screen.getByText(/swe-current/)).toBeInTheDocument()
    })
})
