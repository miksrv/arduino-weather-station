<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->cli('system/current', 'System::getCurrentWeather'); // php index.php system current
$routes->cli('system/forecast', 'System::getForecastWeather'); // php index.php system forecast
$routes->cli('system/migrate', 'MigrationController::migrateWeatherData'); // php index.php system migrate

$routes->get('current', 'Current::getCurrentWeather');
$routes->options('current', 'Current');

$routes->get('forecast/daily', 'Forecast::getForecastDaily');
$routes->get('forecast/hourly', 'Forecast::getForecastHourly');
$routes->options('forecast/(:alphanum)', 'Forecast');

$routes->get('history', 'History::index');
$routes->options('history', 'History');

$routes->get('charts', 'Charts::index');
$routes->options('charts', 'Charts');
