import React from 'react'
import { Provider } from 'react-redux'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { AppProps } from 'next/app'
import { Geist, Geist_Mono } from 'next/font/google'
import Head from 'next/head'
import Script from 'next/script'
// import { useReportWebVitals } from 'next/web-vitals'
import { appWithTranslation, useTranslation } from 'next-i18next/pages'
import { generateDefaultSeo } from 'next-seo/pages'
import { ThemeProvider } from 'next-themes'
import NextNProgress from 'nextjs-progressbar'

import { wrapper } from '@/api/store'
import useServiceWorker from '@/hooks/useServiceWorker'

import i18Config from '../next-i18next.config'

import 'dayjs/locale/ru'

import 'simple-react-ui-kit/theme.css'
import 'simple-react-ui-kit/styles.css'
import '@/styles/theme.css'
import '@/styles/globals.sass'

// Self-hosted at build time (no request to Google, no layout shift); exposed as CSS variables for the tokens
const geist = Geist({ subsets: ['latin', 'cyrillic'], display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin', 'cyrillic'], display: 'swap' })

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

const App = ({ Component, pageProps }: AppProps) => {
    const { i18n } = useTranslation()
    const { store } = wrapper.useWrappedStore(pageProps)

    useServiceWorker(process.env.NODE_ENV === 'production')

    // Set during render (not in an effect), so the server render formats dates in the page's language too.
    // The visitor's language choice lives in the NEXT_LOCALE cookie (Next.js redirects `/` by it); a link to
    // a page in a given language is always honoured, so shared links and hreflang alternates work.
    const locale = i18n.language ?? i18Config.i18n.defaultLocale

    if (dayjs.locale() !== locale) {
        dayjs.locale(locale)
    }

    return (
        <ThemeProvider defaultTheme={'dark'}>
            <Head>
                <style>{`:root { --font-sans: ${geist.style.fontFamily}; --font-mono-face: ${geistMono.style.fontFamily}; }`}</style>
                {generateDefaultSeo({
                    openGraph: {
                        siteName: 'Meteo Orenburg',
                        type: 'website'
                    },
                    twitter: {
                        cardType: 'summary_large_image'
                    }
                })}
                <meta
                    name={'mobile-web-app-capable'}
                    content={'yes'}
                />
                <meta
                    name={'viewport'}
                    content={'width=device-width, initial-scale=1, viewport-fit=cover'}
                />
                <meta
                    key={'theme-color-light'}
                    name={'theme-color'}
                    content={'#f7f8fa'}
                    media={'(prefers-color-scheme: light)'}
                />
                <meta
                    key={'theme-color-dark'}
                    name={'theme-color'}
                    content={'#0b0d10'}
                    media={'(prefers-color-scheme: dark)'}
                />
                <meta
                    name={'apple-mobile-web-app-status-bar-style'}
                    content={'black-translucent'}
                />
                <meta
                    name={'apple-mobile-web-app-title'}
                    content={'Метео'}
                />
                <link
                    rel={'apple-touch-icon'}
                    sizes={'180x180'}
                    href={'/apple-touch-icon.png'}
                />
                <link
                    rel={'icon'}
                    type={'image/svg+xml'}
                    href={'/favicon.svg'}
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

            <NextNProgress
                color={'var(--color-main)'}
                height={2}
                options={{ showSpinner: false }}
            />

            <Provider store={store}>
                <Component {...pageProps} />
            </Provider>

            {process.env.NODE_ENV === 'production' && (
                <>
                    {/* Yandex.Metrika counter */}
                    <Script
                        id={'yandex-metrika'}
                        strategy={'lazyOnload'}
                    >
                        {`
                            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                            m[i].l=1*new Date();
                            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                            ym(67014250, "init", {
                                clickmap:true,
                                referrer: document.referrer,
                                url: location.href,
                                accurateTrackBounce:true,
                                trackLinks:true
                            });
                        `}
                    </Script>
                    <noscript>
                        <div>
                            <img
                                src={'https://mc.yandex.ru/watch/67014250'}
                                width={1}
                                height={1}
                                alt={''}
                            />
                        </div>
                    </noscript>
                </>
            )}
        </ThemeProvider>
    )
}

export default appWithTranslation(App, i18Config)
