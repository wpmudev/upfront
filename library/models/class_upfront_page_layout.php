<?php

class Upfront_PageLayout {

	const PAGE_LAYOUT_TYPE = 'upfront_layout';
	const PAGE_LAYOUT_DEV_TYPE = 'upfront_dev_layout';
	const PAGE_LAYOUT_STATUS = 'ufl'; // upfront layout
	
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
	 * @param $ID if given, it will update the existing layout
	 * @param Upfront_Layout $layout to store
	 * @param bool $dev layout for dev or not
	 * @param mixed $slug if layout slug was provided 
	 * @return mixed (bool)false on failure, (string)layout ID key on success
	 */
	public function save_page_layout ($ID, $layout, $dev, $slug = false) {
		$cascade = $layout->get_cascade();
		$store = $layout->to_php();
		$layout_id = ( $slug )
			? strtolower($slug)
			: strtolower($layout->get_id())
		;
		
		$post_type = ( $dev )
			? self::PAGE_LAYOUT_DEV_TYPE
			: self::PAGE_LAYOUT_TYPE
		;
		
		$existing_page_layout = $this->get_page_layout($ID, $dev);
		
		if ( !empty($ID) && !empty($existing_page_layout) ) {
			// update page layout
			$post_id = wp_update_post(array(
				"ID" => (int) $ID,
				"post_content" => base64_encode(serialize($store)),
				"post_title" => $layout_id,
				"post_name" => $layout_id,
				"post_author" => get_current_user_id(),
			));
		} else {
			// insert page layout
			$post_id = wp_insert_post(array(
				"post_content" => base64_encode(serialize($store)),
				"post_title" => $layout_id,
				"post_name" => $layout_id,
				"post_type" => $post_type,
				"post_status" => self::PAGE_LAYOUT_STATUS,
				"post_author" => get_current_user_id(),
			));
		}
		
		return !empty($post_id) && !is_wp_error($post_id)
			? $post_id
			: false
		;
	}
	
	/**
	 * Fetches a single page layout, as determined by supplied post ID.
	 * @param string $ID Requested page layout post ID
	 * @param string $load_dev layout for dev or not
	 * @return mixed (Upfront_Layout)revision on success, (bool)false on failure
	 */
	public function get_page_layout ($ID, $load_dev) {
	
		if ( empty($ID) ) return false;
		
		$post_type = ( $load_dev )
			? self::PAGE_LAYOUT_DEV_TYPE
			: self::PAGE_LAYOUT_TYPE
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
	 * Fetches layout id by a given slug
	 */
	public function get_id_by_slug ($slug, $load_dev) {
	
		if ( empty($slug) ) return false;
		
		$post_type = ( $load_dev )
			? self::PAGE_LAYOUT_DEV_TYPE
			: self::PAGE_LAYOUT_TYPE
		;
		
		$query = new WP_Query(array(
			'name' => strtolower($slug),
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
	 * Fetches all page layouts for current active theme
	 * @param string $load whether to load all or just dev layouts
	 * @param mixed $layout_type whether to load all or just Page/Layout layouts
	 */
	public function get_all_page_layouts ($load = 'all', $layout_type = false) {
		global $wpdb;
		$store_key = str_replace('_dev','',Upfront_Model::get_storage_key());
		$theme_key = $wpdb->esc_like($store_key) . '%';
		
		if ( $load == 'all' ) {
			$filter_dev = "";
		} elseif ( $load == self::PAGE_LAYOUT_DEV_TYPE ) {
			$filter_dev = " post_type = '". self::PAGE_LAYOUT_DEV_TYPE ."' AND";
		} else {
			$filter_dev = " post_type = '". self::PAGE_LAYOUT_TYPE ."' AND";
		}
		
		$sql = "SELECT * FROM {$wpdb->posts} WHERE {$filter_dev} post_name LIKE %s AND post_status = %s";
		$query = $wpdb->prepare($sql, $theme_key, self::PAGE_LAYOUT_STATUS);
		
		if ( $layout_type ) {
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
			$query = $wpdb->prepare($sql, 'layout_type', $layout_type, $theme_key, self::PAGE_LAYOUT_STATUS);
		}
		
		return $wpdb->get_results($query, OBJECT);
	}
	
	/**
	 * Fetches all pages that are using the specified layout
	 * @param int $layout_id meta value that was attached to each page
	 * @param string $meta_name meta key for custom post type layout
	 */
	public function get_pages_using_layout ($layout_id, $meta_name) {
		global $wpdb;
		$sql = "
			SELECT      p.ID
			FROM        {$wpdb->posts} p
			INNER JOIN  {$wpdb->postmeta} m 
									ON p.ID = m.post_id
									AND m.meta_key = %s 
			WHERE       m.meta_value = %s
			";
		$query = $wpdb->prepare($sql, $meta_name, $layout_id);
		
		return $wpdb->get_results($query, OBJECT);
	}
	
	/**
	 * Deletes the requested page layout.
	 * Also validated we have actually deleted a page layout.
	 * @param int $ID Page Template post ID to remove
	 * @param bool $dev layout for dev or not
	 * @return bool
	 */
	public function drop_page_layout ($ID, $dev) {
		if (empty($ID) || !is_numeric($ID)) return false;
		$layout = get_post($ID);
		if ( $dev ) {
			if (self::PAGE_LAYOUT_DEV_TYPE !== $layout->post_type) return false;
		} else {
			if (self::PAGE_LAYOUT_TYPE !== $layout->post_type) return false;
		}
		return (bool)wp_delete_post($ID, true);
	}
	
	/**
	 * Deletes all layouts for current theme
	 * Also validated we have actually deleted all theme page layouts.
	 * @return bool
	 */
	public function drop_all_theme_page_layouts () {
		$result = true;
		$layouts = $this->get_all_page_layouts();
		foreach ( $layouts as $layout ) {
			if ( !(bool)wp_delete_post($layout->ID, true) ) {
				$result = false;
				break;
			}
		}
		return $result;
	}

	/**
	 * Returns page layout using slug
	 *
	 * @param $slug
	 * @param $load_dev
	 * @return bool|array
	 */
	public function get_by_slug($slug, $load_dev ){

		if ( empty($slug) ) return false;

		$post_type = ( $load_dev )
				? self::PAGE_LAYOUT_DEV_TYPE
				: self::PAGE_LAYOUT_TYPE
		;

		$query = new WP_Query(array(
				'name' => strtolower($slug),
				'post_type' => $post_type,
				'suppress_filters' => true,
				'posts_per_page' => 1,
		));

		return !empty($query->posts[0]) && !empty($query->posts[0]->post_content)
				? unserialize(base64_decode($query->posts[0]->post_content))
				: false
				;

	}
}