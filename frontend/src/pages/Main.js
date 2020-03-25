import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimmer, Loader } from 'semantic-ui-react'

import Header from '../components/Header'
import Summary from '../layouts/Summary'
import Dashboard from '../layouts/Dashboard'

import moment from 'moment'
import 'moment/locale/ru'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Main extends Component {

    state = {
        intervalId: null,
        autoUpdate: false,
        tickTock: null,
        lastUpdate: '---'
    }

    componentDidMount() {
        const { dispatch } = this.props
        const autoUpdate = localStorage.getItem('autoUpdate') === 'true'

        moment.locale('ru')

        this.setState({autoUpdate: autoUpdate})

        dispatch(meteoActions.fetchMeteoData())
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { autoUpdate } = this.state

        if (autoUpdate !== prevState.autoUpdate) {
            localStorage.setItem('autoUpdate', autoUpdate)

            this.timerControl()
        }
    }

    componentWillUnmount() {
        const { intervalId, tickTock } = this.state

        clearInterval(intervalId)
        clearInterval(tickTock)
    }

    handleChangeAutoupdate = () => {
        this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))
    }

    /**
     * Starts or stops the timers for updating the time of the last update and receiving data through the timer API
     */
    timerControl = () => {
        const { autoUpdate, intervalId, tickTock } = this.state
        const { dispatch } = this.props

        if (autoUpdate) {
            const intervalId = setInterval(() => {
                dispatch(meteoActions.fetchMeteoData())
            }, 30000)

            const tickTock = setInterval(() => {
                this.tickClock()
            }, 1000)

            this.setState({
                intervalId: intervalId,
                tickTock: tickTock
            })
        } else {
            clearInterval(intervalId)
            clearInterval(tickTock)
        }
    }

    /**
     * The function every second calculates how much time has passed since the last data update through the API
     */
    tickClock = () => {
        const { current } = this.props

        this.setState({
            lastUpdate: moment.unix(current.datestamp).fromNow()
        });
    }

    render() {
        const { current } = this.props
        const { autoUpdate, lastUpdate } = this.state
        const updateTimer = (!autoUpdate && !_.isEmpty(current)) ? moment.unix(current.datestamp).fromNow() : lastUpdate

        return (
            <div>
                <Header
                    onChangeAutoupdate={this.handleChangeAutoupdate}
                    autoUpdate={autoUpdate}
                />
                { ! _.isEmpty(current) ? (
                    <div>
                        <Summary
                            data={current}
                            updateTimer={updateTimer}
                        />
                        <Dashboard
                            data={current}
                        />
                    </div>
                ) : (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Main)