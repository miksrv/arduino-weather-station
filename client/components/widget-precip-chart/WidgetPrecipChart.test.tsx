import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetPrecipChart from './WidgetPrecipChart'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        i18n: { language: 'en' },
        t: (key: string) => key
    })
}))

jest.mock('next-themes', () => ({
    useTheme: jest.fn(() => ({ theme: 'light' }))
}))

jest.mock('echarts-for-react', () => () => <div data-testid='echarts' />)

describe('WidgetPrecipChart', () => {
    it('shows Skeleton and no chart when loading', () => {
        render(<WidgetPrecipChart loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('echarts')).not.toBeInTheDocument()
    })

    it('renders the echarts div when not loading', () => {
        render(<WidgetPrecipChart loading={false} />)
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })

    it('always renders the monthly-totals title', () => {
        render(<WidgetPrecipChart />)
        expect(screen.getByText('monthly-totals')).toBeInTheDocument()
    })

    it('renders without crashing when monthlyTotals is undefined', () => {
        expect(() => render(<WidgetPrecipChart loading={false} />)).not.toThrow()
    })

    it('renders without crashing with 12 monthlyTotals entries', () => {
        const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: i * 10 }))
        expect(() =>
            render(
                <WidgetPrecipChart
                    loading={false}
                    monthlyTotals={monthlyTotals}
                />
            )
        ).not.toThrow()
        expect(screen.getByTestId('echarts')).toBeInTheDocument()
    })
})
