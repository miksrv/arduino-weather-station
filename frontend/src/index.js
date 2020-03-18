import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter, Route } from 'react-router-dom'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

import * as reducers from './store/reducers';

import 'moment/locale/ru'
import 'semantic-ui-css/semantic.min.css'
import './static/css/main.sass'

import Header from './layouts/Header'
import Footer from './layouts/Footer'

import Main from './pages/Main'
import Test from './pages/Test'

const store = createStore(combineReducers(reducers), applyMiddleware(thunk));

ReactDOM.render(
    <Provider store={store}>
        <div id='wrapper'>
            <BrowserRouter>
                <Route exact path="/" component={Main} />
                <Route exact path="/test" component={Test} />
            </BrowserRouter>
            <Footer />
        </div>
    </Provider>
    , document.getElementById('root')
);