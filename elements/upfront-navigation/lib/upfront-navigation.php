<?php

class Upfront_NavigationView extends Upfront_Object {

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

		upfront_add_element_style('upfront_navigation', array('css/upfront-navigation-style.css', dirname(__FILE__)));
		if (is_user_logged_in()) {
			upfront_add_element_style('upfront_navigation_editor', array('css/upfront-navigation-editor.css', dirname(__FILE__)));
		}
		if ($is_floating) {
			upfront_add_element_script('upfront_navigation', array('js/public.js', dirname(__FILE__)));
		}


		if ( $menu_id ) :
			$menu = wp_nav_menu(array(
				'menu' => $menu_id,
				'fallback_cb'     => false,
				'echo' => false
			));
		else:
			return "<div class=' {$float_class} upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>" . self::_get_l10n('select_menu') . "</div>";
		endif;

		return "<div class=' {$float_class} upfront-navigation' {$element_id} {$menu_style} {$menu_aliment} {$sub_navigation}>" . $menu . "</div>";
	}

	// Inject style dependencies
	public static function add_public_dependencies () {
		if(Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			wp_enqueue_script(array('jquery-ui-sortable'));
		}
	}

	public static function add_js_defaults($data){
		$data['unavigation'] = array(
			'defaults' => self::default_properties(),
		 );
		return $data;
	}

	//Defaults for properties
	public static function default_properties(){
		return array(
			'type' => 'NavigationModel',
			'view_class' => 'NavigationView',
			'class' => 'c24 upfront-navigation',
			'has_settings' => 1,
			'id_slug' => 'nav',

			'menu_id' => false,
			'create_menu' => '',

			'menu_style' => 'horizontal', // horizontal | vertical
			'menu_alignment' => 'left', // left | center | right
			'allow_sub_nav' => array('no'), // array('no') | array ('yes')
			'allow_new_pages' => array('no'), // array('no') | array('yes')



			'custom_url' => '',
			'custom_label' => ''
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['navigation_element'])) return $strings;
		$strings['navigation_element'] = self::_get_l10n();
		return $strings;
	}

	public static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Menus', 'upfront'),
			'select_menu' => __('Please select menu in settings', 'upfront'),
			'not_found' => __('Menu not found', 'upfront'),
			'pages_not_found' => __('Pages not found', 'upfront'),
			'cant_update' => __('Cannot update menu', 'upfront'),
			'cant_create' => __('Cannot create menu', 'upfront'),
			'delete_success' => __('The menu item has been successfully deleted', 'upfront'),
			'cant_delete' => __('Cannot delete menu', 'upfront'),
			'cant_update_label' => __('Cannot update menu item label', 'upfront'),
			'cant_update_auto' => __('Cannot update menu auto add pages', 'upfront'),
			
			'edit_url' => __('edit URL', 'upfront'),
			'visit_page' => __('visit page', 'upfront'),
			'missing_item_id' => __('Error Item id is missing', 'upfront'),
			'item_name_updated' => __('Navigation item name updated!', 'upfront'),
			'opts' => array(
				'menu_label' => __('Menu', 'upfront'),
				'menu_title' => __('Menu settings', 'upfront'),
				'select_menu' => __('Select Menu', 'upfront'),
				'create_menu' => __('Create Menu', 'upfront'),
				'new_menu' => __('New Menu Name', 'upfront'),
				'layout_label' => __('Layout', 'upfront'),
				'layout_title' => __('Layout settings', 'upfront'),
				'menu_style' => __('Menu Style', 'upfront'),
				'horizontal' => __('Horizontal', 'upfront'),
				'vertical' => __('Vertical', 'upfront'),
				'menu_alignment' => __('Menu Alignment', 'upfront'),
				'left' => __('Left', 'upfront'),
				'center' => __('Center', 'upfront'),
				'right' => __('Right', 'upfront'),
				'misc' => __('Misc. Settings', 'upfront'),
				'hover_subnav' => __('Allow subnavigation on hover', 'upfront'),
				'add_new_pages' => __('Add new Pages to this menu', 'upfront'),
				'allow_float' => __('Allow floating...', 'upfront'),
			),
			'cnt' => array(
				'label' => __('Contents', 'upfront'),
				'title' => __('Contents settings', 'upfront'),
				'pages' => __('Pages', 'upfront'),
				'all_pages' => __('All Pages', 'upfront'),
				'menu_items' => __('This Menu Items', 'upfront'),
				'categories' => __('Categories', 'upfront'),
				'all_categories' => __('All Categories', 'upfront'),
				'custom' => __('Custom Links', 'upfront'),
				'add_custom' => __('Add Custom Link', 'upfront'),
				'custom_label' => __('Label', 'upfront'),
				'anchor' => __('Anchor link', 'upfront'),
			),
			'ord' => array(
				'label' => __('Menu Order', 'upfront'),
				'title' => __('Menu Order settings', 'upfront'),
				'info' => __('Order of your menu items', 'upfront'),
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
class Upfront_MenuSetting extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_menu_list', array($this, "load_menu_list"));
		add_action('wp_ajax_upfront_load_menu_html', array($this, "load_menu_html"));
		add_action('wp_ajax_upfront_load_menu_array', array($this, "load_menu_array"));
		add_action('wp_ajax_upfront_load_menu_items', array($this, "load_menu_items"));
		add_action('wp_ajax_upfront_load_all_pages', array($this, "load_all_pages"));
		add_action('wp_ajax_upfront_load_all_categories', array($this, "load_all_categories"));
		add_action('wp_ajax_upfront_add_menu_item', array($this, "add_menu_item"));
		add_action('wp_ajax_upfront_update_post_status', array($this, "update_post_status"));
		add_action('wp_ajax_upfront_delete_menu_item', array($this, "delete_menu_item"));
		add_action('wp_ajax_upfront_update_menu_order', array($this, "update_menu_order"));
		add_action('wp_ajax_upfront_create_menu', array($this, "create_menu"));
		add_action('wp_ajax_upfront_rename_menu', array($this, "rename_menu"));
		add_action('wp_ajax_upfront_delete_menu', array($this, "delete_menu"));
		add_action('wp_ajax_upfront_change_menu_label', array($this, "change_menu_label"));
		add_action('wp_ajax_upfront_update_menu_item', array($this, "update_menu_item"));
		add_action('wp_ajax_upfront_update_auto_add_pages', array($this, "update_auto_add_pages"));

	}

	public function load_menu_list () {
		$menus = wp_get_nav_menus();
		if ( $menus ){
			$this->_out(new Upfront_JsonResponse_Success($menus));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('not_found')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('not_found')));
	}

	function load_menu_array() {

		if(isset($_POST['data']) && is_numeric($_POST['data'])) {

			$menu = wp_get_nav_menu_object( intval($_POST['data']) );

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
			$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('not_found')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('not_found')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('pages_not_found')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('pages_not_found')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_update')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_create')));
	}

	public function delete_menu_item () {

		$menu_item_id = isset($_POST['menu_item_id']) ? intval($_POST['menu_item_id']) : false;
		$menu_items =  isset($_POST['new_menu_order']) ? intval($_POST['new_menu_order']) : false;
		if ( $menu_item_id ){

			if ( is_nav_menu_item( $menu_item_id ) && wp_delete_post( $menu_item_id, true ) ) {
				$messages[] = Upfront_NavigationView::_get_l10n('delete_success');
			}

			if($menu_items)
				$this->update_menu_order($menu_items);
			else
				$this->_out(new Upfront_JsonResponse_Success($messages));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_delete')));
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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_update')));
	}

	public function create_menu(){
		$menu_name = isset($_POST['menu_name']) ? $_POST['menu_name'] : false;
		if ( $menu_name ){
			$response = wp_create_nav_menu($menu_name);
			$this->_out(new Upfront_JsonResponse_Success($response));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_create')));

	}

	public function rename_menu(){
		$new_menu_name = isset($_POST['new_menu_name']) ? $_POST['new_menu_name'] : false;
		$menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
		if ( $menu_id && $new_menu_name ){
			$response = wp_update_nav_menu_object($menu_id, array('menu-name' => $new_menu_name));
			$this->_out(new Upfront_JsonResponse_Success($response));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_create')));

	}

	public function delete_menu(){
		$menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
		if ( $menu_id ){
			$response = wp_delete_nav_menu($menu_id);
			$this->_out(new Upfront_JsonResponse_Success($response));
		}
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_delete')));

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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_update_label')));

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
		$this->_out(new Upfront_JsonResponse_Error(Upfront_NavigationView::_get_l10n('cant_update_auto')));
	}

}

Upfront_MenuSetting::serve();

function upfront_navigation ($data) {
	$data['navigation'] = array(
		"auto_add" => get_option( 'nav_menu_options' )
	);
	return $data;
}
add_filter('upfront_data', 'upfront_navigation');