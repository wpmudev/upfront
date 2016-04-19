<?php

/**
 * Page template handling controller.
 * For actual data/storage mapping, @see Upfront_LayoutRevisions
 */
class Upfront_Server_PageTemplate extends Upfront_Server {

	const HOOK = 'uf-preview';
	
	private static $_instance;
	
	private $_data;

	public static function get_instance () {
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	public static function serve () {
		self::get_instance()->_add_hooks();
	}
	
	private function _add_hooks () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;

		$this->register_requirements();
	}
	
	/**
	 * Registering model requirements. Should probably refactor.
	 */
	public function register_requirements () {
		register_post_type(Upfront_PageTemplate::PAGE_TEMPLATE_TYPE, array(
			"public" => false,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
		));
		
		$this->_data = new Upfront_PageTemplate;
		// $this->test_data();
	}
	
	public function save_template ($template_id, $layout) {
		print_r('save_template was called oh yeah');
		// print_r($layout);
		
		$this->_data->save_page_template($template_id, $layout);
		
		print_r($this->test_data());
		print_r($layout->get_id());
		// return $layout->get_id();
	}
	
	// TODO: to remove later, just for unit testing
	public function test_data () {
		$templates = $this->_data->get_all_page_templates();
		print_r('templates <br/>');
		print_r($templates);
	}
	
}

add_action('init', array('Upfront_Server_PageTemplate', 'serve'), 0);