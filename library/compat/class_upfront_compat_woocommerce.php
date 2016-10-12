<?php

class Upfront_Compat_WooCommerce {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		add_action('after_setup_theme', array($this, 'add_woocommerce_support'));
		add_filter('template_include', array($this, 'override_single_product_tpl'), 99, 3);
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-post_data-get_content-before', array($this, 'override_single_product_filter'));
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-plugins_layouts', array($this, 'add_woocommerce_layouts'));
		add_filter('upfront-postdata_get_markup_before', array($this, 'override_postdata_content'), 10, 2);
		add_filter('upfront-override_post_parts', array($this, 'override_post_parts'), 10, 2);
	}

/**
 * Gets rid of the admin notice and declares support for Woo
 */
	public function add_woocommerce_supports() {
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
		if (!empty($cascade['item']) && 'single-product' === $cascade['item']) {
			$cascade['item'] = 'single-page';
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

	/**
	 * Inject Woo stuff into content instead of the normal content. Doing this on posts element since
	 * there is no logic for user to use anything else on WC pages.
	 *
	 * @param bool|string $status Whatever we got this far, defaults to (bool)false
	 *
	 * @return bool|string
	 */
	public function override_posts_markup_filter ($status) {
		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		return $this->get_woo_content();
	}

	// List WC layouts to match againts current layout in editor
	function add_woocommerce_layouts($layouts) {
		$layouts['woo-commerce'] = array(
			'pluginName' => 'WooCommerce',
			'pageIds' => array(
				wc_get_page_id('shop'), wc_get_page_id('cart'), wc_get_page_id('checkout'), wc_get_page_id('myaccount')
			),
			'layouts' => array(
				array(
					'item' => 'archive-product',
					'type' => 'archive'
				),
				array(
					'specificity' => 'single-product',
					'type' => 'single'
				),
				array(
					'item' => 'archive-product_cat',
					'specificity' => 'archive-product_cat',
					'type' => 'archive'
				),
				array(
					'item' => 'archive-product_tag',
					'specificity' => 'archive-product_tag',
					'type' => 'archive'
				)
			),
			'shortcodes' => array(
				'woocommerce_cart', 'woocommerce_checkout', 'woocommerce_my_account'
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
		return '<div class="woocommerce">' . $content . '</div>';
	}
}
