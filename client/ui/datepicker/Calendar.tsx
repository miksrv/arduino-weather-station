import React, { useEffect, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import { enDaysOfWeek, enMonths, ruDaysOfWeek, ruMonths } from '@/ui/datepicker/utils'
import Icon from '@/ui/icon'

dayjs.extend(utc)

export interface CalendarProps {
    hideDaysOfWeek?: boolean
    startDate?: string
    endDate?: string
    minDate?: string
    maxDate?: string
    locale?: 'en' | 'ru' | string
    onPeriodSelect?: (startDate?: string, endDate?: string) => void
}

const Calendar: React.FC<CalendarProps> = ({
    hideDaysOfWeek,
    startDate,
    endDate,
    minDate,
    maxDate,
    locale,
    onPeriodSelect
}) => {
    const [currentMonth, setCurrentMonth] = useState(dayjs().utc())
    const [selectedStartDate, setSelectedStartDate] = useState<Dayjs | null>(null)
    const [selectedEndDate, setSelectedEndDate] = useState<Dayjs | null>(null)

    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth.month())
    const [selectedYear, setSelectedYear] = useState<number>(currentMonth.year())
    const [yearsOptions, setYearsOptions] = useState<number[]>([])

    const daysInMonth = currentMonth.daysInMonth()
    const startDay = (currentMonth.startOf('month').day() + 6) % 7

    const handlePrevMonth = () => {
        const newMonth = currentMonth.subtract(1, 'month')
        setCurrentMonth(newMonth)
        setSelectedMonth(newMonth.month())
        setSelectedYear(newMonth.year())
    }

    const handleNextMonth = () => {
        const newMonth = currentMonth.add(1, 'month')
        setCurrentMonth(newMonth)
        setSelectedMonth(newMonth.month())
        setSelectedYear(newMonth.year())
    }

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(event.target.value, 10)
        setSelectedMonth(newMonth)
        setCurrentMonth(currentMonth.month(newMonth))
    }

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value, 10)
        setSelectedYear(newYear)
        setCurrentMonth(currentMonth.year(newYear))
    }

    const handleDateClick = (day: number) => {
        const newDate = currentMonth.date(day)

        if (minDate && newDate.isBefore(dayjs(minDate))) {
            return
        }

        if (maxDate && newDate.isAfter(dayjs(maxDate)) && !newDate.isSame(dayjs(maxDate), 'day')) {
            return
        }

        if (!selectedStartDate) {
            setSelectedStartDate(newDate)
            setSelectedEndDate(null)
        } else if (!selectedEndDate) {
            if (newDate.isAfter(selectedStartDate)) {
                setSelectedEndDate(newDate)
                onPeriodSelect?.(selectedStartDate.format('YYYY-MM-DD'), newDate.format('YYYY-MM-DD'))
            } else {
                setSelectedEndDate(selectedStartDate)
                setSelectedStartDate(newDate)
                onPeriodSelect?.(newDate.format('YYYY-MM-DD'), selectedStartDate.format('YYYY-MM-DD'))
            }
        } else {
            setSelectedStartDate(newDate)
            setSelectedEndDate(null)
        }
    }

    const renderDays = () => {
        const days: JSX.Element[] = []

        // Display days of the previous month
        for (let i = 0; i < startDay; i++) {
            days.push(
                <div
                    key={`prev-${i}`}
                    className={cn(styles.day, styles.prevMonth)}
                >
                    {currentMonth.subtract(1, 'month').daysInMonth() - startDay + i + 1}
                </div>
            )
        }

        // Displaying days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = currentMonth.date(day)
            let dayClass = styles.day

            if (selectedStartDate && selectedEndDate) {
                if (date.isAfter(selectedStartDate) && date.isBefore(selectedEndDate)) {
                    dayClass = cn(dayClass, styles.range)
                }
            }

            if (selectedStartDate && date.isSame(selectedStartDate, 'day')) {
                dayClass = cn(dayClass, styles.selected, styles.selectedStartDate)
            }
            if (selectedEndDate && date.isSame(selectedEndDate, 'day')) {
                dayClass = cn(dayClass, styles.selected, styles.selectedEndDate)
            }
            if (
                (minDate && date.isBefore(dayjs(minDate))) ||
                (maxDate && date.isAfter(dayjs(maxDate)) && !date.isSame(dayjs(maxDate), 'day'))
            ) {
                dayClass = cn(dayClass, styles.notAllowed)
            }

            days.push(
                <div
                    key={`day-${day}`}
                    className={dayClass}
                    onClick={() => handleDateClick(day)}
                >
                    {day}
                </div>
            )
        }

        return days
    }

    useEffect(() => {
        const years: number[] = []
        const currentYear = dayjs().utc().year()

        const minYear = minDate ? dayjs.utc(minDate).year() : 1900
        const maxYear = maxDate ? dayjs.utc(maxDate).year() : currentYear

        for (let year = minYear; year <= maxYear; year++) {
            years.push(year)
        }

        setYearsOptions(years)
    }, [minDate, maxDate])

    useEffect(() => {
        if (startDate) {
            setSelectedStartDate(dayjs.utc(startDate))
        }

        if (endDate) {
            setSelectedEndDate(dayjs.utc(endDate))
        }
    }, [startDate, endDate])

    return (
        <div className={styles.calendar}>
            <header className={styles.header}>
                <button
                    className={styles.navigateButton}
                    onClick={handlePrevMonth}
                >
                    <Icon name={'Left'} />
                </button>
                <span>
                    <div className={styles.selectContainer}>
                        <select
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className={styles.monthSelect}
                        >
                            {(locale === 'ru' ? ruMonths : enMonths).map((month, index) => (
                                <option
                                    key={index}
                                    value={index}
                                >
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.selectContainer}>
                        <select
                            value={selectedYear}
                            onChange={handleYearChange}
                            className={styles.yearSelect}
                        >
                            {yearsOptions.map((year) => (
                                <option
                                    key={year}
                                    value={year}
                                >
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </span>
                <button
                    className={styles.navigateButton}
                    onClick={handleNextMonth}
                >
                    <Icon name={'Right'} />
                </button>
            </header>
            {!hideDaysOfWeek && (
                <div className={styles.daysOfWeekContainer}>
                    {(locale === 'ru' ? ruDaysOfWeek : enDaysOfWeek).map((day) => (
                        <div
                            key={`dayOfWeek-${day}`}
                            className={styles.dayOfWeek}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            )}
            <div className={styles.body}>{renderDays()}</div>
        </div>
    )
}

export default Calendar
