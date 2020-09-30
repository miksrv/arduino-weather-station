import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Grid, Loader } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ShortStats from '../components/ShortStats'
import Sensor from '../layouts/Sensor'

import sensors from '../data/sensors'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Dashboard extends Component {

    componentDidMount() {
        const { dispatch } = this.props

        this.updateWeatherData()
        dispatch(meteoActions.fetchStatData('today'))
    }

    updateWeatherData = () => {
        const { dispatch } = this.props

        dispatch(meteoActions.fetchMeteoData())
    }

    render() {
        const { current, chartData } = this.props

        return (
            <MainContainer
                updateTime={current.update}
                onUpdateData={this.updateWeatherData}
            >
                { ! _.isEmpty(current) && ! _.isEmpty(chartData) ? (
                    <Container>
                        <Grid>
                            {sensors.map((item, key) => {
                                return (
                                    <Sensor
                                        key={key}
                                        widget={item}
                                        data={current[item.type][item.source]}
                                    />
                                )
                            })}
                        </Grid>
                        <ShortStats
                            data={chartData}
                            onChangePeriod={this.changePeriod}
                        />
                    </Container>
                ) : (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}
            </MainContainer>
        );
    }
}

function mapStateToProps(state) {
    return {
        chartData: state.meteostation.chartData,
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Dashboard)