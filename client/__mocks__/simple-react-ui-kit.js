const React = require('react');

module.exports = {
    Icon: ({ name, className }) =>
        React.createElement('div', {
            'data-testid': 'icon',
            'data-name': name,
            'data-class': className,
        }),
    cn: (...args) => args.filter(Boolean).join(' '),
    Button: ({ children, ...props }) => (
        React.createElement('button', props, children)
    ),
};
