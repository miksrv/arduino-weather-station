import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { update } from 'update'

import { setLanguage } from 'app/languageSlice'
import { store } from 'app/store'

import translate from 'functions/translate'

import Footer from 'components/footer'

import packageInfo from '../../package.json'

describe('Test Footer component', () => {
    const language = translate()

    it('Checked correct show version and update', async () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Footer />
            </Provider>
        )

        expect(await screen.findByText(packageInfo.version)).toBeInTheDocument()
        expect(await screen.findByText(`(${update})`)).toBeInTheDocument()
    })
})
