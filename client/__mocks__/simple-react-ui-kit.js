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
    Table: (props) =>
        React.createElement('table', { 'data-testid': 'table', ...props }),
    TableProps: {},
    TableColumnProps: {},
    Skeleton: ({ style }) =>
        React.createElement('div', { 'data-testid': 'skeleton', style }),
    Spinner: () =>
        React.createElement('div', { 'data-testid': 'spinner' }),
    // Like the kit's: the rest of the props (className, role, aria-*) land on the badge element
    Badge: ({ icon, label, size, onClickRemove, tooltip, ...rest }) =>
        React.createElement('span', { 'data-testid': 'badge', 'data-icon': icon, ...rest }, label),
};
