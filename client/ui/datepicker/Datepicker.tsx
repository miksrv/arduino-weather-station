import React, { useState } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface CalendarProps {
    hideDaysOfWeek?: boolean
    onPeriodSelect?: (startDate?: Date, endDate?: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({ hideDaysOfWeek, onPeriodSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()

    const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()
    const startDay = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7
    // For start of week in Sunday
    // const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

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

    return (
        <div className={styles.calendar}>
            <header className={styles.header}>
                <button
                    className={styles.navigateButton}
                    onClick={handlePrevMonth}
                >
                    <Icon name={'Left'} />
                </button>
                <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
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
