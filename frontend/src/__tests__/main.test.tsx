import '@testing-library/jest-dom/extend-expect'
import { render, screen } from '@testing-library/react'
import Main from 'features/main'
import React from 'react'
import { Provider } from 'react-redux'

import { setLanguage } from 'app/languageSlice'
import { store } from 'app/store'

import translate from 'functions/translate'

describe('Test Main feature', () => {
    const language = translate()

    it('Checked correct text', () => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Main />
            </Provider>
        )

        expect(screen.getByText(language.dashboard.title)).toBeInTheDocument()
        expect(
            screen.getByText(language.dashboard.subtitle)
        ).toBeInTheDocument()
    })
})
