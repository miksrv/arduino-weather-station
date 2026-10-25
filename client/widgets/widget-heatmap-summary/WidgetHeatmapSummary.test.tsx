import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetHeatmapSummary from './WidgetHeatmapSummary'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const stats = {
    count: 100,
    mean: 7.2,
    min: { value: -3.1, date: '2026-10-20 23:00:00' },
    max: { value: 18.4, date: '2026-10-02 09:00:00' },
    meanDailyRange: 8.6,
    total: 12.4,
    wetDays: 6,
    wettestDay: { value: 4.2, date: '2026-10-11 03:00:00' }
}

describe('WidgetHeatmapSummary', () => {
    it('shows four skeleton cards while loading', () => {
        render(
            <WidgetHeatmapSummary
                type={'temperature'}
                loading={true}
            />
        )
        expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
    })

    it('reads a level as mean, extremes and the daily swing', () => {
        render(
            <WidgetHeatmapSummary
                type={'temperature'}
                stats={stats}
            />
        )

        expect(screen.getByText('heatmap-mean')).toBeInTheDocument()
        expect(screen.getByText('7.2°C')).toBeInTheDocument()
        expect(screen.getByText('18.4°C')).toBeInTheDocument()
        expect(screen.getByText('-3.1°C')).toBeInTheDocument()
        expect(screen.getByText('8.6°C')).toBeInTheDocument()
    })

    it('reads precipitation as totals and the wettest day', () => {
        render(
            <WidgetHeatmapSummary
                type={'precipitation'}
                stats={stats}
            />
        )

        expect(screen.getByText('12.4 millimeters')).toBeInTheDocument()
        expect(screen.getByText('6')).toBeInTheDocument()
        expect(screen.getByText('4.2 millimeters')).toBeInTheDocument()
        expect(screen.queryByText('heatmap-mean')).not.toBeInTheDocument()
    })
})
