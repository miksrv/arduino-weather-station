import React from 'react'
import dayjs from 'dayjs'

import Calendar, { CalendarProps } from '@/ui/datepicker/Calendar'

interface DatePickerProps extends CalendarProps {}

export enum PresetOption {
    TODAY = 'today',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
    HALF_YEAR = 'half_year',
    YEAR = 'year'
}

export type CalendarPresetType = {
    key: PresetOption
    endDate: Date
}

const getPresetDates = (preset: PresetOption): CalendarPresetType => {
    const now = dayjs.utc()

    switch (preset) {
        case PresetOption.TODAY:
            return { key: preset, endDate: now.toDate() }

        case PresetOption.DAY:
            return { key: preset, endDate: now.subtract(1, 'day').toDate() }

        case PresetOption.WEEK:
            return { key: preset, endDate: now.subtract(1, 'week').toDate() }

        case PresetOption.MONTH:
            return { key: preset, endDate: now.subtract(1, 'month').toDate() }

        case PresetOption.QUARTER:
            return { key: preset, endDate: now.subtract(3, 'month').toDate() }

        case PresetOption.HALF_YEAR:
            return { key: preset, endDate: now.subtract(6, 'month').toDate() }

        case PresetOption.YEAR:
            return { key: preset, endDate: now.subtract(1, 'year').toDate() }

        default:
            return { key: PresetOption.TODAY, endDate: now.toDate() }
    }
}

const DatePicker: React.FC<DatePickerProps> = (props) => {
    const handlePresetSelect = (preset: PresetOption) => {
        const { endDate } = getPresetDates(preset)
        props?.onPeriodSelect?.(dayjs(endDate).format('YYYY-MM-DD'), dayjs.utc().format('YYYY-MM-DD')) // Вызов с начала и конца периода
    }

    return (
        <>
            <div>
                {Object.values(PresetOption).map((preset) => (
                    <button
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                    >
                        {preset}
                    </button>
                ))}
            </div>
            <Calendar {...props} />
        </>
    )
}

export default DatePicker
