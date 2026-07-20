import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetCard from './WidgetCard'

import '@testing-library/jest-dom'

jest.mock('next/link', () => ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
    <a
        href={href}
        {...rest}
    >
        {children}
    </a>
))

describe('WidgetCard', () => {
    it('renders the title', () => {
        render(<WidgetCard title={'Temperature'} />)
        expect(screen.getByText('Temperature')).toBeInTheDocument()
    })

    it('renders children', () => {
        render(
            <WidgetCard title={'Temperature'}>
                <div data-testid={'body'} />
            </WidgetCard>
        )
        expect(screen.getByTestId('body')).toBeInTheDocument()
    })

    it('renders icon when provided', () => {
        render(<WidgetCard icon={'Thermometer'} />)
        expect(screen.getAllByTestId('icon').length).toBeGreaterThan(0)
    })

    it('renders link in title when link prop is provided', () => {
        render(
            <WidgetCard
                title={'Temperature'}
                link={{ href: '/history' }}
            />
        )
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', '/history')
    })

    it('renders skeleton instead of children while loading', () => {
        render(
            <WidgetCard loading>
                <div data-testid={'body'} />
            </WidgetCard>
        )
        expect(screen.queryByTestId('body')).not.toBeInTheDocument()
    })

    it('does not render header when neither title nor icon is provided', () => {
        const { container } = render(
            <WidgetCard>
                <div data-testid={'body'} />
            </WidgetCard>
        )
        expect(container.querySelector('h3')).not.toBeInTheDocument()
    })
})
