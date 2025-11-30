import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import ToggleSwitch from './ToggleSwitch'

import '@testing-library/jest-dom'

// Mock child components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@/ui/theme-switcher/Circle', () => (props: any) => (
    <div
        data-testid='circle'
        {...props}
    />
))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@/ui/theme-switcher/Stars', () => (props: any) => (
    <div
        data-testid='stars'
        {...props}
    />
))

describe('ToggleSwitch', () => {
    it('renders with checked=false', () => {
        render(<ToggleSwitch checked={false} />)
        expect(screen.getByTestId('circle')).toBeInTheDocument()
        expect(screen.getByTestId('stars')).toBeInTheDocument()
        const div = screen.getByTestId('circle').parentElement as HTMLElement
        expect(div).toHaveStyle('background-color: #80c7cb')
    })

    it('renders with checked=true', () => {
        render(<ToggleSwitch checked={true} />)
        const div = screen.getByTestId('circle').parentElement
        expect(div).toHaveStyle('background-color: #595dde')
    })

    it('changes background on hover (checked=false)', () => {
        render(<ToggleSwitch checked={false} />)
        const div = screen.getByTestId('circle').parentElement as HTMLElement
        fireEvent.mouseEnter(div)
        expect(div).toHaveStyle('background-color: #79bfc3')
        fireEvent.mouseLeave(div)
        expect(div).toHaveStyle('background-color: #80c7cb')
    })

    it('changes background on hover (checked=true)', () => {
        render(<ToggleSwitch checked={true} />)
        const div = screen.getByTestId('circle').parentElement as HTMLElement
        fireEvent.mouseEnter(div)
        expect(div).toHaveStyle('background-color: #5559cc')
        fireEvent.mouseLeave(div)
        expect(div).toHaveStyle('background-color: #595dde')
    })

    it('scales on hover and active', () => {
        render(<ToggleSwitch checked={false} />)
        const div = screen.getByTestId('circle').parentElement as HTMLElement
        fireEvent.mouseEnter(div)
        expect(div).toHaveStyle('transform: scale(1.05)')
        fireEvent.mouseDown(div)
        expect(div).toHaveStyle('transform: scale(1.03)')
        fireEvent.mouseUp(div)
        expect(div).toHaveStyle('transform: scale(1.05)')
        fireEvent.mouseLeave(div)
        expect(div).toHaveStyle('transform: scale(1)')
    })
})
