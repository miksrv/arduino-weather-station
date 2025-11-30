import React from 'react'

import { act, render, screen } from '@testing-library/react'

import Circle from './Circle'
import { TRANSITION_TIME } from './constants'

import '@testing-library/jest-dom'

// @ts-ignore (ignore missing types for mocked component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('./MoonIcon', () => (props: any) => (
    <div
        data-testid='moon-icon'
        data-clicked={props.checked ? '1' : '0'}
    />
))

describe('Circle', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })
    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
    })

    it('renders with initial checked=false styles', () => {
        render(<Circle checked={false} />)
        const circle = screen.getByTestId('moon-icon').parentElement
        expect(circle).toHaveStyle({
            transform: 'translateX(5px)',
            backgroundColor: '#fddf75',
            borderColor: '#d6b05eb5'
        })
        expect(screen.getByTestId('moon-icon')).toHaveAttribute('data-clicked', '0')
    })

    it('renders with initial checked=true styles', () => {
        render(<Circle checked={true} />)
        const circle = screen.getByTestId('moon-icon').parentElement
        expect(circle).toHaveStyle({
            transform: 'translateX(calc(100% + 15px))',
            backgroundColor: 'rgba(255,255,255,0.4)',
            borderColor: 'rgba(255,255,255,0.9)'
        })
        expect(screen.getByTestId('moon-icon')).toHaveAttribute('data-clicked', '1')
    })

    it('updates styles after checked changes (with delay)', () => {
        const { rerender } = render(<Circle checked={false} />)
        rerender(<Circle checked={true} />)
        // Before timeout, still old style
        let circle = screen.getByTestId('moon-icon').parentElement
        expect(circle).toHaveStyle({ transform: 'translateX(5px)' })
        // Fast-forward timer inside act
        act(() => {
            jest.advanceTimersByTime(TRANSITION_TIME)
        })
        rerender(<Circle checked={true} />)
        circle = screen.getByTestId('moon-icon').parentElement
        expect(circle).toHaveStyle({ transform: 'translateX(calc(100% + 15px))' })
    })

    it('cleans up timeout on unmount', () => {
        const { unmount } = render(<Circle checked={false} />)
        unmount()
        // No errors should occur
    })
})
