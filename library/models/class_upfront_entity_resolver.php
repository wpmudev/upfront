<?php


abstract class Upfront_EntityResolver {

	/**
	 * Dispatches resolving the specified Upfront ID cascade into searchable ID array.
	 * @param array Common Upfront ID cascade
	 * @return array Searchable Common Upfront IDs array
	 */
	public static function get_entity_ids ($cascade=false) {
		$cascade = $cascade ? $cascade : self::get_entity_cascade();

		$ids = array();
		if (!empty($cascade['type']) && !empty($cascade['item']) && !empty($cascade['specificity'])) {
			$ids['specificity'] = $cascade['type'] . '-' . $cascade['item'] . '-' . $cascade['specificity'];
		}
		if (!empty($cascade['type']) && !empty($cascade['item'])) {
			$ids['item'] = $cascade['type'] . '-' . $cascade['item'];
		}
		if (!empty($cascade['type'])) {
			$ids['type'] = $cascade['type'];
		}

		return apply_filters('upfront-entity_resolver-entity_ids', $ids, $cascade);
	}

	/**
	 * Dispatches resolving the current specific WordPress entity
	 * into a common Upfront ID cascade.
	 * @return array Common Upfront ID cascade
	 */
	public static function get_entity_cascade ($query=false) {
		$query = self::_get_query($query);

		if ($query->post_count <= 1 && !$query->tax_query) return self::resolve_singular_entity($query);
		else return self::resolve_archive_entity($query);
	}

	/**
	 * Resolves singular entities to an upfront ID.
	 */
	public static function resolve_singular_entity ($query=false) {
		$query = self::_get_query($query);

		$wp_entity = array();
		$wp_object = $query->get_queried_object();
		$wp_id = $query->get_queried_object_id();

		if (!$wp_id && $query->is_404) {
			$wp_entity = self::_to_entity('404_page');
		} else {
			$post_type = !empty($wp_object->post_type) ? $wp_object->post_type : 'post';
			$wp_entity = self::_to_entity($post_type, $wp_id);
		}

		$wp_entity['type'] = 'single';
		return $wp_entity;
	}

	/**
	 * Resolves archive-like entities to an upfront ID.
	 */
	public static function resolve_archive_entity ($query=false) {
		$query = self::_get_query($query);

		$wp_entity = array();

		if (!empty($query->is_home) && 'posts' === Upfront_Cache_Utils::get_option('show_on_front')) {
			// (1) Home page (recent posts)
			$wp_entity = self::_to_entity('home');
		} else if (is_front_page() && 'posts' !== Upfront_Cache_Utils::get_option('show_on_front')) {
			// (2) Home page (static front-page)
			return self::resolve_singular_entity($query);
		} else if (!empty($query->is_search)) {
			// (3) Search results
			$wp_entity = self::_to_entity('search', $query->get('s'));
		} else if (!empty($query->is_archive) && !empty($query->is_date)) {
			// (4) Date-Archive
			$date = $query->get('m');
			$wp_entity = self::_to_entity('date', $date);
		} else if (!empty($query->is_archive) && !empty($query->is_author)) {
			// (5) Author archives
			$wp_entity = self::_to_entity('author', $query->get('author'));
		} else if (!empty($query->tax_query) && !empty($query->tax_query->queries)) {
			// (6) Tax-Query last, since any other page can contain a tax-query.
			$taxonomy = $term = false;
			foreach ($query->tax_query->queries as $tax_query) {
				$taxonomy = !empty($tax_query['taxonomy']) ? $tax_query['taxonomy'] : false;
				$term = !empty($tax_query['terms']) ? $tax_query['terms'] : false;
			}
			if ($taxonomy && $term) $wp_entity = self::_to_entity($taxonomy, $term);
		} else if (!empty($query->tax_query) && isset($query->query['post_type']) && $query->query['post_type'] === 'product') {
			$wp_entity['item'] = 'product';
		}

		$wp_entity['type'] = 'archive';
		return $wp_entity;
	}

	public static function ids_from_url($url) {
		global $wp;
		$wp = new WP();

		//We need to cheat telling WP we are not in admin area to parse the URL properly
		$current_uri = $_SERVER['REQUEST_URI'];
		$self = $_SERVER['PHP_SELF'];
		$get = $_GET;
		global $current_screen;
		if($current_screen){
			$stored_current_screen = $current_screen->id;
		}
		else {
			require_once(ABSPATH . '/wp-admin/includes/screen.php');
			$current_screen = WP_Screen::get('front');
		}

		$_SERVER['REQUEST_URI'] = $url;
		$_SERVER['PHP_SELF'] = 'foo';

		$urlParts = explode('?', $url);

		if(count($urlParts) > 1){
			parse_str($urlParts[1], $_GET);
		}


		$wp->parse_request();


		$query = new WP_Query($wp->query_vars);
		$query->parse_query();

		//Set the global post in case that no-one is set and we have a single query
		global $post;
		if(!$post && $query->have_posts() && $query->is_singular()){
			$post = $query->next_post();
			setup_postdata($post);
		}

		//Make the query accessible to add it to the response
		global $upfront_ajax_query;
		$upfront_ajax_query = clone($query);

		// Intercept /edit/(post|page)/id
		$editor = Upfront_ContentEditor_VirtualPage::serve();
		if($editor->parse_page()){
			global $wp_query;
			$query = $wp_query;
			$post = $wp_query->next_post();
			setup_postdata($post);
		}


		$_SERVER['REQUEST_URI'] = $current_uri;
		$_SERVER['PHP_SELF'] = $self;
		$_GET = $get;

		if(isset($stored_current_screen)) {
			//$current_screen = $current_screen::get($stored_current_screen);
			$current_screen = call_user_func(array($current_screen, 'get'), $stored_current_screen);
		}

		$cascade = self::get_entity_ids(self::get_entity_cascade($query));

		return $cascade;
	}

	public static function layout_to_name ($layout_ids) {
		$type = $layout_ids['type'];
		$item = !empty($layout_ids['item']) ? preg_replace("/^{$type}-/", "", $layout_ids['item']) : "";
		$specificity = !empty($layout_ids['specificity']) ? preg_replace("/^{$type}-{$item}-/", "", $layout_ids['specificity']) : "";


		$layout_name = apply_filters('upfront-layout_to_name', '', $type, $item, $specificity);
		if ($layout_name !== '') return $layout_name;

		if ('single' === $type) {
			if ('404_page' === $item || 'single-404_page' === $specificity) {
				// 404 page layout
				return __('404 Page', 'upfront');
			}
			if ('maintenance' === $item || 'single-maintenance-mode_page' === $specificity) {
				// maintenance mode page layout
				return __('Maintenance Mode', 'upfront');
			}

			if (empty($item) && empty($specificity)) return __('Single Generic', 'upfront');

			$post_type = get_post_type_object($item ? $item : 'post');
			$name = false;

			if (empty($post_type) && preg_match('/^page-/', $item)) {
				// Singular named pages
				$post_type = get_post_type_object('page');
			}

			if (!empty($post_type)) {
				$name = is_object($post_type->labels)
					? $post_type->labels->singular_name
					: $post_type->labels['singular_name']
				;
			}

			return !empty($specificity)
				? sprintf("Single %s: %s", $name, $specificity)
				: sprintf("Single %s", $name)
			;
		} else if ('archive' === $type) {
			if ('home' === $item) {
				return __("Home Page");
			} else if ('date' === $item || empty($item)) {
				return !empty($specificity) && is_numeric($specificity)
					? sprintf("Archive: %s", jdmonthname($specificity, CAL_MONTH_GREGORIAN_LONG))
					: __("Archive")
				;
			} else if ('search' === $item) {
				return !empty($specificity)
					? sprintf("Search term: %s", $specificity)
					: __("Search")
				;
			} else if ('author' === $item) {
				return !empty($specificity)
					? sprintf("Author: %s", $specificity)
					: __("Author")
				;
			} else {
				// means this is taxonomy
				$taxonomy = get_taxonomy($item);
				if ($taxonomy) { // This can be (bool)false, so let's make sure it's not
					$name = is_object($taxonomy->labels)
						? $taxonomy->labels->singular_name
						: $taxonomy->labels['singular_name']
					;
				} else return false; // We don't know what that is, don't lie
				return !empty($specificity)
					? sprintf("%s: %s", $name, $specificity)
					: $name
				;
			}
		}
	}


	private static function _get_query ($query) {
		if (!$query || !($query instanceof WP_Query)) {
			global $wp_query;
			return $wp_query;
		}
		return $query;
	}

	private static function _to_entity ($item, $specificity=false) {
		$item = is_array($item) ? join('_', $item) : $item;
		$specificity = is_array($specificity) ? join('_', $specificity) : $specificity;
		return array(
			'item' => $item,
			'specificity' => $specificity
		);
	}

	/**
	 * Returns name of the layout from the layouts saved in db
	 *
	 * @param string $str name of layout in db
	 * @return string|void
	 */
	public static function db_layout_to_name( $str ){
		$bits = explode('-', $str, 4);
		$args = array();

		if (!empty($bits[0])) $args['type'] = $bits[0];
		if (!empty($bits[1])) $args['item'] = $bits[1];
		if (!empty($bits[2])) $args['specificity'] = $bits[2];

		return self::layout_to_name( $args );
	}
}
