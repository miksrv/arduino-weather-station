const React = require('react');

module.exports = {
    Icon: ({ name, className }) =>
        React.createElement('div', {
            'data-testid': 'icon',
            'data-name': name,
            'data-class': className,
        }),
};
