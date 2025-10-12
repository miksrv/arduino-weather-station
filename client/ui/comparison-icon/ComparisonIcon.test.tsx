import React from 'react'

import { render, screen } from '@testing-library/react'

import ComparisonIcon from './ComparisonIcon'

import '@testing-library/jest-dom'

describe('ComparisonIcon', () => {
    it('renders nothing if currentValue is undefined', () => {
        const { container } = render(<ComparisonIcon previousValue={10} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders nothing if previousValue is undefined', () => {
        const { container } = render(<ComparisonIcon currentValue={10} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders nothing if currentValue equals previousValue', () => {
        const { container } = render(
            <ComparisonIcon
                currentValue={10}
                previousValue={10}
            />
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders ArrowUp icon if currentValue > previousValue', () => {
        render(
            <ComparisonIcon
                currentValue={20}
                previousValue={10}
            />
        )
        const icon = screen.getByTestId('icon')
        expect(icon).toHaveAttribute('data-name', 'ArrowUp')
        expect(icon).toHaveAttribute('data-class', expect.stringContaining('green'))
    })

    it('renders ArrowDown icon if currentValue < previousValue', () => {
        render(
            <ComparisonIcon
                currentValue={5}
                previousValue={10}
            />
        )
        const icon = screen.getByTestId('icon')
        expect(icon).toHaveAttribute('data-name', 'ArrowDown')
        expect(icon).toHaveAttribute('data-class', expect.stringContaining('red'))
    })

    it('handles string values correctly', () => {
        render(
            <ComparisonIcon
                currentValue='15'
                previousValue='10'
            />
        )
        const icon = screen.getByTestId('icon')
        expect(icon).toHaveAttribute('data-name', 'ArrowUp')
    })

    it('renders nothing if string values are equal', () => {
        const { container } = render(
            <ComparisonIcon
                currentValue='10'
                previousValue='10'
            />
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders nothing if currentValue is 0', () => {
        const { container } = render(
            <ComparisonIcon
                currentValue={0}
                previousValue={10}
            />
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders nothing if previousValue is 0', () => {
        const { container } = render(
            <ComparisonIcon
                currentValue={10}
                previousValue={0}
            />
        )
        expect(container.firstChild).toBeNull()
    })
})
