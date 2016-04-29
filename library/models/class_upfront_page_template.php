<?php

class Upfront_PageTemplate {

	const LAYOUT_TEMPLATE_TYPE = 'upfront_template';
	const LAYOUT_TEMPLATE_DEV_TYPE = 'upfront_dev_template';
	const LAYOUT_TEMPLATE_STATUS = 'uft';
	
	public function __construct () {}

	public static function to_string ($array) {
		if (!is_array($array)) return '';
		return join('::', $array);
	}

	public static function to_hash ($what) {
		return md5(serialize($what));
	}
	
	/**
	 * Saves the layout and returns the layout post ID.
	 * @param $ID if given, it will update the existing layout template
	 * @param Upfront_Layout $layout layout to store
	 * @param bool $dev template for dev or not
	 * @return mixed (bool)false on failure, (string)layout ID key on success
	 */
	public function save_page_template ($ID, $layout, $dev) {
		$cascade = $layout->get_cascade();
		$store = $layout->to_php();
		$layout_id = $layout->get_id();
		
		$post_type = ( $dev )
			? self::LAYOUT_TEMPLATE_DEV_TYPE
			: self::LAYOUT_TEMPLATE_TYPE
		;
		
		$existing_page_template = $this->get_page_template($ID, $dev);
		
		if ( !empty($ID) && !empty($existing_page_template) ) {
			// update page template
			$post_id = wp_update_post(array(
				"ID" => (int) $ID,
				"post_content" => base64_encode(serialize($store)),
				"post_title" => $layout_id,
				"post_name" => $layout_id,
				"post_author" => get_current_user_id(),
			));
		} else {
			// insert page template
			$post_id = wp_insert_post(array(
				"post_content" => base64_encode(serialize($store)),
				"post_title" => $layout_id,
				"post_name" => $layout_id,
				"post_type" => $post_type,
				"post_status" => self::LAYOUT_TEMPLATE_STATUS,
				"post_author" => get_current_user_id(),
			));
		}
		
		return !empty($post_id) && !is_wp_error($post_id)
			? $post_id
			: false
		;
	}
	
	/**
	 * Fetches a single page template, as determined by supplied post ID.
	 * @param string $ID Requested page template post ID
	 * @param string $load_dev template for dev or not
	 * @return mixed (Upfront_Layout)revision on success, (bool)false on failure
	 */
	public function get_page_template ($ID, $load_dev) {
	
		if ( empty($ID) ) return false;
		
		$post_type = ( $load_dev )
			? self::LAYOUT_TEMPLATE_DEV_TYPE
			: self::LAYOUT_TEMPLATE_TYPE
		;
		
		$query = new WP_Query(array(
			'p' => $ID,
			'post_type' => $post_type,
			'suppress_filters' => true,

		));
		
		return !empty($query->posts[0]) && !empty($query->posts[0]->post_content)
			? unserialize(base64_decode($query->posts[0]->post_content))
			: false
		;
	}
	
	/**
	 * Fetches layout template id by a given slug
	 */
	public function get_id_by_slug ($slug, $load_dev) {
	
		if ( empty($slug) ) return false;
		
		$post_type = ( $load_dev )
			? self::LAYOUT_TEMPLATE_DEV_TYPE
			: self::LAYOUT_TEMPLATE_TYPE
		;
		
		$query = new WP_Query(array(
			'name' => $slug,
			'post_type' => $post_type,
			'suppress_filters' => true,
			'posts_per_page' => 1,
		));
		
		return !empty($query->posts[0]) && !empty($query->posts[0]->ID)
			? $query->posts[0]->ID
			: false
		;
	}
	
	/**
	 * Fetches all page templates for current active theme
	 * @param string $load whether to load all or just dev templates
	 * @param mixed $template_type whether to load all or just Page/Layout templates
	 */
	public function get_all_page_templates ($load = 'all', $template_type = false) {
		global $wpdb;
		$theme_key = $wpdb->esc_like(Upfront_Model::get_storage_key()) . '%';
		
		if ( $load == 'all' ) {
			$filter_dev = "";
		} elseif ( $load == self::LAYOUT_TEMPLATE_DEV_TYPE ) {
			$filter_dev = " post_type = '". self::LAYOUT_TEMPLATE_DEV_TYPE ."' AND";
		} else {
			$filter_dev = " post_type = '". self::LAYOUT_TEMPLATE_TYPE ."' AND";
		}
		
		$sql = "SELECT * FROM {$wpdb->posts} WHERE {$filter_dev} post_name LIKE %s AND post_status = %s";
		$query = $wpdb->prepare($sql, $theme_key, self::LAYOUT_TEMPLATE_STATUS);
		
		if ( $template_type ) {
			$sql = "
				SELECT      p.*
				FROM        {$wpdb->posts} p
				INNER JOIN  {$wpdb->postmeta} m 
										ON p.ID = m.post_id
										AND m.meta_key = %s 
				WHERE       {$filter_dev}
										m.meta_value = %s
										AND p.post_name LIKE %s 
										AND p.post_status = %s
				";
			$query = $wpdb->prepare($sql, 'template_type', $template_type, $theme_key, self::LAYOUT_TEMPLATE_STATUS);
		}
		
		return $wpdb->get_results($query, OBJECT);
	}
	
	/**
	 * Deletes the requested page template.
	 * Also validated we have actually deleted a page template.
	 * @param int $ID Page Template post ID to remove
	 * @param bool $dev template for dev or not
	 * @return bool
	 */
	public function drop_page_template ($ID, $dev) {
		if (empty($ID) || !is_numeric($ID)) return false;
		$template = get_post($ID);
		if ( $dev ) {
			if (self::LAYOUT_TEMPLATE_DEV_TYPE !== $template->post_type) return false;
		} else {
			if (self::LAYOUT_TEMPLATE_TYPE !== $template->post_type) return false;
		}
		return (bool)wp_delete_post($ID, true);
	}
	
	/**
	 * Deletes all layouts for current theme
	 * Also validated we have actually deleted all theme page templates.
	 * @return bool
	 */
	public function drop_all_theme_page_templates () {
		$result = true;
		$templates = $this->get_all_page_templates();
		foreach ( $templates as $template ) {
			if ( !(bool)wp_delete_post($template->ID, true) ) {
				$result = false;
				break;
			}
		}
		return $result;
	}
	
}