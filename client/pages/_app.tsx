import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { AppProps } from 'next/app'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
// import { useReportWebVitals } from 'next/web-vitals'
import { appWithTranslation, useTranslation } from 'next-i18next'
import { ThemeProvider, useTheme } from 'next-themes'

import '@/styles/globals.sass'
import 'dayjs/locale/ru'
import '@/styles/dark.css'
import '@/styles/light.css'

import i18Config from '../next-i18next.config'

import { wrapper } from '@/api/store'
import { LOCAL_STORAGE } from '@/tools/constants'
import * as LocalStorage from '@/tools/localstorage'

const locale = LocalStorage.getItem(LOCAL_STORAGE.LOCALE as any)

const App = ({ Component, pageProps }: AppProps) => {
    const router = useRouter()
    const { i18n } = useTranslation()
    const { store } = wrapper.useWrappedStore(pageProps)

    useEffect(() => {
        if (i18n.language !== locale && i18Config.i18n.locales.includes(locale) && router.pathname !== '/404') {
            router.replace(router.asPath, router.asPath, { locale })
        }
    }, [])

    dayjs.extend(utc)
    dayjs.extend(relativeTime)
    dayjs.locale(i18n.language ?? i18Config.i18n.defaultLocale)

    // useReportWebVitals((metric) => {
    //     console.log(metric)
    // })

    return (
        <ThemeProvider>
            <Head>
                <meta
                    name={'apple-mobile-web-app-capable'}
                    content={'yes'}
                />
                <meta
                    name={'viewport'}
                    content={'width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no'}
                />
                {/*<link*/}
                {/*    rel={'apple-touch-icon'}*/}
                {/*    sizes={'180x180'}*/}
                {/*    href={'/apple-touch-icon.png'}*/}
                {/*/>*/}
                {/*<link*/}
                {/*    rel={'icon'}*/}
                {/*    type={'image/png'}*/}
                {/*    sizes={'32x32'}*/}
                {/*    href={'/favicon-32x32.png'}*/}
                {/*/>*/}
                {/*<link*/}
                {/*    rel={'icon'}*/}
                {/*    type={'image/png'}*/}
                {/*    sizes={'16x16'}*/}
                {/*    href={'/favicon-16x16.png'}*/}
                {/*/>*/}
                {/*<link*/}
                {/*    rel={'icon'}*/}
                {/*    href={'/favicon.ico'}*/}
                {/*    type={'image/x-icon'}*/}
                {/*/>*/}
                {/*<link*/}
                {/*    rel={'manifest'}*/}
                {/*    href={'/site.webmanifest'}*/}
                {/*/>*/}
            </Head>

            <ThemeMeta />

            <Provider store={store}>
                <Component {...pageProps} />
            </Provider>

            {process.env.NODE_ENV === 'production' && (
                <div
                    // dangerouslySetInnerHTML={{
                    //     __html: '<!-- Yandex.Metrika counter --> <script type="text/javascript" > (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)}; m[i].l=1*new Date(); for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }} k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)}) (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym"); ym(96500810, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true }); </script> <noscript><div><img src="https://mc.yandex.ru/watch/96500810" style="position:absolute; left:-9999px;" alt="" /></div></noscript> <!-- /Yandex.Metrika counter --><!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-JTW79QN3MM"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "G-JTW79QN3MM");</script>'
                    // }}
                />
            )}
        </ThemeProvider>
    )
}

const ThemeMeta: React.FC = () => {
    const { theme } = useTheme()

    return (
        <Head>
            <meta
                name={'apple-mobile-web-app-status-bar-style'}
                content={theme === 'dark' ? 'black-translucent' : 'default'}
            />
            <meta
                name={'theme-color'}
                content={theme === 'dark' ? '#1b1b1b' : '#ebedf0'}
                media={`(prefers-color-scheme: ${theme === 'dark' ? 'dark' : 'light'})`}
            />
        </Head>
    )
}

export default appWithTranslation(App)
