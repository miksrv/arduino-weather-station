import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyCard from './WidgetAnomalyCard'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) })
}))

describe('WidgetAnomalyCard', () => {
    it('renders the label and description via i18n keys', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
            />
        )
        expect(screen.getByText('anomaly-heat-wave')).toBeInTheDocument()
        expect(screen.getByText('anomaly-heat-wave-desc')).toBeInTheDocument()
    })

    it('renders active-since meta when active and triggeredAt is provided', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={true}
                triggeredAt='2024-07-01'
            />
        )
        expect(screen.getByText(/anomaly-active-since/)).toBeInTheDocument()
    })

    it('does not render active-since meta when not active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
                triggeredAt='2024-07-01'
            />
        )
        expect(screen.queryByText(/anomaly-active-since/)).not.toBeInTheDocument()
    })

    it('renders extraMetric row when active and extraMetric is provided', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={true}
                extraMetric={{ label: 'temperature_c', value: 35.0 }}
            />
        )
        expect(screen.getByText('metric-temperature')).toBeInTheDocument()
        expect(screen.getByText('+35.0 °C')).toBeInTheDocument()
    })

    it('renders zScore section when inactive and currentZScore is provided', () => {
        const { container } = render(
            <WidgetAnomalyCard
                anomalyId='cold_snap'
                active={false}
                currentZScore={-2.5}
            />
        )
        expect(container.querySelector('[class*="zScoreSection"]')).toBeInTheDocument()
        // sign + value + σ are sibling text nodes in the same span; match via regex
        expect(screen.getByText(/2\.50σ/)).toBeInTheDocument()
    })

    it('does not render zScore section when active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='cold_snap'
                active={true}
                currentZScore={-2.5}
            />
        )
        expect(screen.queryByText('2.50σ')).not.toBeInTheDocument()
    })

    it('renders lastTriggered when inactive', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='drought_spi30'
                active={false}
                lastTriggered='2024-01-15'
            />
        )
        expect(screen.getByText(/anomaly-last-triggered/)).toBeInTheDocument()
    })

    it('does not render lastTriggered when active', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='drought_spi30'
                active={true}
                lastTriggered='2024-01-15'
            />
        )
        expect(screen.queryByText(/anomaly-last-triggered/)).not.toBeInTheDocument()
    })

    it('renders extraMetric row for inactive card when extraMetric is provided', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='drought_spi30'
                active={false}
                extraMetric={{ label: 'SPI-30', value: -1.5 }}
            />
        )
        expect(screen.getByText('metric-spi30')).toBeInTheDocument()
    })

    it('renders the zScore value for positive zScore', () => {
        render(
            <WidgetAnomalyCard
                anomalyId='heat_wave'
                active={false}
                currentZScore={1.5}
            />
        )
        // sign, value, and σ are sibling text nodes — match via regex on combined textContent
        expect(screen.getByText(/1\.50σ/)).toBeInTheDocument()
    })
})
