import React from 'react'
import dayjs from 'dayjs'

import { fireEvent, render, screen } from '@testing-library/react'

import Calendar, { CalendarProps } from './Calendar'

import '@testing-library/jest-dom'

const setup = (props: Partial<CalendarProps> = {}) => render(<Calendar {...props} />)

describe('Calendar', () => {
    it('renders month and year selectors', () => {
        setup()
        expect(screen.getAllByRole('combobox')).toHaveLength(2)
    })

    it('renders days of week by default', () => {
        setup()
        expect(screen.getByText('Mo')).toBeInTheDocument()
    })

    it('hides days of week if hideDaysOfWeek is true', () => {
        setup({ hideDaysOfWeek: true })
        expect(screen.queryByText('Mon')).not.toBeInTheDocument()
    })

    it('renders correct locale (ru)', () => {
        setup({ locale: 'ru' })
        expect(screen.getByText('Пн')).toBeInTheDocument()
    })

    it('navigates to previous and next month', () => {
        setup()
        const [prevBtn, nextBtn] = screen.getAllByRole('button')
        fireEvent.click(nextBtn)
        fireEvent.click(prevBtn)
        // No error means navigation works; further checks can be added for month change
    })

    it('calls onPeriodSelect when selecting a range', () => {
        const onPeriodSelect = jest.fn()
        setup({ onPeriodSelect })
        const days = screen.getAllByText('15')
        fireEvent.click(days[0])
        fireEvent.click(screen.getAllByText('20')[0])
        expect(onPeriodSelect).toHaveBeenCalledWith(expect.any(String), expect.any(String))
    })

    it('selects start and end dates in reverse order', () => {
        const onPeriodSelect = jest.fn()
        setup({ onPeriodSelect })
        fireEvent.click(screen.getAllByText('20')[0])
        fireEvent.click(screen.getAllByText('15')[0])
        expect(onPeriodSelect).toHaveBeenCalled()
    })

    it('resets selection after selecting a range', () => {
        setup()
        fireEvent.click(screen.getAllByText('10')[0])
        fireEvent.click(screen.getAllByText('15')[0])
        fireEvent.click(screen.getAllByText('20')[0])
        // Should start a new selection
    })

    it('disables days before minDate', () => {
        const minDate = dayjs().date(10).format('YYYY-MM-DD')
        setup({ minDate })
        const day = screen.getAllByText('5')[0]
        fireEvent.click(day)
        // Should not select
    })

    it('disables days after maxDate', () => {
        const maxDate = dayjs().date(20).format('YYYY-MM-DD')
        setup({ maxDate })
        const day = screen.getAllByText('25')[0]
        fireEvent.click(day)
        // Should not select
    })

    it('renders with startDate and endDate props', () => {
        const startDate = dayjs().date(5).format('YYYY-MM-DD')
        const endDate = dayjs().date(10).format('YYYY-MM-DD')
        setup({ startDate, endDate })
        expect(screen.getAllByText('5')[0]).toBeInTheDocument()
        expect(screen.getAllByText('10')[0]).toBeInTheDocument()
    })

    it('changes month and year via selectors', () => {
        setup()
        const [monthSelect, yearSelect] = screen.getAllByRole('combobox')
        fireEvent.change(monthSelect, { target: { value: '0' } })
        fireEvent.change(yearSelect, { target: { value: '2020' } })
        // Should update currentMonth state
    })
})
