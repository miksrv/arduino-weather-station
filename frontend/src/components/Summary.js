import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Checkbox, Container } from 'semantic-ui-react'
import { WiDaySunny } from 'react-icons/wi'

import moment from 'moment'

import _ from 'lodash'

import * as meteoActions from '../store/meteostation/actions'

class Summary extends Component {
  state = {
    intervalId: null,
    autoUpdate: false,
    tickTock: null,
    lastUpdate: '---'
  }

  componentDidMount() {
    const { dispatch } = this.props

    dispatch(meteoActions.fetchMeteoData())

    moment.locale('ru')
  }

  handleChange = () => {
    const { autoUpdate, intervalId, tickTock } = this.state
    const { dispatch } = this.props

    this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))

    if ( ! autoUpdate) {
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

  tickClock = () => {
    const { current } = this.props

    this.setState({
      lastUpdate: moment.unix(current.datestamp).fromNow()
    });
  }

  valueRange(x, min, max) {
    return x >= min && x <= max;
  }

  renderValueSwitch(param) {
    // #TODO: цвет в зависимости от температуры
    return null

    if (this.valueRange(param, -20, -15)) {
      return 'value-15-20'
    } else if (this.valueRange(param, -15, -10)) {
      return 'value-10-15'
    } else if (this.valueRange(param, -10, -5)) {
      return 'value-5-10'
    } else if (this.valueRange(param, -5, 0)) {
      return 'value-0-5'
    } else if (this.valueRange(param, 15, 20)) {
      return 'value15-20'
    }

    return null;
  }

  render() {
    const { autoUpdate, lastUpdate } = this.state
    const { current } = this.props

    const updateTimer = (!autoUpdate && !_.isEmpty(current)) ? moment.unix(current.datestamp).fromNow() : lastUpdate

    return (
        <div className='summary'>
          <div className='background-overlay'>
            <div className='background-image' style={{backgroundImage: 'url(/background/spring-sunrise.jpg)'}}></div>
          </div>
          <Container className='main-content'>
            <h1>Погодная станция</h1>
            <h4>Россия, г. Оренбург, ул. Чкалова</h4>
            {(! _.isEmpty(current) && typeof current.temp1 !== 'undefined' && (
                <div className='current'>
                  <WiDaySunny className='icon' />
                  <span className={'value' + ' ' + this.renderValueSwitch(current.temp1.cur)}>{current.temp1.cur}</span>
                  <span className='sign'>℃</span>
                </div>
            ))}
            <div className='update'>Обновлено: {moment.unix(current.datestamp).format("DD.MM.Y, h:mm:ss")}</div>
            <div className='timeago'>Последние данные: {updateTimer}</div>
            <div>
              <Checkbox
                  toggle
                  checked={autoUpdate}
                  label='Автообновление'
                  onChange={this.handleChange}
              />
            </div>
          </Container>
        </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    current: state.meteostation.current
  }
}

export default connect(mapStateToProps)(Summary);