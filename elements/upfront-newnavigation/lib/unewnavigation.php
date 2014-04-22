<?php

/**
 * Object implementation for newNavigation entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UnewnavigationView extends Upfront_Object {

	public function get_markup () {
        $menu_id = $this->_get_property('menu_id');
        $menu_name = $this->_get_property('menu_name');

        $layout_settings = json_decode($this->_get_property('layout_setting'));

        $menu_style = $this->_get_property('menu_style');
        $menu_aliment = $this->_get_property('menu_alignment');
        $sub_navigation = $this->_get_property('allow_sub_nav');
        $is_floating = $this->_get_property('is_floating');

        $menu_style = $menu_style ? "data-style='{$menu_style}'" : "";
        $menu_aliment = $menu_aliment ? "data-aliment='{$menu_aliment}'" : "";
        $sub_navigation = $sub_navigation ? "data-allow-sub-nav='yes'" : "data-allow-sub-nav='no'";

        $float_class = $is_floating ? 'upfront-navigation-float' : '';

      //  upfront_add_element_style('unewnavigation', array('css/unewnavigation-style.css', dirname(__FILE__)));
    //    if (is_user_logged_in()) {
      //      upfront_add_element_style('unewnavigation_editor', array('css/unewnavigation-editor.css', dirname(__FILE__)));
      //  }
        //if ($is_floating) {
         //   upfront_add_element_script('unewnavigation', array('js/public.js', dirname(__FILE__)));
       // }

		if($menu_name) {
			$menu = wp_get_nav_menu_object($menu_name);
			if($menu)
				$menu_id = $menu->term_id;
		}

        if ( $menu_id ) :
            $menu = wp_nav_menu(array(
                'menu' => $menu_id,
                'fallback_cb'     => false,
                'echo' => false
            ));
        else:
            return "<div class=' {$float_class} upfront-navigation' {$menu_style} {$menu_aliment} {$sub_navigation}>Please select menu on settings</div>";
        endif;

        return "<div class=' {$float_class} upfront-navigation' {$menu_style} {$menu_aliment} {$sub_navigation}>" . $menu . "</div>";
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
            'class' => 'c24 upfront-navigation',
            'has_settings' => 1,
            'id_slug' => 'unewnavigation',

			'menu_items' => array(),

            'menu_style' => 'horizontal', // horizontal | vertical
            'menu_alignment' => 'left', // left | center | right
            'allow_sub_nav' => array('no'), // array('no') | array ('yes')
            'allow_new_pages' => array('no'), // array('no') | array('yes')
        );
    }

  public function add_styles_scripts() {
	  wp_enqueue_style('upfront_navigation', upfront_element_url('css/unewnavigation-style.css', dirname(__FILE__)));

        if (is_user_logged_in()) {
			 wp_enqueue_style('unewnavigation_editor', upfront_element_url('css/unewnavigation-editor.css', dirname(__FILE__)));
		}
  }
}

/**
 * Serves menu setting
 */
class Upfront_newMenuSetting extends Upfront_Server {
    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_action('wp_ajax_upfront_new_load_menu_list', array($this, "load_menu_list"));

        add_action('wp_ajax_upfront_new_load_menu_array', array($this, "load_menu_array"));
        add_action('wp_ajax_upfront_new_load_menu_items', array($this, "load_menu_items"));
		add_action('wp_ajax_upfront_new_menu_from_slug', array($this, "menu_from_slug"));
        add_action('wp_ajax_upfront_new_delete_menu_item', array($this, "delete_menu_item"));
        add_action('wp_ajax_upfront_new_update_menu_order', array($this, "update_menu_order"));
        add_action('wp_ajax_upfront_new_create_menu', array($this, "create_menu"));
        add_action('wp_ajax_upfront_new_rename_menu', array($this, "rename_menu"));

        add_action('wp_ajax_upfront_new_update_menu_item', array($this, "update_menu_item"));
        add_action('wp_ajax_upfront_new_update_auto_add_pages', array($this, "update_auto_add_pages"));

    }

    public function load_menu_list () {
        $menus = wp_get_nav_menus();
        if ( $menus ){
            $this->_out(new Upfront_JsonResponse_Success($menus));
        }
        $this->_out(new Upfront_JsonResponse_Error('Menu not found'));
    }

	function load_menu_array() {

		if(isset($_POST['data']) && is_numeric($_POST['data'])) {

			$menu_id = intval($_POST['data']);

			$menu = wp_get_nav_menu_object( $menu_id > 0 ? $menu_id : $_POST['alternate'] );

			if ( $menu )
				$menu_items = wp_get_nav_menu_items( $menu->term_id, array( 'update_post_term_cache' => false ) );

			$sorted_menu_items = array();
			foreach ( (array) $menu_items as $key => $menu_item )
				$sorted_menu_items[$menu_item->menu_order] = $menu_item;


			$top_level_elements = array();
			$children_elements  = array();
			foreach ( $sorted_menu_items as $e) {
				if ( 0 == $e->menu_item_parent )
					$top_level_elements[] = $e;
				else
					$children_elements[ $e->menu_item_parent ][] = $e;
			}

			if ( empty($top_level_elements) ) {

				$first = array_slice( $sorted_menu_items, 0, 1 );
				$root = $first[0];

				$top_level_elements = array();
				$children_elements  = array();
				foreach ( $sorted_menu_items as $e) {
					if ( $root->menu_item_parent == $e->menu_item_parent )
						$top_level_elements[] = $e;
					else
						$children_elements[ $e->menu_item_parent ][] = $e;
				}
			}


			$output = array();

			foreach ( $top_level_elements as $e ) {
				$output[] = $this->recursive_processMenuItem($e, $children_elements);
			}

			$this->_out(new Upfront_JsonResponse_Success($output));

		}
		else {
			$this->_out(new Upfront_JsonResponse_Error('Menu not found'));
		}

	}

	function recursive_processMenuItem($e, $children_elements) {

		$this_menu_item = array(
			'menu-item-db-id' => $e->ID,
			'menu-item-parent-id' => $e->menu_item_parent,
			'menu-item-type' => $e->type,
			'menu-item-title' => apply_filters( 'the_title', $e->title, $e->ID ),
			'menu-item-url' => $e->url,
			'menu-item-object' => $e->object,
			'menu-item-object-id' => $e->object_id,
			'menu-item-target' => $e->target,
			'menu-item-position' => $e->menu_order
			);
		if(isset($children_elements[$e->ID])) {
			foreach($children_elements[$e->ID] as $child_element)
				$this_menu_item['sub'][] = $this->recursive_processMenuItem($child_element, $children_elements);
		}
		return $this_menu_item;
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

    public function delete_menu_item () {

        $menu_item_id = isset($_POST['menu_item_id']) ? intval($_POST['menu_item_id']) : false;
		$menu_items =  isset($_POST['new_menu_order']) ? intval($_POST['new_menu_order']) : false;
        if ( $menu_item_id ){

            if ( is_nav_menu_item( $menu_item_id ) && wp_delete_post( $menu_item_id, true ) ) {
                $messages[] = 'The menu item has been successfully deleted';
			}

			if($menu_items)
				$this->update_menu_order($menu_items);
            else
				$this->_out(new Upfront_JsonResponse_Success($messages));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Delete menu!'));
    }

    public function update_menu_order ($menu_items = false) {

		if(!$menu_items)
	        $menu_items = isset($_POST['menu_items']) ? $_POST['menu_items'] : false;

        if ( $menu_items ){

            foreach($menu_items as $key => $menu_item ) :

                $responseArr[] = $this->change_menu_order($menu_item, $key);

            endforeach;

            $this->_out(new Upfront_JsonResponse_Success($responseArr));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Update Menu!'));
    }

    public function change_menu_order($item,$key){

        $current_menu_item = get_post( $item['menu-item-db-id'], 'ARRAY_A' );
        $current_menu_item['menu_order'] = $key;
        update_post_meta($item['menu-item-db-id'], '_menu_item_menu_item_parent', $item['menu-item-parent-id']);

        return wp_update_post($current_menu_item);
    }

    public function create_menu(){
        $menu_name = isset($_POST['menu_name']) ? $_POST['menu_name'] : false;
        if ( $menu_name ){
            $response = wp_create_nav_menu($menu_name);
            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Create Menu!'));

    }

    public function rename_menu(){
        $new_menu_name = isset($_POST['new_menu_name']) ? $_POST['new_menu_name'] : false;
		$menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
        if ( $menu_id && $new_menu_name ){
            $response = wp_update_nav_menu_object($menu_id, array('menu-name' => $new_menu_name));
            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot Create Menu!'));

    }

    public function add_menu_item ($menu_id, $menu_items) {

       // $menu_id = isset($_POST['menu-item']) ? intval($_POST['menu-item']) : false;

        if ( $menu_id && is_nav_menu($menu_id) ){

            $new_menu_items = wp_save_nav_menu_items( $menu_id, $menu_items );
            //$this->_out(new Upfront_JsonResponse_Success($new_menu_items));
			return($new_menu_items);
        }
        return false;//$this->_out(new Upfront_JsonResponse_Error('Cannot create menu!'));
    }

    public function update_menu_item () {

        $menu_id = isset($_POST['menu']) ? intval($_POST['menu']) : false;
        $menu_item = isset($_POST['menu-item']) ? $_POST['menu-item'] : false;

        $menu_item_id = isset($_POST['menu-item-id']) ? intval($_POST['menu-item-id']) : false ;

		if(!$menu_item_id) {
			$menu_item_ids = $this->add_menu_item($menu_id, array($menu_item));
			$menu_item_id = $menu_item_ids[0];

		}

        $items_saved = array();

        if ( $menu_id && is_nav_menu($menu_id) ){

           /* $args = array(
                'menu-item-db-id' => $menu_item_id,
                'menu-item-type' => 'custom',
                'menu-item-title' => ( isset( $menu_item['menu-item-title'] ) ? $menu_item['menu-item-title'] : 'Custom menu' ),
                'menu-item-url' => ( isset( $menu_item['menu-item-url'] ) ? $menu_item['menu-item-url'] : '' ),
            ); */

            $items_updated[] = wp_update_nav_menu_item( $menu_id, $menu_item_id, $menu_item );

            $this->_out(new Upfront_JsonResponse_Success($menu_item_id));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot update menu!'));
    }

	 public function menu_from_slug () {

			$menu_slug = isset($_POST['data']) ? $_POST['data'] : 0;
			$menu = wp_get_nav_menu_object($menu_slug);
			$menu_item_id = 0;
			if($menu)
				$menu_item_id = $menu->term_id;
			$this->_out(new Upfront_JsonResponse_Success($menu_item_id));

		}

    public function update_auto_add_pages(){
        $nav_menu_option = isset($_POST['nav_menu_option']) ? stripslashes($_POST['nav_menu_option']) : false;
        $nav_menu_option = json_decode($nav_menu_option, true);
        if ( $nav_menu_option ){
            // Remove nonexistent/deleted menus
            if( isset($nav_menu_option['auto_add']) )
                $nav_menu_option['auto_add'] = array_intersect( $nav_menu_option['auto_add'], wp_get_nav_menus( array( 'fields' => 'ids' ) ) );
            $response = update_option( 'nav_menu_options', $nav_menu_option );
            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Cannot update auto add pages!'));
    }

}

Upfront_newMenuSetting::serve();