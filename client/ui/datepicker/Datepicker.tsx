import React, { useCallback } from 'react'
import dayjs from 'dayjs'

import styles from './styles.module.sass'

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
const nowDate = dayjs.utc() // Для общего времени

const timePresets: CalendarPresetType[] = [
    { key: PresetOption.TODAY, endDate: nowDate.toDate() }, // Сегодняшний день
    { key: PresetOption.DAY, endDate: nowDate.subtract(1, 'day').toDate() }, // Сутки назад
    { key: PresetOption.WEEK, endDate: nowDate.subtract(1, 'week').toDate() }, // Неделя назад
    { key: PresetOption.MONTH, endDate: nowDate.subtract(1, 'month').toDate() }, // Месяц назад
    { key: PresetOption.QUARTER, endDate: nowDate.subtract(3, 'month').toDate() }, // Квартал назад
    { key: PresetOption.HALF_YEAR, endDate: nowDate.subtract(6, 'month').toDate() }, // Полгода назад
    { key: PresetOption.YEAR, endDate: nowDate.subtract(1, 'year').toDate() } // Год назад
]

const DatePicker: React.FC<DatePickerProps> = (props) => {
    const handlePresetSelect = (preset: PresetOption) => {
        const endDate = timePresets?.find(({key}) => key === preset)?.endDate
        props?.onPeriodSelect?.(dayjs(endDate).format('YYYY-MM-DD'), dayjs.utc().format('YYYY-MM-DD')) // Вызов с начала и конца периода
    }

    const findCurrentPreset = useCallback((key: PresetOption): CalendarPresetType | undefined => {
        const preset = timePresets?.find((preset) => preset.key === key)

        if (nowDate.isSame(props.endDate, 'day') && dayjs(props.startDate).isSame(preset?.endDate, 'day')) {
            return preset
        }

        return undefined
    }, [props.startDate, props.endDate])

    return (
        <>
            <div>
                {timePresets?.map(({key}) => (
                    <button
                        key={key}
                        className={findCurrentPreset(key) && styles.presetActive}
                        onClick={() => handlePresetSelect(key)}
                    >
                        {key}
                    </button>
                ))}
            </div>
            <Calendar {...props} />
        </>
    )
}

export default DatePicker
