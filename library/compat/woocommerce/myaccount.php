<div class="woocommerce">
	<nav class="woocommerce-MyAccount-navigation">
		<ul>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--dashboard is-active"> <a href="#">Dashboard</a> </li>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--orders"> <a href="#">Orders</a> </li>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--downloads"> <a href="#">Downloads</a> </li>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--edit-address"> <a href="#">Addresses</a> </li>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--edit-account"> <a href="#">Account Details</a> </li>
			<li class="woocommerce-MyAccount-navigation-link woocommerce-MyAccount-navigation-link--customer-logout"> <a href="#">Logout</a> </li>
		</ul>
	</nav>
	<div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Dashboard Section</div>
	<div class="woocommerce-MyAccount-content">
		<p> Hello <strong>John</strong> (not John? <a href="#">Sign out</a>)</p>
		<p> From your account dashboard you can view your <a href="#">recent orders</a>, manage your <a href="#">shipping and billing addresses</a> and <a href="#">edit your password and account details</a>.</p>
	</div>
	<div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Orders Section</div>
	<div class="woocommerce-MyAccount-content">
		<table class="woocommerce-MyAccount-orders shop_table shop_table_responsive my_account_orders account-orders-table">
			<thead>
				<tr>
					<th class="order-number"><span class="nobr">Order</span></th>
					<th class="order-date"><span class="nobr">Date</span></th>
					<th class="order-status"><span class="nobr">Status</span></th>
					<th class="order-total"><span class="nobr">Total</span></th>
					<th class="order-actions"><span class="nobr">&nbsp;</span></th>
				</tr>
			</thead>
			<tbody>
				<tr class="order">
					<td class="order-number" data-title="Order"> <a href="#"> #550</a> </td>
					<td class="order-date" data-title="Date"> <time datetime="2016-10-13" title="1476339263">October 13, 2016</time> </td>
					<td class="order-status" data-title="Status"> Processing </td>
					<td class="order-total" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>5,460.00</span> for 7 items </td>
					<td class="order-actions" data-title="&nbsp;"> <a href="#" class="button view">View</a></td>
				</tr>
				<tr class="order">
					<td class="order-number" data-title="Order"> <a href="#"> #90</a> </td>
					<td class="order-date" data-title="Date"> <time datetime="2016-10-05" title="1475660116">October 5, 2016</time> </td>
					<td class="order-status" data-title="Status"> Processing </td>
					<td class="order-total" data-title="Total"> <span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">£</span>1,560.00</span> for 2 items </td>
					<td class="order-actions" data-title="&nbsp;"> <a href="#" class="button view">View</a></td>
				</tr>
			</tbody>
		</table>
	</div>
	<div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Downloads Section</div>
	<div class="woocommerce-MyAccount-content">
		<div class="woocommerce-Message woocommerce-Message--info woocommerce-info"> <a class="woocommerce-Button button" href="#"> Go Shop</a> No downloads available yet.</div>
	</div>
	<div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Addresses Section</div>
	<div class="woocommerce-MyAccount-content">
		<p> The following addresses will be used on the checkout page by default.</p>
		<div class="u-columns woocommerce-Addresses col2-set addresses">
			<div class="u-column1 col-1 woocommerce-Address">
				<header class="woocommerce-Address-title title">
					<h3>Billing Address</h3>
					<a href="#" class="edit">Edit</a>
				</header>
				<address> Name Surname<br>Some Street 10<br>Some City<br>Country<br>21000</address>
			</div>
			<div class="u-column2 col-2 woocommerce-Address">
				<header class="woocommerce-Address-title title">
					<h3>Shipping Address</h3>
					<a href="#" class="edit">Edit</a>
				</header>
				<address> You have not set up this type of address yet.</address>
			</div>
		</div>
	</div>
	<div style="padding: 10px 0; margin: 50px 0 30px; text-align: center; border-top: 1px solid #606060; border-bottom: 1px solid #606060">Account Details Section</div>
	<div class="woocommerce-MyAccount-content">
		<form class="woocommerce-EditAccountForm edit-account" action="" method="post">
			<p class="woocommerce-FormRow woocommerce-FormRow--first form-row form-row-first"> <label for="account_first_name">First name <span class="required">*</span></label> <input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="account_first_name" id="account_first_name" value="Name"> </p>
			<p class="woocommerce-FormRow woocommerce-FormRow--last form-row form-row-last"> <label for="account_last_name">Last name <span class="required">*</span></label> <input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="account_last_name" id="account_last_name" value="Surname"> </p>
			<div class="clear"></div>
			<p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="account_email">Email address <span class="required">*</span></label> <input type="email" class="woocommerce-Input woocommerce-Input--email input-text" name="account_email" id="account_email" value="example@example.com"> </p>
			<fieldset>
				<legend>Password Change</legend>
				<p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_current">Current Password (leave blank to leave unchanged)</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_current" id="password_current"> </p>
				<p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_1">New Password (leave blank to leave unchanged)</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_1" id="password_1"> </p>
				<p class="woocommerce-FormRow woocommerce-FormRow--wide form-row form-row-wide"> <label for="password_2">Confirm New Password</label> <input type="password" class="woocommerce-Input woocommerce-Input--password input-text" name="password_2" id="password_2"> </p>
			</fieldset>
			<div class="clear"></div>
			<p> <input type="submit" class="woocommerce-Button button" name="save_account_details" value="Save changes"></p>
		</form>
	</div>
</div>
