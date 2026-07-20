import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import WidgetChartsPanel from './WidgetChartsPanel'

import '@testing-library/jest-dom'

jest.mock('@/pages/_app', () => ({
    POLING_INTERVAL_CURRENT: 600000
}))

jest.mock('@/api', () => ({
    API: {
        useGetHistoryQuery: jest.fn()
    }
}))

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                'charts-panel-title-24h': 'Графики за 24 часа',
                'charts-panel-title-7d': 'Графики за 7 дней',
                'charts-panel-title-30d': 'Графики за 30 дней',
                'period-24h': '24 часа',
                'period-7d': '7 дней',
                'period-30d': '30 дней',
                temperature: 'Температура',
                humidity: 'Влажность',
                pressure: 'Давление',
                wind: 'Ветер',
                precipitation: 'Осадки',
                'mm-hg-full': 'мм рт. ст.',
                'meters-per-second': 'м/с',
                millimeters: 'мм'
            }

            return dictionary[key] ?? key
        }
    })
}))

jest.mock('./MiniChart', () => (props: { title: string; source: string }) => (
    <div data-testid={`chart-${props.source}`}>{props.title}</div>
))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const useGetHistoryQuery = require('@/api').API.useGetHistoryQuery

const history = [
    { date: '2024-01-01T00:00:00Z', temperature: 20, humidity: 55, pressure: 1000, windSpeed: 3 },
    { date: '2024-01-01T01:00:00Z', temperature: 21, humidity: 56, pressure: 1002, windSpeed: 4 }
]

describe('WidgetChartsPanel', () => {
    beforeEach(() => {
        useGetHistoryQuery.mockReturnValue({ data: undefined, isLoading: false })
    })

    it('renders the 24h title by default', () => {
        render(<WidgetChartsPanel history24h={history} />)
        expect(screen.getByText('Графики за 24 часа')).toBeInTheDocument()
    })

    it('renders all four mini charts from the history24h prop for the 24h period', () => {
        render(<WidgetChartsPanel history24h={history} />)
        expect(screen.getByTestId('chart-temperature')).toHaveTextContent('Температура (°C)')
        expect(screen.getByTestId('chart-humidity')).toHaveTextContent('Влажность (%)')
        expect(screen.getByTestId('chart-pressure')).toHaveTextContent('Давление (мм рт. ст.)')
        expect(screen.getByTestId('chart-windSpeed')).toHaveTextContent('Ветер (м/с)')
        expect(screen.queryByTestId('chart-precipitation')).not.toBeInTheDocument()
    })

    it('renders a skeleton instead of the charts while the history24h prop has not arrived yet', () => {
        render(<WidgetChartsPanel />)
        expect(screen.queryByTestId('chart-temperature')).not.toBeInTheDocument()
    })

    it('does not call its own history query for the 24h period (skip is set)', () => {
        render(<WidgetChartsPanel history24h={history} />)
        const lastCallArgs = useGetHistoryQuery.mock.calls[useGetHistoryQuery.mock.calls.length - 1][1]
        expect(lastCallArgs.skip).toBe(true)
    })

    it('switches to the 7d history prop when the 7d period is toggled', () => {
        render(
            <WidgetChartsPanel
                history24h={history}
                history7d={history}
            />
        )

        fireEvent.click(screen.getByText('7 дней'))

        expect(screen.getByText('Графики за 7 дней')).toBeInTheDocument()
        expect(screen.getByTestId('chart-temperature')).toBeInTheDocument()

        const lastCallArgs = useGetHistoryQuery.mock.calls[useGetHistoryQuery.mock.calls.length - 1][1]
        expect(lastCallArgs.skip).toBe(true)
    })

    it('renders a skeleton for the 7d period while the history7d prop has not arrived yet', () => {
        render(<WidgetChartsPanel history24h={history} />)

        fireEvent.click(screen.getByText('7 дней'))

        expect(screen.queryByTestId('chart-temperature')).not.toBeInTheDocument()
    })

    it('fetches its own history for the 30d period, unskipped, since the page does not provide it', () => {
        useGetHistoryQuery.mockReturnValue({ data: history, isLoading: false })

        render(<WidgetChartsPanel history24h={history} />)

        fireEvent.click(screen.getByText('30 дней'))

        expect(screen.getByText('Графики за 30 дней')).toBeInTheDocument()
        expect(screen.getByTestId('chart-temperature')).toBeInTheDocument()

        const lastCallArgs = useGetHistoryQuery.mock.calls[useGetHistoryQuery.mock.calls.length - 1][1]
        expect(lastCallArgs.skip).toBe(false)
    })

    it('renders a skeleton for the 30d period while its own query is loading', () => {
        useGetHistoryQuery.mockReturnValue({ data: undefined, isLoading: true })

        render(<WidgetChartsPanel history24h={history} />)

        fireEvent.click(screen.getByText('30 дней'))

        expect(screen.queryByTestId('chart-temperature')).not.toBeInTheDocument()
    })
})
