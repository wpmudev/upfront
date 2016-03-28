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
        if (Upfront_Permissions::current(Upfront_Permissions::MODIFY_RESTRICTIONS)) {
            add_submenu_page(
                "upfront",
                __("User Restrictions", Upfront::TextDomain),
                __("User Restrictions", Upfront::TextDomain),
                'promote_users',
                Upfront_Admin::$menu_slugs['restrictions'],
                array($this, "render_page")
            );
        }
    }

    /**
     * Renders the page
     */
    function render_page () {
        if (!Upfront_Permissions::current(Upfront_Permissions::MODIFY_RESTRICTIONS)) wp_die("Nope.");
        
        $roles = $this->_get_roles();
        $this->_save_form();
        ?>
        <div class="wrap upfront_admin upfront_admin_restrictions">
            <h1><?php esc_html_e("User Restrictions", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
            <form action="<?php echo esc_url( add_query_arg( array("page" => "upfront_restrictions") ) ) ?>" method="post" id="upfront_restrictions_form">
                <div id="upfront_user_restrictions_listing">

                    <ul class="upfront_user_restrictions_head">
                        <li class="upfront_restrictions_functionality_name"><?php esc_html_e("Functionality", Upfront::TextDomain); ?></li>
                        <?php foreach( $roles as $role_id => $role ) { ?>
                            <li class="upfront_restrictions_role_<?php echo $role_id ?>"><?php echo esc_html($role['name']);  ?></li>
                        <?php } ?>
                    </ul>

                    <?php foreach( Upfront_Permissions::boot()->get_upfront_capability_map() as $cap_id => $capability ) { ?>
                        <ul class="upfront_restrictions_functionality_row">
                            <li class="upfront_restrictions_functionality_name"><?php echo _e($this->_get_cap_label( $cap_id )) ?></li>
                            <?php foreach( $roles as $role_id => $role ) { ?>
                                <li class="upfront_restrictions_functionality_role">
                                    <div class="upfront_toggle">
                                        <input  value='1' type="checkbox" name="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" class="upfront_toggle_checkbox" id="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]" <?php checked(true, Upfront_Permissions::role( $role_id, $cap_id )); ?> />
                                        <label class="upfront_toggle_label" for="restrictions[<?php echo esc_attr($role_id); ?>][<?php echo esc_attr($cap_id); ?>]">
                                            <span class="upfront_toggle_inner"></span>
                                            <span class="upfront_toggle_switch"></span>
                                        </label>
                                    </div>
                                </li>
                            <?php } ?>
                        </ul>
                    <?php } ?>
                </div>
                <?php wp_nonce_field(self::FORM_NONCE_ACTION, self::FORM_NONCE_KEY); ?>
                <button type="submit" name="upront_restrictions_submit" id="upront_restrictions_submit"><?php esc_attr_e("Save Changes", Upfront::TextDomain); ?></button>
            </form>
        </div>
        <?php
    }


    private function _get_roles(){
        return wp_roles()->roles;
    }

    private function _get_cap_label( $cap_id ){
        $labels = Upfront_Permissions::boot()->get_capability_labels();
        return isset( $labels[$cap_id] ) ? $labels[$cap_id] : sprintf(__("No label set for &quot;%s&quot;", Upfront::TextDomain), $cap_id);
    }

    private function _save_form(){
        if( !isset( $_POST['upront_restrictions_submit'] ) || !wp_verify_nonce( $_POST[self::FORM_NONCE_KEY], self::FORM_NONCE_ACTION ) ) return;
        if (!current_user_can('manage_options')) return false;

        $restrictions = (array) filter_input( INPUT_POST, "restrictions", FILTER_VALIDATE_BOOLEAN , FILTER_FORCE_ARRAY );
        $this->_update_capabilities($restrictions);

        wp_safe_redirect(add_query_arg('saved', true));
        die;
    }

    /**
     * Updates all capabilities of each role
     * @param array $restrictions saved
     */
    private function _update_capabilities ( $restrictions ) {
        $output = array();
        foreach ($restrictions as $role => $caps) {
            foreach ($caps as $cap => $allowed) {
                if (!$allowed) continue;
                if (!isset($output[$cap])) $output[$cap] = array();
                $output[$cap][] = $role;
            }
        }
        Upfront_Permissions::boot()->set_restrictions($output);
    }
}