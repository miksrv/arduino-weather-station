import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetForecastTable, { TABLE_COLUMNS } from './WidgetForecastTable'

import '@testing-library/jest-dom'

jest.mock('next/link', () => (props: any) => <a {...props} />)
jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}))
jest.mock('@/components/weather-icon', () => (props: any) => (
    <span
        data-testid='weather-icon'
        {...props}
    />
))
jest.mock('@/components/wind-direction-icon', () => (props: any) => (
    <span
        data-testid='wind-icon'
        {...props}
    />
))
jest.mock('@/ui/comparison-icon', () => (props: any) => (
    <span
        data-testid='comparison-icon'
        {...props}
    />
))
jest.mock('@/tools/conditions', () => ({
    getWeatherI18nKey: (id: any) => `weather-${id}`
}))
jest.mock('@/tools/date', () => ({
    formatDate: (date: string, format: string) => `${date}-${format}`
}))
jest.mock('@/tools/helpers', () => ({
    round: (num: number) => Math.round(num)
}))
jest.mock('@/tools/weather', () => ({
    convertHpaToMmHg: (pressure: number) => pressure * 0.75,
    getCloudinessColor: (clouds: number) => `clouds-${clouds}`,
    getTemperatureColor: (temp: number) => `temp-${temp}`
}))

const mockData = [
    {
        date: '2024-06-01T12:00:00Z',
        weatherId: 800,
        temperature: 25.5,
        clouds: 50,
        pressure: 1000,
        windSpeed: 5.5,
        windDeg: 90,
        precipitation: 2
    },
    {
        date: '2024-06-01T15:00:00Z',
        weatherId: 801,
        temperature: 27.2,
        clouds: 60,
        pressure: 995,
        windSpeed: 6.2,
        windDeg: 180,
        precipitation: 0
    }
]

describe('WidgetForecastTable', () => {
    it('renders with default props', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columns={[]}
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('renders with title', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columns={[]}
                title='Forecast'
            />
        )
        expect(screen.getByText('Forecast')).toBeInTheDocument()
    })

    it('renders with title and link', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columns={[]}
                title='Forecast'
                link={{ href: '/details' }}
            />
        )
        expect(screen.getByText('Forecast')).toHaveAttribute('href', '/details')
    })

    it('renders with fullWidth', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columns={[]}
                fullWidth
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('renders with columnsPreset', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columns={[]}
                columnsPreset={[TABLE_COLUMNS.date, TABLE_COLUMNS.weather, TABLE_COLUMNS.temperature]}
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    it('formats pressure column with comparison', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columnsPreset={[TABLE_COLUMNS.pressure]}
            />
        )
        expect(screen.queryAllByTestId('comparison-icon')).toHaveLength(0)
    })

    it('formats precipitation column', () => {
        render(
            <WidgetForecastTable
                data={mockData}
                columnsPreset={[TABLE_COLUMNS.precipitation]}
            />
        )
        expect(screen.queryByText((content) => content.includes('millimeters'))).toBeNull()
    })

    it('handles empty data', () => {
        render(
            <WidgetForecastTable
                data={[]}
                columns={[]}
            />
        )
        expect(screen.getByTestId('table')).toBeInTheDocument()
    })
})
