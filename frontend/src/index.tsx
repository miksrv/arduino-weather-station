import App from 'App'
import 'moment/locale/ru'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import 'semantic-ui-css/semantic.min.css'
import 'styles/index.sass'

import { store } from 'app/store'

// if (process.env.NODE_ENV === 'development') {
//     const { worker } = require('./__mocks__/browser')
//     worker.start()
// }

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
)
