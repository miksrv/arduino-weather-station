import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetFloodRisk from './WidgetFloodRisk'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('echarts-for-react', () => () => <div data-testid='echarts' />)

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({}))
}))

const mockComponents = {
    sweAnomaly: { value: 1.5, weight: 0.3, contribution: 30 },
    meltRate: { value: 0.8, weight: 0.2, contribution: 20 },
    rainOnSnowDays: { value: 2, weight: 0.2, contribution: 15 },
    precipAnomaly: { value: 1.1, weight: 0.15, contribution: 10 },
    temperatureTrend: { value: 0.5, weight: 0.15, contribution: 5 }
}

describe('WidgetFloodRisk', () => {
    it('renders the offseason message when season is offseason', () => {
        render(
            <WidgetFloodRisk
                score={0}
                level='low'
                components={mockComponents}
                season='offseason'
            />
        )
        expect(screen.getByText('flood-risk-offseason')).toBeInTheDocument()
        expect(screen.getByText('flood-risk-disclaimer')).toBeInTheDocument()
    })

    it('does not render the gauge or bars in offseason', () => {
        render(
            <WidgetFloodRisk
                score={0}
                level='low'
                components={mockComponents}
                season='offseason'
            />
        )
        expect(screen.queryByText('flood-risk')).not.toBeInTheDocument()
    })

    it('renders the title and level badge when season is active', () => {
        render(
            <WidgetFloodRisk
                score={42}
                level='elevated'
                components={mockComponents}
                season='active'
            />
        )
        expect(screen.getByText('flood-risk')).toBeInTheDocument()
        expect(screen.getByText('flood-risk-elevated')).toBeInTheDocument()
    })

    it('renders the gauge chart when active', () => {
        render(
            <WidgetFloodRisk
                score={42}
                level='low'
                components={mockComponents}
                season='active'
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('renders bars for all components when active', () => {
        render(
            <WidgetFloodRisk
                score={42}
                level='high'
                components={mockComponents}
                season='active'
            />
        )
        expect(screen.getByText('risk-component-swe-anomaly')).toBeInTheDocument()
        expect(screen.getByText('risk-component-melt-rate')).toBeInTheDocument()
        expect(screen.getByText('risk-component-rain-on-snow')).toBeInTheDocument()
        expect(screen.getByText('risk-component-precip-anomaly')).toBeInTheDocument()
        expect(screen.getByText('risk-component-temp-trend')).toBeInTheDocument()
    })

    it('renders the disclaimer when active', () => {
        render(
            <WidgetFloodRisk
                score={42}
                level='critical'
                components={mockComponents}
                season='active'
            />
        )
        expect(screen.getByText('flood-risk-disclaimer')).toBeInTheDocument()
    })
})
