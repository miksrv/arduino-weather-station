import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { Checkbox, Container, Grid } from 'semantic-ui-react'

class Header extends Component {

    render() {
        const { onChangeAutoupdate, autoUpdate } = this.props

        return (
            <Container className='main-content'>
                <Grid className='header-toolbar'>
                    <Grid.Column width={10}>
                        <nav className='navigation'>
                            <NavLink exact to='/'>Датчики</NavLink>
                            <NavLink to='/test' activeClassName='active'>Графики</NavLink>
                            {/*<NavLink to='/experemental' activeClassName='active'>Experemental</NavLink>*/}
                        </nav>
                    </Grid.Column>
                    <Grid.Column textAlign='right' width={6}>
                        <Checkbox
                            toggle
                            checked={autoUpdate}
                            label='Автообновление'
                            onChange={onChangeAutoupdate}
                            className='update-switch'
                        />
                    </Grid.Column>
                </Grid>
            </Container>
        )
    }
}

export default Header