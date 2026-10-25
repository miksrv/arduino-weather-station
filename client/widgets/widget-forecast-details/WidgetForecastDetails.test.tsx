import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetForecastDetails from './WidgetForecastDetails'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${JSON.stringify(values)}` : key)
    })
}))

describe('WidgetForecastDetails', () => {
    it('shows a skeleton while loading', () => {
        render(<WidgetForecastDetails loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('says the forecast is unavailable without today', () => {
        render(<WidgetForecastDetails />)
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
        expect(screen.getByText('forecast-unavailable')).toBeInTheDocument()
    })

    it('shows the six figures of the day', () => {
        render(
            <WidgetForecastDetails
                today={{
                    humidity: 69,
                    pressure: 1011,
                    dewPoint: -4.67,
                    uvIndex: 1.1,
                    windSpeedMax: 5.03,
                    windGust: 8.75,
                    clouds: 69
                }}
            />
        )

        expect(screen.getAllByRole('definition')).toHaveLength(6)
        expect(screen.getByText('758.3 mm-hg')).toBeInTheDocument()
        expect(screen.getByText('−5°')).toBeInTheDocument()
        expect(screen.getByText('uv-category-low')).toBeInTheDocument()
        expect(screen.getByText('5 meters-per-second')).toBeInTheDocument()
        expect(screen.getByText('forecast-gusts {"value":9}')).toBeInTheDocument()
        expect(screen.getAllByText('69%')).toHaveLength(2)
    })
})
