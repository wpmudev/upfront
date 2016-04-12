<?php

/**
 * Created by PhpStorm.
 * User: samnajian
 * Date: 3/12/16
 * Time: 9:53 PM
 */
class Upfront_Admin_Restrictions
{

    const FORM_NONCE_KEY = "upfront_restrictions_wpnonce";

    const FORM_NONCE_ACTION = "upfront_restriction_save";

    function __construct () {
        if ($this->_can_modify_restrictions()) {
            $save_restriction = add_submenu_page(
                "upfront",
                __("User Restrictions", Upfront::TextDomain),
                __("User Restrictions", Upfront::TextDomain),
                'read',
                Upfront_Admin::$menu_slugs['restrictions'],
                array($this, "render_page")
            );
            add_action( 'load-' . $save_restriction , array($this, 'save_user_restriction') );
        }
    }

    /**
     * Renders the page
     */
    function render_page () {
        if (!$this->_can_modify_restrictions()) wp_die("Nope.");
        
        $roles = $this->_get_roles();
        $content_restrictions = Upfront_Permissions::boot()->get_content_restrictions();
        $admin_restrictions = Upfront_Permissions::boot()->get_admin_restrictions();
        $upload_restrictions = Upfront_Permissions::boot()->get_upload_restrictions();
		$can_edit = ( is_multisite() && is_super_admin() ) || ( current_user_can( 'manage_options' ) && Upfront_Permissions::role( 'administrator', 'modify_restrictions' ) );
        ?>
        <div class="wrap upfront_admin upfront_admin_restrictions">
            <h1><?php esc_html_e("User Restrictions", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
            <form action="<?php echo esc_url( add_query_arg( array("page" => "upfront_restrictions") ) ) ?>" method="post" id="upfront_restrictions_form">
                <div id="upfront_user_restrictions_listing">
                    <ul class="upfront_user_restrictions_head">
                        <li class="upfront_restrictions_functionality_name"><?php esc_html_e("Functionality", Upfront::TextDomain); ?></li>
						<?php if( is_multisite() && is_super_admin() ) { ?>
							<li class="upfront_restriction_role_administrator"><?php esc_html_e( 'Super Admin', 'upfront' ); ?></li>
						<?php } ?>
                        <?php foreach( $roles as $role_id => $role ) { ?>
                            <li class="upfront_restrictions_role_<?php echo $role_id ?>"><?php echo esc_html($role['name']);  ?></li>
                        <?php } ?>
                    </ul>

                    <?php foreach( Upfront_Permissions::boot()->get_upfront_capability_map() as $cap_id => $capability ) { ?>
                        <ul class="upfront_restrictions_functionality_row" data-capability_id="<?php echo esc_attr($cap_id); ?>">
                            <li class="upfront_restrictions_functionality_name"><?php _e($this->_get_cap_label( $cap_id )) ?></li>
							<?php
							// Only multi-site super_admin can see this
							if ( is_multisite() && is_super_admin() ) { ?>
								<li class="upfront_restrictions_functionality_role">
									<span class="role_check_mark"></span>
								</li>
							<?php } ?>
                            <?php foreach( $roles as $role_id => $role ) {
									$user_role_can = Upfront_Permissions::role( $role_id, $cap_id );
								?>
                                <li class="upfront_restrictions_functionality_role" data-role_id="<?php echo esc_attr($role_id); ?>">
									<?php
									// If it's an administrator but have no edit access, show UIs only.
									if ( ! $can_edit ) { ?>
											<?php if ( $user_role_can ) { ?>
												<span class="role_check_mark"></span>
											<?php } else { ?>
												<span class="role_ex_mark"></span>
											<?php } ?>
									<?php
										continue; // No need to go further
									} ?>
                                    <?php if ( $role_id == "administrator" ) { ?>
											<?php if ( ! is_multisite() ) { ?>
												<span class="role_check_mark"></span>
												<!-- hidden input for admin and set to always true for single site -->
												<input  value='1' type="checkbox" name="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" class="upfront_toggle_checkbox" id="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" checked="checked" />
											<?php } else { ?>
												<?php if( ! is_super_admin() ) { ?>
														<?php if( $user_role_can ) { ?>
															<span class="role_check_mark"></span>
														<?php } else { ?>
															<span class="role_ex_mark"></span>
														<?php } ?>
														<input  value='1' type="checkbox" name="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" class="upfront_toggle_checkbox" id="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" <?php checked(true, $user_role_can ); ?>  />
												<?php continue; } ?>
											<?php } ?>
                                    <?php } ?>
									<?php
									/**
									if (in_array($cap_id, $content_restrictions) && !$this->_wp_role_can($role_id, 'edit_posts')) { ?>
                                        <!--<span class="role_ex_mark"></span>-->
                                    <?php } else if (in_array($cap_id, $upload_restrictions) && !$this->_wp_role_can($role_id, 'upload_files')) { ?>
                                    <?php } else if (in_array($cap_id, $admin_restrictions) && !$this->_wp_role_can($role_id, 'manage_options')) {
                                    **/ ?>
                                    <?php if ( $can_edit ) { ?>
                                        <div class="<?php echo $this->_toggle_class($role_id,$cap_id); ?>">
                                            <input  value='1' type="checkbox" name="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" class="upfront_toggle_checkbox" id="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" <?php checked(true, Upfront_Permissions::role( $role_id, $cap_id )); ?> />
                                            <label class="upfront_toggle_label" for="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]">
                                                <span class="upfront_toggle_inner"></span>
                                                <span class="upfront_toggle_switch"></span>
                                            </label>
                                        </div>
                                    <?php } ?>
                                </li>
                            <?php } ?>
                        </ul>
                    <?php } ?>
                </div>
                <?php wp_nonce_field(self::FORM_NONCE_ACTION, self::FORM_NONCE_KEY); ?>
				<?php if ( $can_edit ) { ?>
                <button type="submit" name="upront_restrictions_submit" id="upront_restrictions_submit"><?php esc_attr_e("Save Changes", Upfront::TextDomain); ?></button>
				<?php } ?>
            </form>
        </div>
        <?php
    }
		
    /**
     * Saves the User Restrictions set
     */
    function save_user_restriction () {
        if( !isset( $_POST['upront_restrictions_submit'] ) || !wp_verify_nonce( $_POST[self::FORM_NONCE_KEY], self::FORM_NONCE_ACTION ) ) return;
        if (!$this->_can_modify_restrictions()) return false;

        $restrictions = (array) filter_input( INPUT_POST, "restrictions", FILTER_VALIDATE_BOOLEAN , FILTER_FORCE_ARRAY );
        $this->_update_capabilities($restrictions);
        
        wp_safe_redirect(add_query_arg('saved', true));
        die;
    }

    /**
     * Utility for checking capability on modifying restrictions
     *
     * @return bool
     */
    private function _can_modify_restrictions () {
        if ( current_user_can( 'manage_options' ) ) {
            return true;
        }
        
        $current_user = wp_get_current_user();
        return isset($current_user->roles[0])
            ? Upfront_Permissions::role( $current_user->roles[0], Upfront_Permissions::MODIFY_RESTRICTIONS )
            : Upfront_Permissions::current( Upfront_Permissions::MODIFY_RESTRICTIONS )
        ;
    }


    /**
     * Utility wrapper for WP role capability check
     *
     * @param string $role_id WP role ID
     * @param string $capability WP capability
     *
     * @return bool
     */
    private function _wp_role_can ($role_id, $capability) {
        $role = get_role($role_id);
        if (!is_object($role) || !is_callable(array($role, 'has_cap'))) return false;

        return !!$role->has_cap($capability);
    }
		
	/**
     * Utility for setting default toggle class
     *
     * @return string css classname
     */
    private function _toggle_class ($role_id, $cap_id) {
        $toggle_class = 'upfront_toggle';
        if ( !Upfront_Permissions::role($role_id, $cap_id) ) {
            $toggle_class = ( !$this->_wp_role_can($role_id, 'manage_options') && $cap_id != Upfront_Permissions::BOOT && !Upfront_Permissions::role($role_id, Upfront_Permissions::BOOT) )
                ? 'upfront_toggle hide'
                : 'upfront_toggle'
            ;
        }
        return $toggle_class;
    }

    private function _get_roles(){
        return wp_roles()->roles;
    }

    private function _get_cap_label( $cap_id ){
        $labels = Upfront_Permissions::boot()->get_capability_labels();
        return isset( $labels[$cap_id] ) ? $labels[$cap_id] : sprintf(__("No label set for &quot;%s&quot;", Upfront::TextDomain), $cap_id);
    }
		
    /**
     * Updates all capabilities of each role
     * @param array $restrictions saved
     */
    private function _update_capabilities ( $restrictions ) {
        $output = array();
        $saveables = Upfront_Permissions::boot()->get_saveable_restrictions();

        foreach ($restrictions as $role => $caps) {
            foreach ($caps as $cap => $allowed) {
                if (!$allowed) continue;
                if (!isset($output[$cap])) $output[$cap] = array();
                
                $output[$cap][] = $role;

                // If this role needs saving then let's grant the `Upfront_Permissions::SAVE`
                if (in_array($cap, $saveables)) {
                    if (!isset($output[Upfront_Permissions::SAVE])) $output[Upfront_Permissions::SAVE] = array();
                    if (!in_array($role, $output[Upfront_Permissions::SAVE])) $output[Upfront_Permissions::SAVE][] = $role;
                }
                // All done
            }
        }

        Upfront_Permissions::boot()->set_restrictions($output);
    }
}