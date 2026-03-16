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
        expect(screen.getByRole('button')).toBeInTheDocument()
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
        fireEvent.click(screen.getByRole('button'))
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
        fireEvent.click(screen.getByRole('button'))
        expect(onChangeTheme).toHaveBeenCalledWith('dark')
    })

    it('does not throw when onChangeTheme is not provided', () => {
        render(<ThemeSwitcher theme='dark' />)
        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow()
    })

    it('triggers onChangeTheme via Enter key', () => {
        const onChangeTheme = jest.fn()
        render(
            <ThemeSwitcher
                theme='dark'
                onChangeTheme={onChangeTheme}
            />
        )
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
        expect(onChangeTheme).toHaveBeenCalledWith('light')
    })

    it('triggers onChangeTheme via Space key', () => {
        const onChangeTheme = jest.fn()
        render(
            <ThemeSwitcher
                theme='light'
                onChangeTheme={onChangeTheme}
            />
        )
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
        expect(onChangeTheme).toHaveBeenCalledWith('dark')
    })

    it('does not call onChangeTheme for unrelated key presses', () => {
        const onChangeTheme = jest.fn()
        render(
            <ThemeSwitcher
                theme='dark'
                onChangeTheme={onChangeTheme}
            />
        )
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' })
        expect(onChangeTheme).not.toHaveBeenCalled()
    })
})
