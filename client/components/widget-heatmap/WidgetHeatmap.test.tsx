import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetHeatmap from './WidgetHeatmap'

import '@testing-library/jest-dom'

jest.mock('@/components/widget-heatmap/Heatmap', () => (props: { type: string; title?: string }) => (
    <div
        data-testid='heatmap'
        data-type={props.type}
        data-title={props.title}
    />
))

describe('WidgetHeatmap', () => {
    it('renders Heatmap when not loading', () => {
        render(
            <WidgetHeatmap
                type='temperature'
                loading={false}
            />
        )
        expect(screen.getByTestId('heatmap')).toBeInTheDocument()
        expect(screen.getByTestId('heatmap')).toHaveAttribute('data-type', 'temperature')
    })

    it('renders skeleton when loading is true', () => {
        render(
            <WidgetHeatmap
                type='temperature'
                loading
            />
        )
        expect(screen.queryByTestId('heatmap')).not.toBeInTheDocument()
    })

    it('passes title to Heatmap', () => {
        render(
            <WidgetHeatmap
                type='humidity'
                title='Humidity'
            />
        )
        expect(screen.getByTestId('heatmap')).toHaveAttribute('data-title', 'Humidity')
    })

    it('renders with different sensor types', () => {
        render(<WidgetHeatmap type='pressure' />)
        expect(screen.getByTestId('heatmap')).toHaveAttribute('data-type', 'pressure')
    })
})
