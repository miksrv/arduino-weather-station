import React, { Component } from 'react'

import Header from './components/Header'
import Footer from './components/Footer'
import Summary from './containers/Summary'
import Dashboard from './containers/Dashboard'

import 'moment/locale/ru'

class App extends Component {
    render() {
        return (
            <div id='wrapper'>
                <Summary />
                <Dashboard />
                <Footer />
            </div>
        );
    }
}

export default App;