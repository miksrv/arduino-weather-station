import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../app/store'
import '@testing-library/jest-dom/extend-expect'

import Main from '../features/main'

describe('Test Main', function () {
    beforeEach(() => {
        render(
            <Provider store={store}>
                <Main />
            </Provider>
        )
    })

    it('Expect text on page', () => {
        expect(screen.getByText(/Погодная станция/i)).toBeInTheDocument()
        expect(screen.getByText(/Оренбургская обл./i)).toBeInTheDocument()
    })
});