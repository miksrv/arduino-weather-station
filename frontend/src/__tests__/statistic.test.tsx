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

    it('Checked show error', async () => {
        expect(await screen.findByText(language.general.error.title)).toBeInTheDocument()
        expect(await screen.findByText(language.general.error.description)).toBeInTheDocument()
    })
})
