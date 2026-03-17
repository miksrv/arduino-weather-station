import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetParameterZScore from './WidgetParameterZScore'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('echarts-for-react', () => () => <div data-testid='echarts' />)

describe('WidgetParameterZScore', () => {
    it('renders the i18n label for a known parameter', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.5}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('temperature')).toBeInTheDocument()
    })

    it('renders the i18n label for wind speed', () => {
        render(
            <WidgetParameterZScore
                parameter='windSpeed'
                zScore={0.5}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('wind-speed')).toBeInTheDocument()
    })

    it('renders the raw parameter key for unknown parameters', () => {
        render(
            <WidgetParameterZScore
                parameter='unknown_param'
                zScore={0.3}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('unknown_param')).toBeInTheDocument()
    })

    it('renders a positive zScore with + prefix', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.5}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('+1.50')).toBeInTheDocument()
    })

    it('renders a negative zScore without + prefix', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={-1.2}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('-1.20')).toBeInTheDocument()
    })

    it('renders an icon for the parameter', () => {
        render(
            <WidgetParameterZScore
                parameter='humidity'
                zScore={0.2}
                sparklineData={[]}
            />
        )
        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders dots container', () => {
        const { container } = render(
            <WidgetParameterZScore
                parameter='pressure'
                zScore={0.8}
                sparklineData={[]}
            />
        )
        expect(container.firstChild).toBeInTheDocument()
    })

    it('renders echarts when sparklineData is non-empty', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.0}
                sparklineData={[1, 2, 3]}
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('does not render echarts when sparklineData is empty', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.0}
                sparklineData={[]}
            />
        )
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })
})
