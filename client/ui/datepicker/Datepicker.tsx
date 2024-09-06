import React, { useCallback } from 'react'
import dayjs from 'dayjs'

import styles from './styles.module.sass'

import Button from '@/ui/button'
import Calendar, { CalendarProps } from '@/ui/datepicker/Calendar'
import { CalendarPresetType, enPresets, PresetOption, ruPresets } from '@/ui/datepicker/utils'

interface DatePickerProps extends CalendarProps {}

const nowDate = dayjs.utc()

export const timePresets: CalendarPresetType[] = [
    { key: PresetOption.TODAY, endDate: nowDate.toDate() },
    { key: PresetOption.DAY, endDate: nowDate.subtract(1, 'day').toDate() },
    { key: PresetOption.WEEK, endDate: nowDate.subtract(1, 'week').toDate() },
    { key: PresetOption.MONTH, endDate: nowDate.subtract(1, 'month').toDate() },
    { key: PresetOption.QUARTER, endDate: nowDate.subtract(3, 'month').toDate() },
    { key: PresetOption.HALF_YEAR, endDate: nowDate.subtract(6, 'month').toDate() },
    { key: PresetOption.YEAR, endDate: nowDate.subtract(1, 'year').toDate() }
]

export const findPresetByDate = (
    startDate?: string,
    endDate?: string,
    locale?: CalendarProps['locale']
): string | undefined => {
    if (!startDate || !endDate) {
        return undefined
    }

    const start = dayjs(startDate)
    const end = dayjs(endDate)

    // Check that the end date is today
    const isEndDateToday = end.isSame(nowDate, 'day')

    if (!isEndDateToday) {
        return undefined
    }

    // We go through each preset and check if the start of the period matches
    for (const preset of timePresets) {
        const presetStartDate = dayjs(preset.endDate)

        if (start.isSame(presetStartDate, 'day')) {
            return locale ? (locale === 'ru' ? ruPresets[preset.key] : enPresets[preset.key]) : preset.key
        }
    }

    return undefined
}

const DatePicker: React.FC<DatePickerProps> = (props) => {
    const findCurrentPreset = useCallback(
        (key: PresetOption): CalendarPresetType | undefined => {
            const preset = timePresets?.find((preset) => preset.key === key)

            if (nowDate.isSame(props?.endDate, 'day') && dayjs(props?.startDate).isSame(preset?.endDate, 'day')) {
                return preset
            }

            return undefined
        },
        [props?.startDate, props?.endDate]
    )

    const handlePresetSelect = (preset: PresetOption) => {
        const endDate = timePresets?.find(({ key }) => key === preset)?.endDate

        // Call from the beginning and end of the period
        props?.onPeriodSelect?.(dayjs(endDate).format('YYYY-MM-DD'), dayjs.utc().format('YYYY-MM-DD'))
    }

    return (
        <div className={styles.datePickerContainer}>
            <div className={styles.presetList}>
                {timePresets?.map(({ key }) => (
                    <Button
                        key={key}
                        mode={findCurrentPreset(key)?.key ? 'secondary' : 'outline'}
                        onClick={() => handlePresetSelect(key)}
                    >
                        {props?.locale === 'ru' ? ruPresets[key] : enPresets[key]}
                    </Button>
                ))}
            </div>
            <Calendar {...props} />
        </div>
    )
}

export default DatePicker
