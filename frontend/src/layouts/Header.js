import React  from 'react'
import { Link } from 'react-router-dom'
import { Container } from 'semantic-ui-react'

const Header = () => {
    return (
        <div>
            <Container className='main-content'>
                Header
                <Link to='/'>Dashboard</Link>
                <Link to='/test'>Statistic</Link>
            </Container>
        </div>
    )
}

export default Header