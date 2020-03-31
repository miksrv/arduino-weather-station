<?php namespace App\Controllers;

class Set extends BaseController
{

    /**
     * Device token
     * @var string
     */
    private $_token = 'A7FE9540D1F5';

    /**
     * The array contains input data obtained via GET or POST
     * @var array
     */
    protected $source;

    /**
     * Device data
     * @var
     */
    protected $rawData;

    /**
     * Device request source string
     * @var
     */
    protected $rawInput;

    /**
     * Receives data from a weather station, checks a token, enters data into a storage
     */
    public function data()
    {
        $_dataTable = getenv('database.table.data');

        $this->_select_source();
        $this->_check_token();
        $this->_fetch_data();

        $db = \Config\Database::connect();
        $db->table($_dataTable)->insert([
            'item_id' => uniqid(),
            'item_token' => $this->_token,
            'item_client_ip' => $this->request->getIPAddress(),
            'item_raw_data' => json_encode($this->rawData)
        ]);

        $response = ['state' => TRUE, 'data' => 'Data accepted'];

        log_message('notice', '[' .  __METHOD__ . '] Data inserted: ' . $this->rawInput);

        $this->_response($response, 200);
    }

    /**
     * Fills device data into arrays
     */
    protected function _fetch_data()
    {
        $this->rawInput = '?';
        $this->rawData  = [];

        foreach ($this->source as $key => $val)
        {
            $this->rawInput     .= $key . '=' . $val . (end($this->source) != $val ? '&' : NULL);
            $this->rawData[$key] = (float) $val;
        }

        unset($this->rawData['id']);
    }

    /**
     * The method defines a global variable as a data source
     * @return mixed
     */
    protected function _select_source() {
        if ( ! empty($this->request->getPost())) {
            return $this->source = (object) $this->request->getPost();
        } else if ( ! empty($this->request->getGet())) {
            return $this->source = (object) $this->request->getGet();
        }

        $response = array('state' => false, 'error' => 'Empty data input array');

        log_message('error', '[' .  __METHOD__ . '] {error}', $response);

        $this->_response($response);
    }

    /**
     * Device ID Verification
     */
    protected function _check_token()
    {
        if (isset($this->source->id) && $this->source->id === $this->_token)
        {
            return ;
        }

        $response = ['state' => FALSE, 'error' => 'The device identifier is missing or incorrect'];
        $log_data = ['m' => __METHOD__, 'e' => $response['error'], 'd' => json_encode($this->source)];

        log_message('error', '[{m}] {e} {d}', $log_data);

        $this->_response($response);
    }

    /**
     * Generates an answer for the client
     * @param $data
     */
    protected function _response($data, $code = 400)
    {
        $this->response
            ->setStatusCode($code)
            ->setJSON($data)
            ->send();

        exit();
    }

}
