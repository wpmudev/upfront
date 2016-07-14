<?php

class Upfront_Themes_RequiredPage {

	private $_prefix;
	private $_page_data;
	private $_layout_name;
	private $_wp_template;
	private $_key;
	private $_post_id;

	public function __construct ($prefix, $page_data, $layout_name, $wp_template = false) {
		$this->_prefix = $prefix;
		$this->_page_data = $page_data;
		$this->_layout_name = $layout_name;
		$this->_wp_template = $wp_template;

		$slug = $layout_name;

		$this->_key = "{$this->_prefix}_page_{$slug}";

		if (!$this->exists()) $this->_create_page();
	}

	/**
	 * Is the page already there?
	 * @return mixed Page ID if it does, false otherwise
	 */
	public function exists () {
		if (empty($this->_key)) return false;
		return get_option($this->_key, false);
	}

	/**
	 * Get the page ID, if it exists.
	 * Thin wrapper around self::exists()
	 */
	public function get_id () { return $this->exists(); }

	/**
	 * Get the page layout name.
	 * @return mixed Layout name (string) if page exists and has layout name set, (bool)false otherwise.
	 */
	public function get_layout_name () {
		if (!$this->exists() || empty($this->_layout_name)) return false;
		return $this->_layout_name;
	}

	protected function _create_page () {
		$page_slug = sanitize_title($this->_page_data['post_title']);
		$page = get_page_by_path($page_slug);
		if ( $page && $page->ID ) {
			$post_id = $page->ID;
		} else {
			$post_id = wp_insert_post(wp_parse_args($this->_page_data, array(
				'post_status' => 'publish',
				'post_type' => 'page'
			)));
			$this->_wp_template = 'page_tpl-' . $this->_page_data['page_slug'] . '.php';
		}
		if (!empty($this->_wp_template)) update_post_meta($post_id, '_wp_page_template', $this->_wp_template);
		update_option($this->_key, $post_id);
		$this->_post_id = $post_id;
	}
	public function get_post_id() {
		if(isset($this->_post_id))
			return $this->_post_id;
		else
			return false;
	}
}