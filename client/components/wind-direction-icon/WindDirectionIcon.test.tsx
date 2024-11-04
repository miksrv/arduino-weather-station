import React from 'react'

import '@testing-library/jest-dom'

import styles from './styles.module.sass'
import WindDirectionIcon from './WindDirectionIcon'

import { render } from '@testing-library/react'

describe('WindDirectionIcon', () => {
    it('renders SVG element with correct viewBox attribute', () => {
        const { container } = render(<WindDirectionIcon />)
        const svgElement = container.querySelector('svg')
        expect(svgElement).toBeInTheDocument()
        expect(svgElement).toHaveAttribute('viewBox', '0 0 30 30')
    })

    it('applies default rotation when direction is not provided', () => {
        const { container } = render(<WindDirectionIcon />)
        const svgElement = container.querySelector('svg')
        expect(svgElement).toHaveStyle('transform: rotate(0deg)')
    })

    it('applies correct rotation based on direction prop', () => {
        const testDirection = 45
        const { container } = render(<WindDirectionIcon direction={testDirection} />)
        const svgElement = container.querySelector('svg')
        expect(svgElement).toHaveStyle(`transform: rotate(${testDirection}deg)`)
    })

    it('applies correct CSS class for styling', () => {
        const { container } = render(<WindDirectionIcon />)
        const svgElement = container.querySelector('svg')
        expect(svgElement).toHaveClass(styles.weatherIcon)
    })
})
