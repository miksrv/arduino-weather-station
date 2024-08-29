import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

const Skeleton: React.FC<SkeletonProps> = ({ ...props }) => (
    <div
        {...props}
        className={cn(styles.skeleton, props.className)}
    />
)

export default Skeleton
