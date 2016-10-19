<?php

class Upfront_Compat_WooCommerce {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('woocommerce') === false) return;

		add_action('after_setup_theme', array($this, 'add_woocommerce_support'));
		add_filter('template_include', array($this, 'override_single_product_tpl'), 99, 3);
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-post_data-get_content-before', array($this, 'override_single_product_filter'));
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-plugins_layouts', array($this, 'add_woocommerce_layouts'));
		add_filter('upfront-postdata_get_markup_before', array($this, 'override_postdata_content'), 10, 2);
		add_filter('upfront-override_post_parts', array($this, 'override_post_parts'), 10, 2);
		add_filter('upfront-widget_plugins_widgets', array($this, 'declare_plugins_widgets'));
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
		if (!empty($cascade['item']) && 'single-product' === $cascade['item']) {
			// Let's test if a theme supports Woo product layouts.
			// As in, does this theme have single-product ready-made layouts?
			$theme = Upfront_Theme::get_instance();

			// If it doesn't, let's emulate - we'll be single pages here
			if (!$theme->has_theme_layout('single-product')) $cascade['item'] = 'single-page';
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
		$sampleContents = array(
			'single-product' => '<div class="woocommerce"> <div itemscope="" itemtype="http://schema.org/Product" class="product type-product status-publish has-post-thumbnail product_first instock shipping-taxable purchasable product-type-simple"> <div class="images"> <a href="#" itemprop="image" class="woocommerce-main-image zoom" title="Some caption" data-rel="prettyPhoto"><img width="350" height="350" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_single size-shop_single wp-post-image" alt="Some caption" title="Some title"></a></div> <div class="summary entry-summary"> <h1 itemprop="name" class="product_title entry-title">Product title</h1><div itemprop="offers" itemscope="" itemtype="http://schema.org/Offer"> <p class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></p> </div> <div itemprop="description"> <p>Product short description</p> </div> <form class="cart" method="post" enctype="multipart/form-data"> <div class="quantity"> <input type="number" step="1" min="1" max="" name="quantity" value="1" title="Qty" class="input-text qty text" size="4" pattern="[0-9]*" inputmode="numeric"> </div> <input type="hidden" name="add-to-cart" value="36"> <button type="submit" class="single_add_to_cart_button button alt">Add to cart</button> </form> <div class="product_meta"> <span class="posted_in">Categories: <a href="http://local.woo-compat.dev/product-category/alpha/" rel="tag">alpha</a>, <a href="http://local.woo-compat.dev/product-category/beta/" rel="tag">beta</a></span> <span class="tagged_as">Tags: <a href="http://local.woo-compat.dev/product-tag/one/" rel="tag">one</a>, <a href="http://local.woo-compat.dev/product-tag/three/" rel="tag">three</a>, <a href="http://local.woo-compat.dev/product-tag/two/" rel="tag">two</a></span> </div> </div><!-- .summary --> <div class="woocommerce-tabs wc-tabs-wrapper"> <ul class="tabs wc-tabs"> <li class="description_tab active"> <a href="#tab-description">Description</a> </li> <li class="reviews_tab"> <a href="#tab-reviews">Reviews (0)</a> </li> </ul> <div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--description panel entry-content wc-tab" id="tab-description" style="display: block;"> <h2>Product Description</h2> <p>This is product long description</p> </div> </div> <div class="related products"> <h2>Related Products</h2> <ul class="products"> <li class="post-44 product type-product status-publish has-post-thumbnail product_cat-beta product_tag-one first instock shipping-taxable purchasable product-type-simple"> <a href="http://local.woo-compat.dev/product/simpprod-2054-35-lilac-girl-8/" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Some caption" title="2054-35 lilac girl" ><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> </ul> </div></div>',
			'cart' => '<div class="woocommerce"> <form action=""> <table class="shop_table shop_table_responsive cart" cellspacing="0"> <thead> <tr> <th class="product-remove">&nbsp;</th> <th class="product-thumbnail">&nbsp;</th> <th class="product-name">Product</th> <th class="product-price">Price</th> <th class="product-quantity">Quantity</th> <th class="product-subtotal">Total</th> </tr> </thead> <tbody> <tr class="cart_item"> <td class="product-remove"> <a href="#" class="remove" title="Remove this item" >×</a>					</td> <td class="product-thumbnail"> <a href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image-32x32.png" class="attachment-shop_thumbnail size-shop_thumbnail wp-post-image" alt="Some caption" ></a>					</td> <td class="product-name" data-title="Product"> <a href="#">Product title</a>					</td> <td class="product-price" data-title="Price"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>					</td> <td class="product-quantity" data-title="Quantity"> <div class="quantity"> <input type="number" step="1" min="0" max="" value="1" title="Qty" class="input-text qty text" size="4"> </div> </td> <td class="product-subtotal" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>					</td> </tr> <tr> <td colspan="6" class="actions"> <div class="coupon"> <label for="coupon_code">Coupon:</label> <input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="Coupon code"> <input type="submit" class="button" name="apply_coupon" value="Apply Coupon"> </div> <input type="submit" class="button" name="update_cart" value="Update Cart" disabled=""> </tr> </tbody> </table> </form> <div class="cart-collaterals"> <div class="cart_totals calculated_shipping"> <h2>Cart Totals</h2> <table cellspacing="0" class="shop_table shop_table_responsive"> <tbody><tr class="cart-subtotal"> <th>Subtotal</th> <td data-title="Subtotal"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></td> </tr> <tr class="order-total"> <th>Total</th> <td data-title="Total"><strong><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></strong> </td> </tr> </tbody></table> <div class="wc-proceed-to-checkout"> <a href="#" class="checkout-button button alt wc-forward"> Proceed to Checkout</a> </div> </div> </div> </div>',
			'checkout' => '<div class="woocommerce"> <div class="woocommerce-info">Have a coupon? <a href="#" class="showcoupon">Click here to enter your code</a></div> <form class="checkout_coupon" style="display:none"> <p class="form-row form-row-first"> <input type="text" name="coupon_code" class="input-text" placeholder="Coupon code" id="coupon_code" value=""> </p> <p class="form-row form-row-last"> <input type="submit" class="button" name="apply_coupon" value="Apply Coupon"> </p> <div class="clear"></div> </form> <form name="checkout" method="post" class="checkout woocommerce-checkout"> <div class="col2-set" id="customer_details"> <div class="col-1"> <div class="woocommerce-billing-fields"> <h3>Billing Details</h3> <p class="form-row form-row form-row-first validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_first_name_field"><label for="billing_first_name" class="">First Name <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_first_name" id="billing_first_name" placeholder="" autocomplete="given-name" value="" style="background-image: url(&quot;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABHklEQVQ4EaVTO26DQBD1ohQWaS2lg9JybZ+AK7hNwx2oIoVf4UPQ0Lj1FdKktevIpel8AKNUkDcWMxpgSaIEaTVv3sx7uztiTdu2s/98DywOw3Dued4Who/M2aIx5lZV1aEsy0+qiwHELyi+Ytl0PQ69SxAxkWIA4RMRTdNsKE59juMcuZd6xIAFeZ6fGCdJ8kY4y7KAuTRNGd7jyEBXsdOPE3a0QGPsniOnnYMO67LgSQN9T41F2QGrQRRFCwyzoIF2qyBuKKbcOgPXdVeY9rMWgNsjf9ccYesJhk3f5dYT1HX9gR0LLQR30TnjkUEcx2uIuS4RnI+aj6sJR0AM8AaumPaM/rRehyWhXqbFAA9kh3/8/NvHxAYGAsZ/il8IalkCLBfNVAAAAABJRU5ErkJggg==&quot;); background-repeat: no-repeat; background-attachment: scroll; background-size: 16px 18px; background-position: 98% 50%; cursor: pointer;"></p> <p class="form-row form-row form-row-last validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_last_name_field"><label for="billing_last_name" class="">Last Name <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_last_name" id="billing_last_name" placeholder="" autocomplete="family-name" value=""></p><div class="clear"></div> <p class="form-row form-row form-row-wide" id="billing_company_field"><label for="billing_company" class="">Company Name</label><input type="text" class="input-text " name="billing_company" id="billing_company" placeholder="" autocomplete="organization" value=""></p> <p class="form-row form-row form-row-first validate-required validate-email woocommerce-invalid woocommerce-invalid-required-field" id="billing_email_field"><label for="billing_email" class="">Email Address <abbr class="required" title="required">*</abbr></label><input type="email" class="input-text " name="billing_email" id="billing_email" placeholder="" autocomplete="email" value=""></p> <p class="form-row form-row form-row-last validate-required validate-phone woocommerce-invalid woocommerce-invalid-required-field" id="billing_phone_field"><label for="billing_phone" class="">Phone <abbr class="required" title="required">*</abbr></label><input type="tel" class="input-text " name="billing_phone" id="billing_phone" placeholder="" autocomplete="tel" value=""></p><div class="clear"></div> <p class="form-row form-row form-row-wide address-field update_totals_on_change validate-required woocommerce-validated" id="billing_country_field"><label for="billing_country" class="">Country <abbr class="required" title="required">*</abbr></label><div class="select2-container country_to_state country_select" id="s2id_billing_country" style="width: 100%;"><a href="javascript:void(0)" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-1">Select a country...</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen1" class="select2-offscreen">Country *</label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-1" id="s2id_autogen1"></div><select name="billing_country" id="billing_country" autocomplete="country" class="country_to_state country_select " tabindex="-1" title="Country *" style="display: none;"><option value="">Select a country…</option></select></p> <p class="form-row form-row form-row-wide address-field validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_address_1_field"><label for="billing_address_1" class="">Address <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_address_1" id="billing_address_1" placeholder="Street address" autocomplete="address-line1" value=""></p> <p class="form-row form-row form-row-wide address-field" id="billing_address_2_field"><input type="text" class="input-text " name="billing_address_2" id="billing_address_2" placeholder="Apartment, suite, unit etc. (optional)" autocomplete="address-line2" value=""></p> <p class="form-row form-row form-row-wide address-field validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_city_field" data-o_class="form-row form-row form-row-wide address-field validate-required"><label for="billing_city" class="">Town / City <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_city" id="billing_city" placeholder="" autocomplete="address-level2" value=""></p> <p class="form-row form-row form-row-first address-field validate-state woocommerce-validated" id="billing_state_field" data-o_class="form-row form-row form-row-first address-field validate-required validate-state"><label for="billing_state" class="">County</label><input type="text" class="input-text " value="" placeholder="" autocomplete="address-level1" name="billing_state" id="billing_state"></p><p class="form-row form-row form-row-last address-field validate-postcode validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_postcode_field" data-o_class="form-row form-row form-row-last address-field validate-required validate-postcode"><label for="billing_postcode" class="">Postcode <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_postcode" id="billing_postcode" placeholder="" autocomplete="postal-code" value=""></p> <div class="clear"></div> </div> </div> <div class="col-2"> <div class="woocommerce-shipping-fields"> <h3>Additional Information</h3> <p class="form-row form-row notes" id="order_comments_field"><label for="order_comments" class="">Order Notes</label><textarea name="order_comments" class="input-text " id="order_comments" placeholder="Notes about your order, e.g. special notes for delivery." rows="2" cols="5"></textarea></p> </div> </div> </div> <h3 id="order_review_heading">Your order</h3> <div id="order_review" class="woocommerce-checkout-review-order"> <table class="shop_table woocommerce-checkout-review-order-table"> <thead> <tr> <th class="product-name">Product</th> <th class="product-total">Total</th> </tr> </thead> <tbody> <tr class="cart_item"> <td class="product-name"> SimpProd 2054-35 lilac girl&nbsp;							 <strong class="product-quantity">× 1</strong>													</td> <td class="product-total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>						</td> </tr> </tbody> <tfoot> <tr class="cart-subtotal"> <th>Subtotal</th> <td><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></td> </tr> <tr class="order-total"> <th>Total</th> <td><strong><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></strong> </td> </tr> </tfoot> </table> <div id="payment" class="woocommerce-checkout-payment"> <ul class="wc_payment_methods payment_methods methods"> <li class="wc_payment_method payment_method_cod"> <input id="payment_method_cod" type="radio" class="input-radio" name="payment_method" value="cod" checked="checked" data-order_button_text="" style="display: none;"> <label for="payment_method_cod"> Cash on Delivery 	</label> <div class="payment_box payment_method_cod"> <p>Pay with cash upon delivery.</p> </div> </li> </ul> <div class="form-row place-order"> <input type="submit" class="button alt" name="woocommerce_checkout_place_order" id="place_order" value="Place order" data-value="Place order"> </div> </div> </form> </div>',
			'myaccount' => '<div class="woocommerce"> <nav class="woocommerce-MyAccount-navigation"> <ul> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--dashboard is-active"> <a href="#">Dashboard</a> </li> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--orders"> <a href="#">Orders</a> </li> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--downloads"> <a href="#">Downloads</a> </li> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--edit-address"> <a href="#">Addresses</a> </li> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--edit-account"> <a href="#">Account Details</a> </li> <li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--customer-logout"> <a href="#">Logout</a> </li> </ul> </nav> <div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Dashboard Section</div> <div class="woocommerce-MyAccount-content"> <p> Hello <strong>John</strong> (not John? <a href="#">Sign out</a>)</p> <p> From your account dashboard you can view your <a href="#">recent orders</a>, manage your <a href="#">shipping and billing addresses</a> and <a href="#">edit your password and account details</a>.</p> </div> <div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Orders Section</div> <div class="woocommerce-MyAccount-content"> <table class="woocommerce-MyAccount-orders shop_table shop_table_responsive my_account_orders account-orders-table"> <thead> <tr> <th class="order-number"><span class="nobr">Order</span></th> <th class="order-date"><span class="nobr">Date</span></th> <th class="order-status"><span class="nobr">Status</span></th> <th class="order-total"><span class="nobr">Total</span></th> <th class="order-actions"><span class="nobr">&nbsp;</span></th> </tr> </thead> <tbody> <tr class="order"> <td class="order-number" data-title="Order"> <a href="#"> #550</a> </td> <td class="order-date" data-title="Date"> <time datetime="2016-10-13" title="1476339263">October 13, 2016</time> </td> <td class="order-status" data-title="Status"> Processing </td> <td class="order-total" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>5,460.00</span> for 7 items </td> <td class="order-actions" data-title="&nbsp;"> <a href="#" class="button view">View</a></td> </tr> <tr class="order"> <td class="order-number" data-title="Order"> <a href="#"> #90</a> </td> <td class="order-date" data-title="Date"> <time datetime="2016-10-05" title="1475660116">October 5, 2016</time> </td> <td class="order-status" data-title="Status"> Processing </td> <td class="order-total" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>1,560.00</span> for 2 items </td> <td class="order-actions" data-title="&nbsp;"> <a href="#" class="button view">View</a></td> </tr> </tbody> </table> </div> <div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Downloads Section</div> <div class="woocommerce-MyAccount-content"> <div class="woocommerce-Message woocommerce-Message--info woocommerce-info"> <a class="woocommerce-Button button" href="#"> Go Shop</a> No downloads available yet.</div> </div> <div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Addresses Section</div> <div class="woocommerce-MyAccount-content"> <p> The following addresses will be used on the checkout page by default.</p> <div class="u-columns woocommerce-Addresses col2-set addresses"> <div class="u-column1 col-1 woocommerce-Address"> <header class="woocommerce-Address-title title"> <h3>Billing Address</h3> <a href="#" class="edit">Edit</a> </header> <address> Name Surname<br>Some Street 10<br>Some City<br>Country<br>21000</address> </div> <div class="u-column2 col-2 woocommerce-Address"> <header class="woocommerce-Address-title title"> <h3>Shipping Address</h3> <a href="#" class="edit">Edit</a> </header> <address> You have not set up this type of address yet.</address> </div> </div> </div> <div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Account Details Section</div> <div class="woocommerce-MyAccount-content"> <form class="woocommerce-EditAccountForm edit-account" action="" method="post"> <p class="woocommerce-FormRow woocommerce-FormRow--first form-row form-row-first"> <label for="account_first_name">First name <span class="required">*</span></label> <input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="account_first_name" id="account_first_name" value="Name"> </p> <p class="woocommerce-FormRow woocommerce-FormRow--last form-row form-row-last"> <label for="account_last_name">Last name <span class="required">*</span></label> <input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="account_last_name" id="account_last_name" value="Surname"> </p> <div class="clear"></div> <p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="account_email">Email address <span class="required">*</span></label> <input type="email" class="woocommerce-Input woocommerce-Input--email input-text" name="account_email" id="account_email" value="example@example.com"> </p> <fieldset> <legend>Password Change</legend> <p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_current">Current Password (leave blank to leave unchanged)</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_current" id="password_current"> </p> <p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_1">New Password (leave blank to leave unchanged)</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_1" id="password_1"> </p> <p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_2">Confirm New Password</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_2" id="password_2"> </p> </fieldset> <div class="clear"></div> <p> <input type="submit" class="woocommerce-Button button" name="save_account_details" value="Save changes"></p> </form> </div> </div>',
			'shop' => '<div class="woocommerce"> <h1 class="page-title">Page Title</h1> <p class="woocommerce-result-count"> Showing 1–5 of 7 results</p> <form class="woocommerce-ordering" method="get"> <select name="orderby" class="orderby"> <option value="menu_order" selected="selected">Default sorting</option> <option value="popularity">Sort by popularity</option> <option value="rating">Sort by average rating</option> <option value="date">Sort by newness</option> <option value="price">Sort by price: low to high</option> <option value="price-desc">Sort by price: high to low</option> </select> </form> <ul class="products"> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> </ul> <nav class="woocommerce-pagination"> <ul class="page-numbers"> <li><span class="page-numbers current">1</span></li> <li><a class="page-numbers" href="#">2</a></li> <li><a class="next page-numbers" href="#">→</a></li> </ul> </nav> </div>',
			'archive-product' => '<div class="woocommerce"> <h1 class="page-title">Page Title</h1> <p class="woocommerce-result-count"> Showing 1–5 of 7 results</p> <form class="woocommerce-ordering" method="get"> <select name="orderby" class="orderby"> <option value="menu_order" selected="selected">Default sorting</option> <option value="popularity">Sort by popularity</option> <option value="rating">Sort by average rating</option> <option value="date">Sort by newness</option> <option value="price">Sort by price: low to high</option> <option value="price-desc">Sort by price: high to low</option> </select> </form> <ul class="products"> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> <li class="product type-product status-publish has-post-thumbnail instock shipping-taxable purchasable product-type-simple"> <a href="#" class="woocommerce-LoopProduct-link"><img width="300" height="300" src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="Example caption" title="Example title"><h3>Product title</h3> <span class="price"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></span> </a><a rel="nofollow" href="#" data-quantity="1" data-product_id="36" data-product_sku="" class="button product_type_simple add_to_cart_button ajax_add_to_cart">Add to cart</a></li> </ul> <nav class="woocommerce-pagination"> <ul class="page-numbers"> <li><span class="page-numbers current">1</span></li> <li><a class="page-numbers" href="#">2</a></li> <li><a class="next page-numbers" href="#">→</a></li> </ul> </nav> </div>'
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
				)
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
}
