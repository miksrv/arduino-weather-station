import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetSensorUv from './WidgetSensorUv'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const dictionary: Record<string, string> = {
                'today-max': 'Макс (сегодня)',
                'uv-peak-time': 'Время макс.',
                'uv-category-low': 'Низкий',
                'uv-category-moderate': 'Умеренный',
                'uv-category-high': 'Высокий',
                'uv-category-very-high': 'Очень высокий',
                'uv-category-extreme': 'Экстремальный',
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
jest.mock('./UvScale', () => () => <div data-testid={'uv-scale'} />)

const history = [
    { date: '2024-01-01T10:00:00Z', uvIndex: 2 },
    { date: '2024-01-01T12:34:00Z', uvIndex: 5 },
    { date: '2024-01-01T16:00:00Z', uvIndex: 3 }
]

describe('WidgetSensorUv', () => {
    it('renders the title', () => {
        render(
            <WidgetSensorUv
                title={'УФ-индекс'}
                value={3}
            />
        )
        expect(screen.getByText('УФ-индекс')).toBeInTheDocument()
    })

    it('renders the current value', () => {
        render(<WidgetSensorUv value={3} />)
        expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders fallback "no-data" when value is undefined', () => {
        render(<WidgetSensorUv />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
    })

    it('renders skeleton instead of value while loading', () => {
        render(
            <WidgetSensorUv
                value={3}
                loading
            />
        )
        expect(screen.queryByText('3')).not.toBeInTheDocument()
    })

    it('renders the category label matching the value', () => {
        render(<WidgetSensorUv value={3} />)
        expect(screen.getByText('Умеренный')).toBeInTheDocument()
    })

    it('renders the "low" category for a value of 0', () => {
        render(<WidgetSensorUv value={0} />)
        expect(screen.getByText('Низкий')).toBeInTheDocument()
    })

    it('derives today max and peak time from history', () => {
        render(
            <WidgetSensorUv
                value={3}
                history={history}
            />
        )
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('17:34')).toBeInTheDocument()
    })

    it('renders dashes for the stats when there is no history', () => {
        render(<WidgetSensorUv value={3} />)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    })

    it('renders the scale when not loading', () => {
        render(<WidgetSensorUv value={3} />)
        expect(screen.getByTestId('uv-scale')).toBeInTheDocument()
    })

    it('renders a skeleton instead of the scale while the chart is loading', () => {
        render(
            <WidgetSensorUv
                value={3}
                chartLoading
            />
        )
        expect(screen.queryByTestId('uv-scale')).not.toBeInTheDocument()
    })
})
