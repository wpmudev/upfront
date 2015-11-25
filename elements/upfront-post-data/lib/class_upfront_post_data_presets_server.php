<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_PostData_Elements_Server implements IUpfront_Server {

	private static $_instance;

	private $_servers = array();

	public static function get_instance ($type) {
		return self::$_instance->_get_server($type);
	}

	public static function serve () {
		self::$_instance = new self;
		return self::$_instance;
	}

	private function __construct () {
		$this->_initialize_servers();
	}

	private function _initialize_servers () {
		$types = Upfront_Post_Data_Data::get_data_types();
		if (empty($types)) return;

		foreach ($types as $type) {
			$class = $this->_to_server_class_name($type);
			if (empty($class) || !class_exists($class)) continue;
			if (is_callable(array($class, 'serve'))) $this->_servers[$type] = call_user_func(array($class, 'serve'));
		}
	}

	private function _to_server_class_name ($type) {
		if (empty($type)) return false;
		$class_name = join('', array_filter(array_map('trim', array_map('ucfirst', explode('_', $type)))));

		return 'Upfront_' . preg_replace('/[^a-z0-9]/i', '', $class_name) . '_Presets_Server';
	}

	private function _get_servers () {
		return $this->_servers;
	}

	private function _get_server ($type) {
		if (empty($this->_servers[$type])) return false;
		return $this->_servers[$type];
	}

}


abstract class Upfront_DataElement_Preset_Server extends Upfront_Presets_Server {

	abstract public function get_data_type ();

	protected function _add_hooks () {
		parent::_add_hooks();
		add_filter('get_element_preset_styles', array($this, 'get_preset_styles_filter'));
	}
	
	public function get_element_name () {
		return $this->get_data_type() . '_element';
	}
	
// Change these!
	public function get_preset_styles_filter ($style) {
		$style .= $this->get_presets_styles();
		return $style;
	}
	protected function get_style_template_path () {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-post-data/tpl/preset-styles/' . $this->get_data_type() . '.html');
	}
// Up to here

	/**
	 * Sanitize here, because original method doesn't :/
	 */
	public function save () {
		if (isset($_POST['data'])) {
			$data = stripslashes_deep($_POST['data']);
			if (!empty($data['preset']) && !empty($data['id'])) $data['preset'] = $data['id']; // Also override whatever preset we're seding
			$_POST['data'] = $data;
		}
		parent::save();
	}
}

class Upfront_PostData_Presets_Server extends Upfront_DataElement_Preset_Server {

	private static $_instance;

	public function get_data_type () { return 'post_data';	}

	public static function serve () {
		self::$_instance = new self;
		self::$_instance->_add_hooks();
		return self::$_instance;
	}

	public static function get_instance () {
		return self::$_instance;
	}

}

class Upfront_Author_Presets_Server extends Upfront_DataElement_Preset_Server {

	private static $_instance;

	public function get_data_type () { return 'author';	}

	public static function serve () {
		self::$_instance = new self;
		self::$_instance->_add_hooks();
		return self::$_instance;
	}

	public static function get_instance () {
		return self::$_instance;
	}

}

class Upfront_FeaturedImage_Presets_Server extends Upfront_DataElement_Preset_Server {

	private static $_instance;

	public function get_data_type () { return 'featured_image';	}

	public static function serve () {
		self::$_instance = new self;
		self::$_instance->_add_hooks();
		return self::$_instance;
	}

	public static function get_instance () {
		return self::$_instance;
	}

}

class Upfront_Taxonomy_Presets_Server extends Upfront_DataElement_Preset_Server {

	private static $_instance;

	public function get_data_type () { return 'taxonomy';	}

	public static function serve () {
		self::$_instance = new self;
		self::$_instance->_add_hooks();
		return self::$_instance;
	}

	public static function get_instance () {
		return self::$_instance;
	}

}

class Upfront_Comments_Presets_Server extends Upfront_DataElement_Preset_Server {

	private static $_instance;

	public function get_data_type () { return 'comments';	}

	public static function serve () {
		self::$_instance = new self;
		self::$_instance->_add_hooks();
		return self::$_instance;
	}

	public static function get_instance () {
		return self::$_instance;
	}

}