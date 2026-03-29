import React, { useEffect } from 'react'
import { setCookie } from 'cookies-next'
import { cn } from 'simple-react-ui-kit'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { setLocale } from '@/api'
import { useAppDispatch } from '@/api/store'
import { Locale } from '@/api/types'
import useLocalStorage from '@/tools/hooks/useLocalStorage'
import { LocaleType, StorageKeys } from '@/tools/types'

import styles from './styles.module.sass'

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation()
    const router = useRouter()
    const dispatch = useAppDispatch()

    const [, setStorageLocale] = useLocalStorage<StorageKeys, LocaleType>(StorageKeys.LOCALE)

    const { language: currentLanguage } = i18n
    const { pathname, query } = router

    const changeLanguage = (locale: Locale) => {
        if (locale === currentLanguage) {
            return
        }

        void setCookie('NEXT_LOCALE', locale)
        setStorageLocale(locale)
        dispatch(setLocale(locale))

        // Формируем новый URL с учётом локали
        const queryString = new URLSearchParams(query as Record<string, string>).toString()
        const basePath = locale === 'ru' ? pathname : `/${locale}${pathname}`

        window.location.href = queryString ? `${basePath}?${queryString}` : basePath
    }

    useEffect(() => {
        dispatch(setLocale(currentLanguage as Locale))
    }, [currentLanguage, dispatch])

    return (
        <div className={styles.languageSwitcher}>
            <button
                className={cn(currentLanguage === 'en' && styles.active)}
                onClick={() => changeLanguage('en')}
            >
                {'Eng'}
            </button>
            <button
                className={cn(currentLanguage === 'ru' && styles.active)}
                onClick={() => changeLanguage('ru')}
            >
                {'Rus'}
            </button>
        </div>
    )
}

export default LanguageSwitcher
