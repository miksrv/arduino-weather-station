import React from 'react'

import type { GetServerSidePropsResult } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import Menu from '@/components/app-layout/Menu'
import { LocaleType } from '@/tools/types'

export default function CatchAllPage() {
    const { i18n, t } = useTranslation()

    return (
        <AppLayout>
            <NextSeo
                noindex={true}
                nofollow={false}
                title={t('page-not-found')}
                description={t('page-not-found-description')}
                openGraph={{
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('page-not-found'),
                    type: 'website'
                }}
            />
            <div className={'not-found'}>
                <h1>{t('page-not-found')}</h1>
                <div>{t('page-not-found-description')}</div>
                <div className={'not-found-menu'}>
                    <Menu />
                </div>
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<object>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'ru'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)
