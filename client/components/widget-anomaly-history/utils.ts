export { anomalyTypeToI18nKey } from '@/tools/conditions'

export const getDuration = (startDate: string, endDate: string | null): string => {
    if (!endDate) {
        return ''
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)

    return `${days}d`
}

export const isActiveToday = (endDate: string | null): boolean => {
    if (endDate == null) {
        return true
    }

    const today = new Date()
    const end = new Date(endDate)

    return (
        end.getFullYear() === today.getFullYear() &&
        end.getMonth() === today.getMonth() &&
        end.getDate() === today.getDate()
    )
}
