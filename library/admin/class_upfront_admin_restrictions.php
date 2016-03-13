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

    function __construct()
    {
        add_submenu_page( "upfront", __("User Restrictions", Upfront::TextDomain),  __("User Restrictions", Upfront::TextDomain), 'promote_users', Upfront_Admin::$menu_slugs['restrictions'], array($this, "render_page") );
    }

    /**
     * Renders the page
     */
    function render_page(){
        $roles = $this->_get_roles();
        $this->_save_form();
        ?>
        <div class="wrap upfront_admin upfront_admin_restrictions">
            <h1><?php _e("User Restrictions", Upfront::TextDomain); ?><span class="upfront-logo"></span></h1>
            <form action="<?php echo esc_url( add_query_arg( array("page" => "upfront_restrictions") ) ) ?>" method="post" id="upfront_restrictions_form">
                <div id="upfront_user_restrictions_listing">

                        <ul class="upfront_user_restrictions_head">
                            <li class="upfront_restrictions_functionality_name"><?php _e("Functionality", Upfront::TextDomain); ?></li>
                            <?php foreach( $roles as $role_id => $role ): ?>
                                <li class="upfront_restrictions_role_<?php echo $role_id ?>"><?php echo $role['name'];  ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <?php foreach( $this->_get_functionalities() as $functionality_id => $functionality ): ?>
                            <ul class="upfront_restrictions_functionality_row">
                                <li class="upfront_restrictions_functionality_name"><?php echo $functionality ?></li>
                                <?php foreach( $roles as $role_id => $role ): ?>
                                    <li class="upfront_restrictions_functionality_role">
                                        <div class="upfront-toggle">
                                            <input  value='1' type="checkbox" name="restrictions[<?php echo $role_id ?>][<?php echo $functionality_id ?>]" class="upfront-toggle-checkbox" id="restrictions[<?php echo $role_id ?>][<?php echo $functionality_id ?>]" <?php checked(true, Upfront_Permissions::boot()->get_restriction( $role_id, $functionality_id )); ?> />
                                            <label class="upfront-toggle-label" for="restrictions[<?php echo $role_id ?>][<?php echo $functionality_id ?>]">
                                                <span class="upfront-toggle-inner"></span>
                                                <span class="upfront-toggle-switch"></span>
                                            </label>
                                        </div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endforeach; ?>
                </div>
            <?php wp_nonce_field(self::FORM_NONCE_ACTION, self::FORM_NONCE_KEY); ?>
            <button type="submit" name="upront_restrictions_submit" id="upront_restrictions_submit"><?php _e("Save Changes", Upfront::TextDomain); ?></button>
            </form>
        </div>
        <?php
    }


    private function _get_roles(){
        return array_merge( true ? array("super_admin" => array( "name" => __("Super Admin", Upfront::TextDomain) ) ) : array() ,  wp_roles()->roles ) ;
    }

    private function _get_functionalities(){
        return Upfront_Permissions::boot()->get_labels();
    }

    private function _save_form(){
        if( !isset( $_POST['upront_restrictions_submit'] ) || !wp_verify_nonce( $_POST[self::FORM_NONCE_KEY], self::FORM_NONCE_ACTION ) ) return;

        return isset( $_POST['restrictions'] ) ?  Upfront_Permissions::boot()->update_restrictions( $_POST['restrictions'] ) : false;
    }
}