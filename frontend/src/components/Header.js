import React, { Component } from 'react'
import { Checkbox, Container, Icon } from 'semantic-ui-react'

import moment from 'moment'

import timeAgo from '../data/timeAgo'

class Header extends Component {

    state = {
        intervalId: null,
        autoUpdate: false,
        tickTock: null,
        lastUpdate: '---'
    }

    componentDidMount() {
        const autoUpdate = localStorage.getItem('autoUpdate') === 'true'

        moment.locale('ru')

        this.setState({ autoUpdate: autoUpdate })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { autoUpdate, lastUpdate } = this.state
        const { updateTime } = this.props

        if (updateTime !== lastUpdate) {
            this.setState({ lastUpdate: updateTime })
        }

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
        const { onUpdateData } = this.props

        if (autoUpdate) {
            const intervalId = setInterval(() => {
                onUpdateData()
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
        const { updateTime } = this.props

        this.setState({
            lastUpdate: moment.unix(updateTime).fromNow()
        })
    }


    render() {
        const { autoUpdate, lastUpdate } = this.state
        const { onClickMenu } = this.props

        return (
            <Container className='header-toolbar'>
                <Icon
                    className='hamburger'
                    name='bars'
                    size='big'
                    onClick={() => onClickMenu()}
                />
                <span className='last-update'>
                    <span className={((lastUpdate - moment().unix() < 180 && autoUpdate) ? 'online' : 'offline')}></span>
                    {moment.unix(lastUpdate).format("DD.MM.Y, H:mm:ss")}{timeAgo(moment().unix() - lastUpdate)}
                </span>
                {/*{moment.unix(lastUpdate).fromNow()}*/}
                <Checkbox
                    toggle
                    checked={autoUpdate}
                    label=''
                    onChange={this.handleChangeAutoupdate}
                    className='update-switch'
                />
            </Container>
        )
    }
}

export default Header