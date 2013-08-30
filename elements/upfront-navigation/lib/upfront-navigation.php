<?php

class Upfront_NavigationView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        $menu_id = $this->_get_property('menu_id');

        $layout_settings = json_decode($this->_get_property('layout_setting'));

        $menu_style = isset($layout_settings->style) ? $layout_settings->style : false;
        $menu_aliment = isset($layout_settings->aliment) ? $layout_settings->aliment : false;
        $sub_navigation = isset($layout_settings->subNavigation) ? $layout_settings->subNavigation : false;

        $menu_style = $menu_style ? "data-style='{$menu_style}'" : '';
        $menu_aliment = $menu_aliment ? "data-aliment='{$menu_aliment}'" : '';
        $sub_navigation = $sub_navigation ? "data-allow-sub-nav='{$sub_navigation}'" : '';

        if ( $menu_id ) :
            $menu = wp_nav_menu(array(
                'menu' => $menu_id,
                'fallback_cb'     => false,
                'echo' => false
            ));
        else:
            return "<div class='upfront-output-object upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>Please select menu on settings</div>";
        endif;

        return "<div class='upfront-output-object upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>" . $menu . "</div>";
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-navigation', upfront_element_url('css/upfront-navigation-style.css', dirname(__FILE__)));
        if(is_user_logged_in()):
            wp_enqueue_script(array('jquery-ui-sortable'));
        endif;
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
        add_action('wp_ajax_upfront_add_menu_item', array($this, "add_menu_item"));
        add_action('wp_ajax_upfront_update_post_status', array($this, "update_post_status"));
        add_action('wp_ajax_upfront_delete_menu_item', array($this, "delete_menu_item"));
        add_action('wp_ajax_upfront_update_menu_order', array($this, "update_menu_order"));
        add_action('wp_ajax_upfront_create_menu', array($this, "create_menu"));
        add_action('wp_ajax_upfront_delete_menu', array($this, "delete_menu"));
        add_action('wp_ajax_upfront_change_menu_label', array($this, "change_menu_label"));
        add_action('wp_ajax_upfront_update_menu_item', array($this, "update_menu_item"));

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
                'fallback_cb'     => false,
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
                'nopaging'               => true,
                'update_post_term_cache' => false
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
                    'name' => $page->post_title,
                    'url' => $page->guid,
                    'type' => $page->post_type,
                    'item_type' => 'post_type'
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
                    'name' => $category->name,
                    'url' => get_category_link($category->term_id),
                    'type' => $category->taxonomy,
                    'item_type' => 'taxonomy'
                );

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($categoriesArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Pages not found'));
    }

    public function add_menu_item () {

        $menu_id = isset($_POST['menu']) ? intval($_POST['menu']) : false;

        if ( $menu_id && is_nav_menu($menu_id) ){

            $new_menu_items = wp_save_nav_menu_items( $menu_id, $_POST['menu-item'] );
            $this->_out(new Upfront_JsonResponse_Success($new_menu_items));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot create menu!'));
    }

    public function update_menu_item () {

        $menu_id = isset($_POST['menu']) ? intval($_POST['menu']) : false;
        $menu_item_id = isset($_POST['menu-item-id']) ? intval($_POST['menu-item-id']) : false;
        $menu_item = isset($_POST['menu-item']) ? $_POST['menu-item'] : false;

        $items_saved = array();
        if ( $menu_id && is_nav_menu($menu_id) ){

            $args = array(
                'menu-item-db-id' => $menu_item_id,
                'menu-item-type' => 'custom',
                'menu-item-title' => ( isset( $menu_item['menu-item-title'] ) ? $menu_item['menu-item-title'] : 'Custom menu' ),
                'menu-item-url' => ( isset( $menu_item['menu-item-url'] ) ? $menu_item['menu-item-url'] : '' ),
            );

            $items_updated[] = wp_update_nav_menu_item( $menu_id, $menu_item_id, $args );

            $this->_out(new Upfront_JsonResponse_Success($items_updated));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot update menu!'));
    }

    /*
    $post_id - The ID of the post you'd like to change.
    $status -  The post status publish|pending|draft|private|static|object|attachment|inherit|future|trash.
    */
    public function change_post_status($post_id,$status){

        $current_post = get_post( $post_id, 'ARRAY_A' );
        $current_post['post_status'] = $status;
        return wp_update_post($current_post);
    }

    public function change_menu_order($item,$key){

        $current_menu_item = get_post( $item['menu-item-db-id'], 'ARRAY_A' );
        $current_menu_item['menu_order'] = $key;
        update_post_meta($item['menu-item-db-id'], '_menu_item_menu_item_parent', $item['menu-item-parent-id']);

        return wp_update_post($current_menu_item);
    }

    public function update_post_status () {

        $postIds = isset($_POST['postIds']) ? $_POST['postIds'] : false;

        if ( $postIds ){

            foreach($postIds['data'] as $postId ) :

                $responseArr[] = $this->change_post_status($postId,'publish');

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($responseArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot craete menu!'));
    }

    public function delete_menu_item () {

        $menu_item_id = isset($_POST['menu_item_id']) ? intval($_POST['menu_item_id']) : false;

        if ( $menu_item_id ){

            if ( is_nav_menu_item( $menu_item_id ) && wp_delete_post( $menu_item_id, true ) )
                $messages[] = 'The menu item has been successfully deleted';

            $this->_out(new Upfront_JsonResponse_Success($messages));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Delete menu!'));
    }

    public function update_menu_order () {

        $menu_items = isset($_POST['menu_items']) ? $_POST['menu_items'] : false;

        if ( $menu_items ){

            foreach($menu_items as $key => $menu_item ) :

                $responseArr[] = $this->change_menu_order($menu_item, $key);

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($responseArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Update Menu!'));
    }

    public function create_menu(){
        $menu_name = isset($_POST['menu_name']) ? $_POST['menu_name'] : false;
        if ( $menu_name ){
            $response = wp_create_nav_menu($menu_name);
            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Create Menu!'));

    }

    public function delete_menu(){
        $menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
        if ( $menu_id ){
            $response = wp_delete_nav_menu($menu_id);
            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot delete Menu!'));

    }

    public function change_menu_label(){

        $post_id = isset($_POST['item_id']) ? $_POST['item_id'] : false;
        $title = isset($_POST['item_label']) ? $_POST['item_label'] : false;

        if ( $post_id && $title ){
            $current_post = get_post( $post_id, 'ARRAY_A' );
            $current_post['post_title'] = $title;
            $response = wp_update_post($current_post);

            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot update menu item label!'));

    }

}

Upfront_MenuSetting::serve();
