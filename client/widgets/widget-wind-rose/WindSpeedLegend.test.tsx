import React from 'react'

import { render } from '@testing-library/react'

import WindSpeedLegend from './WindSpeedLegend'

import '@testing-library/jest-dom'

describe('WindSpeedLegend', () => {
    it('renders the intermediate tick labels', () => {
        const { getByText } = render(<WindSpeedLegend unit={'м/с'} />)

        expect(getByText('0')).toBeInTheDocument()
        expect(getByText('2')).toBeInTheDocument()
        expect(getByText('4')).toBeInTheDocument()
        expect(getByText('6')).toBeInTheDocument()
        expect(getByText('8')).toBeInTheDocument()
    })

    it('renders a single open-ended label with the unit, not a duplicate "10" tick', () => {
        const { getByText, queryByText } = render(<WindSpeedLegend unit={'м/с'} />)

        expect(getByText('10+ м/с')).toBeInTheDocument()
        expect(queryByText('10')).not.toBeInTheDocument()
    })
})
