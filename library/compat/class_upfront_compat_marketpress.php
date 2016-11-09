<?php

class Upfront_Compat_MarketPress {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('MarketPress') === false) return;

		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-builder_available_layouts', array($this, 'builder_available_layouts'));
		add_filter('upfront-builder_generate_preview_post', array($this, 'generate_preview_post'), 10, 2);
		add_filter('upfront-builder_fake_content', array($this, 'generate_fake_content'), 10, 2);
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-load_post_fake_post_id', array($this, 'load_post_fake_post_id'), 10, 2);
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-plugins_layouts', array($this, 'add_layouts'));
		add_filter('upfront-post_data_view_classes', array($this, 'add_class'), 10, 2);
	}

	public function add_class($classes, $post) {
		if (in_array($post->ID, array(mp_get_setting('pages->products'), mp_get_setting('pages->cart'), mp_get_setting('pages->store'), mp_get_setting('pages->checkout'), mp_get_setting('pages->order_status')))) {
			return $classes . ' mp-content';
		}
		if ($post->post_type === 'product') return $classes . ' mp-content';

		return $classes;
	}

	public function override_posts_markup_filter ($status) {
		// The scope of the issue this addresses stays with archive page
		if (is_singular()) return $status; // ... so don't do this on singular pages

		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		$content = mp_list_products(array('echo' => false));
		return $this->wrap_with_plugin_class($content);
	}

	public function generate_fake_content($content, $post_id) {
		if (false === in_array($post_id, array('mpcart', 'mpproducts', 'mpproduct', 'mporderstatus'))) return $content;

		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'order-status.php');
		$order_status =  ob_get_clean();

		$mpcart = '<form class="mp_form mp_form-cart" id="mp-cart-form"> <section id="mp-cart" class="mp_cart mp_cart-default  mp_cart-editable"> <div class="mp_cart_item"> <div class="mp_cart_item_content mp_cart_item_content-thumb"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" width="75" height="75"> </div> <div class="mp_cart_item_content mp_cart_item_content-title"><h2 class="mp_cart_item_title"><a href="#">some other product</a></h2> </div> <div class="mp_cart_item_content mp_cart_item_content-price"><div class="mp_product_price"><span class="mp_product_price-extended">$192.00<span class="exclusive_tax"> (tax incl.)</span></span><span class="mp_product_price-each" itemprop="price">($32.00 each) <span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> </div><!-- end mp_cart_item_content --> <div class="mp_cart_item_content mp_cart_item_content-qty"> <div class="select2-container mp_select2" id="s2id_182"><a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-1">6</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen1" class="select2-offscreen"></label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-1" id="s2id_autogen1"><div class="select2-drop select2-display-none mp_select2">   <div class="select2-search select2-search-hidden select2-offscreen">       <label for="s2id_autogen1_search" class="select2-offscreen"></label>       <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="select2-input" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-owns="select2-results-1" id="s2id_autogen1_search" placeholder="">   </div>   <ul class="select2-results" role="listbox" id="select2-results-1">   </ul></div></div><select name="mp_cart_item-qty[182]" class="mp_select2 select2-offscreen" id="182" tabindex="-1" title=""> <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option> <option value="6" selected="selected">6</option> <option value="7">7</option> <option value="8">8</option> <option value="9">9</option> <option value="10">10</option> </select> <a class="mp_cart_item_remove_item" href="#">Remove</a> </div><!-- end mp_cart_item_content --></div><!-- end mp_cart_item --> </section><!-- end mp_cart --> <!-- MP Cart Meta --> <section id="mp-cart-meta" class="mp_cart_meta"> <!-- MP Cart Resume --> <div id="mp-cart-resume" class="mp_cart_resume"> <div class="mp_cart_resume_head"><h3 class="mp_sub_title">Estimated Total</h3></div> <div class="mp_cart_resume_item mp_cart_resume_item-product-total"> <span class="mp_cart_resume_item_label">Product Total</span> <span class="mp_cart_resume_item_amount">$192.00</span> </div><!-- end mp_cart_resume_item_product-total --> <div class="mp_cart_resume_item mp_cart_resume_item-order-total"> <span class="mp_cart_resume_item_label">Estimated Total</span> <span class="mp_cart_resume_item_amount">$192.00</span> </div><!-- end mp_cart_resume_item-order-total --> </div><!-- end mp_cart-resume --> <a href="#" class="mp_button mp_button-continue-shopping mp_button-large">Continue Shopping?</a> <a class="mp_button mp_button-checkout mp_button-padlock mp_button-large mp_tooltip" href="#">Checkout</a> <div class="mp_tooltip_content"><p class="mp-secure-checkout-tooltip-text"><strong>Secure Checkout</strong><br>Shopping is always safe and secure.</p></div> </section><!-- end mp_cart_meta --> </form> ';
		$mpproducts =  ' <div class="upfront-indented_content"> <a id="mp-product-top"></a> <!-- Products Filter --> <section class="mp_products_filter"> <form id="mp-products-filter-form" name="mp_products_filter_form" class="mp_form mp_form-products-filter" method="get"> <div class="mp_form_fields"> <div class="mp_form_field mp_products_filter_field mp_products_filter_category" data-placeholder="Product Category"> <label for="mp_product_category" class="mp_form_label">Category</label> <div class="select2-container mp_select2" id="s2id_mp-product-category"><a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-1">Show All</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen1" class="select2-offscreen"></label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-1" id="s2id_autogen1"><div class="select2-drop select2-display-none mp_select2">   <div class="select2-search select2-search-hidden select2-offscreen">       <label for="s2id_autogen1_search" class="select2-offscreen"></label>       <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="select2-input" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-owns="select2-results-1" id="s2id_autogen1_search" placeholder="">   </div>   <ul class="select2-results" role="listbox" id="select2-results-1">   </ul></div></div><select name="product_category" id="mp-product-category" class="mp_select2 select2-offscreen" tabindex="-1" title=""> <option value="-1" selected="selected">Show All</option> <option class="level-0" value="29">alpha&nbsp;&nbsp;(5)</option> <option class="level-0" value="30">beta&nbsp;&nbsp;(4)</option> </select> </div><!-- mp_listing_products_category --> <div class="mp_form_field mp_products_filter_field mp_products_filter_orderby"> <label for="mp_sort_orderby" class="mp_form_label">Order By</label> <div class="select2-container mp_select2" id="s2id_mp_sort_orderby"><a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-2">Default</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen2" class="select2-offscreen">Order By</label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-2" id="s2id_autogen2"><div class="select2-drop select2-display-none mp_select2">   <div class="select2-search select2-search-hidden select2-offscreen">       <label for="s2id_autogen2_search" class="select2-offscreen">Order By</label>       <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="select2-input" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-owns="select2-results-2" id="s2id_autogen2_search" placeholder="">   </div>   <ul class="select2-results" role="listbox" id="select2-results-2">   </ul></div></div><select id="mp_sort_orderby" class="mp_select2 select2-offscreen" name="order" tabindex="-1" title="Order By"> <option value="0-">Default</option><option value="date-desc">Release Date (Latest to Oldest)</option><option value="date-asc">Release Date (Oldest to Latest)</option><option value="title-asc">Name (A-Z)</option><option value="title-desc">Name (Z-A)</option><option value="price-asc">Price (Low to High)</option><option value="price-desc">Price (High to Low)</option><option value="sales-desc">Popularity (Most Popular - Least Popular)</option><option value="sales-asc">Popularity (Least Popular - Most Popular)</option> </select> </div><!-- mp_products_filter_orderby --> </div> <input type="hidden" name="page" value="1"> </form><!-- mp_products_filter_form --> </section><!-- end mp_products_filter --> <!-- MP Product List --><section id="mp-products" class="hfeed mp_products mp_products-list"> <div class="mp_product_item"> <div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail"> <div class="mp_product_images"> <div itemscope="" class="hmedia"> <div style="display:none"><span class="fn">shop-desktop</span></div><a rel="enclosure" id="mp-product-image-226" class="mp_product_img_link" href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 5"></a> </div> </div><!-- end mp_product_images --> <div class="mp_product_details"> <div class="mp_product_meta"> <h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 5</a> </h3> <!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$444.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> <div class="mp_social_shares"> </div><!-- end mp_social_shares --> </div><!-- end mp_product_meta --> <div class="mp_product_callout"> <form id="mp-buy-product-226-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="226"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --> </div><!-- end mp_product_callout --> </div><!-- end mp_product_details --> <div style="display:none"> <span class="entry-title">Product 5</span> was last modified: <time class="updated">2016-11-03T1:16</time> by <span class="author vcard"><span class="fn">admin</span></span> </div> </div><!-- end mp_product --> </div><!-- end mp_product_item --> <div class="mp_product_item"> <div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail"> <div class="mp_product_images"> <div itemscope="" class="hmedia"> <div style="display:none"><span class="fn">hero</span></div><a rel="enclosure" id="mp-product-image-224" class="mp_product_img_link" href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 4"></a> </div> </div><!-- end mp_product_images --> <div class="mp_product_details"> <div class="mp_product_meta"> <h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 4</a> </h3> <!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$233.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> <div class="mp_social_shares"> </div><!-- end mp_social_shares --> </div><!-- end mp_product_meta --> <div class="mp_product_callout"> <form id="mp-buy-product-224-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="224"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --> </div><!-- end mp_product_callout --> </div><!-- end mp_product_details --> <div style="display:none"> <span class="entry-title">Product 4</span> was last modified: <time class="updated">2016-11-03T1:15</time> by <span class="author vcard"><span class="fn">admin</span></span> </div> </div><!-- end mp_product --> </div><!-- end mp_product_item --> <div class="mp_product_item"> <div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail"> <div class="mp_product_images"> <div itemscope="" class="hmedia"> <div style="display:none"><span class="fn">688682740Screenshot-from-2015-09-23-203946</span></div><a rel="enclosure" id="mp-product-image-222" class="mp_product_img_link" href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 3"></a> </div> </div><!-- end mp_product_images --> <div class="mp_product_details"> <div class="mp_product_meta"> <h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 3</a> </h3> <!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$345.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> <div class="mp_social_shares"> </div><!-- end mp_social_shares --> </div><!-- end mp_product_meta --> <div class="mp_product_callout"> <form id="mp-buy-product-222-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="222"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --> </div><!-- end mp_product_callout --> </div><!-- end mp_product_details --> <div style="display:none"> <span class="entry-title">Product 3</span> was last modified: <time class="updated">2016-11-03T1:15</time> by <span class="author vcard"><span class="fn">admin</span></span> </div> </div><!-- end mp_product --> </div><!-- end mp_product_item --> <div class="mp_product_item"> <div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail"> <div class="mp_product_images"> <div itemscope="" class="hmedia"> <div style="display:none"><span class="fn">shop-desktop</span></div><a rel="enclosure" id="mp-product-image-9" class="mp_product_img_link" href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 2"></a> </div> </div><!-- end mp_product_images --> <div class="mp_product_details"> <div class="mp_product_meta"> <h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 2</a> </h3> <!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$111.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> <div class="mp_social_shares"> </div><!-- end mp_social_shares --> </div><!-- end mp_product_meta --> <div class="mp_product_callout"> <form id="mp-buy-product-9-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="9"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --> </div><!-- end mp_product_callout --> </div><!-- end mp_product_details --> <div style="display:none"> <span class="entry-title">Product 2</span> was last modified: <time class="updated">2016-11-02T7:04</time> by <span class="author vcard"><span class="fn">admin</span></span> </div> </div><!-- end mp_product --> </div><!-- end mp_product_item --> <div class="mp_product_item"> <div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail"> <div class="mp_product_images"> <div itemscope="" class="hmedia"> <div style="display:none"><span class="fn">screenshot-from-2015-09-23-203946</span></div><a rel="enclosure" id="mp-product-image-182" class="mp_product_img_link" href="#"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 1"></a> </div> </div><!-- end mp_product_images --> <div class="mp_product_details"> <div class="mp_product_meta"> <h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 1</a> </h3> <!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$32.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --> <div class="mp_social_shares"> </div><!-- end mp_social_shares --> </div><!-- end mp_product_meta --> <div class="mp_product_callout"> <form id="mp-buy-product-182-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="182"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --> </div><!-- end mp_product_callout --> </div><!-- end mp_product_details --> <div style="display:none"> <span class="entry-title">Product 1</span> was last modified: <time class="updated">2016-11-02T18:57</time> by <span class="author vcard"><span class="fn">admin</span></span> </div> </div><!-- end mp_product --> </div><!-- end mp_product_item --></section><!-- end mp-products --> </div> ';
		$mpproduct = ' <section id="mp-single-product-46" class="mp-single-product" > <div class="mp_product mp_single_product mp_single_product-has-image mp_single_product-image-alignleft"><div class="mp_single_product_images"> <div class="lSSlideOuter  noPager"><div class="lSSlideWrapper usingCss"><ul id="mp-product-gallery" class="mp_product_gallery lightSlider lsGrab lSSlide" style="width: 509px; transform: translate3d(0px, 0px, 0px); height: 385px; padding-bottom: 0%;"><li class="lslide active" style="width: 509px; margin-right: 0px;"><img src="'. get_theme_root_uri() . '/upfront/img/placeholder-image.png"></li></ul><div class="lSAction" style="display: none;"><a class="lSPrev"></a><a class="lSNext"></a></div></div><ul class="lSPager lSGallery" style="margin-top: 5px; transition-duration: 400ms; width: 103.3px; transform: translate3d(0px, 0px, 0px);"></ul></div><!-- end mp_product_gallery --></div><!-- end mp_single_product_images --><div class="mp_single_product_details"><span style="display:none" class="date updated">46</span><div class="mp_product_meta"> <h1 itemprop="name" class="mp_product_name entry-title"><a href="#">Marvelous Product</a></h1><!-- MP Product Price --><div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$234.00<span class="exclusive_tax"> (tax incl.)</span></span></div><!-- end mp_product_price --><div class="mp_product_excerpt"><p>lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf…</p> </div><!-- end mp_product_excerpt --><div class="mp_product_categories">Categorized in <a href="#" rel="tag">alpha</a></div></div><!-- end mp_product_meta--><div class="mp_product_callout"><form id="mp-buy-product-46-form" class="mp_form mp_form-buy-product  " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/" novalidate="novalidate"><input type="hidden" name="product_id" value="46"> <div class="mp_product_options_atts"> <div class="mp_product_options_att"> <strong class="mp_product_options_att_label">Quantity</strong> <div class="mp_form_field mp_product_options_att_field"> <input id="mp_product_options_att_quantity" class="mp_form_input mp_form_input-qty required digits" min="1" max="100" data-msg-max="This product has an order limit of 100." type="number" name="product_quantity" value="1" aria-required="true"> </div><!-- end mp_product_options_att_field --> </div><!-- end mp_product_options_att --> </div><!-- end mp_product_options_atts --><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form><!-- end mp-buy-product-form --><div class="mp_product_tags">Tagged in <a href="#" rel="tag">one</a>, <a href="#" rel="tag">three</a>, <a href="#" rel="tag">two</a></div></div><!-- end mp_product_callout--><div class="mp_social_shares"></div><!-- end mp_social_shares --></div><!-- end mp_single_product_details--><div class="mp_single_product_extra"> <ul class="mp_product_tab_labels"> <li class="mp_product_tab_label current"><a class="mp_product_tab_label_link mp-product-overview" href="#">Description</a></li> </ul><!-- end mp_product_tab_labels --> <div id="mp-product-overview-46" class="mp_product_tab_content mp_product_tab_content-overview mp_product_tab_content-current"> <div itemprop="description" class="mp_product_tab_content_text"><p>lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf lsdjsf </p> </div><!-- end mp_product_tab_content_text --> </div><!-- end mp-product-overview --></div><!-- end mp_single_product_extra --> </div><!-- end mp_product/mp_single_product --> </section>';

		$fake = array(
			'mpcart' => $this->wrap_with_plugin_class($mpcart),
			'mpproducts' => $this->wrap_with_plugin_class($mpproducts),
			'mpproduct' => $this->wrap_with_plugin_class($mpproduct),
			'mporderstatus' => $this->wrap_with_plugin_class($order_status)
		);

		return $fake[$post_id];
	}
	public function generate_preview_post($generate, $post_id) {
		if (in_array($post_id, array('mpcart', 'mpproducts', 'mpproduct', 'mporderstatus'))) return true;
		return $generate;
	}

	public function load_post_fake_post_id($fake_id, $layout) {
		if (!empty($layout['specificity']) && $layout['specificity'] === 'single-page-mpcart') {
			$fake_id = 'mpcart';
		}
		if (!empty($layout['specificity']) && $layout['specificity'] === 'single-page-mpproducts') {
			$fake_id = 'mpproducts';
		}
		if (!empty($layout['specificity']) && $layout['specificity'] === 'single-mpproduct') {
			$fake_id = 'mpproduct';
		}
		if (!empty($layout['specificity']) && $layout['specificity'] === 'single-page-mporderstatus') {
			$fake_id = 'mporderstatus';
		}
		return $fake_id;
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
		// Let's test if a theme supports MarketPress product layouts.
		$theme = Upfront_Theme::get_instance();

		if (!empty($cascade['item']) && 'single-product' === $cascade['item']) {
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
		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'category.php');
		$archive =  ob_get_clean();

		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'single-product.php');
		$single =  ob_get_clean();

		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'store.php');
		$store =  ob_get_clean();

		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'checkout.php');
		$checkout =  ob_get_clean();

		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'marketpress' . DIRECTORY_SEPARATOR . 'order-status.php');
		$order_status =  ob_get_clean();

		$sampleContents = array(
			'archive' => $this->wrap_with_plugin_class($archive),
			'single' => $this->wrap_with_plugin_class($single),
			'store' => $this->wrap_with_plugin_class($store),
			'checkout' => $this->wrap_with_plugin_class($checkout),
			'order_status' => $this->wrap_with_plugin_class($order_status)
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
				)
			)
		);

		return $layouts;
	}

	public function forbidden_post_data_types($types) {
		$post = get_post();
		if (is_null($post)) return $types;

		$is_mp_page = in_array($post->ID, array(mp_get_setting('pages->products'), mp_get_setting('pages->cart'), mp_get_setting('pages->store'), mp_get_setting('pages->checkout'), mp_get_setting('pages->order_status')));
		if ($post->post_type === 'product' || $is_mp_page) {
			$types = array('title', 'date_posted', 'comment_form', 'comment_count', 'comments', 'comments_pagination');
		}
		return $types;
	}

	private function wrap_with_plugin_class($content) {
		return '<div class="mp-content">' . $content . '</div>';
	}
}
