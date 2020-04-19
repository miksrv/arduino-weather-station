import React from 'react'
import { Container } from 'semantic-ui-react'

const Error404 = () => {
    return (
        <div id='wrapper'>
            <Container className='error404'>

                <h2>404 - PAGE NOT FOUND</h2>
                <p>The page you are looking for might have been removed<br />had its name changed or is temporarily unavailable.</p>
            </Container>
        </div>
    )
}

export default Error404