<?php

/**
 * Created by PhpStorm.
 * User: samnajian
 * Date: 3/12/16
 * Time: 9:53 PM
 */
class Upfront_Admin_Restrictions
{
    /**
     * Renders the page
     */
    static function render_page(){
        ?>
        <div class="wrap upfront_admin upfront_admin_restrictions">
            <h1><?php _e("User Restrictions", Upfront::TextDomain); ?><span class="upfront-logo"></span></h1>

        </div>
        <?php
    }
}