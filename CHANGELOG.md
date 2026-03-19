# CHANGELOG

## 3.7.1

### Patch Changes

- Add `WidgetForecastCards` component to the main page: horizontally scrollable daily and hourly forecast card rows with weather icons, temperature, clouds, wind, and precipitation; highlights today and the current hour
- Add reusable `Carousel` UI primitive (`ui/carousel/`) using Embla Carousel with optional auto-scroll and previous/next navigation controls
- Move `WidgetForecastTable` (hourly and daily) from the main page to the `/forecast` page
- Fix language switching: resolve router/i18n race condition by making `useLocalStorage` write synchronously and navigating via constructed URL instead of calling `i18n.changeLanguage`
- Fix `appWithTranslation` not receiving the i18n config, causing locale initialization failures in SSR
- Standardise `serverSideTranslations` calls across all pages to explicitly pass `['common']` namespace
- Add HTTP request timeouts (30 s) to OpenWeatherMap, WeatherAPI, and VisualCrossing API clients
- Add response caching to `Anomaly`, `Heatmap`, `History`, and `Precipitation` controllers with short/long TTL constants and cache-key logic
- Fix `GetForecastWeather` CLI command: use `->format('Y-m-d H:i:s')` for datetime and simplify insert/update arrays
- Replace manual `className` string concatenation with `cn()` from `simple-react-ui-kit` across `AppBar`, `LanguageSwitcher`, `WidgetAnomalyCalendar`, `WidgetAnomalyCard`, `WidgetFloodRisk`, and `WidgetParameterZScore`
- Remove unused Sass classes (`.noAnimation`, `.menubar`, `.historyTable`, `.chartLabel`, `.cardTempLow`) and unused translation key `max-daily-rain`
- Add unit tests for `WidgetForecastCards`, `Carousel`, `CarouselButtons`, `usePrevNextButtons`, `Heatmap` controller caching, and `History` controller caching

## 3.7.0

### Minor Changes

- Add Precipitation Calendar feature: full-stack implementation with PHP controller, two-level aggregation model, RTK Query endpoint, calendar grid, stat cards, streak cards, and monthly bar chart
- Add CLI weather commands (`system:getCurrentWeather`, `system:getForecastWeather`, `system:sendNarodmonData`); remove `System.php` controller
- Add skeleton loading states to anomaly page widgets
- Add active anomaly cards to homepage before forecast table, with full-width layout
- Localize month labels in `WidgetPrecipCalendar`, `WidgetAnomalyCalendar`, and `WidgetPrecipChart` using `i18n.language`
- Add precipitation calendar tooltip matching anomaly calendar pattern
- Fix daily precipitation totals computed from hourly averages to eliminate multi-source inflation
- Fix dry streak calculation by expanding sparse precipitation data into a full calendar before streak detection
- Add `forecast_time` column to forecast inserts; remove redundant type cast
- Rename generic `Props` interfaces to component-specific names across widgets
- Add widget unit tests for maximum frontend code coverage

## 3.6.0

### Minor Changes

- Implemented Meteorological Anomaly Feature, including API endpoint and UI components.
- Add PHPUnit test suite and API Checks CI workflow
- Fix PHPUnit CI failure and integrate PHP coverage into SonarCloud
- Fix PHPUnit warning: no code coverage driver in api-checks workflow
- Updated PHP Packages
- Add UI unit tests for maximum frontend code coverage
- Fixed UI Prettier issues
- Add WidgetAnomalyCalendar component and tests
- Add anomaly API, types and menu badge
- Add anomaly detection CLI, controller, migration
- Add anomaly detection, snowpack & logging
- Add unit tests for anomaly detection and models
- Add feature requirements and agent-memory docs
- Add Snowpack chart widget and tests
- Add WidgetParameterZScore component and tests
- Add flood-risk widget, utils, styles & tests
- Add WidgetAnomalyHistory component and tests
- Add WidgetAnomalyCard, utils, styles, tests
- Refactor widgets; add FloodRisk and rename files
- Add Anomaly Monitor docs and update README
- Extract anomaly i18n helper and memoize chart
- Add widget unit tests and testing notes
- I18n sync, AppBar aria i18n and test fixes

## 3.5.2

### Path Changes

- Added a shared `getEChartBaseConfig` function and refactored chart configuration for improved maintainability.
- Updated UI unit tests and introduced new summary images for 3D models.
- Created a README for the models section and integrated project documentation with Claude.AI.
- Fixed multiple bugs, including locale redirects, duplicate year entries, unmounted component updates, React ref dependencies, call-stack overflow in Heatmap, and canonical URL issues.
- Improved value filtering and min/max calculations in weather utilities, with additional unit tests for edge cases.
- Enhanced i18n support by adding missing keys and replacing hardcoded strings with translations.
- Optimized React performance by memoizing arrays and configs, moving `dayjs.extend` calls to module level, and stabilizing dependency arrays.
- Added and expanded unit test coverage for weather utilities and date formatting functions.
- Introduced a loading progress indicator and sessionStorage caching for the climate page, improving user experience during sequential data fetches.
- Cleaned up ROADMAP tracking entries and removed duplicate or obsolete code.

## 3.5.1

### Patch Changes

-   Updated UI Dependencies
-   Replaced DatePicker UI component from UI Kit
-   Migrate from node `20` to `22`
-   Improved WidgetSensor - added new prop `size`
-   Added new Sensor - `visibility`
-   Updated Sensors page - added link for the Sensor Widget

## 3.5.0

### Minor Changes
-   Added new UI Page - `climate`
-   Updated UI Dependencies
-   Implemented some UI Unit tests
-   Fixed ESLinter and Prettier
-   Fixed collect coverage method for UI Jest
-   Update sonar-project.properties
-   Upgraded NextJS from `15` to `16`
-   Updated UI locales

## 3.4.11

### Path Changes
-   Updated UI Dependencies

## 3.4.10

### Path Changes
-   Updated UI Libraries
-   Fixed `thunderstorm` weather icons
-   Improved UI `Popout` component
-   Created `PeriodSelector` UI component

## 3.4.9

### Path Changes
-   Upgraded yarn version from `4.8.1` to `4.9.1`
-   Updated ESLint and Prettier config
-   Removed unused UI functions and types
-   Implemented UI useLocalStorage hook
-   Updated UI `light` and `dark` themes
-   Updated UI libraries and SimpleUIKit version
-   Refactoring UI code-style, fixed code by Prettier and ESLint
-   Refactoring UI API, added new ENV variable -> `NEXT_PUBLIC_STORAGE_KEY`
-   Updated README.md

## 3.4.8

### Path Changes
-   Fixed Calendar UI Component type
-   Updated UI Libraries
-   Updated README.md
-   Updated yarn version from `4.5.0` to `4.8.1`
-   Improved UI themes and website manifest

## 3.4.7

### Path Changes

-   Implemented getForecastWeatherData method for VisualCrossingAPILibrary
-   Fixed CI/CD API Deploy
-   Updated UI Libraries

## 3.4.6

### Path Changes

-   Fixed API NarodMonLibrary
-   Updated UI Libraries
-   Improved CI/CD API Deploy GitHub Action
-   Fixed API Kint Config
-   Changed Arduino firmware send data method
-   Implemented API Sensors Controller
-   Upgraded and added new one API Route
-   Add visualCrossingApi for API get Weather tasks
-   Added PHPDoc for WeatherData Entity
-   Updated Readme, added new params for Server .env

## 3.4.5

### Path Changes

-   Updated UI Libraries
-   Upgraded API Libraries
-   Removed unused API dependencies
-   Fixed API Locale
-   Implemented new API Library for narodmon.ru
-   Improved API RawWeatherDataModel (new function `getCurrentActualWeatherData`)
-   Added new API Endpoint: `CLI system/narodmon`
-   Written documentation (PHPDoc) for the API Classes
-   Added new parameters (for NarodMonLibrary) to the .env file

## 3.4.4

### Path Changes

-   Updated UI Libraries
-   Redesigned footer, added links

## 3.4.3

### Path Changes

-   Implemented Not Found Page

## 3.4.2

### Path Changes

-   Added Arduino code check
-   Fixed Arduino code for testing GYML8511 UV sensor
-   README documentation has been improved
-   Added Arduino BMP085 and PCF8574 libraries to the repository

## 3.4.1

### Path Changes

-   Fixed Jest config
-   Fixed types for UI setItem function
-   Added some UI Unit tests
-   Added descriptions (TSDoc) for UI helpers functions

## 3.4.0

### Minor Changes

-   Implemented new Meteogram Widget
-   Created new Forecast page
-   Refactoring WeatherIcon, added getWeatherIconUrl function
-   Refactoring WidgetChart and WidgetForecastTable
-   Columns for WidgetForecastTable are moved to the component, a set of columns is created
-   Created getSampledData UI function
-   Updated README, CHANGELOG and fixed styles
-   Updated UI libraries

## 3.3.4

### Path Changes

-   Updated UI libraries
-   Improved CSS themes
-   Changed sensors min and max values to last 12 hours
-   Optimized UI filterRecentData function

## 3.3.3

### Path Changes

-   Updated UI libraries
-   Fixed height of base component
-   Added memoization data for UI WeatherChart
-   Changed UI Tests names
-   Added UI function for interpolation charts data (invertData)
-   Improved SonarCloud configuration file
-   Fixed issues in the UI WidgetSummary and WindDirectionIcon components
-   Improved and fixed client config files
-   Added UI Unit tests for Footer and WindDirectionIcon components
-   Migrate to new version of Next.js (15)
-   Updated GitHub CI/CD Actions
-   Fixed code-style

## 3.3.2

### Path Changes

-   Updated UI libraries
-   Updated API dependencies
-   Added new API Endpoint: 'GET /current/text'
-   Added new API Method: getCurrentTextWeather

## 3.3.1

### Path Changes

-   Added animated weather icons
-   Created SECURITY.md
-   Updated UI libraries
-   Removed unused UI Container component
-   Removed unused UI Badge Component
-   Updated locales
-   Improved UI styles and themes
-   Improved UI components styles
-   Removed UI convertWindDirection function
-   Changed main screen image
-   Upgrade index page
-   Updated UI WeatherIcon, Chart, WidgetSummary and WindDirection
-   Updated README.md

## 3.3.0

### Minor Changes

-   Implemented new API Endpoint - Heatmap
-   Connect UI to new API endpoint
-   Implemented new UI Widget Heatmap Component
-   Added new UI page - Heatmap
-   Improved UI locales
-   Optimized and improved UI styles
-   Improved UI tools and utilities functions
-   Improved WidgetChart UI Component
-   Optimized UI pages
-   Improved README, fixed ESLint config
-   Improved Widgets, AppBar and Layouts components
-   Removed unused UI components and install Simple React UI Kit library
-   Added new UI ComparisonIcon Component
-   Added CI/CD release action
