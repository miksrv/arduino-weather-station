<?php

namespace App\Libraries;

// https://aviationweather.gov/data/api/ (NOAA Aviation Weather Center — free, no API key)
use App\Models\RawWeatherDataModel;
use CodeIgniter\I18n\Time;

/**
 * METAR provider: the routine airport observation report of a nearby ICAO
 * station (`app.metar.station`, e.g. UWOO for Orenburg), fetched from the
 * NOAA Aviation Weather Center.
 *
 * Unlike the other providers this is an observation, not a model output:
 * cloud cover and present weather (rain, snow, thunderstorm, fog) are what
 * the airport actually sees. Airports report every 30 minutes, plus SPECI
 * reports on sudden changes.
 *
 * METAR has no forecast (TAF is out of scope) and no precipitation amount:
 * only its intensity, which is mapped to a nominal hourly rate
 * ({@see self::PRECIPITATION_RATES}), and 0 when the report shows no precipitation.
 * CAVOK / NSC mean "no significant cloud below 1500 m", so high cloud may be
 * present while the cover is reported as 0.
 */
class MetarAPILibrary extends AbstractWeatherAPILibrary
{
    private const API_URL = 'https://aviationweather.gov/api/data/metar';

    /** How many hours of reports are requested; the newest one is used. */
    private const REPORT_HOURS = 2;

    private const KNOTS_TO_MS = 0.514444;

    private const MILES_TO_METERS = 1609.344;

    /** METAR visibility tops out at 9999 (10 km or more). */
    private const MAX_VISIBILITY_METERS = 10000;

    /**
     * Cloud cover, %: middle of the okta range of each METAR cover code.
     * @var array<string, int>
     */
    private const CLOUD_COVER = [
        'SKC'   => 0,
        'CLR'   => 0,
        'NSC'   => 0,
        'NCD'   => 0,
        'CAVOK' => 0,
        'FEW'   => 19,  // 1–2 oktas
        'SCT'   => 44,  // 3–4 oktas
        'BKN'   => 75,  // 5–7 oktas
        'OVC'   => 100, // 8 oktas
        'VV'    => 100, // sky obscured
    ];

    /**
     * Cover code → OpenWeatherMap condition id, when the report has no weather phenomena.
     * @var array<string, int>
     */
    private const CLOUD_CONDITIONS = [
        'SKC'   => 800,
        'CLR'   => 800,
        'NSC'   => 800,
        'NCD'   => 800,
        'CAVOK' => 800,
        'FEW'   => 801,
        'SCT'   => 802,
        'BKN'   => 803,
        'OVC'   => 804,
        'VV'    => 804,
    ];

    /**
     * Nominal precipitation rate, mm/h, per kind and intensity (light, moderate, heavy).
     * @var array<string, float[]>
     */
    private const PRECIPITATION_RATES = [
        'drizzle' => [0.1, 0.3, 0.6],
        'rain'    => [0.5, 2.0, 6.0],
        'frozen'  => [0.3, 1.0, 3.0], // water equivalent
    ];

    /** @var array<string, string> METAR precipitation code → kind */
    private const PRECIPITATION_KINDS = [
        'DZ' => 'drizzle',
        'RA' => 'rain',
        'UP' => 'rain',
        'SN' => 'frozen',
        'SG' => 'frozen',
        'IC' => 'frozen',
        'PL' => 'frozen',
        'GR' => 'frozen',
        'GS' => 'frozen',
    ];

    /** @var array<string, int> Obscuration / other phenomena → OpenWeatherMap condition id */
    private const OBSCURATION_CONDITIONS = [
        'FG' => 741,
        'BR' => 701,
        'HZ' => 721,
        'FU' => 711,
        'DU' => 761,
        'SA' => 751,
        'VA' => 762,
        'SQ' => 771,
        'FC' => 781,
        'SS' => 731,
        'DS' => 731,
        'PO' => 731,
    ];

    /**
     * Receive the latest METAR report mapped to the internal schema.
     * @return array|false
     */
    public function getWeatherData(): array|false
    {
        $station = trim((string) getenv('app.metar.station'));

        if ($station === '') {
            return false;
        }

        $response = $this->httpGet(self::API_URL, [
            'ids'    => strtoupper($station),
            'format' => 'json',
            'hours'  => self::REPORT_HOURS,
        ]);

        if ($response === false || $response === []) {
            return false;
        }

        $latest = null;

        foreach ($response as $report) {
            if (is_array($report) && isset($report['obsTime']) && ($latest === null || $report['obsTime'] > $latest['obsTime'])) {
                $latest = $report;
            }
        }

        return $latest === null ? false : $this->mapWeatherData($latest);
    }

    /**
     * METAR carries no forecast.
     * @return false
     */
    public function getForecastWeatherData(): array|false
    {
        return false;
    }

    /**
     * Maps one decoded METAR report (aviationweather.gov JSON) to the internal schema.
     * @param array $data
     * @return array
     */
    protected function mapWeatherData(array $data): array
    {
        $temperature = isset($data['temp']) && is_numeric($data['temp']) ? (float) $data['temp'] : null;
        $dewPoint    = isset($data['dewp']) && is_numeric($data['dewp']) ? (float) $data['dewp'] : null;
        $cover       = self::cloudCoverCode($data);
        $weather     = self::parseWeather((string) ($data['wxString'] ?? ''));

        return [
            'date'          => Time::createFromTimestamp((int) $data['obsTime'], 'UTC'),
            'source'        => RawWeatherDataModel::SOURCE_METAR,
            'temperature'   => $temperature,
            'feels_like'    => null,
            'pressure'      => isset($data['altim']) && is_numeric($data['altim']) ? (int) round((float) $data['altim']) : null,
            'humidity'      => $temperature !== null && $dewPoint !== null ? self::relativeHumidity($temperature, $dewPoint) : null,
            'dew_point'     => $dewPoint,
            'wind_speed'    => isset($data['wspd']) && is_numeric($data['wspd']) ? round((float) $data['wspd'] * self::KNOTS_TO_MS, 2) : null,
            'wind_deg'      => isset($data['wdir']) && is_numeric($data['wdir']) ? (int) $data['wdir'] : null, // 'VRB' = variable
            'wind_gust'     => isset($data['wgst']) && is_numeric($data['wgst']) ? round((float) $data['wgst'] * self::KNOTS_TO_MS, 2) : null,
            'clouds'        => $cover !== null ? self::CLOUD_COVER[$cover] : null,
            'visibility'    => self::visibilityMeters($data['visib'] ?? null),
            'precipitation' => $weather['precipitation'],
            'uv_index'      => null,
            'sol_radiation' => null,
            'sol_energy'    => null,
            'weather_id'    => $weather['weather_id'] ?? ($cover !== null ? self::CLOUD_CONDITIONS[$cover] : null),
        ];
    }

    /**
     * The overall cover code: the report's `cover`, else the densest layer of `clouds`.
     * @param array $data
     * @return string|null A key of {@see self::CLOUD_COVER}, or null when unknown.
     */
    public static function cloudCoverCode(array $data): ?string
    {
        $cover = strtoupper((string) ($data['cover'] ?? ''));

        if (isset(self::CLOUD_COVER[$cover])) {
            return $cover;
        }

        $densest = null;

        foreach ($data['clouds'] ?? [] as $layer) {
            $code = strtoupper((string) ($layer['cover'] ?? ''));

            if (isset(self::CLOUD_COVER[$code]) && ($densest === null || self::CLOUD_COVER[$code] > self::CLOUD_COVER[$densest])) {
                $densest = $code;
            }
        }

        return $densest;
    }

    /**
     * Decodes the METAR present-weather string (e.g. "-RA BR", "+TSRA", "VCSH").
     * Phenomena in the vicinity (VC…) are not at the station and are ignored.
     *
     * @param string $wxString
     * @return array{precipitation: float, weather_id: int|null} Nominal precipitation rate, mm/h
     *         (0 when there is none), and the OpenWeatherMap condition id of the weather (null when there is none).
     */
    public static function parseWeather(string $wxString): array
    {
        $precipitation = 0.0;
        $weatherId     = null;
        $obscuration   = null;

        foreach (preg_split('/\s+/', strtoupper(trim($wxString))) ?: [] as $token) {
            if ($token === '' || str_starts_with($token, 'VC') || str_starts_with($token, 'RE')) {
                continue;
            }

            $intensity = match ($token[0]) {
                '-'     => 0,
                '+'     => 2,
                default => 1,
            };
            $codes = str_split(ltrim($token, '+-'), 2);
            $kinds = [];

            foreach ($codes as $code) {
                if (isset(self::PRECIPITATION_KINDS[$code])) {
                    $kinds[$code] = self::PRECIPITATION_KINDS[$code];
                    $precipitation = max($precipitation, self::PRECIPITATION_RATES[self::PRECIPITATION_KINDS[$code]][$intensity]);
                } elseif ($obscuration === null && isset(self::OBSCURATION_CONDITIONS[$code])) {
                    $obscuration = self::OBSCURATION_CONDITIONS[$code];
                }
            }

            $weatherId ??= self::_precipitationCondition($codes, $kinds, $intensity);
        }

        return [
            'precipitation' => $precipitation,
            'weather_id'    => $weatherId ?? $obscuration,
        ];
    }

    /**
     * Relative humidity, %, from temperature and dew point (Magnus formula).
     * @param float $temperature °C
     * @param float $dewPoint    °C
     * @return float
     */
    public static function relativeHumidity(float $temperature, float $dewPoint): float
    {
        $magnus = static fn (float $t): float => exp(17.625 * $t / (243.04 + $t));

        return round(min(100.0, 100 * $magnus($dewPoint) / $magnus($temperature)), 1);
    }

    /**
     * Visibility, m. The API gives statute miles, "6+" meaning 6 miles or more.
     * @param mixed $visibility
     * @return int|null
     */
    public static function visibilityMeters(mixed $visibility): ?int
    {
        if (is_string($visibility) && str_ends_with($visibility, '+')) {
            return self::MAX_VISIBILITY_METERS;
        }

        if (!is_numeric($visibility)) {
            return null;
        }

        return min(self::MAX_VISIBILITY_METERS, (int) round((float) $visibility * self::MILES_TO_METERS));
    }

    /**
     * OpenWeatherMap condition id of one weather group with thunderstorm or precipitation.
     * @param string[]              $codes     Two-letter codes of the group, e.g. ['SH', 'RA'].
     * @param array<string, string> $kinds     Precipitation code → kind of the group.
     * @param int                   $intensity 0 light, 1 moderate, 2 heavy.
     * @return int|null Null when the group has neither.
     */
    private static function _precipitationCondition(array $codes, array $kinds, int $intensity): ?int
    {
        if (in_array('TS', $codes, true)) {
            return $kinds === [] ? ($intensity === 2 ? 212 : 211) : [200, 201, 202][$intensity];
        }

        if ($kinds === []) {
            return null;
        }

        $kindSet = array_unique(array_values($kinds));

        if (in_array('FZ', $codes, true)) {
            return 511;
        }

        if (isset($kinds['RA']) && in_array('frozen', $kindSet, true)) {
            return $intensity === 0 ? 615 : 616;
        }

        if (isset($kinds['PL']) || isset($kinds['GR']) || isset($kinds['GS'])) {
            return 611;
        }

        $shower = in_array('SH', $codes, true);

        return match (true) {
            in_array('frozen', $kindSet, true) => $shower ? [620, 621, 622][$intensity] : [600, 601, 602][$intensity],
            in_array('rain', $kindSet, true)   => $shower ? [520, 521, 522][$intensity] : [500, 501, 502][$intensity],
            default                            => [300, 301, 302][$intensity],
        };
    }
}
