import React from 'react'

import { render } from '@testing-library/react'

import JsonLd from './JsonLd'

describe('JsonLd', () => {
    it('renders the data as an ld+json script', () => {
        const { container } = render(
            <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Meteo' }} />
        )
        const script = container.querySelector('script[type="application/ld+json"]')

        expect(JSON.parse(script?.innerHTML ?? '{}')).toStrictEqual({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Meteo'
        })
    })

    it('escapes "<" so the data cannot close the script tag', () => {
        const { container } = render(
            <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: '</script><b>' }} />
        )

        expect(container.querySelector('script')?.innerHTML).not.toContain('</script>')
        expect(container.querySelector('b')).toBeNull()
    })
})
