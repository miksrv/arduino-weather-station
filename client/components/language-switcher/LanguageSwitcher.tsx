import React, { useEffect } from 'react'
import { setCookie } from 'cookies-next'

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

    const [, setStorageLocale] = useLocalStorage<StorageKeys, LocaleType>(StorageKeys.LOCALE, 'en')

    const { language: currentLanguage } = i18n
    const { pathname, asPath, query } = router

    const changeLanguage = async (locale: Locale) => {
        if (locale === currentLanguage) {
            return
        }

        await setCookie('NEXT_LOCALE', locale)
        setStorageLocale(locale)

        dispatch(setLocale(locale))

        await i18n.changeLanguage(locale)
        await router.push({ pathname, query }, asPath, { locale })
    }

    useEffect(() => {
        dispatch(setLocale(currentLanguage as Locale))
    }, [])

    return (
        <div className={styles.languageSwitcher}>
            <button
                className={currentLanguage === 'en' ? styles.active : undefined}
                onClick={() => changeLanguage('en')}
            >
                {'Eng'}
            </button>
            <button
                className={currentLanguage === 'ru' ? styles.active : undefined}
                onClick={() => changeLanguage('ru')}
            >
                {'Rus'}
            </button>
        </div>
    )
}

export default LanguageSwitcher
