# Weather station design system

How the client UI is built and where each piece lives. Read this before adding or changing any
user-facing component. The current code and this file are the reference; `docs/` is older.

## 1. Principles

- **Data first, chrome second.** Every screen is a dashboard of readings. The number is the
  loudest thing on a card, its label and unit are quiet, the card itself is barely visible: a
  surface one step above the page with a hairline ring. No heavy shadows, no gradients behind
  text, no decoration that competes with the data.
- **One card, many widgets.** Every block is the same card surface (`card` mixin, `WidgetCard`
  for widgets with a title). A widget differs by its content, never by its own background,
  radius, padding or title style.
- **Kit first.** Primitives (buttons, select, date picker, table, skeleton, icons, tokens) come
  from `simple-react-ui-kit` (`theme.css` + `styles.css`, imported in `pages/_app.tsx`). A missing
  primitive is added to the kit, not hand-rolled here.
- **Tokens, not values.** Colours, radii, spacing, type sizes and motion come from CSS variables:
  the kit's `theme.css`, then the project overrides in `styles/theme.css`. Sass mixins
  (`styles/mixins.sass`, `styles/typography.sass`) apply them. No raw hex colours or pixel font
  sizes in component styles. Canvas charts, which can't read CSS variables, take the same values
  from `tools/echart.ts` (section 7).
- **Both themes, always.** Dark is the default (`next-themes`, `data-theme` on `<html>`). Every
  change is checked in light and dark, on a 1280px desktop and a 390px phone.

## 2. Tokens

### Surfaces and text

| Token                    | Light                | Dark      | Use                                       |
| ------------------------ | -------------------- | --------- | ----------------------------------------- |
| `--body-background`      | `#f7f8fa`            | `#0b0d10` | the page                                  |
| `--surface-1`            | `#ffffff`            | `#14181d` | cards (`--card-background`)               |
| `--surface-2`            | `#f3f4f6`            | `#1b2026` | hover rows, icon squares, segmented track |
| `--surface-3`            | `#e8eaee`            | `#242a31` | meter tracks, empty dots                  |
| `--border`               | `#e6e8ec`            | `#252b33` | card ring, separators                     |
| `--border-strong`        | `#cfd4db`            | `#333a43` | controls, the compass ring                |
| `--text-color-primary`   | `rgba(0, 0, 0, 0.9)` | `#e6e9ee` | values, titles                            |
| `--text-color-secondary` | `#66707d`            | `#8e97a4` | labels, units, captions, axis labels      |

Surfaces are cool neutrals (a slight blue in the grey), the same family in both themes. Status
colours (`--color-green|orange|red` and their `-background` tints) are the kit's. The brand
`--color-main` is the kit's in dark; in light it is one step deeper (`#1f6fd1`, hover `#1a5fb4`)
so that links, the active menu item and white text on primary buttons reach 4.5:1.

Contrast targets: text 4.5:1 on its surface (secondary text too), chart lines, icons and
other graphics 3:1.

### Data colours

One hue per measured quantity. Every line is at least 3:1 against the card it sits on (WCAG 1.4.11
for graphics), so the light theme takes deeper tones of the hues that are too pale on white; the
hue itself never changes between themes. CSS: `--data-*` in the theme blocks of `styles/theme.css`;
charts: `getColor(name, theme)` / `getSensorColor(sensor, theme)` in `tools/colors.ts` (`colors`
for dark, `lightColors` overrides). Keep both in sync; `tools/colors.test.ts` checks the contrast of
every hue in both themes.

| Quantity            | Token                  | Hue      | Light     | Dark      |
| ------------------- | ---------------------- | -------- | --------- | --------- |
| Temperature         | `--data-temperature`   | red      | `#ef5359` | `#ef5359` |
| Feels like          | `--data-feels-like`    | orange   | `#ec6509` | `#f7802f` |
| Humidity            | `--data-humidity`      | cyan     | `#1b9cb1` | `#1fb3cc` |
| Pressure            | `--data-pressure`      | purple   | `#9d6ee0` | `#9d6ee0` |
| Wind                | `--data-wind`          | green    | `#36a16e` | `#3db67c` |
| Precipitation       | `--data-precipitation` | blue     | `#3b8ced` | `#3b8ced` |
| Clouds              | `--data-clouds`        | indigo   | `#6b7fe8` | `#6b7fe8` |
| Sun (UV, radiation) | `--data-sun`           | yellow   | `#b28811` | `#e9b51f` |
| Dew point           | `--data-dew-point`     | sky blue | `#3793e6` | `#55a3ea` |

The data hues are for lines, fills and icons, not for small text: as text on white they miss the
4.5:1 contrast. A maximum and a minimum as **text** use `--color-max` (warm) and `--color-min`
(cool), which are AA in both themes. A change ("+0.7 за последний час") is coloured only for
temperature (warmer / colder); for other quantities "up" is not "bad", so the delta stays neutral.

Fixed scales are the exception to "one hue per quantity" and keep their own colours, because
their meaning is the colour: the UV index bands (`widget-sensor-uv`), the wind speed bins of the
wind rose, the warming stripes and the heat-map gradients.

### Radius, spacing, layers

- **Radius tiers** (kit scale), restrained: cards, dialogs and containers `--card-radius` =
  `--radius-lg` (8px) → plates inside a card, icon squares, segmented tracks, menus and controls
  `--radius-md` (6px) → segments, chips, calendar squares `--radius-sm` (4px). Pills, dots, meter
  tracks `--radius-full`. An inner element is never rounder than its container.
- **Spacing**: the kit's 4px grid `--space-1…6` (4…24px) plus `--space-8` (32) and `--space-10`
  (40). The grid gap between cards is `--gap` (12px, 8px on phones). Card padding is
  `--card-padding` (16px).
- **Card surface**: flat — `--card-shadow` is a 1px `--border` ring and no drop shadow; the step from
  the page to `--surface-1` and the ring separate a card. `--card-shadow-hover` (a `--border-strong`
  ring) for clickable cards. Kit `Container`s alias the same tokens.
- **Motion**: `--duration-fast|base|slow` and `--ease`. Everything stops under
  `prefers-reduced-motion` (`styles/globals.sass`).

## 3. Type scale

Two faces of one family, self-hosted with `next/font` (`pages/_app.tsx`, Latin and Cyrillic, no
request to Google and no layout shift): **Geist** for all text and numbers (`--font-family`) and
**Geist Mono** for the small uppercase labels (`--font-family-mono`, the `overline` role). The canvas
charts get the same face from `components/echart`. The weights are light: the data is the loud part,
so big numbers are thin (200–300), titles medium (500), and semibold is kept for the page `h1`.
Text is set by **role**: a mixin of `styles/typography.sass` (`@use '../../styles/typography' as type`, then
`+type.titleCard`) carries size, weight, line height and tracking together. A component takes a
role, never a bare `font-size`.

| Role (mixin)   | px (phones) | Weight · line height               | Use                                           |
| -------------- | ----------- | ---------------------------------- | --------------------------------------------- |
| `valueDisplay` | 56 (48)     | 200 · 1, tabular, −0.04em          | the temperature of the home summary card only |
| `value`        | 32 (28)     | 300 · 1.1, tabular, −0.03em        | the main reading of a card: "21.4"            |
| `unit`         | 16          | 400, secondary                     | the unit after a `value`: "°C", "мм рт. ст."  |
| `titlePage`    | 24 (20)     | 600 · 1.2, −0.025em, balanced      | the page `h1` (`PageHeader`)                  |
| `titleSection` | 16          | 600 · 1.3                          | `h2` between groups of cards (anomaly page)   |
| `titleCard`    | 14          | 500 · 1.3                          | every card title                              |
| `valueSmall`   | 16          | 500 · 1.3, tabular                 | tile values, secondary readings               |
| `body`         | 14          | 400 · 1.5                          | UI text                                       |
| `secondary`    | 13          | 400 · 1.45, secondary colour       | labels, descriptions                          |
| `caption`      | 12          | 400 · 1.4, secondary colour        | min / max labels, timestamps, legends         |
| `overline`     | 11          | Mono 500 · 1.4, +0.08em, uppercase | weekday names of the forecast, status pills   |

Every number that can change in place uses tabular figures (`+type.numbers`, included in the
value roles), so readings don't jitter as they update. A unit follows its number through
`unitSuffix()` (`tools/helpers.ts`): symbols stick ("21°C", "58%"), words get a space
("780 мм рт. ст.").

## 4. Layout

- **Width.** Content is capped by `--width-max` (1200px). The page column has 16px of air under
  the app bar and 12px side gutters (8px on phones).
- **App bar** (`components/app-bar`): sticky, translucent (`--app-bar-background` with a blur),
  full width with its content aligned to the page column, a hairline under it. Left: the menu
  button, the station status dot (green and pulsing while data is fresh, red when the last
  reading is older than 30 minutes), the time of the last reading and "N минут назад". Right: the
  theme switch (`role="switch"`; its slot is reserved on the server so the bar doesn't shift).
- **Menu** (`components/app-layout`): a drawer sliding over the page (transform, not `left`),
  with a scrim. Rows are 40px, a 20px secondary icon and the label; the current page is
  `--color-main` on `--color-main-background`. The language switch (segmented) and the footer
  sit at the bottom of the drawer.
- **Page header** (`components/page-header`): every page except home starts with `PageHeader`:
  the `h1` (`titlePage`), an optional description (secondary text across the full width of the page) and an `actions` slot. Home has its
  `h1` inside the summary card ("Погода в Оренбурге"). One `h1` per page.
- **Toolbar**: page controls (date range, sensor select, export) go in `.toolbar` under the
  header, kit controls, 8px apart.
- **Grid** (`.widgets-list` in `styles/globals.sass`): a wrapping flex row with `--gap`. Cards
  size themselves with `+mixins.columns($n, $of)`, which is gap-aware:

    | `WidgetCard` size | Desktop | ≤ 768px | ≤ 480px |
    | ----------------- | ------- | ------- | ------- |
    | `x1`              | 1/4     | 1/2     | 1/1     |
    | `x2`              | 1/2     | 1/1     | 1/1     |
    | `x3`              | 3/4     | 1/1     | 1/1     |
    | `x4`              | 1/1     | 1/1     | 1/1     |

    Tiles (`widget-tile`) are 1/5, 1/3 on tablets, 1/2 on phones. `.widget-row` keeps a group of
    cards on their own row at equal height.

- **Breakpoints.** `$mobileMaxWidth` (768px) and `$smallMaxWidth` (480px) in
  `styles/variables.sass`. Nothing else.

## 5. Cards

### `WidgetCard` (`components/widget-card`)

The shell of every titled widget: the card surface, a header (title `titleCard`, optional link
with a small external-link icon that turns `--color-main` on hover, optional 20px secondary icon
on the right), the `size` columns above, and a skeleton while `loading`. Purely presentational;
widgets put their own content inside.

### Reading cards (`widgets/`)

A reading card always reads top to bottom: **title → value + unit → what changed → context →
chart**.

- `widget-sensor-stat` (temperature, humidity, pressure): `value` + `unit`, the change over the
  last hour (caption, the number semibold), max / min of today on the right (`StatBlock`,
  `--color-max` / `--color-min`), the 24h `SparklineChart` with the real values on its axis.
- `widget-precip`: today's total, 24h and 7-day totals on the right, a spike chart.
- `widget-sensor-wind`: speed, direction, gusts; the compass is an SVG drawn with tokens (CSS
  classes, not colour attributes), so it follows the theme without re-rendering; the needle head
  is `--data-feels-like`.
- `widget-sensor-uv`: the index, its category, the band scale with a ring marker.
- `widget-tile`: one derived value: a 36px `--surface-2` square with the icon, the label
  (`caption`) over the value (`valueSmall`) and the unit.
- `widget-wind-rose`, `widget-event-log` (rows split by `--border`, icon colours from the data
  and status tokens), `widget-charts-panel` (four `SparklineChart`s with a segmented period
  toggle).

### Home (`components/`)

- `widget-summary`: the hero card: location (`--color-main` pin), the sky in words, the weather
  icon and the temperature (`valueDisplay`), key readings as kit `Badge` chips. A missing reading
  is "нет данных", never 0.
- `widget-sensor`: the compact reading card of the home grid (x1): title, `value`, min / max with
  times, a sparkline bleeding to the card edges.
- `widget-forecast-cards` (home): a scroll rail of forecast cards: weekday (`overline`), the date
  ("24 октября" / "October 24", `date-day-month`), the icon, the temperature, clouds and wind as
  captions. The current period is `--color-main-background` with a `--color-main` ring.

### Forecast page (`pages/forecast.tsx`)

The page answers top to bottom: what is it like now and today → the details of today → the next
48 hours → the week. Times are the station's local time (UTC+5); the API rolls days up by local day.

- `widget-forecast-today` (x2): the station's reading now (`valueDisplay` at 48px) with feels-like,
  the day's high and low (`--color-max` / `--color-min`, `overline` labels) and the day in one
  sentence on a `--surface-2` plate: the condition in bold, then temperature, precipitation and wind
  phrases from `getDaySummary()` (`tools/forecast.ts`).
- `widget-forecast-details` (x2): six figures on `--surface-2` tiles in a 3-column grid (2 on
  phones): humidity, pressure, dew point, UV max with its category, max wind with gusts, clouds.
- `widget-forecast-hourly` (x4): a segmented toggle Temperature / Precipitation / Wind over one
  chart at a time — every axis carries its unit, night hours (18:00–6:00) are shaded with a
  `markArea`, the axis labels every third hour and the capitalised weekday at midnight. Under it the
  hour strip: a scrollable row of 64px cells (time — "Now" first, highlighted —, icon, temperature,
  precipitation from 0.1 mm in the precipitation hue, wind arrow pointing where the wind blows and
  its speed); a new day starts with a rule and the weekday.
- `widget-forecast-daily` (x4): a row per day in a fixed grid, so columns read top to bottom: day
  name (Today / Tomorrow / weekday) and date → icon and condition → precipitation total and wet
  hours (a dash when dry) → low, the range bar, high → wind with gusts. All range bars share the
  week's scale (`getTemperatureBounds`, `getRangePosition`), and each bar is a gradient between the
  colours of its own low and high on the temperature scale (`getTemperatureHue`: −20 blue, 0 cyan,
  +10 yellow, +20 orange, +30 red). Today's row is `--color-main-background`. On phones the
  condition, precipitation and wind columns drop out.
- A caption under the page names the forecast sources and the time zone.

Signed temperatures use a real minus (`formatSigned`: "+5°", "−3°", "0°").

### Heatmap page (`pages/heatmap.tsx`)

The map is the centre of an analysis of one quantity over a period, not a picture on its own. All
figures come from the same hourly data (`/heatmap` groups by hour; `tools/heatmap.ts` places each
value at its local hour and converts pressure to mm Hg), so they always agree with the map.

- `widget-heatmap-summary`: four figure cards (1/4 each, 1/2 on phones). A level (temperature,
  pressure, humidity, clouds): period mean, maximum and minimum with their date and hour
  (`--color-max` / `--color-min`), mean daily swing. Precipitation: total, max in an hour, days with
  precipitation, the wettest day.
- `widget-heatmap` (x4): days as columns, the 24 hours as rows from midnight down; the colour scale
  under the map with the unit on its handles. Precipitation uses a stepped scale (dry, 0.1–0.5,
  0.5–1, 1–2.5, 2.5–5, 5–10, 10+ mm) with the dry hours in the grid-line tone, because rain is rare
  and skewed and a linear scale would wash it out.
- `widget-diurnal-profile` (x2): the typical day — the mean of each hour with the 10–90th
  percentile band (a transparent base with the spread stacked on it). For precipitation, the chance
  of a wet hour (≥ 0.1 mm) by hour of day instead.
- `widget-value-distribution` (x2): the share of the period's hours in each range of values (equal
  whole-unit bins; precipitation: wet hours only, in the thresholds of the map).

The page reads `currentData` of the query: while another quantity loads, the previous one is never
read as the new one.

### Status and anomalies

- `widget-anomaly-card`: a card with a status dot; an active anomaly is tinted
  `--color-red-background` with a red ring and a haloed dot. z-score bars are `track` meters.
- `widget-flood-risk`: the gauge, the level as a status pill (`overline` on the status tint), the
  factors as `track` meters, the disclaimer on a `--surface-2` plate.
- `widget-anomaly-calendar`, `widget-precip-calendar`: contribution-style grids of 3px-rounded
  squares; empty days are `--surface-2`, intensity is a share of the brand / precipitation hue
  (`color-mix`), so they work in both themes. Tooltips use `+mixins.floatingTooltip`.
- `stale-data-banner`: an orange-tinted card above the content when the station is silent.

## 6. Patterns

- **Segmented control** (`+mixins.segmented` / `segment` / `segmentActive`): a `--surface-2`
  track with the active segment raised on `--surface-1`. Used by the chart period toggle, the
  precipitation year picker and the language switch. Buttons carry `aria-pressed`.
- **Meters** (`+mixins.track`): 6px pill tracks on `--surface-3` with a coloured fill.
- **Status pills**: `overline` text on the status `-background` tint, `--radius-full`.
- **Empty and missing values**: "—" for a missing statistic, `t('no-data')` for a missing reading.
  Never render 0 for "unknown".
- **Loading**: kit `Skeleton` of the final size, so nothing jumps when data arrives.
- **Focus**: `:focus-visible` with `--focus-outline`; hover and focus never share a rule.
- **Icon-only controls** have an `aria-label` (menu, scroll rail arrows, theme switch).

## 7. Charts

- **One component**: `components/echart` (`EChart`). It registers only the chart types and
  components the site uses (`registry.ts`: line, bar, custom, gauge, heatmap; grid, tooltip,
  legend, title, polar, visual map, mark line, mark area, graphic) on `echarts/core`, and loads ECharts after
  hydration in its own chunk (`next/dynamic`, `ssr: false`). The outer box takes the size from
  `style` on the server, so the layout doesn't shift. Before using a new series type or
  component, add it to `registry.ts`. Never import from `echarts` or `echarts-for-react` at
  runtime in a component (types only: `import type`).
- **Linked charts**: pass the same `group` to make charts share the tooltip and zoom
  (`echarts.connect`), as the snowpack charts do.
- **Theme**: charts take `resolvedTheme` from `useTheme()` and their chrome from
  `getChartTokens(theme)` (`tools/echart.ts`), which mirrors the surface and text tokens of
  `styles/theme.css`. Keep both in sync. The background is transparent (the card shows through),
  axis labels are `textSecondary`, split lines `gridLine`, axis lines `border`.
- **Base option**: `getEChartBaseConfig(theme)` (grid, legend with round-rect markers);
  `getChartTooltipStyle(theme)` for every tooltip; the HTML inside tooltips uses the
  `+mixins.chartTooltip` classes (`chartTooltipTitle`, `chartTooltipItem`, `icon`, `label`,
  `value`).
- **Series**: lines 1.5–2px, no symbols; areas are a vertical gradient of the line colour
  (`verticalGradient()`, from ~0.45 alpha to transparent) filled down to the bottom of the axis
  (`areaStyle.origin: 'start'`), so negative values never flip the fill. The y-axis scales to the
  data (`scale: true`) unless the quantity is zero-based (wind, precipitation).

## 8. Adding a component: checklist

1. Is it a primitive? Add it to `simple-react-ui-kit` and release the kit first.
2. Single-use widget → `widgets/<name>/`; anything reused by two widgets or generic →
   `components/<name>/`. Each with `index.ts`, `styles.module.sass` and a test.
3. Surface from `+mixins.card` or `WidgetCard`, text from `typography` roles, sizes from
   `+mixins.columns`, colours from tokens. No hex values, no bare font sizes.
4. Charts through `EChart` with `getChartTokens`.
5. Check light and dark at 1280px and 390px.
6. Describe it in section 5 or 6 of this file.
