import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetFloodRisk from './index'

import '@testing-library/jest-dom'

jest.mock('echarts-for-react', () => (props: { option: unknown; style: unknown }) => (
    <div
        data-testid='echarts'
        data-option={JSON.stringify(props.option)}
    />
))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@/tools', () => ({
    getEChartBaseConfig: jest.fn(() => ({}))
}))

const baseComponents = {
    sweAnomaly: { value: 10, weight: 0.3, contribution: 20 },
    meltRate: { value: 5, weight: 0.2, contribution: 15 },
    rainOnSnowDays: { value: 2, weight: 0.15, contribution: 10 },
    precipAnomaly: { value: 8, weight: 0.2, contribution: 18 },
    temperatureTrend: { value: 3, weight: 0.15, contribution: 12 }
}

describe('WidgetFloodRisk', () => {
    describe('offseason state', () => {
        it('renders the offseason message when season is offseason', () => {
            render(
                <WidgetFloodRisk
                    score={0}
                    level='low'
                    components={baseComponents}
                    season='offseason'
                />
            )
            expect(screen.getByText('flood-risk-offseason')).toBeInTheDocument()
        })

        it('does not render the gauge when offseason', () => {
            render(
                <WidgetFloodRisk
                    score={0}
                    level='low'
                    components={baseComponents}
                    season='offseason'
                />
            )
            expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
        })

        it('renders the disclaimer in offseason state', () => {
            render(
                <WidgetFloodRisk
                    score={0}
                    level='low'
                    components={baseComponents}
                    season='offseason'
                />
            )
            expect(screen.getByText('flood-risk-disclaimer')).toBeInTheDocument()
        })
    })

    describe('active state', () => {
        it('renders the disclaimer in active state', () => {
            render(
                <WidgetFloodRisk
                    score={42}
                    level='low'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('flood-risk-disclaimer')).toBeInTheDocument()
        })

        it('renders the gauge when active', () => {
            render(
                <WidgetFloodRisk
                    score={42}
                    level='low'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByTestId('echarts')).toBeInTheDocument()
        })

        it('renders all 5 component label keys when active', () => {
            render(
                <WidgetFloodRisk
                    score={42}
                    level='elevated'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('risk-component-swe-anomaly')).toBeInTheDocument()
            expect(screen.getByText('risk-component-melt-rate')).toBeInTheDocument()
            expect(screen.getByText('risk-component-rain-on-snow')).toBeInTheDocument()
            expect(screen.getByText('risk-component-precip-anomaly')).toBeInTheDocument()
            expect(screen.getByText('risk-component-temp-trend')).toBeInTheDocument()
        })

        it('renders the correct risk level label for low', () => {
            render(
                <WidgetFloodRisk
                    score={10}
                    level='low'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('flood-risk-low')).toBeInTheDocument()
        })

        it('renders the correct risk level label for elevated', () => {
            render(
                <WidgetFloodRisk
                    score={40}
                    level='elevated'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('flood-risk-elevated')).toBeInTheDocument()
        })

        it('renders the correct risk level label for high', () => {
            render(
                <WidgetFloodRisk
                    score={70}
                    level='high'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('flood-risk-high')).toBeInTheDocument()
        })

        it('renders the correct risk level label for critical', () => {
            render(
                <WidgetFloodRisk
                    score={90}
                    level='critical'
                    components={baseComponents}
                    season='active'
                />
            )
            expect(screen.getByText('flood-risk-critical')).toBeInTheDocument()
        })
    })
})
