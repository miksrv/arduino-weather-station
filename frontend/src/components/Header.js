import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { Checkbox, Container } from 'semantic-ui-react'

class Header extends Component {

    render() {
        const { onChangeAutoupdate, autoUpdate } = this.props

        return (
            <Container className='main-content'>
                <div className='header-toolbar'>
                    <nav className='navigation'>
                        <NavLink exact to='/'>Датчики</NavLink>
                        <NavLink to='/charts' activeClassName='active'>Графики</NavLink>
                        <NavLink to='/forecast' activeClassName='active'>Прогноз</NavLink>
                    </nav>
                    <div className='update-container'>
                        <Checkbox
                            toggle
                            checked={autoUpdate}
                            label='Автообновление'
                            onChange={onChangeAutoupdate}
                            className='update-switch'
                        />
                    </div>
                </div>
            </Container>
        )
    }
}

export default Header