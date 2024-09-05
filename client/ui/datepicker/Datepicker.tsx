import React, { useState } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface CalendarProps {
    selectedDate?: Date | null
    onDateChange?: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const handleDateClick = (date: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date)
        onDateChange?.(newDate)
    }

    const renderDays = () => {
        const days: JSX.Element[] = []
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
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <div
                    key={day}
                    className={cn(styles.day, selectedDate && selectedDate.getDate() === day && styles.selected)}
                    onClick={() => handleDateClick(day)}
                >
                    {day}
                </div>
            )
        }
        return days
    }

    return (
        <div className={styles.calendar}>
            <header className={styles.header}>
                <button onClick={handlePrevMonth}>&lt;</button>
                <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={handleNextMonth}>&gt;</button>
            </header>
            <div className={styles.body}>{renderDays()}</div>
        </div>
    )
}

export default Calendar
