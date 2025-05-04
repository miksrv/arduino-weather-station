import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { AppProps } from 'next/app'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
// import { useReportWebVitals } from 'next/web-vitals'
import { appWithTranslation, useTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'

import { wrapper } from '@/api/store'
import useLocalStorage from '@/tools/hooks/useLocalStorage'
import { StorageKeys } from '@/tools/types'

import i18Config from '../next-i18next.config'

import 'dayjs/locale/ru'

import '@/styles/dark.css'
import '@/styles/light.css'
import '@/styles/globals.sass'

export const POLING_INTERVAL_CURRENT = 10 * 60 * 1000
export const POLING_INTERVAL_FORECAST = 10 * 60 * 1000

const App = ({ Component, pageProps }: AppProps) => {
    const router = useRouter()
    const { i18n } = useTranslation()
    const { store } = wrapper.useWrappedStore(pageProps)

    const [storageLocale] = useLocalStorage<StorageKeys, string>(StorageKeys.LOCALE)

    useEffect(() => {
        if (
            storageLocale &&
            i18n.language !== storageLocale &&
            i18Config.i18n.locales.includes(storageLocale) &&
            router.pathname !== '/404'
        ) {
            void router.replace({ pathname: router.pathname, query: { ...router.query, storageLocale } })
        }
    }, [])

    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(relativeTime)
    dayjs.locale(i18n.language ?? i18Config.i18n.defaultLocale)

    // useReportWebVitals((metric) => {
    //     console.log(metric)
    // })

    return (
        <ThemeProvider defaultTheme={'dark'}>
            <Head>
                <meta
                    name={'mobile-web-app-capable'}
                    content={'yes'}
                />
                <meta
                    name={'viewport'}
                    content={'width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no'}
                />
                <meta
                    name={'theme-color'}
                    content={'#ebedf0'}
                    media={'(prefers-color-scheme: light)'}
                />
                <meta
                    name={'theme-color'}
                    content={'#1b1b1b'}
                    media={'(prefers-color-scheme: dark)'}
                />
                <meta
                    name={'apple-mobile-web-app-status-bar-style'}
                    content={'black-translucent'}
                />
                <link
                    rel={'apple-touch-icon'}
                    sizes={'180x180'}
                    href={'/apple-touch-icon.png'}
                />
                <link
                    rel={'icon'}
                    type={'image/png'}
                    sizes={'32x32'}
                    href={'/favicon-32x32.png'}
                />
                <link
                    rel={'icon'}
                    type={'image/png'}
                    sizes={'16x16'}
                    href={'/favicon-16x16.png'}
                />
                <link
                    rel={'icon'}
                    href={'/favicon.ico'}
                    type={'image/x-icon'}
                />
                <link
                    rel={'manifest'}
                    href={'/site.webmanifest'}
                />
            </Head>

            <Provider store={store}>
                <Component {...pageProps} />
            </Provider>

            {process.env.NODE_ENV === 'production' && (
                <div
                    dangerouslySetInnerHTML={{
                        __html: '<!-- Yandex.Metrika counter --> <script type="text/javascript" > (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)}; m[i].l=1*new Date(); for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }} k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)}) (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym"); ym(67014250, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true }); </script> <noscript><div><img src="https://mc.yandex.ru/watch/67014250" style="position:absolute; left:-9999px;" alt="" /></div></noscript> <!-- /Yandex.Metrika counter -->'
                    }}
                />
            )}
        </ThemeProvider>
    )
}

export default appWithTranslation(App)
