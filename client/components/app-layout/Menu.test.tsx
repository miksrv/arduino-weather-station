import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import Menu from './Menu'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => `t:${key}`
    })
}))
jest.mock('next/router', () => ({
    useRouter: () => ({
        pathname: '/history'
    })
}))
jest.mock('next/link', () => ({ children, ...props }: any) => <a {...props}>{children}</a>)

describe('Menu', () => {
    it('renders all menu items with correct text and icons', () => {
        render(<Menu />)
        expect(screen.getByText('t:current-weather')).toBeInTheDocument()
        expect(screen.getByText('t:weather-sensors')).toBeInTheDocument()
        expect(screen.getByText('t:historical-data')).toBeInTheDocument()
        expect(screen.getByText('t:forecast')).toBeInTheDocument()
        expect(screen.getByText('t:heatmap')).toBeInTheDocument()
        expect(screen.getAllByTestId('icon')[0]).toHaveAttribute('data-name', 'Cloud')
        expect(screen.getAllByTestId('icon')[1]).toHaveAttribute('data-name', 'Pressure')
        expect(screen.getAllByTestId('icon')[2]).toHaveAttribute('data-name', 'Chart')
        expect(screen.getAllByTestId('icon')[3]).toHaveAttribute('data-name', 'Time')
        expect(screen.getAllByTestId('icon')[4]).toHaveAttribute('data-name', 'BarChart')
    })

    it('applies active class to the current route', () => {
        render(<Menu />)
        const activeLink = screen.getByText('t:historical-data')
        expect(activeLink.className).toContain('active')
    })

    it('calls onClick when a menu item is clicked', () => {
        const onClick = jest.fn()
        render(<Menu onClick={onClick} />)
        fireEvent.click(screen.getByText('t:forecast'))
        expect(onClick).toHaveBeenCalled()
    })

    it('renders menu as a <menu> element with correct structure', () => {
        render(<Menu />)
        const menu = screen.getByRole('list', { hidden: true }) || screen.getByTestId('menu')
        expect(menu?.tagName.toLowerCase()).toBe('menu')
        expect(menu?.querySelectorAll('li').length).toBe(5)
    })

    it('links have correct href attributes', () => {
        render(<Menu />)
        expect(screen.getByText('t:current-weather').closest('a')).toHaveAttribute('href', '/')
        expect(screen.getByText('t:weather-sensors').closest('a')).toHaveAttribute('href', '/sensors')
        expect(screen.getByText('t:historical-data').closest('a')).toHaveAttribute('href', '/history')
        expect(screen.getByText('t:forecast').closest('a')).toHaveAttribute('href', '/forecast')
        expect(screen.getByText('t:heatmap').closest('a')).toHaveAttribute('href', '/heatmap')
    })
})
