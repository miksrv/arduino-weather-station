import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { useAppDispatch } from '../../app/hooks'
import { toggle } from '../sidebar/sidebarSlice'

const Header: React.FC = () => {
    const dispatch = useAppDispatch()

    return (
        <div className='header-toolbar'>
            <Icon
                className='hamburger'
                name='bars'
                size='big'
                onClick={() => dispatch(toggle())}
            />
            <span className='online'></span>
            <span className='last-update'>
                <span><Icon loading name='spinner' /> Загрузка...</span>
            </span>
            <span className='buttons'>
                <Button icon='refresh' color='green' size='tiny' />
            </span>
        </div>
    )
}

export default Header
