<div class="upfront-indented_content">
	<a id="mp-product-top"></a> <!-- Products Filter -->
	<section class="mp_products_filter">
		<form id="mp-products-filter-form" name="mp_products_filter_form" class="mp_form mp_form-products-filter" method="get">
			<div class="mp_form_fields">
				<div class="mp_form_field mp_products_filter_field mp_products_filter_category" data-placeholder="Product Category">
					<label for="mp_product_category" class="mp_form_label">Category</label>
					<div class="select2-container mp_select2" id="s2id_mp-product-category">
						<a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-1">Show All</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen1" class="select2-offscreen"></label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-1" id="s2id_autogen1">
						<div class="select2-drop select2-display-none mp_select2">
							<div class="select2-search select2-search-hidden select2-offscreen">       <label for="s2id_autogen1_search" class="select2-offscreen"></label>       <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="select2-input" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-owns="select2-results-1" id="s2id_autogen1_search" placeholder="">   </div>
							<ul class="select2-results" role="listbox" id="select2-results-1">   </ul>
						</div>
					</div>
					<select name="product_category" id="mp-product-category" class="mp_select2 select2-offscreen" tabindex="-1" title="">
						<option value="-1" selected="selected">Show All</option>
						<option class="level-0" value="29">alpha&nbsp;&nbsp;(5)</option>
						<option class="level-0" value="30">beta&nbsp;&nbsp;(4)</option>
					</select>
				</div>
				<!-- mp_listing_products_category -->
				<div class="mp_form_field mp_products_filter_field mp_products_filter_orderby">
					<label for="mp_sort_orderby" class="mp_form_label">Order By</label>
					<div class="select2-container mp_select2" id="s2id_mp_sort_orderby">
						<a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-2">Default</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen2" class="select2-offscreen">Order By</label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-2" id="s2id_autogen2">
						<div class="select2-drop select2-display-none mp_select2">
							<div class="select2-search select2-search-hidden select2-offscreen">       <label for="s2id_autogen2_search" class="select2-offscreen">Order By</label>       <input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="select2-input" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-owns="select2-results-2" id="s2id_autogen2_search" placeholder="">   </div>
							<ul class="select2-results" role="listbox" id="select2-results-2">   </ul>
						</div>
					</div>
					<select id="mp_sort_orderby" class="mp_select2 select2-offscreen" name="order" tabindex="-1" title="Order By">
						<option value="0-">Default</option>
						<option value="date-desc">Release Date (Latest to Oldest)</option>
						<option value="date-asc">Release Date (Oldest to Latest)</option>
						<option value="title-asc">Name (A-Z)</option>
						<option value="title-desc">Name (Z-A)</option>
						<option value="price-asc">Price (Low to High)</option>
						<option value="price-desc">Price (High to Low)</option>
						<option value="sales-desc">Popularity (Most Popular - Least Popular)</option>
						<option value="sales-asc">Popularity (Least Popular - Most Popular)</option>
					</select>
				</div>
				<!-- mp_products_filter_orderby -->
			</div>
			<input type="hidden" name="page" value="1">
		</form>
		<!-- mp_products_filter_form -->
	</section>
	<!-- end mp_products_filter --> <!-- MP Product List -->
	<section id="mp-products" class="hfeed mp_products mp_products-list">
		<div class="mp_product_item">
			<div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail">
				<div class="mp_product_images">
					<div itemscope="" class="hmedia">
						<div style="display:none"><span class="fn">shop-desktop</span></div>
						<a rel="enclosure" id="mp-product-image-226" class="mp_product_img_link" href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 5"></a>
					</div>
				</div>
				<!-- end mp_product_images -->
				<div class="mp_product_details">
					<div class="mp_product_meta">
						<h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 5</a> </h3>
						<!-- MP Product Price -->
						<div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$444.00<span class="exclusive_tax"> (tax incl.)</span></span></div>
						<!-- end mp_product_price -->
						<div class="mp_social_shares"> </div>
						<!-- end mp_social_shares -->
					</div>
					<!-- end mp_product_meta -->
					<div class="mp_product_callout">
						<form id="mp-buy-product-226-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="226"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form>
						<!-- end mp-buy-product-form -->
					</div>
					<!-- end mp_product_callout -->
				</div>
				<!-- end mp_product_details -->
				<div style="display:none"> <span class="entry-title">Product 5</span> was last modified: <time class="updated">2016-11-03T1:16</time> by <span class="author vcard"><span class="fn">admin</span></span> </div>
			</div>
			<!-- end mp_product -->
		</div>
		<!-- end mp_product_item -->
		<div class="mp_product_item">
			<div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail">
				<div class="mp_product_images">
					<div itemscope="" class="hmedia">
						<div style="display:none"><span class="fn">hero</span></div>
						<a rel="enclosure" id="mp-product-image-224" class="mp_product_img_link" href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 4"></a>
					</div>
				</div>
				<!-- end mp_product_images -->
				<div class="mp_product_details">
					<div class="mp_product_meta">
						<h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 4</a> </h3>
						<!-- MP Product Price -->
						<div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$233.00<span class="exclusive_tax"> (tax incl.)</span></span></div>
						<!-- end mp_product_price -->
						<div class="mp_social_shares"> </div>
						<!-- end mp_social_shares -->
					</div>
					<!-- end mp_product_meta -->
					<div class="mp_product_callout">
						<form id="mp-buy-product-224-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="224"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form>
						<!-- end mp-buy-product-form -->
					</div>
					<!-- end mp_product_callout -->
				</div>
				<!-- end mp_product_details -->
				<div style="display:none"> <span class="entry-title">Product 4</span> was last modified: <time class="updated">2016-11-03T1:15</time> by <span class="author vcard"><span class="fn">admin</span></span> </div>
			</div>
			<!-- end mp_product -->
		</div>
		<!-- end mp_product_item -->
		<div class="mp_product_item">
			<div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail">
				<div class="mp_product_images">
					<div itemscope="" class="hmedia">
						<div style="display:none"><span class="fn">688682740Screenshot-from-2015-09-23-203946</span></div>
						<a rel="enclosure" id="mp-product-image-222" class="mp_product_img_link" href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 3"></a>
					</div>
				</div>
				<!-- end mp_product_images -->
				<div class="mp_product_details">
					<div class="mp_product_meta">
						<h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 3</a> </h3>
						<!-- MP Product Price -->
						<div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$345.00<span class="exclusive_tax"> (tax incl.)</span></span></div>
						<!-- end mp_product_price -->
						<div class="mp_social_shares"> </div>
						<!-- end mp_social_shares -->
					</div>
					<!-- end mp_product_meta -->
					<div class="mp_product_callout">
						<form id="mp-buy-product-222-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="222"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form>
						<!-- end mp-buy-product-form -->
					</div>
					<!-- end mp_product_callout -->
				</div>
				<!-- end mp_product_details -->
				<div style="display:none"> <span class="entry-title">Product 3</span> was last modified: <time class="updated">2016-11-03T1:15</time> by <span class="author vcard"><span class="fn">admin</span></span> </div>
			</div>
			<!-- end mp_product -->
		</div>
		<!-- end mp_product_item -->
		<div class="mp_product_item">
			<div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail">
				<div class="mp_product_images">
					<div itemscope="" class="hmedia">
						<div style="display:none"><span class="fn">shop-desktop</span></div>
						<a rel="enclosure" id="mp-product-image-9" class="mp_product_img_link" href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 2"></a>
					</div>
				</div>
				<!-- end mp_product_images -->
				<div class="mp_product_details">
					<div class="mp_product_meta">
						<h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 2</a> </h3>
						<!-- MP Product Price -->
						<div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$111.00<span class="exclusive_tax"> (tax incl.)</span></span></div>
						<!-- end mp_product_price -->
						<div class="mp_social_shares"> </div>
						<!-- end mp_social_shares -->
					</div>
					<!-- end mp_product_meta -->
					<div class="mp_product_callout">
						<form id="mp-buy-product-9-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="9"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form>
						<!-- end mp-buy-product-form -->
					</div>
					<!-- end mp_product_callout -->
				</div>
				<!-- end mp_product_details -->
				<div style="display:none"> <span class="entry-title">Product 2</span> was last modified: <time class="updated">2016-11-02T7:04</time> by <span class="author vcard"><span class="fn">admin</span></span> </div>
			</div>
			<!-- end mp_product -->
		</div>
		<!-- end mp_product_item -->
		<div class="mp_product_item">
			<div itemscope="" itemtype="http://schema.org/Product" class="mp_product mp_product-has-image mp_product-image-alignleft mp_thumbnail">
				<div class="mp_product_images">
					<div itemscope="" class="hmedia">
						<div style="display:none"><span class="fn">screenshot-from-2015-09-23-203946</span></div>
						<a rel="enclosure" id="mp-product-image-182" class="mp_product_img_link" href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image.png" itemprop="image" class="mp_product_image_list photo" title="Product 1"></a>
					</div>
				</div>
				<!-- end mp_product_images -->
				<div class="mp_product_details">
					<div class="mp_product_meta">
						<h3 class="mp_product_name entry-title" itemprop="name"> <a href="#">Product 1</a> </h3>
						<!-- MP Product Price -->
						<div class="mp_product_price" itemtype="http://schema.org/Offer" itemscope="" itemprop="offers"><span class="mp_product_price-normal" itemprop="price">$32.00<span class="exclusive_tax"> (tax incl.)</span></span></div>
						<!-- end mp_product_price -->
						<div class="mp_social_shares"> </div>
						<!-- end mp_social_shares -->
					</div>
					<!-- end mp_product_meta -->
					<div class="mp_product_callout">
						<form id="mp-buy-product-182-form" class="mp_form mp_form-buy-product mp_no_single " method="post" data-ajax-url="http://local.woo-compat.dev/wp-admin/admin-ajax.php?action=mp_update_cart" action="http://local.woo-compat.dev/store/cart/"><input type="hidden" name="product_id" value="182"><button class="mp_button mp_button-addcart" type="submit" name="addcart">Add To Cart</button></form>
						<!-- end mp-buy-product-form -->
					</div>
					<!-- end mp_product_callout -->
				</div>
				<!-- end mp_product_details -->
				<div style="display:none"> <span class="entry-title">Product 1</span> was last modified: <time class="updated">2016-11-02T18:57</time> by <span class="author vcard"><span class="fn">admin</span></span> </div>
			</div>
			<!-- end mp_product -->
		</div>
		<!-- end mp_product_item -->
	</section>
	<!-- end mp-products -->
</div>
