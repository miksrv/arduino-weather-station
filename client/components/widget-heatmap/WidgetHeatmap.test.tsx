import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetHeatmap from './WidgetHeatmap'

import '@testing-library/jest-dom'

jest.mock('@/components/widget-heatmap/Heatmap', () => (props: { type: string }) => (
    <div
        data-testid='heatmap'
        data-type={props.type}
    />
))

const points = [{ day: '2026-10-23', hour: 0, date: '2026-10-22 19:00:00', value: 1 }]

describe('WidgetHeatmap', () => {
    it('renders the map with its title and subtitle', () => {
        render(
            <WidgetHeatmap
                type={'humidity'}
                points={points}
                title={'Heatmap: Humidity'}
                subtitle={'Last 6 months'}
            />
        )

        expect(screen.getByTestId('heatmap')).toHaveAttribute('data-type', 'humidity')
        expect(screen.getByText('Heatmap: Humidity')).toBeInTheDocument()
        expect(screen.getByText('Last 6 months')).toBeInTheDocument()
    })

    it('shows a skeleton while loading or without points', () => {
        const { rerender } = render(
            <WidgetHeatmap
                type={'temperature'}
                loading={true}
            />
        )
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()

        rerender(
            <WidgetHeatmap
                type={'temperature'}
                points={[]}
            />
        )
        expect(screen.queryByTestId('heatmap')).not.toBeInTheDocument()
    })
})
