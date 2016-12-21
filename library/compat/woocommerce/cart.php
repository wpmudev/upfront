<div class="woocommerce">
	<form action="">
		<table class="shop_table shop_table_responsive cart" cellspacing="0">
			<thead>
				<tr>
					<th class="product-remove">&nbsp;</th>
					<th class="product-thumbnail">&nbsp;</th>
					<th class="product-name">Product</th>
					<th class="product-price">Price</th>
					<th class="product-quantity">Quantity</th>
					<th class="product-subtotal">Total</th>
				</tr>
			</thead>
			<tbody>
				<tr class="cart_item">
					<td class="product-remove"> <a href="#" class="remove" title="Remove this item" >×</a>					</td>
					<td class="product-thumbnail"> <a href="#"><img src="<?php echo get_theme_root_uri() ?>/upfront/img/placeholder-image-32x32.png" class="attachment-shop_thumbnail size-shop_thumbnail wp-post-image" alt="Some caption" ></a>					</td>
					<td class="product-name" data-title="Product"> <a href="#">Product title</a>					</td>
					<td class="product-price" data-title="Price"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>					</td>
					<td class="product-quantity" data-title="Quantity">
						<div class="quantity"> <input type="number" step="1" min="0" max="" value="1" title="Qty" class="input-text qty text" size="4"> </div>
					</td>
					<td class="product-subtotal" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span>					</td>
				</tr>
				<tr>
					<td colspan="6" class="actions">
						<div class="coupon"> <label for="coupon_code">Coupon:</label> <input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="Coupon code"> <input type="submit" class="button" name="apply_coupon" value="Apply Coupon"> </div>
						<input type="submit" class="button" name="update_cart" value="Update Cart" disabled="">
				</tr>
			</tbody>
		</table>
	</form>
	<div class="cart-collaterals">
		<div class="cart_totals calculated_shipping">
			<h2>Cart Totals</h2>
			<table cellspacing="0" class="shop_table shop_table_responsive">
				<tbody>
					<tr class="cart-subtotal">
						<th>Subtotal</th>
						<td data-title="Subtotal"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></td>
					</tr>
					<tr class="order-total">
						<th>Total</th>
						<td data-title="Total"><strong><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>780.00</span></strong> </td>
					</tr>
				</tbody>
			</table>
			<div class="wc-proceed-to-checkout"> <a href="#" class="checkout-button button alt wc-forward"> Proceed to Checkout</a> </div>
		</div>
	</div>
</div>
