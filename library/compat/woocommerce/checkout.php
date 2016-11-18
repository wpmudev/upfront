<div class="woocommerce">
	<div class="woocommerce-info">Have a coupon? <a href="#" class="showcoupon">Click here to enter your code</a></div>
	<form class="checkout_coupon" style="display:none">
		<p class="form-row form-row-first"> <input type="text" name="coupon_code" class="input-text" placeholder="Coupon code" id="coupon_code" value=""> </p>
		<p class="form-row form-row-last"> <input type="submit" class="button" name="apply_coupon" value="Apply Coupon"> </p>
		<div class="clear"></div>
	</form>
	<form name="checkout" method="post" class="checkout woocommerce-checkout">
		<div class="col2-set" id="customer_details">
			<div class="col-1">
				<div class="woocommerce-billing-fields">
					<h3>Billing Details</h3>
					<p class="form-row form-row form-row-first validate-required woocommerce-validated" id="billing_first_name_field"><label for="billing_first_name" class="">First Name <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_first_name" id="billing_first_name" placeholder="" autocomplete="given-name" value="John" style="background-image: url(&quot;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABHklEQVQ4EaVTO26DQBD1ohQWaS2lg9JybZ+AK7hNwx2oIoVf4UPQ0Lj1FdKktevIpel8AKNUkDcWMxpgSaIEaTVv3sx7uztiTdu2s/98DywOw3Dued4Who/M2aIx5lZV1aEsy0+qiwHELyi+Ytl0PQ69SxAxkWIA4RMRTdNsKE59juMcuZd6xIAFeZ6fGCdJ8kY4y7KAuTRNGd7jyEBXsdOPE3a0QGPsniOnnYMO67LgSQN9T41F2QGrQRRFCwyzoIF2qyBuKKbcOgPXdVeY9rMWgNsjf9ccYesJhk3f5dYT1HX9gR0LLQR30TnjkUEcx2uIuS4RnI+aj6sJR0AM8AaumPaM/rRehyWhXqbFAA9kh3/8/NvHxAYGAsZ/il8IalkCLBfNVAAAAABJRU5ErkJggg==&quot;); background-repeat: no-repeat; background-attachment: scroll; background-size: 16px 18px; background-position: 98% 50%; cursor: pointer;"></p>
					<p class="form-row form-row form-row-last validate-required woocommerce-validated" id="billing_last_name_field"><label for="billing_last_name" class="">Last Name <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_last_name" id="billing_last_name" placeholder="" autocomplete="family-name" value="Smith"></p>
					<div class="clear"></div>
					<p class="form-row form-row form-row-wide" id="billing_company_field"><label for="billing_company" class="">Company Name</label><input type="text" class="input-text " name="billing_company" id="billing_company" placeholder="" autocomplete="organization" value=""></p>
					<p class="form-row form-row form-row-first validate-required validate-email woocommerce-invalid woocommerce-invalid-required-field" id="billing_email_field"><label for="billing_email" class="">Email Address <abbr class="required" title="required">*</abbr></label><input type="email" class="input-text " name="billing_email" id="billing_email" placeholder="" autocomplete="email" value=""></p>
					<p class="form-row form-row form-row-last validate-required validate-phone woocommerce-invalid woocommerce-invalid-required-field" id="billing_phone_field"><label for="billing_phone" class="">Phone <abbr class="required" title="required">*</abbr></label><input type="tel" class="input-text " name="billing_phone" id="billing_phone" placeholder="" autocomplete="tel" value=""></p>
					<div class="clear"></div>
					<p class="form-row form-row form-row-wide address-field update_totals_on_change validate-required woocommerce-validated" id="billing_country_field"><label for="billing_country" class="">Country <abbr class="required" title="required">*</abbr></label>
					<div class="select2-container country_to_state country_select" id="s2id_billing_country" style="width: 100%;"><a href="#" class="select2-choice" tabindex="-1">   <span class="select2-chosen" id="select2-chosen-1">Select a country...</span><abbr class="select2-search-choice-close"></abbr>   <span class="select2-arrow" role="presentation"><b role="presentation"></b></span></a><label for="s2id_autogen1" class="select2-offscreen">Country *</label><input class="select2-focusser select2-offscreen" type="text" aria-haspopup="true" role="button" aria-labelledby="select2-chosen-1" id="s2id_autogen1"></div>
					<select name="billing_country" id="billing_country" autocomplete="country" class="country_to_state country_select " tabindex="-1" title="Country *" style="display: none;">
						<option value="">Select a country…</option>
					</select>
					</p>
					<p class="form-row form-row form-row-wide address-field validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_address_1_field"><label for="billing_address_1" class="">Address <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_address_1" id="billing_address_1" placeholder="Street address" autocomplete="address-line1" value=""></p>
					<p class="form-row form-row form-row-wide address-field" id="billing_address_2_field"><input type="text" class="input-text " name="billing_address_2" id="billing_address_2" placeholder="Apartment, suite, unit etc. (optional)" autocomplete="address-line2" value=""></p>
					<p class="form-row form-row form-row-wide address-field validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_city_field" data-o_class="form-row form-row form-row-wide address-field validate-required"><label for="billing_city" class="">Town / City <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_city" id="billing_city" placeholder="" autocomplete="address-level2" value=""></p>
					<p class="form-row form-row form-row-first address-field validate-state woocommerce-validated" id="billing_state_field" data-o_class="form-row form-row form-row-first address-field validate-required validate-state"><label for="billing_state" class="">County</label><input type="text" class="input-text " value="" placeholder="" autocomplete="address-level1" name="billing_state" id="billing_state"></p>
					<p class="form-row form-row form-row-last address-field validate-postcode validate-required woocommerce-invalid woocommerce-invalid-required-field" id="billing_postcode_field" data-o_class="form-row form-row form-row-last address-field validate-required validate-postcode"><label for="billing_postcode" class="">Postcode <abbr class="required" title="required">*</abbr></label><input type="text" class="input-text " name="billing_postcode" id="billing_postcode" placeholder="" autocomplete="postal-code" value=""></p>
					<div class="clear"></div>
				</div>
			</div>
			<div class="col-2">
				<div class="woocommerce-shipping-fields">
					<h3>Additional Information</h3>
					<p class="form-row form-row notes" id="order_comments_field"><label for="order_comments" class="">Order Notes</label><textarea name="order_comments" class="input-text " id="order_comments" placeholder="Notes about your order, e.g. special notes for delivery." rows="2" cols="5"></textarea></p>
				</div>
			</div>
		</div>
		<h3 id="order_review_heading">Your order</h3>
		<div id="order_review" class="woocommerce-checkout-review-order">
			<table class="shop_table woocommerce-checkout-review-order-table">
				<thead>
					<tr>
						<th class="product-name">Product</th>
						<th class="product-total">Total</th>
					</tr>
				</thead>
				<tbody>
					<tr class="cart_item">
						<td class="product-name">Example product<strong class="product-quantity">× 1</strong>													</td>
						<td class="product-total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>						</td>
					</tr>
				</tbody>
				<tfoot>
					<tr class="cart-subtotal">
						<th>Subtotal</th>
						<td><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></td>
					</tr>
					<tr class="order-total">
						<th>Total</th>
						<td><strong><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></strong> </td>
					</tr>
				</tfoot>
			</table>
			<div id="payment" class="woocommerce-checkout-payment">
				<ul class="wc_payment_methods payment_methods methods">
					<li class="wc_payment_method payment_method_cod">
						<input id="payment_method_cod" type="radio" class="input-radio" name="payment_method" value="cod" checked="checked" data-order_button_text="" style="display: none;"> <label for="payment_method_cod"> Cash on Delivery 	</label>
						<div class="payment_box payment_method_cod">
							<p>Pay with cash upon delivery.</p>
						</div>
					</li>
				</ul>
				<div class="form-row place-order"> <input type="submit" class="button alt" name="woocommerce_checkout_place_order" id="place_order" value="Place order" data-value="Place order"> </div>
			</div>
	</form>
</div>
