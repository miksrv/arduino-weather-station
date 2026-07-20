import React from 'react'

import { render } from '@testing-library/react'

import WindCompass from './WindCompass'

import '@testing-library/jest-dom'

describe('WindCompass', () => {
    it('renders the cardinal labels', () => {
        const { getByText } = render(<WindCompass direction={315} />)

        expect(getByText('N')).toBeInTheDocument()
        expect(getByText('E')).toBeInTheDocument()
        expect(getByText('S')).toBeInTheDocument()
        expect(getByText('W')).toBeInTheDocument()
    })

    it('rotates the needle group to the given direction', () => {
        const { container } = render(<WindCompass direction={315} />)
        const needleGroup = container.querySelector('g')

        expect(needleGroup).toHaveAttribute('transform', 'rotate(315 100 100)')
    })

    it('defaults the rotation to 0 when no direction is given', () => {
        const { container } = render(<WindCompass />)
        const needleGroup = container.querySelector('g')

        expect(needleGroup).toHaveAttribute('transform', 'rotate(0 100 100)')
    })
})
