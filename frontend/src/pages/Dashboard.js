import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Grid, Loader } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ShortStats from '../components/ShortStats'
import Sensor from '../layouts/Sensor'

import sensors from '../data/sensors'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

const data_set = 'p,t2,h,uv,lux,ws,wd'

class Dashboard extends Component {

    componentDidMount() {
        const { dispatch } = this.props

        this.updateWeatherData()
        dispatch(meteoActions.fetchStatData('today', data_set))
    }

    updateWeatherData = () => {
        const { dispatch } = this.props

        dispatch(meteoActions.fetchMeteoData())
    }

    render() {
        const { current, statistic } = this.props

        return (
            <MainContainer
                updateTime={current.update}
                onUpdateData={this.updateWeatherData}
            >
                { ! _.isEmpty(current) && ! _.isEmpty(statistic) ? (
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
                            data={statistic}
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
        statistic: state.meteostation.statistic,
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Dashboard)