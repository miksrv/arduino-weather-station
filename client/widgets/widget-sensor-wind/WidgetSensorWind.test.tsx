import React from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { render, screen } from '@testing-library/react'

import WidgetSensorWind from './WidgetSensorWind'

import '@testing-library/jest-dom'

dayjs.extend(utc)

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                'meters-per-second': 'м/с',
                'wind-gust-short': 'Порывы',
                'wind-avg-speed': 'Средняя скорость (10 мин)',
                'wind-max-speed': 'Макс. скорость (сегодня)',
                'wind-avg-direction': 'Направление (сред.)',
                'no-data': '—',
                'wind-direction-n': 'N',
                'wind-direction-nw': 'NW'
            }

            return dictionary[key] ?? key
        }
    })
}))
jest.mock('next/link', () => ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
    <a
        href={href}
        {...rest}
    >
        {children}
    </a>
))
jest.mock('./WindCompass', () => () => <div data-testid={'compass'} />)

const history = [
    { date: '2024-01-01T00:00:00Z', windSpeed: 10, windDeg: 10, windGust: 12 },
    { date: '2024-01-01T00:55:00Z', windSpeed: 2, windDeg: 30, windGust: 3 },
    { date: '2024-01-01T01:00:00Z', windSpeed: 4, windDeg: 350, windGust: 6 }
]

describe('WidgetSensorWind', () => {
    it('renders the title', () => {
        render(
            <WidgetSensorWind
                title={'Ветер'}
                windSpeed={4.2}
            />
        )
        expect(screen.getByText('Ветер')).toBeInTheDocument()
    })

    it('renders the current wind speed with unit', () => {
        render(<WidgetSensorWind windSpeed={4.2} />)
        expect(screen.getByText('4.2')).toBeInTheDocument()
        expect(screen.getByText('м/с')).toBeInTheDocument()
    })

    it('renders fallback "no-data" when windSpeed is undefined', () => {
        render(<WidgetSensorWind />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
    })

    it('renders skeleton instead of value while loading', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                loading
            />
        )
        expect(screen.queryByText('4.2')).not.toBeInTheDocument()
    })

    it('renders the current direction as a compass label with degrees', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                windDeg={315}
            />
        )
        expect(screen.getByText('NW (315°)')).toBeInTheDocument()
    })

    it('renders the gust value', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                windGust={8.5}
            />
        )
        expect(screen.getByText('8.5 м/с')).toBeInTheDocument()
    })

    it('renders dashes for gust and stats when there is no data', () => {
        render(<WidgetSensorWind windSpeed={4.2} />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
    })

    it('derives average speed, max speed and average direction from history', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                history={history}
            />
        )
        expect(screen.getByText('3 м/с')).toBeInTheDocument()
        expect(screen.getByText('10 м/с')).toBeInTheDocument()
        expect(screen.getByText('N (10°)')).toBeInTheDocument()
    })

    it('renders the compass when not loading', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                windDeg={315}
            />
        )
        expect(screen.getByTestId('compass')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the compass while the current reading is loading', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                loading
            />
        )
        expect(screen.queryByTestId('compass')).not.toBeInTheDocument()
    })

    it('does not gate the compass or gust on chartLoading, since they come from the current reading, not history', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                windDeg={315}
                windGust={8.5}
                chartLoading
            />
        )
        expect(screen.getByTestId('compass')).toBeInTheDocument()
        expect(screen.getByText('8.5 м/с')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the gust value while the current reading is loading', () => {
        render(
            <WidgetSensorWind
                windSpeed={4.2}
                windGust={8.5}
                loading
            />
        )
        expect(screen.queryByText('8.5 м/с')).not.toBeInTheDocument()
    })
})
