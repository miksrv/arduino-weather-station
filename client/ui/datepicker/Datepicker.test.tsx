import React from 'react'
import dayjs from 'dayjs'

import { fireEvent, render, screen } from '@testing-library/react'

import { PresetOption } from '@/ui/datepicker/utils'

import DatePicker, { findPresetByDate, timePresets } from './Datepicker'

import '@testing-library/jest-dom'

describe('DatePicker', () => {
    it('renders all preset buttons by default', () => {
        render(<DatePicker />)
        const enPresetNames = [
            'Today',
            '24 Hours',
            'Last Week',
            'Last Month',
            'Last Quarter',
            'Last 6 Months',
            'Last Year'
        ]
        enPresetNames.forEach((name) => {
            expect(screen.getByRole('button', { name })).toBeInTheDocument()
        })
    })

    it('renders preset names in Russian if locale is ru', () => {
        render(<DatePicker locale='ru' />)
        const ruPresetNames = [
            'Сегодня',
            'Последняя неделя',
            'Последний месяц',
            'Последний квартал',
            'Последние полгода',
            'Последний год'
        ]
        ruPresetNames.forEach((name) => {
            expect(screen.getByRole('button', { name })).toBeInTheDocument()
        })
    })

    it('hides specified presets', () => {
        render(<DatePicker hidePresets={[PresetOption.TODAY, PresetOption.DAY]} />)
        expect(screen.queryByRole('button', { name: 'TODAY' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'DAY' })).not.toBeInTheDocument()
    })

    it('calls onPeriodSelect with correct dates when preset is clicked', () => {
        const onPeriodSelect = jest.fn()
        render(<DatePicker onPeriodSelect={onPeriodSelect} />)
        const btn = screen.getByRole('button', { name: 'Today' })
        fireEvent.click(btn)
        expect(onPeriodSelect).toHaveBeenCalledWith(expect.any(String), dayjs.utc().format('YYYY-MM-DD'))
    })

    it('highlights the current preset if dates match', () => {
        const endDate = dayjs.utc().format('YYYY-MM-DD')
        const startDate = dayjs(timePresets[0].endDate).format('YYYY-MM-DD')
        render(
            <DatePicker
                startDate={startDate}
                endDate={endDate}
            />
        )
        const btn = screen.getByRole('button', { name: 'Today' })
        expect(btn).toHaveAttribute('mode', 'secondary')
    })
})

describe('findPresetByDate', () => {
    it('returns undefined if startDate or endDate is missing', () => {
        expect(findPresetByDate(undefined, '2024-01-01')).toBeUndefined()
        expect(findPresetByDate('2024-01-01', undefined)).toBeUndefined()
    })

    it('returns undefined if endDate is not today', () => {
        expect(findPresetByDate('2024-01-01', '2020-01-01')).toBeUndefined()
    })

    it('returns correct preset key if dates match a preset', () => {
        const endDate = dayjs.utc().format('YYYY-MM-DD')
        const startDate = dayjs(timePresets[0].endDate).format('YYYY-MM-DD')
        expect(findPresetByDate(startDate, endDate)).toBe(PresetOption.TODAY)
    })

    it('returns localized preset if locale is ru', () => {
        const endDate = dayjs.utc().format('YYYY-MM-DD')
        const startDate = dayjs(timePresets[0].endDate).format('YYYY-MM-DD')
        expect(findPresetByDate(startDate, endDate, 'ru')).toMatch(/сегодня/i)
    })
})
