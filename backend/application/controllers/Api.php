<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Api extends CI_Controller {

	public function index()
	{
	    echo '1111';
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
                $result->$key = $val;
                continue;
            }

            $result->$key = (object) array(
                'cur' => (float) $val,
                'avg' => $avg->$key
            );
        }

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
}
