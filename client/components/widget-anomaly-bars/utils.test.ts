import { linearRegression } from './utils'

describe('linearRegression', () => {
    it('returns empty array for empty input', () => {
        expect(linearRegression([])).toStrictEqual([])
    })

    it('returns same value for single element', () => {
        expect(linearRegression([5])).toStrictEqual([5])
    })

    it('returns trend line for two points', () => {
        const result = linearRegression([0, 2])
        expect(result).toHaveLength(2)
        expect(result[0]).toBeCloseTo(0, 1)
        expect(result[1]).toBeCloseTo(2, 1)
    })

    it('calculates ascending trend correctly', () => {
        const result = linearRegression([1, 2, 3, 4, 5])
        expect(result).toHaveLength(5)
        // Should be approximately [1, 2, 3, 4, 5] for perfect linear data
        expect(result[0]).toBeCloseTo(1, 1)
        expect(result[4]).toBeCloseTo(5, 1)
    })

    it('calculates descending trend correctly', () => {
        const result = linearRegression([5, 4, 3, 2, 1])
        expect(result).toHaveLength(5)
        expect(result[0]).toBeCloseTo(5, 1)
        expect(result[4]).toBeCloseTo(1, 1)
    })

    it('calculates flat trend for constant values', () => {
        const result = linearRegression([3, 3, 3, 3])
        expect(result).toHaveLength(4)
        result.forEach((v: number) => expect(v).toBeCloseTo(3, 1))
    })

    it('handles negative values', () => {
        const result = linearRegression([-2, -1, 0, 1, 2])
        expect(result).toHaveLength(5)
        expect(result[0]).toBeCloseTo(-2, 1)
        expect(result[2]).toBeCloseTo(0, 1)
        expect(result[4]).toBeCloseTo(2, 1)
    })

    it('handles noisy data and returns smoothed trend', () => {
        const result = linearRegression([1, 3, 2, 4, 3, 5])
        expect(result).toHaveLength(6)
        // Should have ascending trend despite noise
        expect(result[5]).toBeGreaterThan(result[0])
    })

    it('rounds results to 2 decimal places', () => {
        const result = linearRegression([1.111, 2.222, 3.333])
        result.forEach((v: number) => {
            const decimals = (v.toString().split('.')[1] || '').length
            expect(decimals).toBeLessThanOrEqual(2)
        })
    })
})
