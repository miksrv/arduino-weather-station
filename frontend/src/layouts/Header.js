import React  from 'react'
import { NavLink } from 'react-router-dom'
import { Container } from 'semantic-ui-react'

const Header = () => {
    return (
        <Container className='main-content'>
            <nav className='navigation'>
                <NavLink exact to='/'>Home</NavLink>
                <NavLink to='/test' activeClassName='active'>Statistic</NavLink>
                <NavLink to='/experemental' activeClassName='active'>Experemental</NavLink>
            </nav>
        </Container>
    )
}

export default Header