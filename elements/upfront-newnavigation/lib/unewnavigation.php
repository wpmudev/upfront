<?php

/**
 * Object implementation for newNavigation entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UnewnavigationView extends Upfront_Object {

	public function get_markup () {
		$menu_id = $this->_get_property('menu_id');
		$menu_slug = $this->_get_property('menu_slug');

		$layout_settings = json_decode($this->_get_property('layout_setting'));

		$menu_style = $this->_get_property('menu_style');
		$breakpoint_data = $this->_get_property('breakpoint');
		$breakpoints = Upfront_Grid::get_grid()->get_breakpoints();
		foreach ($breakpoints as $name => $point) {
			$data = $point->get_data();
			if(!empty($data['enabled'])) {
				$breakpoint_data[$data['id']]['width'] = $data['width'];
			}
		}
		$burgermenu_desktop =  $this->_get_property('burger_menu');
		$breakpoint_data['desktop']['burger_menu'] = is_array( $burgermenu_desktop ) && isset( $burgermenu_desktop[0] ) ? $burgermenu_desktop[0] : $burgermenu_desktop ;
		$breakpoint_data['desktop']['burger_alignment'] = $this->_get_property('burger_alignment');
		$breakpoint_data['desktop']['burger_over'] = $this->_get_property('burger_over');
		//$breakpoint_data['desktop']['menu_style'] = 'horizontal';

		$breakpoint_data = json_encode($breakpoint_data);

		$menu_aliment = $this->_get_property('menu_alignment');
		$sub_navigation = $this->_get_property('allow_sub_nav');
		$is_floating = $this->_get_property('is_floating');

		$menu_style = $menu_style ? "data-style='{$menu_style}' data-stylebk='{$menu_style}'" : "";
		$breakpoint_data = $breakpoint_data ? "data-breakpoints='{$breakpoint_data}'" : "";
		$menu_aliment = $menu_aliment ? "data-aliment='{$menu_aliment}' data-alimentbk='{$menu_aliment}'" : "";
		$sub_navigation = $sub_navigation ? "data-allow-sub-nav='yes'" : "data-allow-sub-nav='no'";

		$float_class = $is_floating ? 'upfront-navigation-float' : '';

		//  upfront_add_element_style('unewnavigation', array('css/unewnavigation-style.css', dirname(__FILE__)));
		//    if (is_user_logged_in()) {
		//      upfront_add_element_style('unewnavigation_editor', array('css/unewnavigation-editor.css', dirname(__FILE__)));
		//  }
		if ($is_floating) {
			//wp_enqueue_script('unewnavigation', upfront_element_url('js/public.js', dirname(__FILE__)));
			upfront_add_element_script('unewnavigation', array('js/public.js', dirname(__FILE__)));
		}

		//wp_enqueue_script('unewnavigation_responsive', upfront_element_url('js/responsive.js', dirname(__FILE__)));
		upfront_add_element_script('unewnavigation_responsive', array('js/responsive.js', dirname(__FILE__)));

		if($menu_slug) {
			$menu = wp_get_nav_menu_object($menu_slug);
			if($menu)
				$menu_id = $menu->term_id;
		}

		if ( $menu_id ) {
			$menu = wp_nav_menu(array(
				'menu' => $menu_id,
				'fallback_cb'     => false,
				'echo' => false
			));
		} else {
			return "<div class=' {$float_class} upfront-navigation' {$menu_style} {$menu_aliment} {$breakpoint_data} {$sub_navigation}>" . self::_get_l10n('select_menu') . "</div>";
		}

		return "<div class=' {$float_class} upfront-navigation' {$menu_style} {$menu_aliment} {$breakpoint_data} {$sub_navigation}>" . $menu . "</div>";
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

	public static  function add_styles_scripts() {
		upfront_add_element_style('upfront_navigation', array('css/unewnavigation-style.css', dirname(__FILE__)));

		if (is_user_logged_in()) {
			upfront_add_element_style('upfront_navigation_editor', array('css/unewnavigation-editor.css', dirname(__FILE__)));
		}
		/*
		wp_enqueue_style('upfront_navigation', upfront_element_url('css/unewnavigation-style.css', dirname(__FILE__)));

		if (is_user_logged_in()) {
			wp_enqueue_style('unewnavigation_editor', upfront_element_url('css/unewnavigation-editor.css', dirname(__FILE__)));
		}
		*/

	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['newnavigation_element'])) return $strings;
		$strings['newnavigation_element'] = self::_get_l10n();
		return $strings;
	}

	public static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Menu', 'upfront'),
			'select_menu' => __('Please select menu in settings', 'upfront'),
			'not_found' => __('Menu not found', 'upfront'),
			'cant_update' => __('Cannot update menu', 'upfront'),
			'cant_create' => __('Cannot create menu', 'upfront'),
			'delete_success' => __('The menu item has been successfully deleted', 'upfront'),
			'cant_delete' => __('Cannot delete menu', 'upfront'),
			'cant_update_auto' => __('Cannot update menu auto add pages', 'upfront'),
			'visit_url' => __('Visit URL', 'upfront'),
			'edit_url' => __('Edit URL', 'upfront'),
			'create_dropdown' => __('Create Drop-Down', 'upfront'),
			'css' => array(
				'bar_label' => __('Menu Bar', 'upfront'),
				'bar_info' => __('Menu Bar', 'upfront'),
				'item_label' => __('Menu Item', 'upfront'),
				'item_info' => __('Top level Menu item', 'upfront'),
				'hover_label' => __('Menu Item hover', 'upfront'),
				'hover_info' => __('Hover state for Top level Menu item', 'upfront'),
				'close_info' => __('Icon to close the responsive navigation', 'upfront'),
				'subitem_label' => __('Sub Menu Item', 'upfront'),
				'subitem_info' => __('Sub level Menu item', 'upfront'),
				'subitem_hover_label' => __('Sub Menu Item hover', 'upfront'),
				'subitem_hover_info' => __('Hover state for Sub level Menu item', 'upfront'),
				'responsive_bar_label' => __('Responsive Menu Bar', 'upfront'),
				'responsive_trigger' => __('Responsive Menu Trigger', 'upfront'),
				'responsive_trigger_bars' => __('Responsive Trigger Bars', 'upfront'),
				'responsive_nav_close' => __('Responsive Close Icon', 'upfront'),
				'responsive_item_label' => __('Responsive Menu Item', 'upfront'),
				'responsive_hover_label' => __('Responsive Menu Item hover', 'upfront'),
				'responsive_subitem_label' => __('Responsive Sub Menu Item', 'upfront'),
				'responsive_subitem_hover_label' => __('Responsive Sub Menu Item hover', 'upfront'),
			),
			'new_menu_name' => __('New Menu Name', 'upfront'),
			'create_new' => __('Create New', 'upfront'),
			'link_name' => __('Link Name', 'upfront'),
			'mnu' => array(
				'label' => __('Menu', 'upfront'),
				'title' => __('Menu settings', 'upfront'),
				'load' => __('Load Different Menu', 'upfront'),
				'create' => __('or Create New', 'upfront'),
				'use' => __('Use', 'upfront'),
				'btn' => __('button to open menu', 'upfront'),
				'appearance' => __('Revealed Menu Appearance', 'upfront'),
				'aligh' => __('Menu Item Alignment', 'upfront'),
				'left' => __('Left', 'upfront'),
				'right' => __('Right', 'upfront'),
				'horiz' => __('Horizontal', 'upfront'),
				'vert' => __('Vertical', 'upfront'),
				'right' => __('Right', 'upfront'),
				'top' => __('Top', 'upfront'),
				'whole' => __('Whole', 'upfront'),
				'over' => __('Over Content', 'upfront'),
				'push' => __('Pushes Content', 'upfront'),
				'align' => __('Menu Items Alignment', 'upfront'),
				'style' => __('Menu Style', 'upfront'),
				'center' => __('Center', 'upfront'),
				'behavior' => __('Behaviour Settings', 'upfront'),
				'auto_add' => __('Add new Pages automatically', 'upfront'),
				'float' => __('Float this menu', 'upfront'),
			),
			'settings' => __('Navigation settings', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
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
		/*
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
		*/
		upfront_add_ajax('upfront_new_load_menu_list', array($this, "load_menu_list"));
		upfront_add_ajax('upfront_new_load_menu_array', array($this, "load_menu_array"));
		upfront_add_ajax('upfront_new_load_menu_items', array($this, "load_menu_items"));
		upfront_add_ajax('upfront_new_menu_from_slug', array($this, "menu_from_slug"));
		upfront_add_ajax('upfront_new_delete_menu_item', array($this, "delete_menu_item"));
		upfront_add_ajax('upfront_new_update_menu_order', array($this, "update_menu_order"));
		upfront_add_ajax('upfront_new_create_menu', array($this, "create_menu"));
		upfront_add_ajax('upfront_new_rename_menu', array($this, "rename_menu"));
		
		upfront_add_ajax('upfront_new_update_menu_item', array($this, "update_menu_item"));
		upfront_add_ajax('upfront_new_update_auto_add_pages', array($this, "update_auto_add_pages"));
	}



	public function load_menu_list () {
		$menus = wp_get_nav_menus();
		if ( $menus ){
			$this->_out(new Upfront_JsonResponse_Success($menus));
		}
		$this->_out(new Upfront_JsonResponse_Error('Menu not found'));
	}

	function load_menu_array() {

		if(isset($_POST['data'])) {
			$menu_id = $_POST['data'];
			$menu = wp_get_nav_menu_object( $menu_id ? $menu_id : $_POST['alternate'] );

			$menu_items = $menu
				? wp_get_nav_menu_items( $menu->term_id, array( 'update_post_term_cache' => false ) )
				: array()
			;

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
//echo sizeof($top_level_elements);
			if ( empty($top_level_elements) ) {

				$first = array_slice( $sorted_menu_items, 0, 1 );
				$root = !empty($first[0]) ? $first[0] : false;

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
			$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('not_found')));
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
			'menu-item-target' => ($e->type === 'anchor' || $e->type === 'email') ? '_self' : $e->target,
			'menu-item-position' => $e->menu_order
			);
		if(isset($children_elements[$e->ID])) {
			foreach($children_elements[$e->ID] as $child_element)
				$this_menu_item['sub'][] = $this->recursive_processMenuItem($child_element, $children_elements);
		}
		return $this_menu_item;
	}

	public function load_menu_items () {
		$menu_id = isset($_POST['data']) ? $_POST['data'] : false;
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('not_found')));
	}

	public function delete_menu_item () {

		$menu_item_id = isset($_POST['menu_item_id']) ? intval($_POST['menu_item_id']) : false;
		$menu_items =  isset($_POST['new_menu_order']) ? $_POST['new_menu_order'] : false;
		if ( $menu_item_id ){

			if ( is_nav_menu_item( $menu_item_id ) && wp_delete_post( $menu_item_id, true ) ) {
				$messages[] = Upfront_UnewnavigationView::_get_l10n('delete_success');
			}


	//			update_post_meta($child['menu-item-db-id'], '_menu_item_menu_item_parent', 0);
//echo $menu_items;
//die(0);
			if($menu_items) {
				$this->update_menu_order($menu_items);

				/*
				foreach($menu_items as $menu_item) {

					if(isset($menu_item['refresh-parent']) && $menu_item['refresh-parent'] == 1) {
						echo "yes this happend";
						return;
	//				     $current_menu_item = get_post( $menu_item['menu-item-db-id'], 'ARRAY_A' );
//						$current_menu_item['menu_order'] = $count;
						delete_post_meta($menu_item['menu-item-db-id'], '_menu_item_menu_item_parent');
		//				wp_update_post($current_menu_item);
					}
					$count++;
				}

				*/

			}
			else
				$this->_out(new Upfront_JsonResponse_Success($messages));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_delete')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_update')));
	}

	public function change_menu_order($item,$key){
		if (empty($item['menu-item-db-id'])) return false;

		$current_menu_item = get_post( $item['menu-item-db-id'], 'ARRAY_A' );
		$current_menu_item['menu_order'] = $key;
		update_post_meta($item['menu-item-db-id'], '_menu_item_menu_item_parent', $item['menu-item-parent-id']);

		return wp_update_post($current_menu_item);
	}

	public function create_menu() {
		$menu_name = isset($_POST['menu_name']) ? $_POST['menu_name'] : false;
		if ( $menu_name === false )
			$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_create')));

		$menu_id = wp_create_nav_menu($menu_name);
		$menu = wp_get_nav_menu_object($menu_id);
		$response = array(
			'id' => $menu->term_id,
			'slug' => $menu->slug
		);

		$this->_out(new Upfront_JsonResponse_Success($response));

	}

	public function rename_menu(){
		$new_menu_name = isset($_POST['new_menu_name']) ? $_POST['new_menu_name'] : false;
		$menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
		if ( $menu_id && $new_menu_name ){
			$response = wp_update_nav_menu_object($menu_id, array('menu-name' => $new_menu_name));
			$this->_out(new Upfront_JsonResponse_Success($response));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_create')));

	}

	public function add_menu_item ($menu_id, $menu_items) {
		if ( empty($menu_id) || is_nav_menu($menu_id) === false ) return false;//$this->_out(new Upfront_JsonResponse_Error('Cannot create menu!'));

		$new_menu_items = wp_save_nav_menu_items( $menu_id, $menu_items );
		return($new_menu_items);
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

		if (empty($menu_id) || is_nav_menu($menu_id) === false)
			$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_update')));

		/* $args = array(
		 *  'menu-item-db-id' => $menu_item_id,
		 *  'menu-item-type' => 'custom',
		 *  'menu-item-title' => ( isset( $menu_item['menu-item-title'] ) ? $menu_item['menu-item-title'] : 'Custom menu' ),
		 *  'menu-item-url' => ( isset( $menu_item['menu-item-url'] ) ? $menu_item['menu-item-url'] : '' ),
		 *);
		 */

		$items_updated[] = wp_update_nav_menu_item( $menu_id, $menu_item_id, $menu_item );

		$this->_out(new Upfront_JsonResponse_Success($menu_item_id));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_UnewnavigationView::_get_l10n('cant_update_auto')));
	}

}

Upfront_newMenuSetting::serve();
