import React from 'react'

import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import AppLayout from '@/components/app-layout'
import Menu from '@/components/app-layout/Menu'

export default function CatchAllPage() {
    const { i18n, t } = useTranslation('common')

    return (
        <AppLayout>
            <NextSeo
                title={t('page-not-found')}
                description={t('page-not-found-description')}
                canonical={process.env.NEXT_PUBLIC_SITE_LINK}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const locale = context.locale || 'en'

    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            notFound: true
        }
    }
}
