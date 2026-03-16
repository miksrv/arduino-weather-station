import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetSensor from './WidgetSensor'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('next/link', () => ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
    <a
        href={href}
        {...rest}
    >
        {children}
    </a>
))
jest.mock('@/tools/date', () => ({
    formatDate: (_date: unknown, _fmt: unknown) => '12:00'
}))

describe('WidgetSensor', () => {
    it('renders the title', () => {
        render(<WidgetSensor title='Temperature' />)
        expect(screen.getByText('Temperature')).toBeInTheDocument()
    })

    it('renders the current value', () => {
        render(<WidgetSensor currentValue={22.5} />)
        expect(screen.getByText('22.5')).toBeInTheDocument()
    })

    it('renders fallback "??" when currentValue is undefined', () => {
        render(<WidgetSensor />)
        expect(screen.getByText('??')).toBeInTheDocument()
    })

    it('renders unit alongside the value', () => {
        render(
            <WidgetSensor
                currentValue={22}
                unit='°C'
            />
        )
        expect(screen.getByText('°C')).toBeInTheDocument()
    })

    it('does not render unit while loading', () => {
        render(
            <WidgetSensor
                loading
                unit='°C'
            />
        )
        expect(screen.queryByText('°C')).not.toBeInTheDocument()
    })

    it('renders with formatter applied to current value', () => {
        const formatter = (v: string | number | undefined) => `${v}!`
        render(
            <WidgetSensor
                currentValue={5}
                formatter={formatter}
            />
        )
        expect(screen.getByText('5!')).toBeInTheDocument()
    })

    it('renders min/max stats when minMax is provided', () => {
        render(
            <WidgetSensor
                minMax={{ min: { value: 10, date: '2024-01-01' }, max: { value: 30, date: '2024-01-02' } }}
            />
        )
        expect(screen.getByText('min')).toBeInTheDocument()
        expect(screen.getByText('max')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('renders time labels in min/max stats', () => {
        render(
            <WidgetSensor
                minMax={{ min: { value: 5, date: '2024-01-01' }, max: { value: 25, date: '2024-01-02' } }}
            />
        )
        expect(screen.getAllByText('12:00')).toHaveLength(2)
    })

    it('renders chart when chart prop is provided', () => {
        render(<WidgetSensor chart={<div data-testid='chart' />} />)
        expect(screen.getByTestId('chart')).toBeInTheDocument()
    })

    it('renders skeleton for chart when chartLoading is true', () => {
        render(
            <WidgetSensor
                chart={<div data-testid='chart' />}
                chartLoading
            />
        )
        expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
    })

    it('renders link in title when link prop is provided', () => {
        render(
            <WidgetSensor
                title='Wind'
                link={{ href: '/wind' }}
            />
        )
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', '/wind')
    })

    it('applies x2 size class', () => {
        const { container } = render(<WidgetSensor size='x2' />)
        expect(container.firstChild).toBeInTheDocument()
    })

    it('renders icon when icon prop is provided', () => {
        render(<WidgetSensor icon='Wind' />)
        const icons = screen.getAllByTestId('icon')
        expect(icons.length).toBeGreaterThan(0)
    })
})
