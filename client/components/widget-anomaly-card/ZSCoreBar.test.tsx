import React from 'react'

import { render } from '@testing-library/react'

import { ZScoreBar } from './ZSCoreBar'

import '@testing-library/jest-dom'

describe('ZScoreBar', () => {
    it('renders right fill for positive zScore', () => {
        const { container } = render(<ZScoreBar zScore={1.5} />)
        expect(container.querySelector('[class*="zBarFillRight"]')).toBeInTheDocument()
        expect(container.querySelector('[class*="zBarFillLeft"]')).not.toBeInTheDocument()
    })

    it('renders left fill for negative zScore', () => {
        const { container } = render(<ZScoreBar zScore={-1.5} />)
        expect(container.querySelector('[class*="zBarFillLeft"]')).toBeInTheDocument()
        expect(container.querySelector('[class*="zBarFillRight"]')).not.toBeInTheDocument()
    })

    it('right fill width is proportional to min(abs/3, 1) * 50 for positive zScore', () => {
        const { container } = render(<ZScoreBar zScore={3} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        // abs=3 => min(3/3, 1) * 50 = 50%
        expect(fill.style.width).toBe('50%')
    })

    it('right fill width is clamped at 50% when abs >= 3', () => {
        const { container } = render(<ZScoreBar zScore={6} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        // min(6/3, 1) * 50 = 50%
        expect(fill.style.width).toBe('50%')
    })

    it('left fill width is proportional for negative zScore', () => {
        const { container } = render(<ZScoreBar zScore={-1.5} />)
        const fill = container.querySelector('[class*="zBarFillLeft"]') as HTMLElement
        // abs=1.5 => min(1.5/3, 1) * 50 = 25%
        expect(fill.style.width).toBe('25%')
    })

    it('zScore = 0 renders right fill with 0% width', () => {
        const { container } = render(<ZScoreBar zScore={0} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        expect(fill).toBeInTheDocument()
        expect(fill.style.width).toBe('0%')
        expect(container.querySelector('[class*="zBarFillLeft"]')).not.toBeInTheDocument()
    })

    it('abs < 1.5 → green color', () => {
        const { container } = render(<ZScoreBar zScore={1.0} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        expect(fill.style.backgroundColor).toBe('var(--color-green)')
    })

    it('abs = 1.5 → orange color', () => {
        const { container } = render(<ZScoreBar zScore={1.5} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        expect(fill.style.backgroundColor).toBe('var(--color-orange)')
    })

    it('1.5 <= abs < 2.0 → orange color (negative)', () => {
        const { container } = render(<ZScoreBar zScore={-1.8} />)
        const fill = container.querySelector('[class*="zBarFillLeft"]') as HTMLElement
        expect(fill.style.backgroundColor).toBe('var(--color-orange)')
    })

    it('abs >= 2.0 → red color', () => {
        const { container } = render(<ZScoreBar zScore={2.5} />)
        const fill = container.querySelector('[class*="zBarFillRight"]') as HTMLElement
        expect(fill.style.backgroundColor).toBe('var(--color-red)')
    })

    it('abs = 2.0 → red color', () => {
        const { container } = render(<ZScoreBar zScore={-2.0} />)
        const fill = container.querySelector('[class*="zBarFillLeft"]') as HTMLElement
        expect(fill.style.backgroundColor).toBe('var(--color-red)')
    })
})
