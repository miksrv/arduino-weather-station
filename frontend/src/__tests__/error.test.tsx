import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

import Error from '../features/error'

describe('Test Error feature', () => {
    const language = translate()

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Error/>
            </Provider>
        )
    })

    it('Checked correct text', () => {
        expect(screen.queryByText(language.error.header)).toBeInTheDocument()
        expect(screen.queryByText(language.error.subtitle)).toBeInTheDocument()
    })
})
