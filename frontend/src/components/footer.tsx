import React from 'react'

const Footer: React.FC = () => {
    return (
        <div className='footer'>
            <div>Powered by Arduino, PHP + MySQL, ReactJS</div>
            <div>Copyright ©
                <a href='https://miksoft.pro' className='copyright-link' title=''>
                    <img src='https://miksoft.pro/favicon.ico' alt='' /> Mik
                </a> 2021, Version {process.env.REACT_APP_VERSION} ({process.env.REACT_APP_UPDATE})
            </div>
        </div>
    )
}

export default Footer
