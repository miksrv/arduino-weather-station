---
name: ECharts tooltip CSS class pattern
description: Tooltip HTML injected by ECharts formatters needs its classes defined in the SASS module — include +mixins.chartTooltip
type: project
---

ECharts tooltip formatters build raw HTML strings like:
```
`<span class="${styles.value}">...</span>`
```

This means the `.value` class must be defined in the corresponding `.module.sass` file, even though it only appears as a string interpolation (not a direct JSX class reference). Static analysis tools and editors won't flag its absence.

**Why:** Found during 2026-03-23 CSS audit. Three modules (`widget-chart`, `widget-heatmap`, `widget-climate`) were missing `.value` despite using it in tooltip HTML. When a CSS Module class is absent, `styles.value` resolves to `undefined`, producing `class="undefined"` in the DOM.

**How to apply:** Whenever adding or reviewing ECharts tooltip formatters that reference `styles.*`, verify each referenced class is actually defined in the SASS file — especially `.value`, `.label`, `.icon`, `.chartTooltipTitle`, `.chartTooltipItem`.

These classes now come from the shared `=chartTooltip` mixin in `styles/mixins.sass` (see `client/DESIGN.md` section 7): include `+mixins.chartTooltip` in the chart's `.module.sass` (as `widget-chart`, `widget-heatmap`, `widget-climate` and the other chart widgets do) instead of hand-writing the classes.
