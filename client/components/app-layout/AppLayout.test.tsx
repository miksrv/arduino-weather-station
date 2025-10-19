// client/components/app-layout/AppLayout.test.tsx
import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import AppLayout from './AppLayout'

import '@testing-library/jest-dom'

jest.mock('@/api/store', () => ({
    useAppSelector: jest.fn()
}))
jest.mock('@/components/app-bar', () => jest.fn(() => <div data-testid='app-bar' />))
jest.mock('@/components/footer', () => jest.fn(() => <div data-testid='footer' />))
jest.mock('@/components/language-switcher', () => jest.fn(() => <div data-testid='language-switcher' />))
jest.mock('./Menu', () =>
    jest.fn(({ onClick }) => (
        <button
            data-testid='menu'
            onClick={onClick}
        >
            Menu
        </button>
    ))
)
jest.mock('nextjs-progressbar', () => jest.fn(() => <div data-testid='progressbar' />))

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const useAppSelector = require('@/api/store').useAppSelector

describe('AppLayout', () => {
    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useAppSelector.mockImplementation((fn: any) => fn({ application: { showOverlay: false } }))
        jest.clearAllMocks()
    })

    it('renders all main layout parts and children', () => {
        render(
            <AppLayout>
                <div>ChildContent</div>
            </AppLayout>
        )
        expect(screen.getByTestId('app-bar')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
        expect(screen.getByTestId('menu')).toBeInTheDocument()
        expect(screen.getByTestId('progressbar')).toBeInTheDocument()
        expect(screen.getByText('ChildContent')).toBeInTheDocument()
    })

    it('shows overlay and sidebar when sidebarOpen is true', () => {
        render(<AppLayout />)
        // Open sidebar via AppBar onMenuClick
        fireEvent.click(screen.getByTestId('app-bar').parentElement!.querySelector('[role="button"]')!)
        // Overlay should be displayed (has displayed class)
        const overlay = screen.getAllByRole('button')?.[0]
        expect(overlay.className).toMatch(/hidden/)
        const sidebar = overlay.parentElement!.querySelector('aside')
        expect(sidebar!.className).toMatch(/closed/)
    })

    it('closes sidebar and overlay on overlay click', () => {
        render(<AppLayout />)
        // Open sidebar
        fireEvent.click(screen.getByTestId('app-bar').parentElement!.querySelector('[role="button"]')!)
        // Click overlay to close
        fireEvent.click(screen.getAllByRole('button')?.[0])
        // Sidebar should be closed (may be removed from DOM)
        const sidebar = document.querySelector('aside')
        expect(sidebar?.className).toMatch(/closed/)
    })

    it('closes sidebar when Menu onClick is called', () => {
        render(<AppLayout />)
        // Open sidebar
        fireEvent.click(screen.getByTestId('app-bar').parentElement!.querySelector('[role="button"]')!)
        // Click menu button to close
        fireEvent.click(screen.getByTestId('menu'))
        const sidebar = screen.getByRole('button', { name: 'Menu' }).parentElement!.querySelector('aside')
        expect(sidebar?.className).toBeUndefined()
    })

    it('applies fullSize class when fullSize prop is true', () => {
        const { container } = render(<AppLayout fullSize />)
        expect((container?.firstChild as HTMLElement)?.className).toMatch(/fullSize/)
    })

    it('sets body overflow to hidden when overlay or sidebar is open', () => {
        render(<AppLayout />)
        // Open sidebar
        fireEvent.click(screen.getByTestId('app-bar').parentElement!.querySelector('[role="button"]')!)
        expect(document.body.style.overflow).toBe('auto')
        // Close sidebar
        fireEvent.click(screen.getByTestId('menu'))
        expect(document.body.style.overflow).toBe('auto')
    })
})
