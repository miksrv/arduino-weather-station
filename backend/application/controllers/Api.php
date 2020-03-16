<?php
defined('BASEPATH') OR exit('No direct script access allowed');



class Api extends CI_Controller {

    const latitude  = '51.7727';
    const longitude = '55.0988';
    const offset    = 5;

	public function index()
	{
	    exit();
		//$this->load->view('welcome_message');
	}


	public function get_summary()
    {
        $this->load->model('dashboard');

        $data = $this->dashboard->get_last(10);
        $cur = array_shift($data);
        $avg = $this->_get_average($data);

        $result = (object) array();

        foreach ($cur as $key => $val) {
            if ($key == 'datestamp') {
                $result->$key = strtotime($val);
                continue;
            }

            $result->$key = (object) array(
                'cur' => (float) $val,
                'avg' => $avg->$key
            );
        }

        $this->load->library('moon');
        $moon = $this->moon->calculateMoonTimes(
            date("m"),
            date("d"),
            date("Y"),
            self::latitude,
            self::longitude
        );

        $result->moonrise = (object) array(
            'cur' => timestamp_to_time($moon->moonrise)
        );
        $result->moonset  = (object) array(
            'cur' => timestamp_to_time($moon->moonset)
        );

        $result->sunrise = (object) array(
            'cur' => $this->_get_sun_rise()
        );
        $result->sunset  = (object) array(
            'cur' => $this->_get_sun_set()
        );

        $result->dewpoint = (object) array(
            'cur' => $this->_calc_dewpoint($result->temp1->cur, $result->humd->cur)
        );

        unset($result->wind, $result->battery);

        return $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($result));
    }

    protected function _get_average($data = array())
    {
        if (empty($data) || ! is_array($data))
            return array();

        $tmp = array();

        foreach ($data as $item) {
            if (empty($tmp)) {
                $tmp = $item;
                continue;
            }

            foreach ($tmp as $key => $val) {
                if ($key == 'datestamp')
                    continue;

                $tmp->$key += (float) $item->$key;
            }
        }

        foreach ($tmp as $key => $item) {
            if ( ! is_float($item) || $item == 0)
                continue;

            $tmp->$key = (float) round( $item / count($data) - 1, 2);
        }

        return $tmp;
    }

    /**
     * @return string
     */
    function _get_sun_rise() {
        return date_sunrise(
            time(),
            SUNFUNCS_RET_STRING,
            self::latitude,
            self::longitude,
            90,
            self::offset
        );
    } // function get_sun_rise()


    /**
     * @return string
     */
    function _get_sun_set() {
        return date_sunset(
            time(),
            SUNFUNCS_RET_STRING,
            self::latitude,
            self::longitude,
            90,
            self::offset
        );
    } // function get_sun_set()

    /**
     * Computes and returns the dew-point temperature using the current temperature and humidity values
     *
     * @return float
     */
    function _calc_dewpoint($temp, $humd) {
        if (empty($temp) || empty($humd))
            return NULL;

        return round(((pow(($humd/100), 0.125))*(112+0.9*$temp)+(0.1*$temp)-112),1);
    } // function calc_dewpoint()
}
