# CHANGELOG

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
