import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { version, update } from '../../package.json'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

import Footer from '../components/footer'

describe('Test Footer component', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Footer />
            </Provider>
        )
    })

    it('Checked correct show version and update', async () => {
        expect(await screen.findByText(version)).toBeInTheDocument()
        expect(await screen.findByText(`(${update})`)).toBeInTheDocument()
    })
})
