import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import Menu from './Menu'

import '@testing-library/jest-dom'

jest.mock('@/api', () => ({
    API: {
        useGetAnomalyQuery: jest.fn()
    }
}))

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => `t:${key}`
    })
}))
jest.mock('next/router', () => ({
    useRouter: () => ({
        pathname: '/history'
    })
}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('next/link', () => ({ children, ...props }: any) => <a {...props}>{children}</a>)

// eslint-disable-next-line @typescript-eslint/no-require-imports
const useGetAnomalyQuery = require('@/api').API.useGetAnomalyQuery

describe('Menu', () => {
    beforeEach(() => {
        useGetAnomalyQuery.mockReturnValue({ data: undefined })
    })

    it('renders all menu items with correct text and icons', () => {
        render(<Menu />)
        expect(screen.getByText('t:current-weather')).toBeInTheDocument()
        expect(screen.getByText('t:weather-sensors')).toBeInTheDocument()
        expect(screen.getByText('t:historical-data')).toBeInTheDocument()
        expect(screen.getByText('t:forecast')).toBeInTheDocument()
        expect(screen.getByText('t:heatmap')).toBeInTheDocument()
        expect(screen.getByText('t:precipitation-calendar')).toBeInTheDocument()
        expect(screen.getByText('t:climate-changes')).toBeInTheDocument()
        expect(screen.getByText('t:anomaly-monitor')).toBeInTheDocument()
        expect(screen.getAllByTestId('icon')[0]).toHaveAttribute('data-name', 'Cloud')
        expect(screen.getAllByTestId('icon')[1]).toHaveAttribute('data-name', 'Pressure')
        expect(screen.getAllByTestId('icon')[2]).toHaveAttribute('data-name', 'Chart')
        expect(screen.getAllByTestId('icon')[3]).toHaveAttribute('data-name', 'Time')
        expect(screen.getAllByTestId('icon')[4]).toHaveAttribute('data-name', 'BarChart')
        expect(screen.getAllByTestId('icon')[5]).toHaveAttribute('data-name', 'WaterDrop')
        expect(screen.getAllByTestId('icon')[6]).toHaveAttribute('data-name', 'Thermometer')
        expect(screen.getAllByTestId('icon')[7]).toHaveAttribute('data-name', 'Bell')
    })

    it('applies active class to the current route', () => {
        render(<Menu />)
        const activeLink = screen.getByText('t:historical-data')
        expect(activeLink.className).toContain('active')
    })

    it('calls onClick when a menu item is clicked', () => {
        const onClick = jest.fn()
        render(<Menu onClick={onClick} />)
        fireEvent.click(screen.getByText('t:forecast'))
        expect(onClick).toHaveBeenCalled()
    })

    it('renders menu as a <menu> element with correct structure', () => {
        render(<Menu />)
        const menu = screen.getByRole('list', { hidden: true }) || screen.getByTestId('menu')
        expect(menu?.tagName.toLowerCase()).toBe('menu')
        expect(menu?.querySelectorAll('li').length).toBe(8)
    })

    it('links have correct href attributes', () => {
        render(<Menu />)
        expect(screen.getByText('t:current-weather').closest('a')).toHaveAttribute('href', '/')
        expect(screen.getByText('t:weather-sensors').closest('a')).toHaveAttribute('href', '/sensors')
        expect(screen.getByText('t:historical-data').closest('a')).toHaveAttribute('href', '/history')
        expect(screen.getByText('t:forecast').closest('a')).toHaveAttribute('href', '/forecast')
        expect(screen.getByText('t:heatmap').closest('a')).toHaveAttribute('href', '/heatmap')
        expect(screen.getByText('t:precipitation-calendar').closest('a')).toHaveAttribute('href', '/precipitation')
        expect(screen.getByText('t:climate-changes').closest('a')).toHaveAttribute('href', '/climate')
        expect(screen.getByText('t:anomaly-monitor').closest('a')).toHaveAttribute('href', '/anomaly')
    })

    it('does not show anomaly badge when no data', () => {
        useGetAnomalyQuery.mockReturnValue({ data: undefined })
        render(<Menu />)
        expect(document.querySelector('[class*="badge"]')).not.toBeInTheDocument()
    })

    it('shows anomaly badge when an anomaly is active', () => {
        useGetAnomalyQuery.mockReturnValue({
            data: {
                anomalies: [{ id: 'freezing_rain', active: true }],
                floodRisk: { level: 'low', season: 'active' }
            }
        })
        render(<Menu />)
        expect(document.querySelector('[class*="badge"]')).toBeInTheDocument()
    })

    it('shows anomaly badge when flood risk is critical in active season', () => {
        useGetAnomalyQuery.mockReturnValue({
            data: {
                anomalies: [],
                floodRisk: { level: 'critical', season: 'active' }
            }
        })
        render(<Menu />)
        expect(document.querySelector('[class*="badge"]')).toBeInTheDocument()
    })

    it('does not show badge for high flood risk in offseason', () => {
        useGetAnomalyQuery.mockReturnValue({
            data: {
                anomalies: [],
                floodRisk: { level: 'critical', season: 'offseason' }
            }
        })
        render(<Menu />)
        expect(document.querySelector('[class*="badge"]')).not.toBeInTheDocument()
    })
})
