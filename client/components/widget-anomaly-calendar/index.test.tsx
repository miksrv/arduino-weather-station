import React from 'react'

import { render, screen } from '@testing-library/react'

import WidgetAnomalyCalendar from './index'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}))

// Fix "today" so the calendar grid is deterministic
const FIXED_TODAY = new Date(2024, 5, 16) // June 16, 2024

beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_TODAY)
})

afterEach(() => {
    jest.useRealTimers()
})

// 52 weeks × 7 days = 364 cells
const TOTAL_CELLS = 364

describe('WidgetAnomalyCalendar', () => {
    it('renders 364 cells for a full grid of data', () => {
        const { container } = render(<WidgetAnomalyCalendar data={[]} />)
        const grid = container.querySelector('.grid')
        expect(grid).toBeInTheDocument()
        const cells = grid!.querySelectorAll('div')
        expect(cells).toHaveLength(TOTAL_CELLS)
    })

    it('applies the correct intensity class to a cell with activeCount === 2', () => {
        const targetDate = new Date(FIXED_TODAY)
        targetDate.setDate(targetDate.getDate() - 10)
        const y = targetDate.getFullYear()
        const m = String(targetDate.getMonth() + 1).padStart(2, '0')
        const d = String(targetDate.getDate()).padStart(2, '0')
        const dateStr = `${y}-${m}-${d}`

        const { container } = render(<WidgetAnomalyCalendar data={[{ date: dateStr, activeCount: 2 }]} />)
        const grid = container.querySelector('.grid')
        const intensityCell = grid!.querySelector('.cellIntensity2')
        expect(intensityCell).toBeInTheDocument()
    })

    it('does not apply active intensity class to a cell with activeCount === 0', () => {
        const { container } = render(<WidgetAnomalyCalendar data={[]} />)
        const grid = container.querySelector('.grid')
        expect(grid!.querySelector('.cellIntensity1')).not.toBeInTheDocument()
        expect(grid!.querySelector('.cellIntensity2')).not.toBeInTheDocument()
        expect(grid!.querySelector('.cellIntensity3')).not.toBeInTheDocument()
    })

    it('renders month labels', () => {
        render(<WidgetAnomalyCalendar data={[]} />)
        const monthLabels = screen.getAllByText(/^[A-Z][a-z]{2}$/)
        expect(monthLabels.length).toBeGreaterThan(0)
    })

    it('applies cellIntensity1 for activeCount === 1', () => {
        const targetDate = new Date(FIXED_TODAY)
        targetDate.setDate(targetDate.getDate() - 5)
        const y = targetDate.getFullYear()
        const m = String(targetDate.getMonth() + 1).padStart(2, '0')
        const d = String(targetDate.getDate()).padStart(2, '0')

        const { container } = render(<WidgetAnomalyCalendar data={[{ date: `${y}-${m}-${d}`, activeCount: 1 }]} />)
        expect(container.querySelector('.cellIntensity1')).toBeInTheDocument()
    })

    it('applies cellIntensity3 for activeCount === 3', () => {
        const targetDate = new Date(FIXED_TODAY)
        targetDate.setDate(targetDate.getDate() - 7)
        const y = targetDate.getFullYear()
        const m = String(targetDate.getMonth() + 1).padStart(2, '0')
        const d = String(targetDate.getDate()).padStart(2, '0')

        const { container } = render(<WidgetAnomalyCalendar data={[{ date: `${y}-${m}-${d}`, activeCount: 3 }]} />)
        expect(container.querySelector('.cellIntensity3')).toBeInTheDocument()
    })
})
