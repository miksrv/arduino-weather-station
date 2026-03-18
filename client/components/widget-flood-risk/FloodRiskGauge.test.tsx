import React from 'react'

import { render, screen } from '@testing-library/react'

import { FloodRiskGauge } from './FloodRiskGauge'

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

jest.mock('./utils', () => ({
    getRiskLevelColor: jest.fn(() => '#4bb34b'),
    resolveCssVar: jest.fn((_variable: string, fallback: string) => fallback)
}))

describe('FloodRiskGauge', () => {
    it('renders the echarts div', () => {
        render(
            <FloodRiskGauge
                score={42}
                level='low'
                theme='light'
            />
        )
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('does not crash with score=0, level=low, theme=undefined', () => {
        expect(() =>
            render(
                <FloodRiskGauge
                    score={0}
                    level='low'
                    theme={undefined}
                />
            )
        ).not.toThrow()
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('does not crash with score=75, level=critical, theme=dark', () => {
        expect(() =>
            render(
                <FloodRiskGauge
                    score={75}
                    level='critical'
                    theme='dark'
                />
            )
        ).not.toThrow()
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })
})
