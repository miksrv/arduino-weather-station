---
name: ECharts tooltip CSS class pattern
description: Tooltip HTML injected by ECharts formatters requires .value class defined in the SASS module; this class is frequently missing in older modules
type: project
---

ECharts tooltip formatters build raw HTML strings like:
```
`<span class="${styles.value}">...</span>`
```

This means the `.value` class must be defined in the corresponding `.module.sass` file, even though it only appears as a string interpolation (not a direct JSX class reference). Static analysis tools and editors won't flag its absence.

**Why:** Found during 2026-03-23 CSS audit. Three modules (`widget-chart`, `widget-heatmap`, `widget-climate`) were missing `.value` despite using it in tooltip HTML. When a CSS Module class is absent, `styles.value` resolves to `undefined`, producing `class="undefined"` in the DOM.

**How to apply:** Whenever adding or reviewing ECharts tooltip formatters that reference `styles.*`, verify each referenced class is actually defined in the SASS file — especially `.value`, `.label`, `.icon`, `.chartTooltipTitle`, `.chartTooltipItem`.

The standard tooltip CSS pattern (consistent across all chart widgets) is:
```sass
.chartTooltipTitle
    font-size: 12px
    color: var(--text-color-primary)

.chartTooltipItem
    .icon
        float: left
        width: 6px
        height: 6px
    .label
        font-size: 12px
        color: var(--text-color-secondary)
    .value
        color: var(--text-color-primary)
        margin-left: 10px
```
