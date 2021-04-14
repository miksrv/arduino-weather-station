import _ from 'lodash'

import React, { Component } from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Container, Dimmer, Grid, Loader, Message } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import Summary from '../layouts/Summary'
import ForeacstTile from '../layouts/ForeacstTile'

import * as meteoActions from '../store/meteostation/actions'

class Main extends Component {

    componentDidMount() {
        const { dispatch, storeForecast } = this.props

        if (_.isEmpty(storeForecast))
            dispatch(meteoActions.fetchDataForecast())
    }

    render() {
        const { storeSummary, storeForecast } = this.props
        let last_update = moment().unix() - storeSummary.update

        return (
            <MainContainer
                updateTime={storeSummary.update}
            >
                {(last_update < -180 || last_update > 180) && (
                    <Container>
                        <Message negative>
                            <Message.Header>Данные устарели</Message.Header>
                            <p>Последние показания погодная станция передавала {moment.unix(storeSummary.update).format("DD.MM.Y в H:mm:ss")}</p>
                        </Message>
                    </Container>
                )}

                <Container>
                    <Summary
                        storeSummary={storeSummary}
                        openWeatherData={storeForecast}
                    />
                    <br />
                    {! _.isEmpty(storeForecast) ? (
                        <ForeacstTile
                            data={storeForecast.data}
                        />
                    ) : (
                        <Grid className='forecast-list-loader'>
                            <Grid.Column computer={16} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 210}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                        </Grid>
                    )}
                </Container>
            </MainContainer>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeSummary: state.meteostation.storeSummary,
        storeForecast: state.meteostation.storeForecast
    }
}

export default connect(mapStateToProps)(Main)