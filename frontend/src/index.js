import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

import * as reducers from './store/reducers'

import 'moment/locale/ru'
import 'semantic-ui-css/semantic.min.css'
import './static/css/main.sass'

import Main from './pages/Main'
import Statistic from './pages/Statistic'
import Forecast from './pages/Forecast'
import Dashboard from './pages/Dashboard'
import Archive from './pages/Archive'
import Error404 from './pages/Error404'

const store = createStore(combineReducers(reducers), applyMiddleware(thunk))

ReactDOM.render(
    <Provider store={store} id='wrapper'>
        <BrowserRouter>
            <Switch>
                <Route exact path="/" component={Main} />
                <Route path="/statistic" component={Statistic} />
                <Route path="/forecast" component={Forecast} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/archive" component={Archive} />
                <Route component={Error404} />
            </Switch>
        </BrowserRouter>
    </Provider>
    , document.getElementById('root')
);