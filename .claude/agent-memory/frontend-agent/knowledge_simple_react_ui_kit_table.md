---
name: simple-react-ui-kit Table usage
description: How to use the Table component from simple-react-ui-kit, including column config, formatter signature, and widget wrapping pattern
type: project
---

## Import Pattern

```ts
import { cn, ColumnProps, Table, TableProps } from 'simple-react-ui-kit'
```

`TableProps` is used when a component needs to extend or forward table props.

## Column Config with useMemo

Define columns with `ColumnProps<T>[]` and wrap in `useMemo` to avoid recreation on each render:

```ts
const columns: ColumnProps<MyType>[] = useMemo(
    () => [
        {
            accessor: 'fieldName',
            header: t('i18n-key'),
            isSortable: true,
            formatter: (value) => String(value)
        }
    ],
    [t]
)
```

## Column Fields

| Field | Type | Description |
|---|---|---|
| `accessor` | `keyof T` | Which field from the row object to pass as `value` |
| `header` | `string` | Column heading text |
| `formatter` | `(value, data, i) => ReactNode \| string` | Cell renderer (see below) |
| `isSortable` | `boolean` | Enables sort on this column |
| `background` | `(value) => string` | Returns CSS color string for cell background |
| `className` | `string` | CSS class applied to all cells in this column |

## Formatter Signature

```ts
formatter: (value: unknown, data: T[], i: number) => React.ReactNode | string
```

- `value` — the cell value (the field named by `accessor` for row `i`)
- `data` — the full rows array
- `i` — the row index

Use `data[i]` to access sibling fields when a column needs more than one field:
```ts
formatter: (startDate, data, i) => getDuration(startDate as string, data[i].endDate)
```

When two columns share the same `accessor`, the `formatter` distinguishes their rendering (used in `WidgetForecastTable` for `date`/`time` sharing `accessor: 'date'`).

## Table Component Usage

```tsx
<Table<MyType>
    data={rows}
    columns={columns}
    size={'small'}
/>
```

Common props: `data`, `columns`, `size` (`'small'`), `stickyHeader`, `height`, `className`.

## Widget Wrapping Pattern

Wrap `<Table>` in a container div with a CSS Module class:

```tsx
return (
    <div className={cn(styles.widgetMyTable)}>
        <Table<MyType>
            data={rows}
            columns={columns}
            size={'small'}
        />
    </div>
)
```

## Row-level Conditional Styling

`ColumnProps` has no row-class callback — `className` is a static `string`. To apply conditional per-row styles, use `formatter` to wrap the cell content in a `<span>` with `cn(condition && styles.myClass)`:

```tsx
formatter: (value, data, i) => (
    <span className={cn(isSpecialRow(data[i]) && styles.highlightCell)}>
        {value as string}
    </span>
)
```

Apply this pattern to every column that needs the row highlight. Name the CSS class `*Cell` (e.g., `floodYearCell`) to distinguish it from the old `*Row` pattern on `<tr>`.

## Reference Components

- `client/components/widget-forecast-table/WidgetForecastTable.tsx` — full-featured example with columnsPreset, stickyHeader, title/link, background colors, multi-field formatters
- `client/components/widget-anomaly-history/index.tsx` — simpler example showing 5-column history table with pure data display
- `client/components/widget-snowpack-chart/ComparisonTable.tsx` — minimal 3-column table with conditional per-row cell styling via formatter + `cn`

## Mock (\_\_mocks\_\_/simple-react-ui-kit.js)

The existing mock renders `<table data-testid='table' />` but does NOT call formatters or render row cells. Component tests should only assert `screen.getByTestId('table')` presence. Do NOT write tests that query for cell text content or cell classes when using this mock — those will always fail. If deeper cell-level assertions are needed, write them by calling formatters directly or using a custom mock.
