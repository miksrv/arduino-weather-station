import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetParameterZScore from './index'

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

describe('WidgetParameterZScore', () => {
    it('renders the parameter label', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.2}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('temperature')).toBeInTheDocument()
    })

    it('renders the parameter label for humidity', () => {
        render(
            <WidgetParameterZScore
                parameter='humidity'
                zScore={0.5}
                sparklineData={[]}
            />
        )
        expect(screen.getByText('humidity')).toBeInTheDocument()
    })

    it('renders the correct number of filled dots for Z = 2 (5 dots filled)', () => {
        const { container } = render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={2}
                sparklineData={[]}
            />
        )
        const filled = container.querySelectorAll('.dotFilled')
        expect(filled).toHaveLength(5)
    })

    it('renders 0 filled dots for Z = 0', () => {
        const { container } = render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={0}
                sparklineData={[]}
            />
        )
        const filled = container.querySelectorAll('.dotFilled')
        expect(filled).toHaveLength(0)
    })

    it('renders 5 total dots', () => {
        const { container } = render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={0}
                sparklineData={[]}
            />
        )
        const allDots = container.querySelectorAll('.dotFilled, .dotEmpty')
        expect(allDots).toHaveLength(5)
    })

    it('renders the chart wrapper when sparklineData has values', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.2}
                sparklineData={[10, 12, 11, 13]}
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('does not render chart when sparklineData is empty', () => {
        render(
            <WidgetParameterZScore
                parameter='temperature'
                zScore={1.2}
                sparklineData={[]}
            />
        )
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })

    it('renders filled dots for negative Z-score', () => {
        const { container } = render(
            <WidgetParameterZScore
                parameter='pressure'
                zScore={-2}
                sparklineData={[]}
            />
        )
        const filled = container.querySelectorAll('.dotFilled')
        expect(filled).toHaveLength(5)
    })
})
