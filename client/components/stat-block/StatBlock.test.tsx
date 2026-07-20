import React from 'react'

import { render, screen } from '@testing-library/react'

import StatBlock from './StatBlock'

import '@testing-library/jest-dom'

describe('StatBlock', () => {
    it('renders the title and value', () => {
        render(
            <StatBlock
                title={'Max today'}
                value={'22.6°C'}
            />
        )
        expect(screen.getByText('Max today')).toBeInTheDocument()
        expect(screen.getByText('22.6°C')).toBeInTheDocument()
    })

    it('renders react node titles and values', () => {
        render(
            <StatBlock
                title={<span data-testid={'title-node'} />}
                value={<span data-testid={'value-node'} />}
            />
        )
        expect(screen.getByTestId('title-node')).toBeInTheDocument()
        expect(screen.getByTestId('value-node')).toBeInTheDocument()
    })

    it('applies the max modifier class to the value', () => {
        render(
            <StatBlock
                title={'Max'}
                value={'22.6'}
                modifier={'max'}
            />
        )
        expect(screen.getByText('22.6')).toHaveClass('statValue--max')
    })

    it('applies the min modifier class to the value', () => {
        render(
            <StatBlock
                title={'Min'}
                value={'14.7'}
                modifier={'min'}
            />
        )
        expect(screen.getByText('14.7')).toHaveClass('statValue--min')
    })

    it('does not apply a modifier class when none is provided', () => {
        render(
            <StatBlock
                title={'Avg'}
                value={'18.2'}
            />
        )
        expect(screen.getByText('18.2')).not.toHaveClass('statValue--max')
        expect(screen.getByText('18.2')).not.toHaveClass('statValue--min')
    })

    it('right-aligns by default', () => {
        render(
            <StatBlock
                title={'Title'}
                value={'Value'}
            />
        )
        expect(screen.getByText('Title').parentElement).toHaveClass('alignEnd')
    })

    it('left-aligns when align is start', () => {
        render(
            <StatBlock
                title={'Title'}
                value={'Value'}
                align={'start'}
            />
        )
        expect(screen.getByText('Title').parentElement).toHaveClass('alignStart')
    })
})
