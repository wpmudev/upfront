<?php

class Upfront_Compat_Woocommerce_Woocommerce extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_theme_support('woocommerce'); // Yeah, so we're a supporting theme now
		add_action('wp', array($this, 'detect_virtual_page'));

		// Deal with editor
		add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9); // Bind this early to override the default Posts element action
	}

	public function detect_virtual_page () {
		if (!is_woocommerce() && !is_cart() && !is_checkout() && !is_account_page()) return false;

		add_filter('template_include', array($this, 'resolve_template'), 99);
		
		
		if (is_woocommerce()) { // Virtual pages only
			add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Woocommerce_Woocommerce', 'augment_virtual_pages'));
			add_filter('upfront-views-view_class', array($this, 'override_view'));
		} else {
			add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Woocommerce_Woocommerce', 'augment_singular_pages'));
		}

	}

	public function override_view ($view_class) {
		if ('Upfront_PostsView' === $view_class) return 'Upfront_WooView';

		return $view_class;
	}

	public function resolve_template ($tpl) {
		$wc_path = preg_quote(wp_normalize_path(WC()->plugin_path()), '/');
		$tpl_path = wp_normalize_path($tpl);

		if (!preg_match("/{$wc_path}/", $tpl_path)) return $tpl;

		return locate_template('single.php');
	}

	public static function augment_virtual_pages ($cascade) {
		$item = 'generic';
		if (is_shop()) $item = 'shop';
		if (is_product_taxonomy()) $item = 'product_tax';
		if (is_product()) $item = 'product';

		$spec = false;
		
		$cascade["type"] = "archive";
		$cascade['item'] = "woocommerce-{$item}"; 
		if (!empty($spec)) $cascade['specificity'] = "woocommerce-{$item}-{$spec}"; 

		return $cascade;
	}
	
	public static function augment_singular_pages ($cascade) {
		$item = 'generic';
		if (is_cart()) $item = 'cart';
		if (is_checkout()) $item = 'checkout';
		if (is_checkout_pay_page()) $item = 'payment';
		if (is_account_page()) $item = 'account';

		$spec = get_queried_object_id();
		if (is_view_order_page()) $spec = 'view_order';
		if (is_order_received_page()) $spec = 'order_received';
		if (is_add_payment_method_page()) $spec = 'payment_method';

		if (!empty($spec)) $cascade['specificity'] = "woocommerce-{$item}-{$spec}"; 

		return $cascade;

	public function load_posts () {
		$data = stripslashes_deep($_POST);
		if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is

		$has_woo_item = !empty($data['layout']['item']) && (bool)preg_match('/^woocommerce/', $data['layout']['item']);
		$has_woo_spec = !empty($data['layout']['specificity']) && (bool)preg_match('/^woocommerce/', $data['layout']['specificity']);

		if (!$has_woo_item && !$has_woo_spec) return false;

		$this->_out(new Upfront_JsonResponse_Success(array(
			'posts' => '<div class="upfront-woocommerce_compat upfront-plugin_compat"><p>WooCommerce specific content</p></div>',
			'pagination' => '',
		)));
	}
	}
}
Upfront_Compat_Woocommerce_Woocommerce::serve();




class Upfront_WooView extends Upfront_Object {

	public function get_markup () {
		rewind_posts();
		ob_start();
		woocommerce_content();
		return ob_get_clean();
	}

/*
	public static function default_properties () {
		return Upfront_Posts_PostsData::get_defaults();
	}
*/
}