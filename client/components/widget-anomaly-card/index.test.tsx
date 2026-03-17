import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyCard from './index'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, string>) => (opts ? `${key}:${JSON.stringify(opts)}` : key)
    })
}))

describe('WidgetAnomalyCard', () => {
    it('renders active state with red indicator when active === true', () => {
        const { container } = render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={true}
                triggeredAt='2024-06-01'
            />
        )
        expect(container.querySelector('.dotActive')).toBeInTheDocument()
        expect(container.querySelector('.cardActive')).toBeInTheDocument()
    })

    it('renders inactive state with grey indicator when active === false', () => {
        const { container } = render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
            />
        )
        expect(container.querySelector('.dot')).toBeInTheDocument()
        expect(container.querySelector('.card')).toBeInTheDocument()
        expect(container.querySelector('.dotActive')).not.toBeInTheDocument()
    })

    it('displays triggeredAt date when active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={true}
                triggeredAt='2024-06-01'
            />
        )
        expect(screen.getByText(/anomaly-active-since/)).toBeInTheDocument()
    })

    it('does not display triggeredAt section when not active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
                triggeredAt='2024-06-01'
            />
        )
        expect(screen.queryByText(/anomaly-active-since/)).not.toBeInTheDocument()
    })

    it('displays lastTriggered when inactive and provided', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='cold_snap'
                active={false}
                lastTriggered='2024-02-10'
            />
        )
        expect(screen.getByText(/anomaly-last-triggered/)).toBeInTheDocument()
    })

    it('does not display lastTriggered when active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='cold_snap'
                active={true}
                triggeredAt='2024-02-01'
                lastTriggered='2024-02-10'
            />
        )
        expect(screen.queryByText(/anomaly-last-triggered/)).not.toBeInTheDocument()
    })

    it('displays currentZScore when inactive and provided', () => {
        const { container } = render(
            <WidgetAnomalyCard
                anomalyId='drought_spi30'
                active={false}
                currentZScore={1.75}
            />
        )
        expect(container.querySelector('.zScoreSection')).toBeInTheDocument()
        expect(screen.getByText(/z-interp-elevated/)).toBeInTheDocument()
        expect(screen.getByText(/1.75/)).toBeInTheDocument()
    })

    it('does not display currentZScore section when active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='drought_spi30'
                active={true}
                triggeredAt='2024-05-01'
                currentZScore={1.75}
            />
        )
        expect(screen.queryByText(/z-score-label/)).not.toBeInTheDocument()
    })

    it('displays extraMetric label and value when inactive and provided', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
                extraMetric={{ label: 'SPI', value: -1.5 }}
            />
        )
        expect(screen.getByText(/SPI/)).toBeInTheDocument()
        expect(screen.getByText(/-1.5/)).toBeInTheDocument()
    })
})
