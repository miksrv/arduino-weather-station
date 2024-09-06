import React, { useCallback } from 'react'
import dayjs from 'dayjs'

import styles from './styles.module.sass'

import Button from '@/ui/button'
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

const nowDate = dayjs.utc()

export const enPresets = {
    [PresetOption.TODAY]: 'Today',
    [PresetOption.DAY]: '24 Hours',
    [PresetOption.WEEK]: 'Last Week',
    [PresetOption.MONTH]: 'Last Month',
    [PresetOption.QUARTER]: 'Last Quarter',
    [PresetOption.HALF_YEAR]: 'Last 6 Months',
    [PresetOption.YEAR]: 'Last Year'
}

export const ruPresets = {
    [PresetOption.TODAY]: 'Сегодня',
    [PresetOption.DAY]: 'Сутки',
    [PresetOption.WEEK]: 'Неделя',
    [PresetOption.MONTH]: 'Месяц',
    [PresetOption.QUARTER]: 'Квартал',
    [PresetOption.HALF_YEAR]: 'Полгода',
    [PresetOption.YEAR]: 'Год'
}

const timePresets: CalendarPresetType[] = [
    { key: PresetOption.TODAY, endDate: nowDate.toDate() },
    { key: PresetOption.DAY, endDate: nowDate.subtract(1, 'day').toDate() },
    { key: PresetOption.WEEK, endDate: nowDate.subtract(1, 'week').toDate() },
    { key: PresetOption.MONTH, endDate: nowDate.subtract(1, 'month').toDate() },
    { key: PresetOption.QUARTER, endDate: nowDate.subtract(3, 'month').toDate() },
    { key: PresetOption.HALF_YEAR, endDate: nowDate.subtract(6, 'month').toDate() },
    { key: PresetOption.YEAR, endDate: nowDate.subtract(1, 'year').toDate() }
]

const DatePicker: React.FC<DatePickerProps> = ({endDate, startDate, locale, ...props}) => {
    const handlePresetSelect = (preset: PresetOption) => {
        const endDate = timePresets?.find(({key}) => key === preset)?.endDate
        props?.onPeriodSelect?.(dayjs(endDate).format('YYYY-MM-DD'), dayjs.utc().format('YYYY-MM-DD')) // Вызов с начала и конца периода
    }

    const findCurrentPreset = useCallback((key: PresetOption): CalendarPresetType | undefined => {
        const preset = timePresets?.find((preset) => preset.key === key)

        if (nowDate.isSame(endDate, 'day') && dayjs(startDate).isSame(preset?.endDate, 'day')) {
            return preset
        }

        return undefined
    }, [startDate, endDate])

    return (
        <div className={styles.datePickerContainer}>
            <div className={styles.presetList}>
                {timePresets?.map(({key}) => (
                    <Button
                        key={key}
                        mode={findCurrentPreset(key)?.key ? 'secondary' : 'outline'}
                        onClick={() => handlePresetSelect(key)}
                    >
                        {locale === 'ru' ? ruPresets[key] : enPresets[key]}
                    </Button>
                ))}
            </div>
            <Calendar {...props} />
        </div>
    )
}

export default DatePicker
