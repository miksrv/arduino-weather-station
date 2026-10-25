import React from 'react'

import { render, screen } from '@testing-library/react'

import PageHeader from './PageHeader'

import '@testing-library/jest-dom'

describe('PageHeader', () => {
    it('renders the title as the page h1', () => {
        render(<PageHeader title={'Sensors'} />)
        expect(screen.getByRole('heading', { level: 1, name: 'Sensors' })).toBeInTheDocument()
    })

    it('renders the description when given', () => {
        render(
            <PageHeader
                title={'Sensors'}
                description={'Live readings'}
            />
        )
        expect(screen.getByText('Live readings')).toBeInTheDocument()
    })

    it('omits the description and actions when not given', () => {
        const { container } = render(<PageHeader title={'Sensors'} />)
        expect(container.querySelector('p')).not.toBeInTheDocument()
        expect(container.querySelector('header')?.children).toHaveLength(1)
    })

    it('renders the actions', () => {
        render(
            <PageHeader
                title={'History'}
                actions={<button>{'Export'}</button>}
            />
        )
        expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    })
})
