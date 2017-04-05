<?php

class Upfront_Compat_MarketPress {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('MarketPress') === false) {
			add_filter('upfront-builder_skip_exported_layouts', array($this, 'skip_layouts_when_inactive'), 10, 2);
			return;
		}

		// Just-in-time check for content filter rebinding
		add_filter('upfront-post_data-get_content-before', array($this, 'ensure_mp_product_filtering'));

		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-builder_available_layouts', array($this, 'builder_available_layouts'));
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-plugins_layouts', array($this, 'add_layouts'));
		add_filter('upfront-postdata_get_markup_after', array($this, 'add_class'), 10, 2);
		add_filter('mp-do_grid_with_js', array($this, 'disable_mp_js_grid'), 10, 2);
	}

	/**
	 * Hides MarketPress layouts in builder exported layouts if "Layouts" popup when MarketPress is not active.
	 */
	public function skip_layouts_when_inactive($skip, $layout) {
		$mp_layouts = array(
			'single-mpproduct',
			'archive-mpproduct_category',
			'archive-mpproduct_tag',
			'single-page-mpstore',
			'single-page-mpcheckout',
			'single-page-mporderstatus',
			'single-page-mpcart',
			'single-page-mpproducts',
		);
		if (in_array($layout['specificity'], $mp_layouts)) return true;

		return $skip;
	}

	/**
	 * Checks and re-binds MP product filtering
	 *
	 * This is needed for other plugin conflicts resolution,
	 * as MP will remove its content filtering once they're
	 * first applied (which is sane, but can cause issues).
	 *
	 * Also, this is a fake filter - we're not changing the
	 * parameter, but re-setting the filtering (consequence).
	 *
	 * @param string $str Passthrough param
	 *
	 * @return string Passthrough param
	 */
	public function ensure_mp_product_filtering ($str) {
		if (!class_exists('MP_Public')) return $str;
		if (!self::is_product(get_post())) return $str;

		$callback = array(MP_Public::get_instance(), 'single_product_content');
		if (has_filter('the_content', $callback)) return $str; // We're good here

		// Whoops, something triggered MP content filtering ahead of time.
		// So, let's just re-negotiate the processing and be done with it.
		add_filter('the_content', $callback);

		return $str;
	}

	/**
	 * Checks whether we're dealing with a MP product
	 *
	 * The check is done according to the post argument's post_type
	 *
	 * @param WP_Post|int $post Post type to check
	 *
	 * @return bool
	 */
	public static function is_product ($post) {
		if (!class_exists('WP_Post')) return false; // Basic sanity check

		// Ensure we have an actual post here
		if (!($post instanceof WP_Post)) $post = get_post($post);
		if (!($post instanceof WP_Post)) return false;

		return self::get_product_post_type() === $post->post_type;
	}

	/**
	 * MarketPress product post type getter
	 *
	 * @return string|bool Currently configured MP post type, or (bool)false on failure
	 */
	public static function get_product_post_type () {
		$type = function_exists('mp_get_setting')
			? mp_get_setting('product_post_type')
			: false
		;
		return !empty($type)
			? $type
			: 'product'
		;
	}

	/**
	 * Checks if a post is actually a known MP page
	 *
	 * @param WP_Post|int $post Post to check
	 *
	 * @return bool
	 */
	public static function is_mp_page ($post) {
		if (!class_exists('WP_Post')) return false; // Basic sanity check

		// Ensure we have an actual post here
		if (!($post instanceof WP_Post)) $post = get_post($post);
		if (!($post instanceof WP_Post)) return false;

		return in_array($post->ID, self::get_mp_page_ids());
	}

	/**
	 * Returns a list of known MP pages as a list of post IDs
	 *
	 * @return array List of post IDs
	 */
	public static function get_mp_page_ids () {
		return $pages = array(
			mp_get_setting('pages->products'),
			mp_get_setting('pages->cart'),
			mp_get_setting('pages->store'),
			mp_get_setting('pages->checkout'),
			mp_get_setting('pages->order_status')
		);
	}

	public function add_class($markup, $post) {
		if (self::is_mp_page($post)) {
			return $this->wrap_with_plugin_class($markup);
		}
		if (self::is_product($post)) return $this->wrap_with_plugin_class($markup);

		return $markup;
	}

	public function override_posts_markup_filter ($status) {
		// The scope of the issue this addresses stays with archive page
		if (is_singular()) return $status; // ... so don't do this on singular pages

		$post = get_post();
		//if (empty($post->post_type) || 'product' !== $post->post_type) return $status;
		if (!self::is_product($post)) return $status;

		$content = mp_list_products(array('echo' => false));
		return $this->wrap_with_plugin_class($content);
	}

	public function get_sample_content($specificity) {
		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . $specificity . '.php');
		return  ob_get_clean();
	}

	/**
	 * Overrides MP equal height filter
	 */

	public function disable_mp_js_grid () {
		return false;
	}

	/**
	 * Overrides the entity IDs when we're dealing with MarketPress output
	 *
	 * This will force using the appropriate layout
	 *
	 * @param array $cascade Upfront layout IDs cascade
	 *
	 * @return array
	 */
	public function override_entity_ids ($cascade) {
		// Let's test if a theme supports MarketPress product layouts.
		$theme = Upfront_Theme::get_instance();

		$mp_item_name = 'single-' . self::get_product_post_type();
		if (!empty($cascade['item']) && $mp_item_name === $cascade['item']) {
			// If it doesn't, let's emulate - we'll be single pages here
			if (!$theme->has_theme_layout('single-mpproduct')) $cascade['item'] = 'single-page';
			else $cascade['item'] = 'single-mpproduct';
		}
		if (!empty($cascade['item']) && 'archive-product_category' === $cascade['item']) {
			if ($theme->has_theme_layout('archive-mpproduct_category')) $cascade['item'] = 'archive-mpproduct_category';
		}
		if (!empty($cascade['item']) && 'archive-product_tag' === $cascade['item']) {
			if ($theme->has_theme_layout('archive-mpproduct_tag')) $cascade['item'] = 'archive-mpproduct_tag';
		}
		if (!empty($cascade['specificity']) && $cascade['specificity'] === 'single-page-' . mp_get_setting('pages->products')) {
			if ($theme->has_theme_layout('single-page-mpproducts')) $cascade['specificity'] = 'single-page-mpproducts';
		}
		if (!empty($cascade['specificity']) && $cascade['specificity'] === 'single-page-' . mp_get_setting('pages->cart')) {
			if ($theme->has_theme_layout('single-page-mpcart')) $cascade['specificity'] = 'single-page-mpcart';
		}
		if (!empty($cascade['specificity']) && $cascade['specificity'] === 'single-page-' . mp_get_setting('pages->store')) {
			if ($theme->has_theme_layout('single-page-mpstore')) $cascade['specificity'] = 'single-page-mpstore';
		}
		if (!empty($cascade['specificity']) && $cascade['specificity'] === 'single-page-' . mp_get_setting('pages->checkout')) {
			if ($theme->has_theme_layout('single-page-mpcheckout')) $cascade['specificity'] = 'single-page-mpcheckout';
		}
		if (!empty($cascade['specificity']) && $cascade['specificity'] === 'single-page-' . mp_get_setting('pages->order_status')) {
			if ($theme->has_theme_layout('single-page-mporderstatus')) $cascade['specificity'] = 'single-page-mporderstatus';
		}
		return $cascade;
	}

	public function layout_to_name($layout_name, $type = '', $item = '', $specificity = '') {

		if ($item === 'mpproduct') {
			return __('MarketPress Product', 'upfront');
		}

		if ($item === 'mpproduct_tag') {
			return __('MarketPress Tag Archive', 'upfront');
		}

		if ($item === 'mpproduct_category') {
			return __('MarketPress Category Archive', 'upfront');
		}

		if ($specificity === 'single-page-mpproducts' || $specificity === 'mpproducts') {
			return __('MarketPress Products Page', 'upfront');
		}

		if ($specificity === 'single-page-mpcart' || $specificity === 'mpcart') {
			return __('MarketPress Cart Page', 'upfront');
		}

		if ($specificity === 'single-page-mpstore' || $specificity === 'mpstore') {
			return __('MarketPress Store Page', 'upfront');
		}

		if ($specificity === 'single-page-mpcheckout' || $specificity === 'mpcheckout') {
			return __('MarketPress Checkout Page', 'upfront');
		}

		if ($specificity === 'single-page-mporderstatus' || $specificity === 'mporderstatus') {
			return __('MarketPress Order Status Page', 'upfront');
		}

		return $layout_name;
	}

	public function builder_available_layouts($layouts) {
		$keys = array_keys($layouts);
		if (in_array('single-product', $keys)) {
			$layouts['single-product']['layout']['item'] = 'single-mpproduct';
		}
		if (in_array('archive-product_tag', $keys)) {
			$layouts['archive-product_tag']['layout']['item'] = 'archive-mpproduct_tag';
		}
		if (in_array('archive-product_category', $keys)) {
			$layouts['archive-product_category']['layout']['item'] = 'archive-mpproduct_category';
		}
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-mpproducts'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-mpcart'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-mpstore'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-mpcheckout'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-mporderstatus'
			)
		);

		return $layouts;
	}

	function add_layouts($layouts) {
		$sampleContents = array(
			'archive' => $this->wrap_with_plugin_class($this->get_sample_content('category')),
			'single' => $this->wrap_with_plugin_class($this->get_sample_content('single-product')),
			'store' => $this->wrap_with_plugin_class($this->get_sample_content('store')),
			'checkout' => $this->wrap_with_plugin_class($this->get_sample_content('checkout')),
			'order_status' => $this->wrap_with_plugin_class($this->get_sample_content('order-status')),
			'cart' => $this->wrap_with_plugin_class($this->get_sample_content('cart')),
			'products' => $this->wrap_with_plugin_class($this->get_sample_content('products'))
		);

		$layouts['marketpress'] = array(
			'pluginName' => 'MarketPress',
			'sampleContents' => $sampleContents,
			'layouts' => array(
				array(
					'item' => 'single-mpproduct',
					'type' => 'single',
					'content' => 'single'
				),
				array(
					'item' => 'archive-mpproduct_category',
					'type' => 'archive',
					'content' => 'archive'
				),
				array(
					'item' => 'archive-mpproduct_tag',
					'type' => 'archive',
					'content' => 'archive'
				),
				array(
					'item' => 'single-page-mpstore',
					'specificity' => 'single-page-mpstore',
					'type' => 'single',
					'content' => 'store'
				),
				array(
					'item' => 'single-page-mpcheckout',
					'specificity' => 'single-page-mpcheckout',
					'type' => 'single',
					'content' => 'checkout'
				),
				array(
					'item' => 'single-page-mporderstatus',
					'specificity' => 'single-page-mporderstatus',
					'type' => 'single',
					'content' => 'order_status'
				),
				array(
					'item' => 'single-page-mpcart',
					'specificity' => 'single-page-mpcart',
					'type' => 'single',
					'content' => 'cart'
				),
				array(
					'item' => 'single-page-mpproducts',
					'specificity' => 'single-page-mpproducts',
					'type' => 'single',
					'content' => 'products'
				)
			)
		);

		return $layouts;
	}

	public function forbidden_post_data_types($types) {
		$post = get_post();
		if (is_null($post)) return $types;

		//if ($post->post_type === 'product' || $is_mp_page) {
		if (self::is_product($post) || self::is_mp_page($post)) {
			$types = array('title', 'date_posted', 'comment_form', 'comment_count', 'comments', 'comments_pagination');
		}
		return $types;
	}

	private function wrap_with_plugin_class($content) {
		return '<div class="mp-content">' . $content . '</div>';
	}
}
