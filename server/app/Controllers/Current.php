<?php

namespace App\Controllers;

use App\Entities\WeatherData;
use App\Libraries\EventFeedBuilder;
use App\Libraries\ObservatorySafety;
use App\Models\ForecastWeatherDataModel;
use App\Models\RawWeatherDataModel;
use CodeIgniter\Entity\Entity;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Exception;
use Throwable;

/**
 * Class Current
 *
 * Handles retrieval of current weather data in JSON and plain-text formats.
 *
 * @package App\Controllers
 */
class Current extends ResourceController
{
    protected $format = 'json';

    /**
     * Extra plain-text keys duplicating API fields under the names the INDI
     * Weather Watcher driver reads by default (precip / wind / gust).
     */
    private const WATCHER_KEY_ALIASES = [
        'precipitation' => 'precip',
        'wind_speed'    => 'wind',
        'wind_gust'     => 'gust',
    ];

    protected RawWeatherDataModel $weatherDataModel;

    protected ForecastWeatherDataModel $forecastModel;

    /**
     * Initialises the raw weather data and forecast models.
     */
    public function __construct()
    {
        $this->weatherDataModel = new RawWeatherDataModel();
        $this->forecastModel    = new ForecastWeatherDataModel();
    }

    /**
     * Returns the latest weather observation as a JSON object.
     *
     * Adds `lastUpdated` (ISO 8601 timestamp of the most recent raw_weather_data
     * row) and `isStale` (true when there is no reading, or the most recent one
     * is older than {@see EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES}) so the
     * frontend can flag outdated data instead of silently showing it as current.
     *
     * @return ResponseInterface
     */
    public function getCurrentWeather(): ResponseInterface
    {
        $weatherData = $this->_getWeatherData();

        if ($weatherData instanceof ResponseInterface) {
            return $weatherData;
        }

        $lastUpdate = $weatherData['date'] ?? null;

        $weatherData['lastUpdated'] = $this->_formatLastUpdated($lastUpdate);
        $weatherData['isStale']     = $this->_isDataStale($lastUpdate);

        return $this->respond(new WeatherData($weatherData));
    }

    /**
     * Returns the latest weather observation formatted as plain text, with
     * a precipitation forecast flag appended.
     *
     * This feed drives the observatory's INDI Weather Watcher, where a false
     * alarm closes the roof. So precipitation, clouds, wind, gust and the forecast flag
     * are the confirmed values of {@see ObservatorySafety}: one source or one
     * spike can not make them unsafe. The response is never cached.
     *
     * @return ResponseInterface
     */
    public function getCurrentTextWeather(): ResponseInterface
    {
        $weatherData = $this->_getWeatherData();

        if ($weatherData instanceof ResponseInterface) {
            return $weatherData;
        }

        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

        try {
            $since        = new DateTime('-' . ObservatorySafety::REPORT_WINDOW_MINUTES . ' minutes', new DateTimeZone('UTC'));
            $rows         = array_map(
                static fn ($row): array => $row instanceof Entity ? $row->toRawArray() : (array) $row,
                $this->weatherDataModel->getRowsSince($since)
            );
            $forecastRows = $this->forecastModel->getSourceRowsAhead(ObservatorySafety::FORECAST_LOOKAHEAD_HOURS + 1, $now);

            $weatherData['precipitation'] = round(ObservatorySafety::precipitation($rows, $now), 2);
            $weatherData['clouds']        = round(ObservatorySafety::clouds($rows, $now), 2);
            $weatherData['wind_speed']    = round(ObservatorySafety::windSpeed($rows, $now), 2);
            $weatherData['wind_gust']     = round(ObservatorySafety::windGust($rows, $now), 2);
            $forecast                     = ObservatorySafety::forecastFlag($forecastRows, $now);
        } catch (Throwable $e) {
            log_message('error', 'Current::getCurrentTextWeather - failed to get safety data: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving current weather data.');
        }

        $formattedResponse = $this->_formatWeatherDataToText($weatherData, $forecast);

        // No caching anywhere: the observatory must always see the latest values
        return $this->response
            ->setBody($formattedResponse)
            ->setContentType('text/plain')
            ->setHeader('Cache-Control', 'no-store, max-age=0')
            ->setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Formats a weather data array into a key=value plain-text string.
     *
     * Empty values are left out: the Weather Watcher parser reads the line
     * after a bare `key=` as that key's value, swallowing the next key.
     *
     * @param array    $data     Associative weather data array.
     * @param int|null $forecast Precipitation forecast flag (1 = clear, -1 = rain, null = omit).
     * @return string
     */
    private function _formatWeatherDataToText(array $data, ?int $forecast = null): string
    {
        $formattedDate = (new DateTime($data['date']))->format('Y/m/d H:i:s');
        $formattedData = "dataGMTTime={$formattedDate}" . PHP_EOL;

        foreach ($data as $key => $item) {
            if ($key === 'date' || $item === null || $item === '') {
                continue;
            }

            $formattedData .= "{$key}={$item}" . PHP_EOL;
        }

        foreach (self::WATCHER_KEY_ALIASES as $key => $alias) {
            if (isset($data[$key]) && $data[$key] !== '') {
                $formattedData .= "{$alias}={$data[$key]}" . PHP_EOL;
            }
        }

        if ($forecast !== null) {
            $formattedData .= "forecast={$forecast}" . PHP_EOL;
        }

        return $formattedData;
    }

    /**
     * Fetches the current weather data row from the database.
     *
     * Catches {@see Throwable} (not just {@see Exception}) because a fully
     * empty or stale-data window can otherwise surface a PHP {@see \TypeError}
     * (e.g. from array_merge() receiving a null argument), which is not an
     * Exception subclass and would previously escape as an unhandled 500.
     *
     * @return array|ResponseInterface Array on success; error response on failure.
     */
    private function _getWeatherData(): array|ResponseInterface
    {
        try {
            return $this->weatherDataModel->getCurrentActualWeatherData();
        } catch (Throwable $e) {
            log_message('error', 'Current::_getWeatherData - failed to get current weather data: ' . $e->getMessage());
            return $this->failServerError('An error occurred while retrieving current weather data.');
        }
    }

    /**
     * Formats the most recent observation timestamp as an ISO 8601 string.
     *
     * @param mixed $lastUpdate Most recent raw_weather_data date value (Time|DateTimeInterface|string|null).
     * @return string|null ISO 8601 timestamp, or null when there is no data at all.
     */
    private function _formatLastUpdated(mixed $lastUpdate): ?string
    {
        $dateTime = $this->_toDateTime($lastUpdate);

        return $dateTime?->format(DateTime::ATOM);
    }

    /**
     * Determines whether the most recent observation is missing or older than
     * the shared system-wide freshness threshold.
     *
     * @param mixed $lastUpdate Most recent raw_weather_data date value (Time|DateTimeInterface|string|null).
     * @return bool True when there is no reading, or it is older than the freshness threshold.
     */
    private function _isDataStale(mixed $lastUpdate): bool
    {
        $dateTime = $this->_toDateTime($lastUpdate);

        if ($dateTime === null) {
            return true;
        }

        $now         = new DateTime('now', new DateTimeZone(app_timezone()));
        $diffMinutes = ($now->getTimestamp() - $dateTime->getTimestamp()) / 60;

        return $diffMinutes > EventFeedBuilder::SYSTEM_FRESHNESS_MINUTES;
    }

    /**
     * Normalises a mixed date value into a DateTimeInterface instance.
     *
     * @param mixed $value Date value (Time|DateTimeInterface|string|null).
     * @return DateTimeInterface|null Null when the value is empty.
     */
    private function _toDateTime(mixed $value): ?DateTimeInterface
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return $value;
        }

        return new DateTime((string) $value, new DateTimeZone(app_timezone()));
    }
}
