/**
 * Calculate linear regression trend line for a set of values.
 * Returns array of predicted values based on best-fit line.
 */
export const linearRegression = (values: number[]): number[] => {
    const n = values.length

    if (n < 2) {
        return values.slice()
    }

    const sumX = (n * (n - 1)) / 2
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((acc, y, i) => acc + i * y, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return values.map((_, i) => Math.round((intercept + slope * i) * 100) / 100)
}
