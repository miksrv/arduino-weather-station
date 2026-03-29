import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import WidgetPrecipCalendar from './WidgetPrecipCalendar'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        i18n: { language: 'en' },
        t: (key: string) => key
    })
}))

jest.mock('@/tools/date', () => ({
    formatDate: (_d: string, _f: string) => _d
}))

beforeEach(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 200,
        width: 10,
        height: 10,
        right: 110,
        bottom: 210,
        x: 100,
        y: 200,
        toJSON: () => ({})
    }))
})

describe('WidgetPrecipCalendar', () => {
    it('renders Skeleton when loading', () => {
        render(<WidgetPrecipCalendar loading={true} />)
        expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('does not render the grid when loading', () => {
        const { container } = render(<WidgetPrecipCalendar loading={true} />)
        expect(container.querySelectorAll('.monthRow')).toHaveLength(0)
    })

    it('renders 12 month rows by default', () => {
        const { container } = render(<WidgetPrecipCalendar />)
        expect(container.querySelectorAll('.monthRow')).toHaveLength(12)
    })

    it('Feb row has 28 active cells for non-leap year (2023)', () => {
        const { container } = render(<WidgetPrecipCalendar year={2023} />)
        const monthRows = container.querySelectorAll('.monthRow')
        const febRow = monthRows[1]
        // days 1-28 are .cell, days 29-31 are .cellEmpty
        expect(febRow.querySelectorAll('.cell')).toHaveLength(28)
        expect(febRow.querySelectorAll('.cellEmpty')).toHaveLength(3)
    })

    it('Feb row has 29 active cells for leap year (2024)', () => {
        const { container } = render(<WidgetPrecipCalendar year={2024} />)
        const monthRows = container.querySelectorAll('.monthRow')
        const febRow = monthRows[1]
        // days 1-29 are .cell, days 30-31 are .cellEmpty
        expect(febRow.querySelectorAll('.cell')).toHaveLength(29)
        expect(febRow.querySelectorAll('.cellEmpty')).toHaveLength(2)
    })

    it('a cell with data gets a non-neutral background color', () => {
        const days = [{ date: '2024-01-15', total: 5.5 }]
        const { container } = render(
            <WidgetPrecipCalendar
                year={2024}
                days={days}
            />
        )
        const monthRows = container.querySelectorAll('.monthRow')
        const janRow = monthRows[0]
        const cells = janRow.querySelectorAll('.cell')
        // day 15 is index 14 (0-based)
        const dataCell = cells[14] as HTMLElement
        expect(dataCell.style.backgroundColor).not.toBe('var(--input-border-color)')
    })

    it('renders all 5 legend labels', () => {
        render(<WidgetPrecipCalendar />)
        expect(screen.getByText('dry-days')).toBeInTheDocument()
        expect(screen.getByText('precip-level-trace')).toBeInTheDocument()
        expect(screen.getByText('precip-level-light')).toBeInTheDocument()
        expect(screen.getByText('precip-level-moderate')).toBeInTheDocument()
        expect(screen.getByText('precip-level-heavy')).toBeInTheDocument()
    })

    it('shows tooltip on mouse enter on a data cell', () => {
        const days = [{ date: '2024-03-10', total: 3.2 }]
        const { container } = render(
            <WidgetPrecipCalendar
                year={2024}
                days={days}
            />
        )
        // March is monthIndex=2; day 10 is index 9
        const monthRows = container.querySelectorAll('.monthRow')
        const marRow = monthRows[2]
        const cells = marRow.querySelectorAll('.cell')
        const dataCell = cells[9]

        fireEvent.mouseEnter(dataCell)
        expect(screen.getByText('2024-03-10')).toBeInTheDocument()
    })

    it('hides tooltip on mouse leave', () => {
        const days = [{ date: '2024-03-10', total: 3.2 }]
        const { container } = render(
            <WidgetPrecipCalendar
                year={2024}
                days={days}
            />
        )
        const monthRows = container.querySelectorAll('.monthRow')
        const marRow = monthRows[2]
        const cells = marRow.querySelectorAll('.cell')
        const dataCell = cells[9]

        fireEvent.mouseEnter(dataCell)
        expect(screen.getByText('2024-03-10')).toBeInTheDocument()

        fireEvent.mouseLeave(dataCell)
        expect(screen.queryByText('2024-03-10')).not.toBeInTheDocument()
    })
})
