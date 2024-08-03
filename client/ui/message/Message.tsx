import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    list?: string[]
    text?: string
    type?: 'negative' | 'positive'
}

const Message: React.FC<MessageProps> = ({ title, text, list, type, ...props }) => (
    <section
        {...props}
        className={cn(styles.message, type && styles[type])}
    >
        {title && <p className={styles.title}>{title}</p>}
        {text && <p className={styles.content}>{text}</p>}
        {list && <ul>{list.map((item) => (item.length ? <li key={`item${item}`}>{item}</li> : ''))}</ul>}
    </section>
)

export default Message
