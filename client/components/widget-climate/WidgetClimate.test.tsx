import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetClimate from './WidgetClimate'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => (params ? `${key}:${JSON.stringify(params)}` : key) })
}))
jest.mock('@/components/widget-climate/Chart', () => () => <div data-testid='climate-chart' />)

describe('WidgetClimate', () => {
    it('renders Chart when data is provided and not loading', () => {
        const data = [{ year: '2023', weather: [] }]
        render(<WidgetClimate data={data} />)
        expect(screen.getByTestId('climate-chart')).toBeInTheDocument()
    })

    it('renders skeleton when loading with no data', () => {
        render(<WidgetClimate loading />)
        expect(screen.queryByTestId('climate-chart')).not.toBeInTheDocument()
    })

    it('renders Chart even when loading if data is present', () => {
        const data = [{ year: '2023', weather: [] }]
        render(
            <WidgetClimate
                data={data}
                loading
            />
        )
        expect(screen.getByTestId('climate-chart')).toBeInTheDocument()
    })

    it('shows progress bar when loading with partial years', () => {
        const data = [{ year: '2023', weather: [] }]
        render(
            <WidgetClimate
                data={data}
                loading
                loadedYears={1}
                totalYears={3}
            />
        )
        expect(screen.getByText(/loading-years/)).toBeInTheDocument()
    })

    it('does not show progress bar when loading is false', () => {
        render(
            <WidgetClimate
                loading={false}
                loadedYears={1}
                totalYears={3}
            />
        )
        expect(screen.queryByText(/loading-years/)).not.toBeInTheDocument()
    })

    it('does not show progress bar when totalYears equals loadedYears', () => {
        const data = [{ year: '2023', weather: [] }]
        render(
            <WidgetClimate
                data={data}
                loading
                loadedYears={3}
                totalYears={3}
            />
        )
        expect(screen.queryByText(/loading-years/)).not.toBeInTheDocument()
    })

    it('does not show progress bar when totalYears is 0', () => {
        const data = [{ year: '2023', weather: [] }]
        render(
            <WidgetClimate
                data={data}
                loading
                loadedYears={0}
                totalYears={0}
            />
        )
        expect(screen.queryByText(/loading-years/)).not.toBeInTheDocument()
    })

    it('renders Chart with no data without crashing', () => {
        render(<WidgetClimate />)
        expect(screen.getByTestId('climate-chart')).toBeInTheDocument()
    })
})
