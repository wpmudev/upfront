<?php

class Upfront_NavigationView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        $menu_id = $this->_get_property('menu_id');

        $layout_settings = json_decode($this->_get_property('layout_setting'));

        $menu_style = $layout_settings->style;
        $menu_aliment = $layout_settings->aliment;

        $menu_style = $menu_style ? "data-style='{$menu_style}'" : '';
        $menu_aliment = $menu_aliment ? "data-aliment='{$menu_aliment}'" : '';

        $allow_sub_nav = $layout_settings->subNavigation;
        $new_page = $layout_settings->newPage;

        $menu = '';
        if ( $menu_id )
            $menu = wp_nav_menu(array(
                'menu' => $menu_id,
                'echo' => false
            ));
        return "<div class='upfront-output-object upfront-navigation' {$element_id} {$menu_style} {$menu_aliment}>" . $menu . "</div>";
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-navigation', upfront_element_url('css/upfront-navigation-style.css', dirname(__FILE__)));
    }
}

/**
 * Serves menu setting
 */
class Upfront_MenuSetting extends Upfront_Server {
    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_action('wp_ajax_upfront_load_menu_list', array($this, "load_menu_list"));
        add_action('wp_ajax_upfront_load_menu_html', array($this, "load_menu_html"));
        add_action('wp_ajax_upfront_load_menu_items', array($this, "load_menu_items"));
        add_action('wp_ajax_upfront_load_all_pages', array($this, "load_all_pages"));
        add_action('wp_ajax_upfront_load_all_categories', array($this, "load_all_categories"));
    }

    public function load_menu_list () {
        $menus = wp_get_nav_menus();
        $this->_out(new Upfront_JsonResponse_Success($menus));
    }

    public function load_menu_html () {
        $menu_id = isset($_POST['data']) ? intval($_POST['data']) : false;
        if ( $menu_id && is_nav_menu($menu_id) ){
            $html = wp_nav_menu(array(
                'menu' => $menu_id,
                'echo' => false
            ));
            $this->_out(new Upfront_JsonResponse_Success($html));
        }
        $this->_out(new Upfront_JsonResponse_Error('Menu not found'));
    }

    public function load_menu_items () {
        $menu_id = isset($_POST['data']) ? intval($_POST['data']) : false;
        if ( $menu_id ){
            $args = array(
                'order'                  => 'ASC',
                'orderby'                => 'menu_order',
                'post_type'              => 'nav_menu_item',
                'post_status'            => 'publish',
                'output'                 =>  ARRAY_A,
                'output_key'             => 'menu_order',
                //'nopaging'               => true,
                //'update_post_term_cache' => false
            );

            $menu_items = wp_get_nav_menu_items($menu_id, $args);
            $this->_out(new Upfront_JsonResponse_Success($menu_items));
        }
        $this->_out(new Upfront_JsonResponse_Error('Menu not found'));
    }

    public function load_all_pages () {

        $args = array(
            'sort_order' => 'ASC',
            'post_type' => 'page',
            'post_status' => 'publish'
        );

        $pages = get_pages( $args );

        if ( $pages ){

            foreach($pages as $page) :

                $pagesArr[] = array(
                    'ID' => $page->ID,
                    'slug' => $page->post_name,
                    'parent_id' => $page->post_parent,
                    'name' => $page->post_title
                );

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($pagesArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Pages not found'));
    }
    public function load_all_categories () {

        $args = array(
            'type'                     => 'post',
            'order'                    => 'ASC',
            'hide_empty'               => 0,
            'taxonomy'                 => 'category',
            'pad_counts'               => false
        );

        $categories = get_categories($args);

        if ( $categories ){

            foreach($categories as $category) :

                $categoriesArr[] = array(
                    'ID' => $category->term_id,
                    'slug' => $category->slug,
                    'parent_id' => $category->parent,
                    'name' => $category->name
                );

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($categoriesArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Pages not found'));
    }
}

Upfront_MenuSetting::serve();
