import React, { useEffect } from 'react'
import { setCookie } from 'cookies-next'
import { cn } from 'simple-react-ui-kit'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next/pages'

import { setLocale } from '@/api'
import { useAppDispatch } from '@/api/store'
import { Locale } from '@/api/types'
import useLocalStorage from '@/hooks/useLocalStorage'
import { LocaleType, StorageKeys } from '@/tools/types'

import styles from './styles.module.sass'

// The choice outlives the browser session: Next.js redirects `/` to the NEXT_LOCALE language on the next visit
const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

const LANGUAGES: Array<{ locale: Locale; label: string }> = [
    { locale: 'en', label: 'Eng' },
    { locale: 'ru', label: 'Rus' }
]

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation()
    const router = useRouter()
    const dispatch = useAppDispatch()

    const [, setStorageLocale] = useLocalStorage<StorageKeys, LocaleType>(StorageKeys.LOCALE)

    const { language: currentLanguage } = i18n

    // Real links to the page in the other language (crawlable, with hreflang). The switch itself is a full
    // page load, so every API answer is fetched again with the new Locale header.
    const handleSelect = (event: React.MouseEvent<HTMLAnchorElement>, locale: Locale) => {
        if (locale === currentLanguage) {
            event.preventDefault()
            return
        }

        void setCookie('NEXT_LOCALE', locale, { maxAge: LOCALE_COOKIE_MAX_AGE, path: '/', sameSite: 'lax' })
        setStorageLocale(locale)
        dispatch(setLocale(locale))

        event.preventDefault()
        window.location.href = event.currentTarget.href
    }

    useEffect(() => {
        dispatch(setLocale(currentLanguage as Locale))
    }, [currentLanguage, dispatch])

    return (
        <div className={styles.languageSwitcher}>
            {LANGUAGES.map(({ locale, label }) => (
                <Link
                    key={locale}
                    href={router.asPath}
                    locale={locale}
                    hrefLang={locale}
                    aria-current={locale === currentLanguage ? 'true' : undefined}
                    className={cn(locale === currentLanguage && styles.active)}
                    onClick={(event) => handleSelect(event, locale)}
                >
                    {label}
                </Link>
            ))}
        </div>
    )
}

export default LanguageSwitcher
