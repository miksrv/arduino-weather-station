import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader } from 'semantic-ui-react'

import Header from '../components/Header'
import Stats from '../components/Stats'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Charts extends Component {

    state = {
        intervalId: null,
        autoUpdate: false,
        period: 'today',
        update: false
    }

    componentDidMount() {
        const { dispatch } = this.props
        const { period } = this.state
        const autoUpdate = localStorage.getItem('autoUpdate') === 'true'

        this.setState({autoUpdate: autoUpdate})

        dispatch(meteoActions.fetchStatData(period))
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { autoUpdate } = this.state

        if (autoUpdate !== prevState.autoUpdate) {
            localStorage.setItem('autoUpdate', autoUpdate)

            this.timerControl()
        }
    }

    componentWillUnmount() {
        const { intervalId } = this.state

        clearInterval(intervalId)
    }

    handleChangeAutoupdate = () => {
        this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))
    }

    /**
     * Starts or stops the timers for updating the time of the last update and receiving data through the timer API
     */
    timerControl = () => {
        const { autoUpdate, intervalId } = this.state
        const { period } = this.state
        const { dispatch } = this.props

        if (autoUpdate) {
            const intervalId = setInterval(() => {
                // #TODO
                // dispatch(meteoActions.fetchStatData())
            }, 30000)

            this.setState({
                intervalId: intervalId
            })
        } else {
            clearInterval(intervalId)
        }
    }

    changePeriod = ( period ) => {
        const { dispatch } = this.props

        // , update: true
        this.setState({ period })

        if ( period !== this.state.period ) {
            dispatch(meteoActions.fetchStatData(period))
        }
    }

    // #TODO Not working
    loaderOff = () => {
        this.setState({ update: false })
    }

    render() {
        const { chartData } = this.props
        const { autoUpdate, update } = this.state

        return (
            <div>
                <Header
                    onChangeAutoupdate={this.handleChangeAutoupdate}
                    autoUpdate={autoUpdate}
                />
                <br />
                <Container className='main-content'>
                    { (! _.isEmpty(chartData) && ! update) ? (
                        <Stats
                            data={chartData}
                            onChangePeriod={this.changePeriod}
                        />
                    ) : (
                        <Dimmer active>
                            <Loader>Загрузка</Loader>
                        </Dimmer>
                    )}
                </Container>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        chartData: state.meteostation.chartData,
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Charts)