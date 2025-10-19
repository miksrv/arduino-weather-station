import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react'

import LanguageSwitcher from './LanguageSwitcher'

import '@testing-library/jest-dom'

jest.mock('next-i18next', () => ({
    useTranslation: () => ({
        i18n: {
            language: 'en',
            changeLanguage: jest.fn(() => Promise.resolve())
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
jest.mock('@/tools/hooks/useLocalStorage', () => jest.fn(() => [null, jest.fn()]))

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders both language buttons', () => {
        render(<LanguageSwitcher />)
        expect(screen.getByText('Eng')).toBeInTheDocument()
        expect(screen.getByText('Rus')).toBeInTheDocument()
    })

    it('highlights the active language button', () => {
        render(<LanguageSwitcher />)
        expect(screen.getByText('Eng').className).toMatch(/active/)
        expect(screen.getByText('Rus').className).not.toMatch(/active/)
    })

    it('does not call changeLanguage if the selected language is already active', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const i18n = require('next-i18next').useTranslation().i18n
        render(<LanguageSwitcher />)
        fireEvent.click(screen.getByText('Eng'))
        expect(i18n.changeLanguage).not.toHaveBeenCalled()
    })

    it('dispatches setLocale on mount', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const setLocale = require('@/api').setLocale
        render(<LanguageSwitcher />)
        expect(setLocale).toHaveBeenCalled()
    })
})
