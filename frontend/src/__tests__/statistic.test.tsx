import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import { setLanguage } from '../app/languageSlice'
import translate from '../functions/translate'

import '@testing-library/jest-dom/extend-expect'

// eslint-disable-next-line jest/no-mocks-import
import { server } from '../__mocks__/server'

import Statistic from '../features/statistic'

describe('Test Statistic feature', () => {
    const language = translate()

    beforeAll(() => server.listen())

    beforeEach(() => {
        store.dispatch(setLanguage(language))

        render(
            <Provider store={store}>
                <Statistic/>
            </Provider>
        )
    })

    afterEach(() => server.resetHandlers())

    afterAll(() => server.close())

    it('Checked correct toolbar', async () => {
        expect(await screen.findByText(language.toolbar.periods.day)).toBeInTheDocument()
        expect(await screen.findByText(language.toolbar.periods.week)).toBeInTheDocument()
        expect(await screen.findByText(language.toolbar.periods.month)).toBeInTheDocument()
    })
})
