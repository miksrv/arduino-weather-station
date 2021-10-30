import { Provider } from 'react-redux'
import { BrowserRouter, Switch } from 'react-router-dom'
import '@testing-library/jest-dom/extend-expect'

import { store } from '../app/store'

import Index from '../main'
import { render } from "@testing-library/react";

describe('Test Main', function () {
    beforeEach(() => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Switch>
                        <Index />
                    </Switch>
                </BrowserRouter>
            </Provider>
        )
    })

    it('Hello', () => {
        // eslint-disable-next-line no-restricted-globals
        expect(screen.getByText(/Кадров/i)).toBeInTheDocument();
    })
});