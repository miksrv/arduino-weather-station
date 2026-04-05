import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetSummary from './WidgetSummary'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('@/components/weather-icon', () => () => <span data-testid='weather-icon' />)
jest.mock('@/tools/conditions', () => ({
    getWeatherI18nKey: (id: unknown) => `conditions.${String(id)}`
}))
jest.mock('@/tools/helpers', () => ({
    round: (value: number) => value
}))
jest.mock('@/tools/weather', () => ({
    convertHpaToMmHg: (hpa: number) => hpa
}))

describe('WidgetSummary', () => {
    it('renders the location title', () => {
        render(<WidgetSummary />)
        expect(screen.getByText('weather-in-orenburg')).toBeInTheDocument()
    })

    it('renders GMT offset', () => {
        render(<WidgetSummary />)
        expect(screen.getByText('(GMT+5)')).toBeInTheDocument()
    })

    it('renders skeleton placeholders while loading', () => {
        render(<WidgetSummary loading />)
        // Skeletons are rendered from simple-react-ui-kit mock — ensure no weather icon
        expect(screen.queryByTestId('weather-icon')).not.toBeInTheDocument()
    })

    it('renders weather icon when not loading', () => {
        render(<WidgetSummary weather={{ weatherId: 800, temperature: 20 }} />)
        expect(screen.getByTestId('weather-icon')).toBeInTheDocument()
    })

    it('renders temperature value', () => {
        render(<WidgetSummary weather={{ temperature: 22.5 }} />)
        expect(screen.getByText('22.5')).toBeInTheDocument()
    })

    it('renders wind speed badge', () => {
        render(<WidgetSummary weather={{ windSpeed: 5 }} />)
        expect(screen.getByText(/meters-per-second/)).toBeInTheDocument()
    })

    it('renders humidity badge', () => {
        render(<WidgetSummary weather={{ humidity: 60 }} />)
        expect(screen.getByText(/60 %/)).toBeInTheDocument()
    })

    it('renders weather condition key', () => {
        render(<WidgetSummary weather={{ weatherId: 800 }} />)
        expect(screen.getByText('conditions.800')).toBeInTheDocument()
    })

    it('renders with no props without crashing', () => {
        const { container } = render(<WidgetSummary />)
        expect(container).toBeInTheDocument()
    })

    it('renders no-data fallback when weather values are undefined', () => {
        render(<WidgetSummary weather={{}} />)
        // Each badge should contain 'no-data' translation key when value is missing
        const noDataElements = screen.getAllByText(/no-data/)
        expect(noDataElements.length).toBeGreaterThanOrEqual(4)
    })
})
