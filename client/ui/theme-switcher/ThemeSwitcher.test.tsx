import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import ThemeSwitcher from './ThemeSwitcher'

import '@testing-library/jest-dom'

jest.mock('@/ui/theme-switcher/ToggleSwitch', () => ({ checked }: { checked: boolean }) => (
    <div
        data-testid='toggle-switch'
        data-checked={checked ? 'true' : 'false'}
    />
))

describe('ThemeSwitcher', () => {
    it('renders without crashing', () => {
        render(<ThemeSwitcher />)
        expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('passes checked=true to ToggleSwitch when theme is "dark"', () => {
        render(<ThemeSwitcher theme='dark' />)
        expect(screen.getByTestId('toggle-switch')).toHaveAttribute('data-checked', 'true')
    })

    it('passes checked=false to ToggleSwitch when theme is "light"', () => {
        render(<ThemeSwitcher theme='light' />)
        expect(screen.getByTestId('toggle-switch')).toHaveAttribute('data-checked', 'false')
    })

    it('passes checked=false to ToggleSwitch when theme is undefined', () => {
        render(<ThemeSwitcher />)
        expect(screen.getByTestId('toggle-switch')).toHaveAttribute('data-checked', 'false')
    })

    it('calls onChangeTheme with "light" when current theme is "dark" and clicked', () => {
        const onChangeTheme = jest.fn()
        render(
            <ThemeSwitcher
                theme='dark'
                onChangeTheme={onChangeTheme}
            />
        )
        fireEvent.click(screen.getByRole('switch'))
        expect(onChangeTheme).toHaveBeenCalledWith('light')
    })

    it('calls onChangeTheme with "dark" when current theme is "light" and clicked', () => {
        const onChangeTheme = jest.fn()
        render(
            <ThemeSwitcher
                theme='light'
                onChangeTheme={onChangeTheme}
            />
        )
        fireEvent.click(screen.getByRole('switch'))
        expect(onChangeTheme).toHaveBeenCalledWith('dark')
    })

    it('does not throw when onChangeTheme is not provided', () => {
        render(<ThemeSwitcher theme='dark' />)
        expect(() => fireEvent.click(screen.getByRole('switch'))).not.toThrow()
    })

    it('exposes the dark state as aria-checked', () => {
        const { rerender } = render(<ThemeSwitcher theme='dark' />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')

        rerender(<ThemeSwitcher theme='light' />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('uses the label as the accessible name', () => {
        render(
            <ThemeSwitcher
                theme='dark'
                label='Dark theme'
            />
        )
        expect(screen.getByRole('switch', { name: 'Dark theme' })).toBeInTheDocument()
    })
})
