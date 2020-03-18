import React, { Component } from 'react'

import Summary from '../components/Summary'
import Dashboard from '../components/Dashboard'

import 'moment/locale/ru'

class Main extends Component {
    render() {
        return (
            <div>
                <Summary />
                <Dashboard />
            </div>
        );
    }
}

export default Main;