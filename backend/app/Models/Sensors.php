<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

class Sensors extends Model
{
    protected $table = '';

    protected string $key_id = 'item_id';
    protected string $key_time = 'item_utc_date';

    protected $db;

    function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);

        $this->table = getenv('database.table.weather_sensors');
    }

    protected function _get_one(string $order)
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, $order)
            ->limit(1)
            ->get()
            ->getRow();
    }

    function get_first()
    {
        return $this->_get_one('ASC');
    }

    function get_last()
    {
        return $this->_get_one('DESC');
    }

    function get_by_hour($year, $month, $day, $hour)
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->getWhere([
                "YEAR({$this->key_time})"  => $year,
                "MONTH({$this->key_time})" => $month,
                "DAY({$this->key_time})"   => $day,
                "HOUR({$this->key_time})"  => $hour,
            ])
            ->getResult();
    }

    function get_last_day()
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->where($this->key_time . ' > DATE_SUB(NOW(), INTERVAL 24 HOUR)')
            ->get()
            ->getResult();
    }

    function get_period(object $period, array $sensors)
    {
        $available = ['temperature', 'humidity', 'pressure', 'illumination', 'uvindex', 'wind_speed', 'wind_deg'];

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

    function get_week_count()
    {
        return $this->db
            ->table($this->table)
            ->selectCount($this->key_id)
            ->where($this->key_time . ' > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)')
            ->get()
            ->getRow();
    }

    // var_dump($this->db->getLastQuery());

    function add(array $data)
    {
        $meta = [
            $this->key_id   => uniqid(),
            $this->key_time => gmdate('Y-m-d H:i:s')
        ];

        return $this->db->table($this->table)->insert(array_merge($meta, $data));
    }
}