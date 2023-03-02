import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import Error from 'features/error'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from 'app/languageSlice'
import { store } from 'app/store'

import translate from 'functions/translate'

describe('Test Error feature', () => {
    const language = translate()

    it('Checked correct text', () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Error />
            </Provider>
        )

        expect(screen.getByText(language.error.header)).toBeInTheDocument()
        expect(screen.getByText(language.error.subtitle)).toBeInTheDocument()
    })
})
