<?php namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Validation\ValidationInterface;

/**
 * Abstract class for the general data model of interaction with the database
 */
abstract class ADataModel extends Model
{
    // The name of the current database table
    protected $table = '';

    protected string $key_id = 'item_id';
    protected string $key_time = 'item_utc_date';
    protected array $key_items = [];

    protected $db;

    function __construct(ConnectionInterface &$db = null, ValidationInterface $validation = null)
    {
        parent::__construct($db, $validation);
    }

    /**
     * Sets the name of the current database table
     * @param string $name
     */
    function set_table(string $name)
    {
        $this->table = $name;
    }

    /**
     * Set data keys to fetch (SELECT)
     * @param array $keys
     */
    function set_key_items(array $keys)
    {
        $this->key_items = $keys;
    }

    /**
     * Get the first entry
     * @return mixed
     */
    function get_first_row()
    {
        return $this->_get_one_row('ASC');
    }

    /**
     * Get the latest entry
     * @return mixed
     */
    function get_last_row()
    {
        return $this->_get_one_row('DESC');
    }

    /**
     * Get a list of all records for the entire hour for a specific date
     * @param string $year
     * @param string $month
     * @param string $day
     * @param string $hour
     * @return mixed
     */
    function get_array_by_hour(string $year, string $month, string $day, string $hour)
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

    /**
     * Get a list of all records for the last day (24 hours)
     * @return mixed
     */
    function get_array_by_last_day()
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, 'DESC')
            ->where($this->key_time . ' > DATE_SUB(NOW(), INTERVAL 24 HOUR)')
            ->get()
            ->getResult();
    }

    /**
     * Get an array of data for a period, an array of keys can be set to fetch (set_key_items)
     * @param string $start
     * @param string $stop
     * @return mixed
     */
    function get_period(string $start, string $stop)
    {
        if (empty($this->key_items)) {
            return [];
        }

        return $this->db->table($this->table)
            ->select('item_utc_date,' . implode(',', $this->key_items))
            ->orderBy($this->key_time, 'DESC')
            ->where("{$this->key_time} BETWEEN '{$start}' AND '{$stop}'")
            ->get()
            ->getResult();
    }

    /**
     * Get the number of keys in the database per week
     * @return mixed
     */
    function get_week_count()
    {
        return $this->db
            ->table($this->table)
            ->selectCount($this->key_id)
            ->where($this->key_time . ' > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)')
            ->get()
            ->getRow();
    }

    /**
     * Add array of data to database
     * @param array $data
     * @param string $time [optional]
     * @return mixed
     */
    function add(array $data, string $time = '')
    {
        $meta = [
            $this->key_id   => uniqid(),
            $this->key_time => $time ?: gmdate('Y-m-d H:i:s')
        ];

        return $this->db->table($this->table)->insert(array_merge($meta, $data));
    }


    /**
     * Returns one table record (object) depending on the sort
     * @param string $order
     * @return mixed
     */
    protected function _get_one_row(string $order)
    {
        return $this->db
            ->table($this->table)
            ->orderBy($this->key_time, $order)
            ->limit(1)
            ->get()
            ->getRow();
    }
}