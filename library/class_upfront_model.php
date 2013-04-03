<?php


abstract class Upfront_Model {

	const STORAGE_KEY = 'upfront';

	protected $_name;
	protected $_data;
	
	abstract public function initialize ();
	abstract public function save ();
	abstract public function delete ();

	protected function _name_to_id () {
		$name = preg_replace('/[^-_a-z0-9]/', '-', strtolower($this->_name));
		return $name;
	}

	public function get_name () {
		return $this->_name;
	}

	public function get_id () {
		return self::STORAGE_KEY . '-' . $this->_name_to_id();
	}

	public function is_empty () {
		return empty($this->_data);
	}
}



abstract class Upfront_JsonModel extends Upfront_Model {

	protected function __construct ($json=false) {
		$this->_data = $json;
		$this->initialize();
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
		return json_encode($this->to_php(), true);
	}

}



class Upfront_Layout extends Upfront_JsonModel {

	public static function from_php ($data) {
		return new self($data);
	}

	public static function from_json ($json) {
		return self::from_php(json_decode($json, true));
	}

	public static function from_id ($id) {
		$data = get_option($id, json_encode(array()));
		return self::from_json($data);
	}

	public static function create_layout () {
		//$data = '{"name":"Layout 1","regions":[{"name":"Main","modules":[{"name":"Merged module","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357456975525-1753"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c6"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719047636-1467"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c14"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719048044-1716"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357719072172-1882"},{"name":"class","value":"c22"}]},{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"image-object-1357460676135-1523"},{"name":"content","value":"http:\/\/wpsalad.com\/wp-content\/uploads\/2012\/11\/wpmudev.png"},{"name":"class","value":"c22"},{"name":"type","value":"ImageModel"},{"name":"view_class","value":"ImageView"}]}],"properties":[{"name":"element_id","value":"module-1357460676140-1230"},{"name":"class","value":"c20 ml2"}]},{"name":"Merged module","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719370220-1638"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719370581-1294"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357719375784-1417"},{"name":"class","value":"c22"}]}]},{"name":"sidebar","modules":[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357460687069-1239"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357460687072-1451"},{"name":"class","value":"c20 ml2"}]}]}]}';
		$data = '{"name":"Layout 1","regions":[{"name":"Main"},{"name":"sidebar","modules":[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1360045228310-1131"},{"name":"content","value":"Edit away!"},{"name":"class","value":"c22 ml0 mr0 mt0"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1360045228313-1375"},{"name":"wrapper_id","value":"wrapper-13548645456-1231"},{"name":"class","value":"c22"},{"name":"has_settings","value":"0"}]}]}], "wrappers":[{"name":"","properties":[{"name":"wrapper_id","value":"wrapper-13548645456-1231"},{"name":"class","value":"c22"}]}]}';
		return self::from_json($data);
	}

	public function save () {
		update_option($this->get_id(), $this->to_json());
		return $this->get_id();
	}

	public function delete () {
		return delete_option($this->get_id());
	}
}