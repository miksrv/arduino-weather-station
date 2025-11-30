import React, { act } from 'react'

import { render } from '@testing-library/react'

import { TRANSITION_TIME } from './constants'
import MoonIcon from './MoonIcon'

import '@testing-library/jest-dom'

describe('MoonIcon', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })
    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
    })

    it('renders with initial checked=false', () => {
        render(<MoonIcon checked={false} />)
        const div = document.querySelector('.moonSvg') as HTMLElement
        expect(div).toHaveStyle({
            opacity: '0',
            transform: 'translateY(32px)'
        })
    })

    it('renders with initial checked=true', () => {
        render(<MoonIcon checked={true} />)
        const div = document.querySelector('.moonSvg') as HTMLElement
        expect(div).toHaveStyle({
            opacity: '1',
            transform: 'translateY(0px)'
        })
    })

    it('updates style after checked changes (with delay)', () => {
        const { rerender, container } = render(<MoonIcon checked={false} />)
        rerender(<MoonIcon checked={true} />)
        const div = container.firstChild as HTMLElement
        // Before timer, still old style
        expect(div).toHaveStyle({ opacity: '0', transform: 'translateY(32px)' })
        // Advance timer in act
        act(() => {
            jest.advanceTimersByTime(TRANSITION_TIME)
        })
        // After timer, new style
        expect(div).toHaveStyle({ opacity: '1', transform: 'translateY(0px)' })
    })

    it('cleans up timeout on unmount', () => {
        const { unmount } = render(<MoonIcon checked={false} />)
        expect(() => unmount()).not.toThrow()
    })
})
