import React, { useEffect, useState } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface CalendarProps {
    hideDaysOfWeek?: boolean
    minDate?: Date
    maxDate?: Date
    onPeriodSelect?: (startDate?: Date, endDate?: Date) => void
}

const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const months = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
]

const Calendar: React.FC<CalendarProps> = ({ hideDaysOfWeek, minDate, maxDate, onPeriodSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()

    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth.getMonth())
    const [selectedYear, setSelectedYear] = useState<number>(currentMonth.getFullYear())

    const [yearsOptions, setYearsOptions] = useState<number[]>([])

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()
    const startDay = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7
    // For start of week in Sunday
    // const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

    const handlePrevMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        setCurrentMonth(newMonth)
        setSelectedMonth(newMonth.getMonth())
        setSelectedYear(newMonth.getFullYear())
    }

    const handleNextMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        setCurrentMonth(newMonth)
        setSelectedMonth(newMonth.getMonth())
        setSelectedYear(newMonth.getFullYear())
    }

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(event.target.value, 10)
        setSelectedMonth(newMonth)
        setCurrentMonth(new Date(selectedYear, newMonth, 1))
    }

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value, 10)
        setSelectedYear(newYear)
        setCurrentMonth(new Date(newYear, selectedMonth, 1))
    }

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

        if (minDate && newDate < minDate) {
            return
        }
        if (maxDate && newDate > maxDate) {
            return
        }

        if (!startDate) {
            // If the start date is not selected, set it
            setStartDate(newDate)
            setEndDate(undefined)
        } else if (!endDate) {
            // If the end date is not selected
            if (newDate >= startDate) {
                setEndDate(newDate)
            } else {
                // If the selected date is earlier than the start date, swap them
                setEndDate(startDate)
                setStartDate(newDate)
            }
            if (onPeriodSelect) {
                onPeriodSelect?.(startDate, endDate)
            }
        } else {
            // If both dates are selected, reset and set a new start date
            setStartDate(newDate)
            setEndDate(undefined)
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
                    {prevMonthDays - startDay + i + 1}
                </div>
            )
        }

        // Displaying days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            let dayClass = styles.day

            if (startDate && endDate) {
                if (date > startDate && date < endDate) {
                    dayClass = cn(dayClass, styles.range) // День в диапазоне
                }
            }

            if (startDate && date.toDateString() === startDate.toDateString()) {
                dayClass = cn(dayClass, styles.selected, styles.startDate)
            }
            if (endDate && date.toDateString() === endDate.toDateString()) {
                dayClass = cn(dayClass, styles.selected, styles.endDate)
            }
            if (startDate && endDate && date.toDateString() === endDate.toDateString()) {
                dayClass = cn(dayClass, styles.selected, styles.endDate)
            }
            if ((minDate && date < minDate) || (maxDate && date > maxDate)) {
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

    const renderDaysOfWeek = () => (
        <div className={styles.daysOfWeekContainer}>
            {daysOfWeek.map((day) => (
                <div
                    key={`dayOfWeek-${day}`}
                    className={styles.dayOfWeek}
                >
                    {day}
                </div>
            ))}
        </div>
    )

    useEffect(() => {
        const years: number[] = []
        const currentYear = new Date().getFullYear()

        if (minDate) {
            const minYear = minDate.getFullYear()
            for (let year = minYear; year <= currentYear; year++) {
                years.push(year)
            }
        }

        if (maxDate) {
            const maxYear = maxDate.getFullYear()
            const minYear = minDate ? minDate.getFullYear() : 1900
            for (let year = minYear; year <= maxYear; year++) {
                years.push(year)
            }
        }

        setYearsOptions(years)
    }, [minDate, maxDate])

    return (
        <div className={styles.calendar}>
            <header className={styles.header}>
                <button
                    className={styles.navigateButton}
                    onClick={handlePrevMonth}
                >
                    <Icon name={'Left'} />
                </button>
                {/*<span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>*/}
                <span>
                    <div className={styles.selectContainer}>
                        <select
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className={styles.monthSelect}
                        >
                            {months.map((month, index) => (
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
            {!hideDaysOfWeek && renderDaysOfWeek()}
            <div className={styles.body}>{renderDays()}</div>
        </div>
    )
}

export default Calendar
