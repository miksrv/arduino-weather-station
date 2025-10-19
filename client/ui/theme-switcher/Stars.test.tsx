import React from 'react'

import { render, screen } from '@testing-library/react'

import Stars from './Stars'

import '@testing-library/jest-dom'

// Mock styles
jest.mock('@/ui/theme-switcher/styles.module.sass', () => ({
    stars: 'stars',
    star: 'star'
}))
// Mock TRANSITION_TIME
jest.mock('@/ui/theme-switcher/constants', () => ({
    TRANSITION_TIME: 100
}))

describe('Stars', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })
    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders with isClicked=false (opacity 0)', () => {
        const { container } = render(<Stars isClicked={false} />)
        const starsContainer = container.querySelector('.stars')
        expect(starsContainer).toHaveStyle('opacity: 0')
    })

    it('renders with isClicked=true (opacity 1)', () => {
        const { container } = render(<Stars isClicked={true} />)
        const starsContainer = container.querySelector('.stars')
        expect(starsContainer).toHaveStyle('opacity: 1')
    })

    it('transitions opacity when isClicked changes', () => {
        const { container, rerender } = render(<Stars isClicked={false} />)
        const starsContainer = container.querySelector('.stars')
        expect(starsContainer).toHaveStyle('opacity: 0')
        rerender(<Stars isClicked={true} />)
        jest.advanceTimersByTime(100)
        expect(starsContainer).toHaveStyle('opacity: 0')
        rerender(<Stars isClicked={false} />)
        jest.advanceTimersByTime(100)
        expect(starsContainer).toHaveStyle('opacity: 1')
    })

    it('renders 4 star elements with correct styles', () => {
        const { container } = render(<Stars isClicked={true} />)
        const stars = container.querySelectorAll('.star')
        expect(stars).toHaveLength(4)
        expect(stars[0]).toHaveStyle('top: 8px')
        expect(stars[1]).toHaveStyle('width: 3px')
        expect(stars[2]).toHaveStyle('opacity: 0.4')
        expect(stars[3]).toHaveStyle('left: 13px')
    })
})
