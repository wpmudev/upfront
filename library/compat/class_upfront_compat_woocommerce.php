<?php

class Upfront_Compat_WooCommerce {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('woocommerce') === false) {
			add_filter('upfront-builder_skip_exported_layouts', array($this, 'skip_layouts_when_inactive'), 10, 2);
			return;
		}

		add_action('after_setup_theme', array($this, 'add_woocommerce_support'));
		add_filter('template_include', array($this, 'override_single_product_tpl'), 99, 3);
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-post_data-get_content-before', array($this, 'override_single_product_filter'));
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-plugins_layoucartts', array($this, 'add_woocommerce_layouts'));
		add_filter('upfront-postdata_get_markup_before', array($this, 'override_postdata_content'), 10, 2);
		add_filter('upfront-override_post_parts', array($this, 'override_post_parts'), 10, 2);
		add_filter('upfront-widget_plugins_widgets', array($this, 'declare_plugins_widgets'));
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-builder_available_layouts', array($this, 'builder_available_layouts'));
		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
	}

	/**
	 * Hides CoursePress layouts in builder exported layouts if "Layouts" popup when CoursePress is not active.
	 */
	public function skip_layouts_when_inactive($skip, $layout) {
		$woo_layouts = array(
			'single-product',
			'archive-product_cat',
			'archive-product_tag',
			'archive-product',
			'single-page-woocart',
			'single-page-woomyaccount',
			'single-page-woocheckout',
		);
		if (in_array($layout['specificity'], $woo_layouts)) return true;

		return $skip;
	}


	public function forbidden_post_data_types($types) {
		$post = get_post();
		if (is_null($post)) return $types;

		if (self::is_woo_page($post)) {
			$types = array('title', 'date_posted', 'comment_form', 'comment_count', 'comments', 'comments_pagination');
		}
		return $types;
	}


	/**
	 * Checks if a post is actually a known Woo page
	 *
	 * @param WP_Post|int $post Post to check
	 *
	 * @return bool
	 */
	public static function is_woo_page ($post) {
		if (!class_exists('WP_Post')) return false; // Basic sanity check

		// Ensure we have an actual post here
		if (!($post instanceof WP_Post)) $post = get_post($post);
		if (!($post instanceof WP_Post)) return false;

		return in_array($post->ID, self::get_woo_page_ids());
	}

	/**
	 * Returns a list of known Woo pages as a list of post IDs
	 *
	 * @return array List of post IDs
	 */
	public static function get_woo_page_ids () {
		return $pages = array(
			wc_get_page_id('cart'),
			wc_get_page_id('checkout'),
			wc_get_page_id('myaccount'),
			wc_get_page_id('shop')
		);
	}

/**
 * Gets rid of the admin notice and declares support for Woo
 */
	public function add_woocommerce_support() {
		add_theme_support('woocommerce');
	}

	/**
	 * Overrides Woo's internal template injection
	 *
	 * Forces loading Upfront's single.php/index.php
	 *
	 * @param string $tpl Template
	 *
	 * @return string
	 */
	public function override_single_product_tpl ($tpl) {
		if (preg_match('/\bwoocommerce\b/', $tpl)) {
			if (preg_match('/single-product\.php$/', $tpl)) return locate_template('single.php');
			if (preg_match('/archive-product.*\.php$/', $tpl)) {
				return locate_template('index.php');
			}
			if (preg_match('/(taxonomy|archive)-product.*\.php$/', $tpl)) return locate_template('index.php');
		}
		return $tpl;
	}

	/**
	 * Overrides the entity IDs when we're dealing with Woo output
	 *
	 * This will force using the appropriate layout
	 *
	 * @param array $cascade Upfront layout IDs cascade
	 *
	 * @return array
	 */
	public function override_entity_ids ($cascade) {
		$theme = Upfront_Theme::get_instance();

		if (!empty($cascade['item']) && 'single-product' === $cascade['item']) {
			// Let's test if a theme supports Woo product layouts.
			// As in, does this theme have single-product ready-made layouts?

			// If it doesn't, let's emulate - we'll be single pages here
			if (!$theme->has_theme_layout('single-product')) $cascade['item'] = 'single-page';

		} else if (!empty($cascade['specificity'])) {
			// Swap single-page-{number} with specific layouts
			$s = $cascade['specificity'];
			$layouts = array(
				'single-page-woocart'      => 'single-page-' . wc_get_page_id('cart'),
				'single-page-wooccheckout' => 'single-page-' . wc_get_page_id('checkout'),
				'single-page-woomyaccount' => 'single-page-' . wc_get_page_id('myaccount'),
			);

			foreach ($layouts as $slug=>$specificity) {
				if ($s === $specificity) {
					if ($theme->has_theme_layout($slug)) $cascade['specificity'] = $slug;
					break;
				}
			}

		} else {
			// If all else fails try to find out if this really isn't the shop page.
			// When in General > Permalinks > Product Permalinks
			// selected value is not Default, shop page resolves to archive instead archive-product
			global $wp_query;
			if (empty($cascade['item']) && $wp_query->is_archive && $wp_query->queried_object_id === wc_get_page_id('shop')) {
				$cascade['item'] = 'archive-product';
			}
		}

		return $cascade;
	}

	/**
	 * Inject Woo stuff into content instead of the normal content
	 *
	 * @param bool|string $status Whatever we got this far, defaults to (bool)false
	 *
	 * @return bool|string
	 */
	public function override_single_product_filter ($status) {
		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		return $this->get_woo_content();
	}

	public function get_sample_content($specificity) {
		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'woocommerce' . DIRECTORY_SEPARATOR . $specificity . '.php');
		return  ob_get_clean();
	}

	/**
	 * Inject Woo stuff into content instead of the normal content. Doing this on posts element since
	 * there is no logic for user to use anything else on WC pages.
	 *
	 * @param bool|string $status Whatever we got this far, defaults to (bool)false
	 *
	 * @return bool|string
	 */
	public function override_posts_markup_filter ($status) {
		// The scope of the issue this addresses stays with archive page
		if (is_singular()) return $status; // ... so don't do this on singular pages

		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		return $this->get_woo_content();
	}

	// List WC layouts to match againts current layout in editor
	function add_woocommerce_layouts($layouts) {
		$sampleContents = array(
			'single-product' => $this->get_sample_content('single-product'),
			'cart' => $this->get_sample_content('cart'),
			'checkout' => $this->get_sample_content('checkout'),
			'myaccount' => $this->get_sample_content('myaccount'),
			'shop' => $this->get_sample_content('shop'),
			'archive-product' => $this->get_sample_content('archive-product')
		);

		$layouts['woo-commerce'] = array(
			'pluginName' => 'WooCommerce',
			'sampleContents' => $sampleContents,
			'pagesById' => array(
				array(
					'pageId' => wc_get_page_id('shop'),
					'content' => 'shop'
				),
				array(
					'pageId' => wc_get_page_id('cart'),
					'content' => 'cart'
				),
				array(
					'pageId' => wc_get_page_id('checkout'),
					'content' => 'checkout'
				),
				array(
					'pageId' => wc_get_page_id('myaccount'),
					'content' => 'myaccount'
				)
			),
			'layouts' => array(
				array(
					'item' => 'archive-product',
					'type' => 'archive',
					'content' => 'archive-product'
				),
				array(
					'item' => 'single-product',
					'specificity' => 'single-product',
					'type' => 'single',
					'content' => 'single-product'
				),
				array(
					'item' => 'archive-product_cat',
					'specificity' => 'archive-product_cat',
					'type' => 'archive',
					'content' => 'archive-product'
				),
				array(
					'item' => 'archive-product_tag',
					'specificity' => 'archive-product_tag',
					'type' => 'archive',
					'content' => 'archive-product'
				),
				array(
					'item' => 'single-page-woocart',
					'specificity' => 'single-page-woocart',
					'content' => 'cart'
				),
				array(
					'item' => 'single-page-woocheckout',
					'specificity' => 'single-page-woocheckout',
					'content' => 'checkout'
				),
				array(
					'item' => 'single-page-woomyaccount',
					'specificity' => 'single-page-woomyaccount',
					'content' => 'myaccount'
				),
			)
		);

		return $layouts;
	}

	/**
	 * Force WC content in post data.
	 */
	public function override_postdata_content($content, $post_type) {
		if ($post_type === 'product') {
			$content = $this->get_woo_content();
		}
		return $content;
	}

	public function override_post_parts($parts, $post_type) {
		$something = WC()->query->get_query_vars();
		if ($post_type === 'product') {
			$parts = array('content');
		}
		return $parts;
	}

	private function get_woo_content() {
		ob_start();
		woocommerce_content();
		$content = ob_get_clean();
		wp_reset_postdata();
		if ($content === '') return '';
		return '<div class="woocommerce">' . $content . '</div>';
	}

	public function declare_plugins_widgets($pw) {
		return array_merge($pw, array(
				array(
					'class' => 'WC_Widget_Layered_Nav',
					'text' => 'WooCommerce Layered Navigation Widget'
				),
				array(
					'class' => 'WC_Widget_Layered_Nav_Filters',
					'text' => 'WooCommerce Layered Navigation Filters Widget'
				),
				array(
					'class' => 'WC_Widget_Price_Filter',
					'text' => 'WooCommerce Price Filter Widget'
				),
				array(
					'class' => 'WC_Widget_Rating_Filter',
					'text' => 'WooCommerce Rating Filter Widget'
				),
				array(
					'class' => 'WC_Widget_Recent_Reviews',
					'text' => 'WooCommerce Recent Reivews Widget'
				),
				array(
					'class' => 'WC_Widget_Recently_Viewed',
					'text' => 'WooCommerce Recently Viewed Widget'
				),
			)
		);
	}

	public function layout_to_name($layout_name, $type, $item, $specificity) {
		if ($specificity === 'archive-product' && $item === 'product') {
			return __('WooCommerce Shop Page', 'upfront');
		}

		if ($specificity === 'single-page-woocart' || $specificity === 'woocart') {
			return __('WooCommerce Cart Page', 'upfront');
		}

		if ($specificity === 'single-page-woomyaccount' || $specificity === 'woomyaccount') {
			return __('WooCommerce My Account Page', 'upfront');
		}

		if ($specificity === 'single-page-woocheckout' || $specificity === 'woocheckout') {
			return __('WooCommerce Checkout Page', 'upfront');
		}

		return $layout_name;
	}

	public function builder_available_layouts($layouts) {
		$keys = array_keys($layouts);

		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-woocart'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-woomyaccount'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'single-page',
				'specificity' => 'single-page-woocheckout'
			)
		);

		return $layouts;
	}
}
