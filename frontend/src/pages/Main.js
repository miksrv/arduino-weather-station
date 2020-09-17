import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader } from 'semantic-ui-react'

import Header from '../components/Header'
import Summary from '../layouts/Summary'
import ForeacstTile from '../layouts/ForeacstTile'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Main extends Component {

    componentDidMount() {
        const { dispatch } = this.props

        this.updateWeatherData()
        dispatch(meteoActions.fetchForecastData())
    }

    updateWeatherData = () => {
        const { dispatch } = this.props

        dispatch(meteoActions.fetchMeteoData())
    }

    render() {
        const { current, forecast } = this.props

        return (
            <div>
                <Header
                    updateTime={current.update}
                    onUpdateData={this.updateWeatherData}
                />
                { ! _.isEmpty(current) && ! _.isEmpty(forecast)  ? (
                    <Container>
                        <Summary
                            dTemperature={current.sensors.t1.value}
                            dHumidity={current.sensors.h.value}
                            dPressure={current.sensors.p.value}
                            dWindSpeed={current.sensors.ws.value}
                            dWindDir={current.sensors.wd.info}
                            openWeatherData={forecast.data[0]}
                        />
                        <ForeacstTile
                            data={forecast.data.slice(0, 4)}
                        />
                    </Container>
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
        current: state.meteostation.current,
        forecast: state.meteostation.forecast
    }
}

export default connect(mapStateToProps)(Main)