import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Grid, Loader, Message } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import Summary from '../layouts/Summary'
import ForeacstTile from '../layouts/ForeacstTile'

import * as meteoActions from '../store/meteostation/actions'
import _ from 'lodash'
import moment from 'moment'

class Main extends Component {

    componentDidMount() {
        const { dispatch } = this.props

        this.updateWeatherData()
        dispatch(meteoActions.fetchDataForecast())
    }

    updateWeatherData = () => {
        const { dispatch } = this.props

        dispatch(meteoActions.fetchDataSummary())
    }

    render() {
        const { storeSummary, storeForecast } = this.props
        let last_update = moment().unix() - storeSummary.update

        return (
            <MainContainer
                updateTime={storeSummary.update}
                onUpdateData={this.updateWeatherData}
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
                    {! _.isEmpty(storeForecast) ? (
                        <ForeacstTile
                            data={storeForecast.data.slice(0, 4)}
                        />
                    ) : (
                        <Grid className='forecast-list-loader'>
                            <Grid.Column computer={8} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 210}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                            <Grid.Column computer={8} tablet={16} mobile={16}>
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
        );
    }
}

function mapStateToProps(state) {
    return {
        storeSummary: state.meteostation.storeSummary,
        storeForecast: state.meteostation.storeForecast
    }
}

export default connect(mapStateToProps)(Main)