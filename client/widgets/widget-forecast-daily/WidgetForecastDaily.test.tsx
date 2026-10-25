import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetForecastDaily from './WidgetForecastDaily'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${JSON.stringify(values)}` : key)
    })
}))
// eslint-disable-next-line next/no-img-element
jest.mock('next/image', () => (props: { alt: string }) => <img alt={props.alt} />)

const day = (offset: number, extra: Record<string, number> = {}) => {
    const date = new Date(Date.now() + offset * 86_400_000)

    return {
        date: `${date.toISOString().slice(0, 10)} 00:00:00`,
        temperatureMin: -2,
        temperatureMax: 6,
        precipitation: 0,
        windSpeed: 3.4,
        windGust: 7.6,
        windDeg: 90,
        weatherId: 803,
        ...extra
    }
}

describe('WidgetForecastDaily', () => {
    it('shows a skeleton while loading or without days', () => {
        const { rerender } = render(<WidgetForecastDaily loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()

        rerender(<WidgetForecastDaily days={[]} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('renders a row per day with today marked', () => {
        render(<WidgetForecastDaily days={[day(0), day(1), day(2)]} />)

        const rows = screen.getAllByRole('listitem')
        expect(rows).toHaveLength(3)
        expect(rows[0]).toHaveAttribute('aria-current', 'date')
        expect(rows[0]).toHaveTextContent('today')
        expect(rows[1]).toHaveTextContent('forecast-tomorrow')
        expect(rows[1]).not.toHaveAttribute('aria-current')
    })

    it('shows low and high, precipitation with its hours, and the wind with gusts', () => {
        render(
            <WidgetForecastDaily days={[day(0, { precipitation: 2.46, precipitationHours: 5, temperatureMax: 4.6 })]} />
        )

        const row = screen.getByRole('listitem')
        expect(row).toHaveTextContent('−2°')
        expect(row).toHaveTextContent('+5°')
        expect(row).toHaveTextContent('2.5 millimeters')
        expect(row).toHaveTextContent('forecast-precip-hours {"count":5}')
        expect(row).toHaveTextContent('3 meters-per-second')
        expect(row).toHaveTextContent('forecast-gusts {"value":8}')
    })

    it('puts every range on the week scale', () => {
        const { container } = render(
            <WidgetForecastDaily
                days={[
                    day(0, { temperatureMin: -10, temperatureMax: 0 }),
                    day(1, { temperatureMin: 0, temperatureMax: 10 })
                ]}
            />
        )
        const fills = container.querySelectorAll('[class*="rangeFill"]')

        expect(fills[0]).toHaveStyle({ left: '0%', width: '50%' })
        expect(fills[1]).toHaveStyle({ left: '50%', width: '50%' })
    })

    it('shows a dash for a dry day', () => {
        render(<WidgetForecastDaily days={[day(0)]} />)
        expect(screen.getByText('—')).toBeInTheDocument()
    })
})
