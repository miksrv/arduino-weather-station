import React, { useMemo, useRef } from 'react'
import { Button, Popout, PopoutHandleProps } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { currentDate, formatDate } from '@/tools/date'
import { LocaleType } from '@/tools/types'
import Datepicker, { findPresetByDate } from '@/ui/datepicker'

const MIN_DATE = '2021-01-01'

interface PeriodSelectorProps {
    disabled?: boolean
    minDate?: string
    periodDates?: string[]
    onSetPeriod?: (period?: string[]) => void
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ disabled, minDate, periodDates, onSetPeriod }) => {
    const { i18n } = useTranslation()

    const popoutRef = useRef<PopoutHandleProps>(null)

    const currentDatePreset = useMemo((): string => {
        const preset = findPresetByDate(periodDates?.[0], periodDates?.[1], i18n.language as LocaleType)

        return preset ? preset : periodDates?.[0] && periodDates?.[1] ? `${periodDates?.[0]} - ${periodDates?.[1]}` : ''
    }, [periodDates, i18n.language])

    return (
        <Popout
            ref={popoutRef}
            position={'left'}
            disabled={disabled}
            trigger={
                <Button
                    mode={'secondary'}
                    disabled={disabled}
                >
                    {currentDatePreset}
                </Button>
            }
        >
            <Datepicker
                locale={i18n.language as LocaleType}
                startDate={periodDates?.[0]}
                endDate={periodDates?.[1]}
                minDate={minDate || MIN_DATE}
                maxDate={formatDate(currentDate.toDate(), 'YYYY-MM-DD')}
                onPeriodSelect={(startDate, endDate) => {
                    onSetPeriod?.([startDate || '', endDate || ''])

                    if (popoutRef.current) {
                        popoutRef.current.close()
                    }
                }}
            />
        </Popout>
    )
}

export default PeriodSelector
