import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Checkbox, Container, Grid } from 'semantic-ui-react'
import { WiDaySunny } from 'react-icons/wi'

import moment from 'moment'

import _ from 'lodash'

import * as meteoActions from '../store/meteostation/actions'

class Summary extends Component {
  state = {
    intervalId: null,
    autoUpdate: false
  }

  componentDidMount() {
    const { dispatch } = this.props

    dispatch(meteoActions.fetchMeteoData())

    moment.locale('ru')
  }

  handleChange = () => {
    const { autoUpdate } = this.state
    const { dispatch } = this.props

    this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))

    if ( !autoUpdate) {
      var intervalId = setInterval(() => {
          dispatch(meteoActions.fetchMeteoData())
      }, 30000)

      this.setState({intervalId: intervalId})
    } else {
      clearInterval(this.state.intervalId)
    }
  }

  render() {
    const { autoUpdate } = this.state
    const { current } = this.props

    return (
        <div className='summary'>
          <div className='background-overlay'>
            <div className='background-image' style={{backgroundImage: 'url(/background/spring-sunrise.jpg)'}}></div>
          </div>
          <Container className='main-content'>
            <Grid>
              <Grid.Column computer={8} tablet={16}>
                <h1>Погодная станция</h1>
                <h4>Россия, г. Оренбург, ул. Чкалова</h4>
                {(! _.isEmpty(current) && typeof current.temp1 !== 'undefined' && (
                <div className='current'>
                  <WiDaySunny className='icon' />
                  <span className='value'>{current.temp1.cur}</span>
                  <span className='sign'>℃</span>
                </div>
                ))}
                <div className='update'>Обновлено: {moment.unix(current.datestamp).format("DD.MM.Y, h:mm:ss")}</div>
                <div>
                  <Checkbox
                      toggle
                      checked={autoUpdate}
                      label='Автообновление данных'
                      onChange={this.handleChange}
                  />
                </div>
              </Grid.Column>
              <Grid.Column computer={8} tablet={0}>

              </Grid.Column>
            </Grid>
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