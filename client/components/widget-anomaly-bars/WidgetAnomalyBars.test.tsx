import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyBars from './WidgetAnomalyBars'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('echarts-for-react', () => () => <div data-testid='echarts' />)

const mockData = [
    {
        avgClouds: 60,
        avgHumidity: 70,
        avgPressure: 1013,
        avgTemp: 8.0,
        avgWindSpeed: 3.5,
        frostDays: 80,
        heavyRainDays: 5,
        hotDays: 10,
        maxTemp: 35,
        minTemp: -20,
        precipDays: 90,
        tempAnomaly: -1.0,
        totalPrecip: 400,
        year: 2022
    },
    {
        avgClouds: 62,
        avgHumidity: 72,
        avgPressure: 1012,
        avgTemp: 11.0,
        avgWindSpeed: 3.8,
        frostDays: 70,
        heavyRainDays: 8,
        hotDays: 15,
        maxTemp: 38,
        minTemp: -18,
        precipDays: 95,
        tempAnomaly: 2.0,
        totalPrecip: 450,
        year: 2023
    }
]

describe('WidgetAnomalyBars', () => {
    it('shows Skeleton when loading', () => {
        render(<WidgetAnomalyBars loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })

    it('renders chart when not loading', () => {
        render(
            <WidgetAnomalyBars
                data={mockData}
                loading={false}
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })

    it('renders title', () => {
        render(<WidgetAnomalyBars />)
        expect(screen.getByText('temp-anomaly')).toBeInTheDocument()
    })

    it('renders without crashing with no data', () => {
        expect(() => render(<WidgetAnomalyBars loading={false} />)).not.toThrow()
    })
})
