<?php

/**
 * Object implementation for newNavigation entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UnewnavigationView extends Upfront_Object {

	public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        $menu_id = $this->_get_property('menu_id');

        $layout_settings = json_decode($this->_get_property('layout_setting'));

        $menu_style = $this->_get_property('menu_style');
        $menu_aliment = $this->_get_property('menu_alignment');
        $sub_navigation = $this->_get_property('allow_sub_nav');
        $is_floating = $this->_get_property('is_floating');

        $menu_style = $menu_style ? "data-style='{$menu_style}'" : "";
        $menu_aliment = $menu_aliment ? "data-aliment='{$menu_aliment}'" : "";
        $sub_navigation = $sub_navigation ? "data-allow-sub-nav='yes'" : "data-allow-sub-nav='no'";

        $float_class = $is_floating ? 'upfront-navigation-float' : '';

        upfront_add_element_style('unewnavigation', array('css/unewnavigation-style.css', dirname(__FILE__)));
        if (is_user_logged_in()) {
            upfront_add_element_style('unewnavigation_editor', array('css/unewnavigation-editor.css', dirname(__FILE__)));
        }
        if ($is_floating) {
            upfront_add_element_script('unewnavigation', array('js/public.js', dirname(__FILE__)));
        }


        if ( $menu_id ) :
            $menu = wp_nav_menu(array(
                'menu' => $menu_id,
                'fallback_cb'     => false,
                'echo' => false
            ));
        else:
            return "<div class='upfront-output-object {$float_class} upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>Please select menu on settings</div>";
        endif;

        return "<div class='upfront-output-object {$float_class} upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>" . $menu . "</div>";
	}

	public static function add_js_defaults($data){
        $data['unewnavigation'] = array(
            'defaults' => self::default_properties(),
         );
        return $data;
    }

    //Defaults for properties
    public static function default_properties(){
        return array(
            'type' => 'UnewnavigationModel',
            'view_class' => 'UnewnavigationView',
            'class' => 'c22 upfront-navigation',
            'has_settings' => 1,
            'id_slug' => 'unewnavigation',
			
			'menu_items' => array(),
        );
    }
}


