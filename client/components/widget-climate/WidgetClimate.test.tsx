import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetClimate from './WidgetClimate'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key)
    })
}))

jest.mock('./Chart', () => () => <div data-testid='climate-chart' />)

describe('WidgetClimate', () => {
    it('renders Skeleton when loading with no data', () => {
        render(<WidgetClimate loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('climate-chart')).not.toBeInTheDocument()
    })

    it('shows progress text when loading with partial years loaded', () => {
        render(
            <WidgetClimate
                loading={true}
                loadedYears={2}
                totalYears={5}
            />
        )
        expect(screen.getByText('loading-years:{"current":2,"total":5}')).toBeInTheDocument()
        expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })

    it('does not show progress bar when all years are loaded', () => {
        render(
            <WidgetClimate
                loading={true}
                loadedYears={5}
                totalYears={5}
            />
        )
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    })

    it('renders Chart when not loading and data is provided', () => {
        const data = [{ year: '2024', weather: [] }]
        render(
            <WidgetClimate
                loading={false}
                data={data}
            />
        )
        expect(screen.getByTestId('climate-chart')).toBeInTheDocument()
    })

    it('renders Chart when not loading and no data', () => {
        render(<WidgetClimate loading={false} />)
        expect(screen.getByTestId('climate-chart')).toBeInTheDocument()
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
})
