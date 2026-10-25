import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import AppLayout from './AppLayout'

import '@testing-library/jest-dom'

jest.mock('@/api/store', () => ({
    useAppSelector: jest.fn()
}))
jest.mock('@/components/app-bar', () =>
    jest.fn(({ onMenuClick }: { onMenuClick: () => void }) => (
        <button
            data-testid='app-bar'
            onClick={onMenuClick}
        >
            {'Open menu'}
        </button>
    ))
)
jest.mock('@/components/footer', () => jest.fn(() => <div data-testid='footer' />))
jest.mock('@/components/language-switcher', () => jest.fn(() => <div data-testid='language-switcher' />))
jest.mock('@/components/stale-data-banner', () => jest.fn(() => <div data-testid='stale-data-banner' />))
jest.mock('./Menu', () =>
    jest.fn(({ onClick }) => (
        <button
            data-testid='menu'
            onClick={onClick}
        >
            {'Menu'}
        </button>
    ))
)

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const useAppSelector = require('@/api/store').useAppSelector

const getSidebar = () => document.querySelector('aside') as HTMLElement
const getOverlay = () => document.querySelector('[aria-hidden="true"]') as HTMLElement

describe('AppLayout', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useAppSelector.mockImplementation((fn: (state: unknown) => unknown) =>
            fn({ application: { showOverlay: false } })
        )
    })

    it('renders all main layout parts and children', () => {
        render(
            <AppLayout>
                <div>{'ChildContent'}</div>
            </AppLayout>
        )
        expect(screen.getByTestId('app-bar')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
        expect(screen.getByTestId('menu')).toBeInTheDocument()
        expect(screen.getByTestId('stale-data-banner')).toBeInTheDocument()
        expect(screen.getByText('ChildContent')).toBeInTheDocument()
    })

    it('keeps the menu closed until the app bar opens it', () => {
        render(<AppLayout />)
        expect(getSidebar().className).toMatch(/closed/)
        expect(getOverlay().className).toMatch(/hidden/)

        fireEvent.click(screen.getByTestId('app-bar'))

        expect(getSidebar().className).toMatch(/opened/)
        expect(getOverlay().className).toMatch(/displayed/)
    })

    it('closes the menu on an overlay click', () => {
        render(<AppLayout />)
        fireEvent.click(screen.getByTestId('app-bar'))
        fireEvent.click(getOverlay())

        expect(getSidebar().className).toMatch(/closed/)
    })

    it('closes the menu on Escape', () => {
        render(<AppLayout />)
        fireEvent.click(screen.getByTestId('app-bar'))
        fireEvent.keyDown(window, { key: 'Escape' })

        expect(getSidebar().className).toMatch(/closed/)
    })

    it('ignores other keys', () => {
        render(<AppLayout />)
        fireEvent.click(screen.getByTestId('app-bar'))
        fireEvent.keyDown(window, { key: 'Enter' })

        expect(getSidebar().className).toMatch(/opened/)
    })

    it('closes the menu when a menu item is chosen', () => {
        render(<AppLayout />)
        fireEvent.click(screen.getByTestId('app-bar'))
        fireEvent.click(screen.getByTestId('menu'))

        expect(getSidebar().className).toMatch(/closed/)
    })

    it('applies fullSize class when fullSize prop is true', () => {
        const { container } = render(<AppLayout fullSize />)
        expect((container?.firstChild as HTMLElement)?.className).toMatch(/fullSize/)
    })

    it('locks the page scroll while the menu is open', () => {
        render(<AppLayout />)
        fireEvent.click(screen.getByTestId('app-bar'))
        expect(document.body.style.overflow).toBe('hidden')

        fireEvent.click(screen.getByTestId('menu'))
        expect(document.body.style.overflow).toBe('auto')
    })
})
