import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import LanguageSwitcher from './LanguageSwitcher'

import '@testing-library/jest-dom'

jest.mock('next-i18next/pages', () => ({
    useTranslation: () => ({
        i18n: {
            language: 'en'
        }
    })
}))
jest.mock('next/router', () => ({
    useRouter: () => ({
        pathname: '/test',
        asPath: '/test',
        query: {},
        push: jest.fn(() => Promise.resolve())
    })
}))
jest.mock('@/api', () => ({
    setLocale: jest.fn()
}))
jest.mock('@/api/store', () => ({
    useAppDispatch: () => jest.fn()
}))
jest.mock('cookies-next', () => ({
    setCookie: jest.fn()
}))
jest.mock('@/hooks/useLocalStorage', () => jest.fn(() => [null, jest.fn()]))
jest.mock(
    'next/link',
    () =>
        ({
            children,
            href,
            locale,
            ...rest
        }: React.PropsWithChildren<
            { href: string; locale: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>
        >) => (
            <a
                href={`/${locale}${href}`}
                {...rest}
            >
                {children}
            </a>
        )
)

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders both languages as links to the current page', () => {
        render(<LanguageSwitcher />)
        expect(screen.getByRole('link', { name: 'Eng' })).toHaveAttribute('href', '/en/test')
        expect(screen.getByRole('link', { name: 'Rus' })).toHaveAttribute('href', '/ru/test')
        expect(screen.getByRole('link', { name: 'Rus' })).toHaveAttribute('hreflang', 'ru')
    })

    it('marks the active language', () => {
        render(<LanguageSwitcher />)
        expect(screen.getByText('Eng').className).toMatch(/active/)
        expect(screen.getByText('Eng')).toHaveAttribute('aria-current', 'true')
        expect(screen.getByText('Rus').className).not.toMatch(/active/)
    })

    it('does nothing when the active language is chosen again', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { setCookie } = require('cookies-next')
        render(<LanguageSwitcher />)
        fireEvent.click(screen.getByText('Eng'))
        expect(setCookie).not.toHaveBeenCalled()
    })

    it('dispatches setLocale on mount', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const setLocale = require('@/api').setLocale
        render(<LanguageSwitcher />)
        expect(setLocale).toHaveBeenCalled()
    })

    it('clicking Rus remembers the choice in the cookie and the storage', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { setCookie } = require('cookies-next')
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const useLocalStorage = require('@/hooks/useLocalStorage') as jest.Mock
        const mockSetter = jest.fn()
        useLocalStorage.mockReturnValue([null, mockSetter])
        render(<LanguageSwitcher />)
        fireEvent.click(screen.getByText('Rus'))
        expect(setCookie).toHaveBeenCalledWith(
            'NEXT_LOCALE',
            'ru',
            expect.objectContaining({ maxAge: 31536000, path: '/' })
        )
        expect(mockSetter).toHaveBeenCalledWith('ru')
    })
})
