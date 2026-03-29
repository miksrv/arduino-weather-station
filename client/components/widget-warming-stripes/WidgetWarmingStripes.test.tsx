import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetWarmingStripes from './WidgetWarmingStripes'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

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

describe('WidgetWarmingStripes', () => {
    it('renders skeleton when loading', () => {
        render(<WidgetWarmingStripes loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders title in both loading and loaded states', () => {
        render(<WidgetWarmingStripes loading={true} />)
        expect(screen.getByText('warming-stripes')).toBeInTheDocument()
    })

    it('renders stripes when data is provided', () => {
        render(
            <WidgetWarmingStripes
                data={mockData}
                loading={false}
            />
        )
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
        expect(screen.getByText('warming-stripes')).toBeInTheDocument()
    })

    it('renders without crashing with empty data', () => {
        expect(() => render(<WidgetWarmingStripes data={[]} />)).not.toThrow()
    })

    it('renders without crashing with no props', () => {
        expect(() => render(<WidgetWarmingStripes />)).not.toThrow()
    })
})
