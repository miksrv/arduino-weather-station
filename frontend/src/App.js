import React, { Component } from 'react'

import Header from './components/Header'
import Summary from './containers/Summary'
import Dashboard from './containers/Dashboard'

class App extends Component {
    render() {
        return (
            <div id='wrapper'>
                <Header />
                <Summary />
                <Dashboard />
            </div>
        );
    }
}

export default App;