import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetWindRose from './WidgetWindRose'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                'meters-per-second': 'м/с',
                'wind-calm': 'Штиль',
                'wind-prevailing-direction': 'Преобладающее направление',
                'wind-average-speed-24h': 'Средняя скорость',
                'wind-max-gust': 'Макс. порыв',
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
jest.mock('./WindRoseChart', () => () => <div data-testid={'wind-rose-chart'} />)
jest.mock('./WindSpeedLegend', () => () => <div data-testid={'wind-speed-legend'} />)

const history = [
    { date: '2024-01-01T00:00:00Z', windSpeed: 5, windDeg: 315, windGust: 6 },
    { date: '2024-01-01T01:00:00Z', windSpeed: 5, windDeg: 315, windGust: 9.8 },
    { date: '2024-01-01T02:00:00Z', windSpeed: 3, windDeg: 90, windGust: 4 }
]

describe('WidgetWindRose', () => {
    it('renders the title', () => {
        render(
            <WidgetWindRose
                title={'Роза ветров'}
                history={history}
            />
        )
        expect(screen.getByText('Роза ветров')).toBeInTheDocument()
    })

    it('renders the prevailing direction derived from history', () => {
        render(<WidgetWindRose history={history} />)
        expect(screen.getByText('NW (315°)')).toBeInTheDocument()
    })

    it('renders the average speed and max gust derived from history', () => {
        render(<WidgetWindRose history={history} />)
        expect(screen.getByText('4.3 м/с')).toBeInTheDocument()
        expect(screen.getByText('9.8 м/с')).toBeInTheDocument()
    })

    it('renders dashes when there is no history', () => {
        render(<WidgetWindRose history={[]} />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
    })

    it('renders the chart and legend when not loading', () => {
        render(<WidgetWindRose history={history} />)
        expect(screen.getByTestId('wind-rose-chart')).toBeInTheDocument()
        expect(screen.getByTestId('wind-speed-legend')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the content while loading', () => {
        render(
            <WidgetWindRose
                history={history}
                loading
            />
        )
        expect(screen.queryByTestId('wind-rose-chart')).not.toBeInTheDocument()
    })
})
