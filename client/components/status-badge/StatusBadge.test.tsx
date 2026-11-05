import React from 'react'

import { render, screen } from '@testing-library/react'

import StatusBadge from './StatusBadge'

import '@testing-library/jest-dom'

describe('StatusBadge', () => {
    it('renders the label on a kit badge in the tone of the status', () => {
        render(
            <StatusBadge
                tone={'yellow'}
                label={'Data may be outdated'}
            />
        )
        expect(screen.getByText('Data may be outdated')).toHaveClass('statusBadge', 'yellow')
    })

    it('passes the live-region role and an extra class to the badge', () => {
        render(
            <StatusBadge
                tone={'red'}
                role={'status'}
                className={'extra'}
                label={'Offline'}
            />
        )
        expect(screen.getByRole('status')).toHaveClass('statusBadge', 'red', 'extra')
    })
})
