import React from 'react'
import { Icon } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export interface ComparisonIconProps {
    currentValue?: number | string
    previousValue?: number | string
}

const ComparisonIcon: React.FC<ComparisonIconProps> = (props) => {
    const currentValue = props?.currentValue ? Number(props?.currentValue) : undefined
    const previousValue = props?.previousValue ? Number(props?.previousValue) : undefined

    return !currentValue || !previousValue || currentValue === previousValue ? null : currentValue > previousValue ? (
        <Icon
            name={'ArrowUp'}
            className={styles.green}
        />
    ) : (
        <Icon
            name={'ArrowDown'}
            className={styles.red}
        />
    )
}

export default ComparisonIcon
