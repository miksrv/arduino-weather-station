import React from 'react'
import { Badge, BadgeProps, cn } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type StatusTone = 'green' | 'yellow' | 'orange' | 'red'

export interface StatusBadgeProps extends Omit<BadgeProps, 'onClickRemove'> {
    /** The status colour: the tint, the ring and the icon */
    tone: StatusTone
}

/**
 * The kit `Badge` in a status colour: the outdated-data warning, a risk level. Size, radius and type stay the
 * kit's; the tone only sets the badge's own tokens (`--badge-background`, `--badge-border-color`) and the icon fill.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ tone, className, ...props }) => (
    <Badge
        {...props}
        className={cn(styles.statusBadge, styles[tone], className)}
    />
)

export default StatusBadge
