<?php

class Upfront_Admin_Experimental
{
    function __construct(){
        add_submenu_page( "upfront", __("Experimental Features", Upfront::TextDomain),  __("Experimental", Upfront::TextDomain), 'promote_users', Upfront_Admin::$menu_slugs['experimental'], array($this, "render_page") );
    }

    function render_page(){
        ?>
        <div class="wrap upfront_admin upfront_admin_experimental">
            <h1><?php _e("Experimental Features", Upfront::TextDomain); ?><span class="upfront-logo"></span></h1>

        </div>
        <?php
    }
}