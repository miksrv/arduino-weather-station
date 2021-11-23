<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

class Hourly extends Model
{
    protected $table = '';

    protected string $key_id   = 'item_id';
    protected string $key_time = 'item_utc_date';

    protected $db;

    function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);

        $this->table = getenv('database.table.weather_hourly');
    }

    function get_last()
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->limit(1)
            ->get()
            ->getRow();
    }

    function get_period(object $period, array $sensors)
    {
        $available = ['temperature', 'humidity', 'pressure', 'illumination', 'uvindex', 'wind_speed', 'wind_deg', 'wind_gust', 'clouds', 'precipitation'];

        foreach ($sensors as $key => $item)
        {
            if ( ! in_array($item, $available))
                unset($sensors[$key]);
        }

        if (empty($sensors))
            return [];

        return $this->db
            ->table($this->table)
            ->select('item_utc_date,' . implode(',', $sensors))
            ->orderBy($this->key_time, 'DESC')
            ->where("{$this->key_time} BETWEEN '{$period->start}' AND '{$period->end}'")
            ->get()
            ->getResult();
    }

    function add(array $data, string $time)
    {
        $meta = [
            $this->key_id   => uniqid(),
            $this->key_time => $time
        ];

        return $this->db->table($this->table)->insert(array_merge($meta, $data));
    }
}