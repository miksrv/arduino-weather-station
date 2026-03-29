import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetChart from './WidgetChart'

import '@testing-library/jest-dom'

jest.mock('@/components/widget-chart/Chart', () => (props: { type: string }) => (
    <div
        data-testid='chart'
        data-type={props.type}
    />
))

describe('WidgetChart', () => {
    it('renders Chart when not loading', () => {
        render(
            <WidgetChart
                type='temperature'
                loading={false}
            />
        )
        expect(screen.getByTestId('chart')).toBeInTheDocument()
        expect(screen.getByTestId('chart')).toHaveAttribute('data-type', 'temperature')
    })

    it('renders skeleton when loading is true', () => {
        render(
            <WidgetChart
                type='temperature'
                loading
            />
        )
        expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
    })

    it('passes type="clouds" to Chart', () => {
        render(<WidgetChart type='clouds' />)
        expect(screen.getByTestId('chart')).toHaveAttribute('data-type', 'clouds')
    })

    it('passes type="pressure" to Chart', () => {
        render(<WidgetChart type='pressure' />)
        expect(screen.getByTestId('chart')).toHaveAttribute('data-type', 'pressure')
    })

    it('renders with fullWidth prop without crashing', () => {
        const { container } = render(
            <WidgetChart
                type='temperature'
                fullWidth
            />
        )
        expect(container.firstChild).toBeInTheDocument()
    })
})
