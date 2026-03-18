import React from 'react'

import { render, screen } from '@testing-library/react'

import { FloodRiskBars } from './FloodRiskBars'
import { clampContribution } from './utils'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

const mockComponents = {
    sweAnomaly: { value: 1.5, weight: 0.3, contribution: 30 },
    meltRate: { value: 0.8, weight: 0.2, contribution: 20 },
    rainOnSnowDays: { value: 2, weight: 0.2, contribution: 15 },
    precipAnomaly: { value: 1.1, weight: 0.15, contribution: 10 },
    temperatureTrend: { value: 0.5, weight: 0.15, contribution: 5 }
}

describe('FloodRiskBars', () => {
    it('renders all 5 i18n label keys', () => {
        render(
            <FloodRiskBars
                components={mockComponents}
                level='high'
            />
        )
        expect(screen.getByText('risk-component-swe-anomaly')).toBeInTheDocument()
        expect(screen.getByText('risk-component-melt-rate')).toBeInTheDocument()
        expect(screen.getByText('risk-component-rain-on-snow')).toBeInTheDocument()
        expect(screen.getByText('risk-component-precip-anomaly')).toBeInTheDocument()
        expect(screen.getByText('risk-component-temp-trend')).toBeInTheDocument()
    })

    it('renders contribution values with + prefix', () => {
        render(
            <FloodRiskBars
                components={mockComponents}
                level='high'
            />
        )
        expect(screen.getByText('+30')).toBeInTheDocument()
        expect(screen.getByText('+20')).toBeInTheDocument()
        expect(screen.getByText('+15')).toBeInTheDocument()
        expect(screen.getByText('+10')).toBeInTheDocument()
        expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('bar fill widths match clampContribution(contribution)%', () => {
        const { container } = render(
            <FloodRiskBars
                components={mockComponents}
                level='low'
            />
        )
        const fills = container.querySelectorAll('[class*="barFill"]')
        const expectedWidths = [30, 20, 15, 10, 5].map((c) => `${clampContribution(c)}%`)
        fills.forEach((fill, i) => {
            expect((fill as HTMLElement).style.width).toBe(expectedWidths[i])
        })
    })

    it('level=high → all fills share the same background color (from getRiskLevelColor)', () => {
        const { container } = render(
            <FloodRiskBars
                components={mockComponents}
                level='high'
            />
        )
        const fills = Array.from(container.querySelectorAll('[class*="barFill"]'))
        expect(fills).toHaveLength(5)
        // All fills must share the same non-empty background color
        const colors = fills.map((fill) => (fill as HTMLElement).style.backgroundColor)
        expect(colors.every((c) => c !== '')).toBe(true)
        expect(new Set(colors).size).toBe(1)
    })
})
