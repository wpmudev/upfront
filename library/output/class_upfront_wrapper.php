<?php


class Upfront_Wrapper extends Upfront_Entity {
	static protected $_instances = array();
	protected $_type = 'Wrapper';
	protected $_wrapper_id = '';

	static public function get_instance ($wrapper_id, $data = '') {
		foreach ( self::$_instances as $instance ){
			if ( $instance->_wrapper_id == $wrapper_id )
				return $instance;
		}
		$wrapper_data = false;
		if ( empty($data) ){
			$layout = Upfront_Output::get_layout_data();
			if ( !$layout )
				return false;
			foreach ( $layout['regions'] as $region ){
				if (!empty($region['wrappers'])) foreach ( $region['wrappers'] as $wrapper ){
					if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
						$wrapper_data = $wrapper;
						break 2;
					}
				}
			}
		}
		else {
			if (!empty($data['wrappers'])) foreach ( $data['wrappers'] as $wrapper ){
				if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
					$wrapper_data = $wrapper;
					break;
				}
			}
		}
		if ( !$wrapper_data )
			return false;
		self::$_instances[] = new self($wrapper_data);
		return end(self::$_instances);
	}

	public function __construct ($data) {
		parent::__construct($data);
		$this->_wrapper_id = $this->_get_property('wrapper_id');
	}

	public function get_markup () {
		return '';
	}

	public function get_wrapper_id () {
		return $this->_wrapper_id;
	}

	public function wrap ($out) {
		$class = $this->get_css_class();

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $this->get_name();
			$pre = "\n\t<!-- Upfront {$this->_type} [{$name} - #{$this->_wrapper_id}] -->\n";
			$post = "\n<!-- End {$this->_type} [{$name} - #{$this->_wrapper_id}] --> \n";
		}
		else {
			$pre = "";
			$post = "";
		}

		$wrapper_id = $this->_wrapper_id ? "id='{$this->_wrapper_id}'" : '';
		return "{$pre}<{$this->_tag} class='{$class}' {$wrapper_id}>{$out}</{$this->_tag}>{$post}";
	}
}