export const isLeapYear = (year: number): boolean => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

export const getCellColor = (total: number): string => {
    if (total <= 0) {
        return 'var(--input-border-color)'
    }
    if (total <= 1) {
        return '#cce5ff'
    }
    if (total <= 5) {
        return '#66b2ff'
    }
    if (total <= 20) {
        return '#1a7fd4'
    }
    return '#004080'
}
