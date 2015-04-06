<?php

abstract class Upfront_JsonModel extends Upfront_Model {

	protected static $instance;

	protected function __construct ($json=false) {
		$this->_data = $json;
		$this->initialize();
		self::$instance = $this;
	}

	public static function get_instance () {
		return self::$instance;
	}

	public function initialize () {
		$data = $this->to_php();
		$this->_name = !empty($data['name']) ? $data['name'] : false;
	}

	public function to_php () {
		return $this->_data
			? $this->_data
			: array()
		;
	}

	public function to_json () {
		//return json_encode($this->to_php(), true);
		return json_encode($this->to_php());
	}

}