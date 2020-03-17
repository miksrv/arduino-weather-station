import React from 'react'

import { Container } from 'semantic-ui-react'

import version from '../data/version'

const Footer = () => {
    return (
        <Container textAlign='center' className='footer'>
            <div>Powered by Arduino, PHP + MySQL, ReactJS</div>
            <div>Copyright © Mik 2020, Version {version}</div>
        </Container>
    )
}

export default Footer