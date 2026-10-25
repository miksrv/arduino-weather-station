import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetForecastToday from './WidgetForecastToday'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${JSON.stringify(values)}` : key)
    })
}))
// eslint-disable-next-line next/no-img-element
jest.mock('next/image', () => (props: { alt: string }) => <img alt={props.alt} />)

const today = {
    date: '2026-10-24 00:00:00',
    temperatureMin: -3.1,
    temperatureMax: 4.7,
    precipitation: 2.5,
    windSpeed: 3,
    windGust: 8,
    weatherId: 616
}

describe('WidgetForecastToday', () => {
    it('shows a skeleton while loading', () => {
        render(<WidgetForecastToday loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('shows the station reading now and the forecast high and low', () => {
        render(
            <WidgetForecastToday
                current={{ temperature: -1.52, feelsLike: -6.4, date: '2026-10-24 01:00:00' }}
                today={today}
            />
        )

        expect(screen.getByText('-1.5')).toBeInTheDocument()
        expect(screen.getByText('+5°')).toBeInTheDocument()
        expect(screen.getByText('−3°')).toBeInTheDocument()
        expect(screen.getByText(/forecast-feels-like/)).toHaveTextContent('−6°')
    })

    it('writes the day in one sentence: condition, temperatures, precipitation, wind', () => {
        render(<WidgetForecastToday today={today} />)

        const summary = screen.getByText(/forecast-summary-temperature/)
        expect(summary).toHaveTextContent('forecast-summary-precip-moderate')
        expect(summary).toHaveTextContent('forecast-summary-wind-light')
        expect(screen.getByText('conditions.rain_and_snow.')).toBeInTheDocument()
    })

    it('shows no-data without a station reading', () => {
        render(<WidgetForecastToday today={today} />)
        expect(screen.getByText('no-data')).toBeInTheDocument()
    })
})
