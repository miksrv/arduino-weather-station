import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetPrecip from './WidgetPrecip'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                millimeters: 'мм',
                today: 'Сегодня',
                'precip-24h': 'За сутки',
                'precip-7d': 'За неделю',
                'no-data': '—'
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
jest.mock('./PrecipTrendChart', () => () => <div data-testid={'precip-chart'} />)

describe('WidgetPrecip', () => {
    it('renders the title', () => {
        render(
            <WidgetPrecip
                title={'Осадки'}
                todayTotal={0}
            />
        )
        expect(screen.getByText('Осадки')).toBeInTheDocument()
    })

    it('renders the today total with unit and label', () => {
        render(<WidgetPrecip todayTotal={0} />)
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('мм')).toBeInTheDocument()
        expect(screen.getByText('Сегодня')).toBeInTheDocument()
    })

    it('renders fallback "no-data" when todayTotal is undefined', () => {
        render(<WidgetPrecip />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
    })

    it('renders skeleton instead of value while loading', () => {
        render(
            <WidgetPrecip
                todayTotal={0}
                loading
            />
        )
        expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('renders the 24h and 7d totals', () => {
        render(
            <WidgetPrecip
                todayTotal={0}
                last24hTotal={2.3}
                last7dTotal={12.7}
            />
        )
        expect(screen.getByText('2.3 мм')).toBeInTheDocument()
        expect(screen.getByText('12.7 мм')).toBeInTheDocument()
    })

    it('renders dashes for the stats when totals are unavailable', () => {
        render(<WidgetPrecip todayTotal={0} />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    })

    it('renders the chart when not loading', () => {
        render(<WidgetPrecip todayTotal={0} />)
        expect(screen.getByTestId('precip-chart')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the chart while the chart is loading', () => {
        render(
            <WidgetPrecip
                todayTotal={0}
                chartLoading
            />
        )
        expect(screen.queryByTestId('precip-chart')).not.toBeInTheDocument()
    })
})
