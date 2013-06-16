<?php

class Upfront_FacepileView extends Upfront_Object {

    public function get_markup () {

        return "Upfront Facepile";
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-facepile', upfront_element_url('css/upfront-facepile-style.css', dirname(__FILE__)));
    }
}

/**
 * Serves menu setting
 */
class Upfront_Facepile_Setting extends Upfront_Server {
    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_action('wp_ajax_upfront_load_menu_list', array($this, "load_menu_list"));
    }

    public function load_menu_list () {
        $menus = wp_get_nav_menus();
        $this->_out(new Upfront_JsonResponse_Success($menus));
    }

}

Upfront_Facepile_Setting::serve();
