import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Dimmer, Loader, Container, Image, Popup } from 'semantic-ui-react'

import Header from '../components/Header'
import 'moment/locale/ru'
import moment from "moment";

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'
import Stats from "../components/Stats";
import sensors from "../data/sensors";

class Forecast extends Component {

    state = {
        autoUpdate: false
    }

    componentDidMount() {
        const { dispatch } = this.props
        const autoUpdate = localStorage.getItem('autoUpdate') === 'true'

        moment.locale('ru')

        this.setState({autoUpdate: autoUpdate})

        dispatch(meteoActions.fetchForecastData())
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { autoUpdate } = this.state

        if (autoUpdate !== prevState.autoUpdate) {
            localStorage.setItem('autoUpdate', autoUpdate)
        }
    }

    render() {
        const { forecast } = this.props
        const { autoUpdate } = this.state

        console.log('forecast', forecast);

        return (
            <div>
                <Header
                    onChangeAutoupdate={this.handleChangeAutoupdate}
                    autoUpdate={autoUpdate}
                />
                { ! _.isEmpty(forecast) ? (
                    <Container className='main-content'>
                        <Table celled inverted selectable className='weather-table'>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell></Table.HeaderCell>
                                    <Table.HeaderCell>Дата, время</Table.HeaderCell>
                                    <Table.HeaderCell>Описание</Table.HeaderCell>
                                    <Table.HeaderCell>
                                        <Popup content='Температура воздуха' trigger={<span>T (℃)</span>} />
                                    </Table.HeaderCell>
                                    <Table.HeaderCell>
                                        <Popup content='Эффективная температура - характеристика комфортности с учётом влажности воздуха и скорости ветра: температура, которую должен иметь сухой воздух при штиле, чтобы теплоощущение человека было таким же, как в данном влажном воздухе при наличии ветра.' trigger={<span>Te (℃)</span>} />
                                    </Table.HeaderCell>
                                    <Table.HeaderCell>
                                        <Popup content='Влажность воздуха' trigger={<span>H (%)</span>} />
                                    </Table.HeaderCell>
                                    <Table.HeaderCell>
                                        <Popup content='Давление (мм. рт. ст.)' trigger={<span>P (мм)</span>} />
                                    </Table.HeaderCell>
                                    <Table.HeaderCell colSpan='2'>Ветер (м\с)</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                            {forecast.data.map((item, key) => (
                                <Table.Row key={key}>
                                    <Table.Cell>
                                        <Image src={'http://openweathermap.org/img/wn/' + item.weather[0].icon + '.png'} />
                                    </Table.Cell>
                                    <Table.Cell>{moment.unix(item.dt).format("DD.MM.Y H:mm")}</Table.Cell>
                                    <Table.Cell>{item.weather[0].description}</Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {this.valueColor(Number((item.main.temp).toFixed(1)))}
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {this.valueColor(Number((item.main.feels_like).toFixed(1)))}
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {item.main.humidity}
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {Number((item.main.pressure * 0.75).toFixed(1))}
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {Number((item.wind.speed).toFixed(1))}
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {item.wind.deg}°
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                            </Table.Body>
                        </Table>
                    </Container>
                ) : (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}
            </div>
        );
    }

    valueColor = value => {
        let color = ''

        if (value >= -20 && value < -15) {
            color = 'value-15-20'
        } else if (value >= -15 && value < -10) {
            color = 'value-10-15'
        } else if (value >= -10 && value < -5) {
            color = 'value-5-10'
        } else if (value >= -5 && value < 0) {
            color = 'value-0-5'
        } else if (value >= 0 && value < 5) {
            color = 'value0-5'
        } else if (value >= 5 && value < 10) {
            color = 'value5-10'
        } else if (value >= 10 && value < 15) {
            color = 'value10-15'
        } else if (value >= 15 && value < 20) {
            color = 'value15-20'
        } else if (value >= 20 && value < 25) {
            color = 'value20-25'
        } else if (value >= 25 && value < 30) {
            color = 'value25-30'
        } else if (value >= 30 && value < 35) {
            color = 'value30-35'
        }

        return <span className={color}>{value}</span>
    }

    handleChangeAutoupdate = () => {
        this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))
    }
}

function mapStateToProps(state) {
    return {
        forecast: state.meteostation.forecast
    }
}

export default connect(mapStateToProps)(Forecast)