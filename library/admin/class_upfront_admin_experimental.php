<?php

class Upfront_Admin_Experimental
{

		const FORM_NONCE_KEY = "upfront_experimental_wpnonce";

    const FORM_NONCE_ACTION = "upfront_experimental_save";

    function __construct(){
        add_submenu_page( "upfront", __("Experimental Features", Upfront::TextDomain),  __("Experimental", Upfront::TextDomain), 'promote_users', Upfront_Admin::$menu_slugs['experimental'], array($this, "render_page") );
    }

    function render_page(){
        ?>
        <div class="wrap upfront_admin upfront_admin_experimental">
            <h1><?php _e("Experimental Features", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
						<div class="upfront_admin_experimental_contents">
								<p class="disclaimer"><?php _e("These are various Experimental Features available to Upfront. Please be careful, some of those settings might interfere with plugins.", Upfront::TextDomain ); ?></p>
								<form action="<?php echo esc_url( add_query_arg( array("page" => "upfront_experimental") ) ) ?>" method="post" id="upfront_experimental_form">
										<div class="form_content">
												<div class="form_title bottom_separator"><span><?php _e("Performance Optimizations", Upfront::TextDomain); ?></span></div>
												<div class="form_content_group clear_after">
														<div class="form_content_group_title"><?php _e("Performance-improving Behavior Changes", Upfront::TextDomain); ?></div>
														<div class="form_content_input float_left">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_optimization_off" />
																		<label class="upfront_toggle_radio_label" for="experimental_optimization_off">
																				<span class="upfront_toggle_radio_button"></span>
																				<span class="upfront_toggle_radio_main_label"><?php _e("Off", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input float_left">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_optimization_on" checked="checked" />
																		<label class="upfront_toggle_radio_label" for="experimental_optimization_on">
																				<span class="upfront_toggle_radio_button"></span>
																				<span class="upfront_toggle_radio_main_label"><?php _e("On", Upfront::TextDomain ); ?></span>
																				<span class="upfront_toggle_radio_sub_label"><?php _e("Turns On the default Optimization", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
												</div>
												<div class="form_content_group">
														<div class="form_content_input">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_aggressive" />
																		<label class="upfront_toggle_radio_label" for="experimental_aggressive">
																				<span class="upfront_toggle_radio_button"></span>
																				<span class="upfront_toggle_radio_main_label"><?php _e("Aggressive", Upfront::TextDomain ); ?></span>
																				<span class="upfront_toggle_radio_sub_label"><?php _e("Debounces WordPress built-in scripts used, and load them asynchronously", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input bottom_separator">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_hardcore" />
																		<label class="upfront_toggle_radio_label" for="experimental_hardcore">
																				<span class="upfront_toggle_radio_button"></span>
																				<span class="upfront_toggle_radio_main_label"><?php _e("Hardcore", Upfront::TextDomain ); ?></span>
																				<span class="upfront_toggle_radio_sub_label"><?php _e("All built-in dependencies as well as jQuery are debounced & moved to footer. (This mode is very likely to break plugins, please use with caution).", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input compress_response">
																<div class="upfront_toggle">
																		<input  value="1" type="checkbox" name="experimental_compress_response" id="experimental_compress_response" class="upfront_toggle_checkbox" />
																		<label class="upfront_toggle_label" for="experimental_compress_response">
																				<span class="upfront_toggle_inner"></span>
																				<span class="upfront_toggle_switch"></span>
																		</label>
																</div>
																<div class="upfront_toggle_description">
																		<span class="upfront_toggle_checkbox_main_label"><?php _e("Enable Upfront Compress Response", Upfront::TextDomain ); ?></span>
																		<span class="upfront_toggle_checkbox_sub_label"><?php _e("Applies GZip compression to all Upfront-generated responses (AJAX)", Upfront::TextDomain ); ?></span>
																</div>
														</div>
												</div>
										</div>
										<?php wp_nonce_field(self::FORM_NONCE_ACTION, self::FORM_NONCE_KEY); ?>
										<button type="submit" name="upront_restrictions_submit" id="upront_restrictions_submit"><?php _e("Save Changes", Upfront::TextDomain); ?></button>
								</form>
						</div>
        </div>
        <?php
    }
}