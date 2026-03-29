/**
 * Formats a Date object as a YYYY-MM-DD string using local time.
 */
export const formatDateStr = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/**
 * Returns true when the given cell date is strictly after today.
 */
export const isFutureDate = (cellDate: Date, today: Date): boolean => cellDate > today

/**
 * Maps an activeCount to one of three CSS Module intensity class keys.
 * count === 1 → 'cellIntensity1'
 * count === 2 → 'cellIntensity2'
 * count >= 3  → 'cellIntensity3'
 */
export const getIntensityClass = (count: number): 'cellIntensity1' | 'cellIntensity2' | 'cellIntensity3' => {
    if (count === 1) {
        return 'cellIntensity1'
    }
    if (count === 2) {
        return 'cellIntensity2'
    }
    return 'cellIntensity3'
}
