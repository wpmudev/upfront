<?php

class Upfront_Admin_Experimental extends Upfront_Admin_Page {

	const FORM_NONCE_KEY = "upfront_experimental_wpnonce";

    const FORM_NONCE_ACTION = "upfront_experimental_save";

    public function __construct () {
		if ($this->_can_access( Upfront_Permissions::SEE_USE_DEBUG )) {
			add_submenu_page( "upfront", __("Experimental Features", Upfront::TextDomain),  __("Experimental", Upfront::TextDomain), 'manage_options', Upfront_Admin::$menu_slugs['experimental'], array($this, "render_page") );
		}
	}

    /**
     * Validates and saves data submitted via POST request
     *
     * @return bool
     */
    private function _save_settings () {
    	if (empty($_POST)) return false;
    	if (!current_user_can('manage_options')) return false;

    	$input = stripslashes_deep($_POST);
    	
    	// Check required fields
    	if (!isset($input['upront_experiments_submit']) || empty($input[self::FORM_NONCE_KEY])) return false;
    	if (!wp_verify_nonce($input[self::FORM_NONCE_KEY], self::FORM_NONCE_ACTION)) return false;

    	$compression = Upfront_Behavior::compression();
    	$options = $compression->get_options();

    	$all_levels = $compression->get_known_compression_levels();
    	$options['level'] = !empty($input['experimental_optimization']) && in_array($input['experimental_optimization'], array_keys($all_levels))
    		? $input['experimental_optimization']
    		: false
    	;

    	$options['compression'] = !empty($input['experimental_compress_response']);

    	$result = $compression->set_options($options);

    	// Re-parse options on successful save
    	if (!empty($result)) $compression->reload();

    	return $result;
    }

    public function render_page () {
    	if (!current_user_can('manage_options')) wp_die('Nope.');
    	$this->_save_settings();

    	$compression = Upfront_Behavior::compression();

        ?>
        <div class="wrap upfront_admin upfront_admin_experimental">
            <h1><?php _e("Experimental Features", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
						<div class="upfront_admin_experimental_contents">
								<p class="info">
									<?php esc_html_e("These are various Experimental Features available to Upfront. Please be careful, some of those settings might interfere with plugins.", Upfront::TextDomain ); ?>
								</p>
								<form action="<?php echo esc_url( add_query_arg( array("page" => "upfront_experimental") ) ) ?>" method="post" id="upfront_experimental_form">
										<div class="form_content">
												<div class="form_title bottom_separator">
													<span><?php esc_html_e("Performance Optimizations", Upfront::TextDomain); ?></span>
												</div>
												<div class="form_content_group clear_after">
														<div class="form_content_group_title">
															<?php esc_html_e("Performance-improving Behavior Changes", Upfront::TextDomain); ?>
														</div>
														<div class="form_content_input float_left">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_optimization_off" <?php checked(false, $compression->has_experiments()); ?> value="" />
																		<label class="upfront_toggle_radio_label" for="experimental_optimization_off">
																			<span class="upfront_toggle_radio_button"></span>
																			<span class="upfront_toggle_radio_main_label"><?php esc_html_e("Off", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input float_left">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_optimization_on" <?php checked(true, $compression->has_experiments_level('default')); ?> value="<?php echo esc_attr($compression->constant('default')); ?>" />
																		<label class="upfront_toggle_radio_label" for="experimental_optimization_on">
																			<span class="upfront_toggle_radio_button"></span>
																			<span class="upfront_toggle_radio_main_label"><?php esc_html_e("On", Upfront::TextDomain ); ?></span>
																			<span class="upfront_toggle_radio_sub_label"><?php esc_html_e("Turns On the default Optimization", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
												</div>
												<div class="form_content_group">
														<div class="form_content_input">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_aggressive" <?php checked(true, $compression->has_experiments_level('aggressive')); ?> value="<?php echo esc_attr($compression->constant('aggressive')); ?>" />
																		<label class="upfront_toggle_radio_label" for="experimental_aggressive">
																			<span class="upfront_toggle_radio_button"></span>
																			<span class="upfront_toggle_radio_main_label"><?php esc_html_e("Aggressive", Upfront::TextDomain ); ?></span>
																			<span class="upfront_toggle_radio_sub_label"><?php esc_html_e("Debounces WordPress built-in scripts used, and load them asynchronously", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input bottom_separator">
																<div class="upfront_toggle_radio">
																		<input type="radio" name="experimental_optimization" id="experimental_hardcore" <?php checked(true, $compression->has_experiments_level('hardcore')); ?> value="<?php echo esc_attr($compression->constant('hardcore')); ?>" />
																		<label class="upfront_toggle_radio_label" for="experimental_hardcore">
																			<span class="upfront_toggle_radio_button"></span>
																			<span class="upfront_toggle_radio_main_label"><?php esc_html_e("Hardcore", Upfront::TextDomain ); ?></span>
																			<span class="upfront_toggle_radio_sub_label"><?php esc_html_e("All built-in dependencies as well as jQuery are debounced & moved to footer. (This mode is very likely to break plugins, please use with caution).", Upfront::TextDomain ); ?></span>
																		</label>
																</div>
														</div>
														<div class="form_content_input compress_response">
																<div class="upfront_toggle">
																		<input value="1" <?php checked(true, $compression->has_compression()); ?> type="checkbox" name="experimental_compress_response" id="experimental_compress_response" class="upfront_toggle_checkbox" />
																		<label class="upfront_toggle_label" for="experimental_compress_response">
																			<span class="upfront_toggle_inner"></span>
																			<span class="upfront_toggle_switch"></span>
																		</label>
																</div>
																<div class="upfront_toggle_description">
																	<span class="upfront_toggle_checkbox_main_label"><?php esc_html_e("Enable Upfront Compress Response", Upfront::TextDomain ); ?></span>
																	<span class="upfront_toggle_checkbox_sub_label"><?php esc_html_e("Applies GZip compression to all Upfront-generated responses (AJAX)", Upfront::TextDomain ); ?></span>
																</div>
														</div>
												</div>
										</div>
										<?php wp_nonce_field(self::FORM_NONCE_ACTION, self::FORM_NONCE_KEY); ?>
										<button type="submit" name="upront_experiments_submit" id="upront_restrictions_submit"><?php esc_html_e("Save Changes", Upfront::TextDomain); ?></button>
								</form>
						</div>
        </div>
        <?php
    }
}