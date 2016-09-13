<?php

/**
 * Object implementation for newNavigation entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UnewnavigationView extends Upfront_Object {

	public function get_markup () {
		$breakpoint_menu_id = $this->_get_property('breakpoint_menu_id');
		$menu_id = $this->_get_property('menu_id');
		$menu_slug = $this->_get_property('menu_slug');
		$activeBreakpoints = Upfront_Grid::get_grid()->get_breakpoints();
		$preset = $this->_get_property('preset');
		if (!isset($preset)) {
			$preset = 'default';
		}
		$breakpoint_data = $this->_get_property('breakpoint');

		if ($this->_get_property('usingNewAppearance') == true) {
			/* NEW APPEARANCE */
			// preset here uses the Desktop one
			$preset_props = Upfront_Nav_Presets_Server::get_instance()->get_preset_properties($preset);
			$breakpoint_data['preset'] = isset($preset_props['breakpoint'])?$preset_props['breakpoint']:false;
			// catering breakpoint presets
			$breakpoint_presets = $this->_get_property('breakpoint_presets');
			$breakpoint_presets = is_array($breakpoint_presets) ? $breakpoint_presets : array();
			foreach ( $breakpoint_presets as $key=>$properties ) {
				// skip the desktop since already catered above
				if ( $key == 'desktop' ) continue;
				// if preset not defined skip also
				if ( !isset($properties['preset']) ) continue;
				// supplying correct breakpoint preset data
				$preset_props = Upfront_Nav_Presets_Server::get_instance()->get_preset_properties($properties['preset']);
				$breakpoint_data['preset'][$key] = ( isset($preset_props['breakpoint']) && isset($preset_props['breakpoint'][$key]) ) ? $preset_props['breakpoint'][$key] : false;
			}
		} else {
			/* OLD APPEARANCE */
			$breakpoint_property = $breakpoint_data;
			$breakpoint_property = is_array($breakpoint_property) ? $breakpoint_property : array();
			foreach ($breakpoint_property as $key=>$properties) {
				$breakpoint_data['preset'][$key] = $properties;

				if(isset( $properties['burger_menu'] ) && isset( $properties['burger_menu'][0] )) {
					$breakpoint_data['preset'][$key]['burger_menu'] = $properties['burger_menu'][0];
					$breakpoint_data['preset'][$key]['menu_style'] = "burger";
					$breakpoint_data['preset'][$key]['menu_alignment'] = $properties['menu_alignment'];
					$breakpoint_data['preset'][$key]['burger_alignment'] = $properties['burger_alignment'];
					$breakpoint_data['preset'][$key]['burger_over'] = $properties['burger_over'];
				}
			}
		}

		// if a breakpoint does not have info to render menu style, copy it from one higher
		if(is_array($breakpoint_data['preset'])) {
			$higher_name = '';
			foreach ($activeBreakpoints as $name => $point) {
				$data = $point->get_data();

				if(!array_key_exists($name, $breakpoint_data['preset']) && '' != $higher_name && !empty($breakpoint_data['preset'][$higher_name])) {
					$breakpoint_data['preset'][$name] = $breakpoint_data['preset'][$higher_name];
				}

				$higher_name = $name;

				/** if breakpoint has menu_style set to burger, but no
					burger_alignment is defined, set it to default
				**/
				if(isset($breakpoint_data['preset'][$name]) && isset($breakpoint_data['preset'][$name]['menu_style']) && $breakpoint_data['preset'][$name]['menu_style'] && !isset($breakpoint_data['preset'][$name]['burger_alignment']) ) {
					$breakpoint_data['preset'][$name]['burger_alignment'] = 'left';
				}
			}
		}

		$menu_style = $this->_get_property('menu_style');
		$menu_alignment = $this->_get_property('menu_alignment');

		$desktopPreset = (is_array($breakpoint_data['preset']) && isset($breakpoint_data['preset']['desktop']))?$breakpoint_data['preset']['desktop']:false;

		$sub_navigation = $this->_get_property('allow_sub_nav');
		$is_floating = $this->_get_property('is_floating');

		$breakpoint_data['preset']['desktop']['is_floating'] = $is_floating ? $is_floating : '';

		if ($this->_get_property('usingNewAppearance') == true) {
			$menu_style = isset($desktopPreset['menu_style']) && !empty($desktopPreset['menu_style']) ? $desktopPreset['menu_style'] :  $menu_style;
			$menu_alignment = isset($desktopPreset['menu_alignment']) ? $desktopPreset['menu_alignment'] : $menu_alignment;
			$breakpoint_data['preset']['desktop']['menu_style'] = ( empty($menu_style) ) ? 'horizontal' : $menu_style ;
		} else {
			$burgermenu_desktop =  $this->_get_property('burger_menu');
			if(is_array( $burgermenu_desktop ) && isset( $burgermenu_desktop[0] )) {
				$breakpoint_data['preset']['desktop']['burger_menu'] = $burgermenu_desktop[0];
				$breakpoint_data['preset']['desktop']['menu_style'] = "burger";
				$breakpoint_data['preset']['desktop']['menu_alignment'] = $menu_alignment;
				$breakpoint_data['preset']['desktop']['burger_alignment'] = $this->_get_property('burger_alignment');
				$breakpoint_data['preset']['desktop']['burger_over'] = $this->_get_property('burger_over');
			}
		}

		$menu_style = $menu_style === 'burger' ? 'burger' : $menu_style;

		if(empty($menu_style)) {
			$menu_style = 'horizontal';
		}

		$menu_style = "data-style='{$menu_style}' data-stylebk='{$menu_style}'";
		$breakpoint_data = "data-breakpoints='" . preg_replace("#'#", '"', json_encode($breakpoint_data)) . "'" ;
		$breakpoint_data = preg_replace('#\\\\"#', '"', $breakpoint_data);
		$menu_alignment = $menu_alignment ? "data-alignment='{$menu_alignment}' data-alignment='{$menu_alignment}'" : "";
		$sub_navigation = $sub_navigation ? "data-allow-sub-nav='yes'" : "data-allow-sub-nav='no'";

		$new_appearance = $this->_get_property('usingNewAppearance') ? 'true' : 'false';
		$using_appearance = "data-new-appearance='{$new_appearance}'";

		$float_class = $is_floating ? 'upfront-navigation-float' : '';

		upfront_add_element_script('unewnavigation_responsive', array('js/responsive.js', dirname(__FILE__)));

		if ($is_floating) {
			//wp_enqueue_script('unewnavigation', upfront_element_url('js/public.js', dirname(__FILE__)));
			upfront_add_element_script('unewnavigation', array('js/public.js', dirname(__FILE__)));
		}

		$breakpoint_menu_id = is_array($breakpoint_menu_id) ? $breakpoint_menu_id : array();
		$menu_html = '';
		if ( count($breakpoint_menu_id) ) {
			// return all menu for each breakpoint
			foreach ( $breakpoint_menu_id as $breakpoint => $breakpoint_menu ) {
				if ( isset($breakpoint_menu['menu_id']) ) {
					// check first if the breakpoint menu still existing, otherwise fallback to using menu_slug
					$target_menu = ( wp_get_nav_menu_object($breakpoint_menu['menu_id']) ) ? $breakpoint_menu['menu_id'] : $menu_slug ;
					$menu = wp_nav_menu(array(
						'menu' => $target_menu,
						'fallback_cb'     => false,
						'echo' => false,
						'walker' => new upfront_nav_walker(),
					));
					if($new_appearance == 'true') {
						$menu_html .= "<div class='nav-preset-{$preset} {$float_class} upfront-output-unewnavigation upfront-navigation upfront-breakpoint-navigation upfront-{$breakpoint}-breakpoint-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . $menu . "</div>";
					} else {
						$menu_html .= "<div class='{$float_class} upfront-output-unewnavigation upfront-navigation upfront-breakpoint-navigation upfront-{$breakpoint}-breakpoint-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . $menu . "</div>";
					}
				}
			}
		}
		// if we do have breakpoint menu then go ahead and show it, skip the rest below
		if ( !empty($menu_html) ) {
			return $menu_html;
		}
		
		// normal display with no other menu on each breakpoint
		if($menu_slug) {
			$menu = wp_get_nav_menu_object($menu_slug);
			if($menu)
				$menu_id = $menu->term_id;
		}
		if ( $menu_id ) {
			$menu = wp_nav_menu(array(
				'menu' => $menu_id,
				'fallback_cb'     => false,
				'echo' => false,
				'walker' => new upfront_nav_walker(),
			));
		} else {
			if($new_appearance == 'true') {
				return "<div class='{$preset} {$float_class} upfront-output-unewnavigation upfront-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . self::_get_l10n('select_menu') . "</div>";
			} else {
				return "<div class='{$float_class} upfront-output-unewnavigation upfront-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . self::_get_l10n('select_menu') . "</div>";
			}
		}
		if($new_appearance == 'true') {
			return "<div class='nav-preset-{$preset} {$float_class} upfront-output-unewnavigation upfront-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . $menu . "</div>";
		} else {
			return "<div class='{$float_class} upfront-output-unewnavigation upfront-navigation' {$using_appearance} {$menu_style} {$menu_alignment} {$breakpoint_data} {$sub_navigation}>" . $menu . "</div>";
		}
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
			'preset' => 'default',

			'allow_sub_nav' => array('no'), // array('no') | array ('yes')
			'allow_new_pages' => array('no'), // array('no') | array('yes')
		);
	}

	public static  function add_styles_scripts() {
		//upfront_add_element_style('upfront_navigation', array('css/unewnavigation-style.css', dirname(__FILE__)));
		wp_enqueue_style('upfront_navigation', upfront_element_url( Upfront_Debug::get_debugger()->is_dev() ? 'css/unewnavigation-style.css' : 'css/unewnavigation-style.min.css', dirname(__FILE__)));


		if (is_user_logged_in()) {
			upfront_add_element_style('upfront_navigation_editor', array('css/unewnavigation-editor.css', dirname(__FILE__)));
		}


		/*
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
			'choose_existing_menu' => __('Choose existing menu', 'upfront'),
			'are_you_sure_nag' => __('Are you sure to delete this menu?', 'upfront'),
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
				'title' => __('General Settings', 'upfront'),
				'load' => __('Select Menu to Use', 'upfront'),
				'delete_menu' => __('Delete', 'upfront'),
				'create' => __('or Create New', 'upfront'),
				'use' => __('Use', 'upfront'),
				'btn' => __('button to open menu', 'upfront'),
				'appearance' => __('Revealed Menu Appearance', 'upfront'),
				'show_on_click' => __('Show on click menu location:', 'upfront'),
				'alignment' => __('Alignment:', 'upfront'),
				'aligh' => __('Menu Item Alignment', 'upfront'),
				'left' => __('Left', 'upfront'),
				'right' => __('Right', 'upfront'),
				'horiz' => __('Horizontal', 'upfront'),
				'vert' => __('Vertical', 'upfront'),
				'triggered' => __('Triggered', 'upfront'),
				'right' => __('Right', 'upfront'),
				'top' => __('Top', 'upfront'),
				'whole' => __('Whole', 'upfront'),
				'over' => __('Over Content', 'upfront'),
				'push' => __('Pushes Content', 'upfront'),
				'align' => __('Menu Items Alignment', 'upfront'),
				'style' => __('Menu Style:', 'upfront'),
				'center' => __('Center', 'upfront'),
				'behavior' => __('Behaviour Settings', 'upfront'),
				'auto_add' => __('Add new Pages automatically', 'upfront'),
				'float' => __('Float this menu', 'upfront'),
			),
			'panel' => array(
				'menu_kind_label' => __('Menu Kind', 'upfront'),
				'typography_label' => __('Typography', 'upfront'),
				'colors_label' => __('Colors', 'upfront'),
				'background_label' => __('Background', 'upfront'),
				'item_background_label' => __('Item Background', 'upfront'),
			),
			'settings' => __('Navigation settings', 'upfront'),
			'add_item' => __('Add a menu item', 'upfront'),
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
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_new_load_menu_list', array($this, "load_menu_list"));
			upfront_add_ajax('upfront_new_load_menu_array', array($this, "load_menu_array"));
			upfront_add_ajax('upfront_new_load_menu_items', array($this, "load_menu_items"));
			upfront_add_ajax('upfront_new_menu_from_slug', array($this, "menu_from_slug"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::SAVE) && Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE)) {
			upfront_add_ajax('upfront_new_delete_menu_item', array($this, "delete_menu_item"));
			upfront_add_ajax('upfront_new_update_menu_order', array($this, "update_menu_order"));
			upfront_add_ajax('upfront_new_create_menu', array($this, "create_menu"));
			upfront_add_ajax('upfront_new_rename_menu', array($this, "rename_menu"));
			upfront_add_ajax('upfront_new_delete_menu', array($this, "delete_menu"));

			upfront_add_ajax('upfront_new_update_menu_item', array($this, "update_menu_item"));
			upfront_add_ajax('upfront_new_update_auto_add_pages', array($this, "update_auto_add_pages"));
			upfront_add_ajax('upfront_update_menu_items', array($this, "update_menu_items"));
			upfront_add_ajax('upfront_update_single_menu_item', array($this, "update_single_menu_item"));
		}
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
			$alternate = !empty($_POST['alternate']) ? $_POST['alternate'] : false;
			$menu = wp_get_nav_menu_object( $menu_id ? $menu_id : $alternate );

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
			'menu-item-target' => ($e->type === 'anchor' || $e->type === 'email' || $e->type === 'phone') ? '_self' : $e->target,
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
		$messages = array();
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
		$this->_out(new Upfront_JsonResponse_Success($menu));

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

	public function delete_menu() {
		$menu_id = isset($_POST['menu_id']) ? $_POST['menu_id'] : false;
		if ( $menu_id ){
			$response = wp_delete_nav_menu($menu_id);
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

	public function update_menu_items(){
		$menuId = isset($_POST['data']['menuId']) ? intval($_POST['data']['menuId']) : 0;
		$items = isset($_POST['data']['items']) ? $_POST['data']['items'] : array();
		foreach($items as $item) {
			wp_update_nav_menu_item($menuId, $item['menu-item-db-id'], $item);
		}
		$this->_out(new Upfront_JsonResponse_Success('success'));
	}

	public function update_single_menu_item() {
		$menuId = isset($_POST['menuId']) ? intval($_POST['menuId']) : 0;
		$item_data = isset($_POST['menuItemData']) ? $_POST['menuItemData'] : array();
		if ($menuId === 0 || empty($item_data)) {
			$this->_out(new Upfront_JsonResponse_Error('cant update item'));
		}

		if (!isset($item_data['menu-item-db-id'])) $item_data['menu-item-db-id'] = 0;

		$itemId = wp_update_nav_menu_item($menuId, $item_data['menu-item-db-id'], $item_data);
		$this->_out(new Upfront_JsonResponse_Success(array('itemId' => $itemId)));
	}
}

Upfront_newMenuSetting::serve();

class upfront_nav_walker extends Walker_Nav_Menu
{
	public function start_el( &$output, $item, $depth = 0, $args = array(), $id = 0 ) {
		$indent = ( $depth ) ? str_repeat( "\t", $depth ) : '';

		$classes = empty( $item->classes ) ? array() : (array) $item->classes;

		// to add current menu item status to a paginated blog
		if($item->url == rtrim(get_permalink(), '/') && !array_search('current-menu-item', $classes))
			$classes[] = 'current-menu-item';

		//this code is why all this function has been overriden, this one checks if the link is anchor and removes the current-menu-item class
		if(strpos($item->url, '#')) {
			foreach($classes as $index => $class_item) {
				if($class_item == 'current-menu-item')
					unset($classes[$index]);
			}
		}

		$classes[] = 'menu-item-' . $item->ID;
		$classes[] = 'menu-item-depth-' . $depth;

		/**
		 * Filter the CSS class(es) applied to a menu item's <li>.
		 *
		 * @since 3.0.0
		 *
		 * @see wp_nav_menu()
		 *
		 * @param array  $classes The CSS classes that are applied to the menu item's <li>.
		 * @param object $item    The current menu item.
		 * @param array  $args    An array of wp_nav_menu() arguments.
		 */
		$class_names = join( ' ', apply_filters( 'nav_menu_css_class', array_filter( $classes ), $item, $args ) );
		$class_names = $class_names ? ' class="' . esc_attr( $class_names ) . '"' : '';

		/**
		 * Filter the ID applied to a menu item's <li>.
		 *
		 * @since 3.0.1
		 *
		 * @see wp_nav_menu()
		 *
		 * @param string $menu_id The ID that is applied to the menu item's <li>.
		 * @param object $item    The current menu item.
		 * @param array  $args    An array of wp_nav_menu() arguments.
		 */
		$id = apply_filters( 'nav_menu_item_id', 'menu-item-'. $item->ID, $item, $args );
		$id = $id ? ' id="' . esc_attr( $id ) . '"' : '';

		$output .= $indent . '<li' . $id . $class_names .'>';

		$atts = array();
		$atts['title']  = ! empty( $item->attr_title ) ? $item->attr_title : '';
		$atts['target'] = ! empty( $item->target )     ? $item->target     : '';
		$atts['rel']    = ! empty( $item->xfn )        ? $item->xfn        : '';
		$atts['href']   = ! empty( $item->url )        ? $item->url        : '';

		/**
		 * Filter the HTML attributes applied to a menu item's <a>.
		 *
		 * @since 3.6.0
		 *
		 * @see wp_nav_menu()
		 *
		 * @param array $atts {
		 *     The HTML attributes applied to the menu item's <a>, empty strings are ignored.
		 *
		 *     @type string $title  Title attribute.
		 *     @type string $target Target attribute.
		 *     @type string $rel    The rel attribute.
		 *     @type string $href   The href attribute.
		 * }
		 * @param object $item The current menu item.
		 * @param array  $args An array of wp_nav_menu() arguments.
		 */
		$atts = apply_filters( 'nav_menu_link_attributes', $atts, $item, $args );

		$attributes = '';
		foreach ( $atts as $attr => $value ) {
			if ( ! empty( $value ) ) {
				$value = ( 'href' === $attr ) ? esc_url( $value ) : esc_attr( $value );
				$attributes .= ' ' . $attr . '="' . $value . '"';
			}
		}

		$item_output = $args->before;
		$item_output .= '<a'. $attributes .'>';
		/** This filter is documented in wp-includes/post-template.php */
		$item_output .= $args->link_before . apply_filters( 'the_title', $item->title, $item->ID, true ) . $args->link_after;
		$item_output .= '</a>';
		$item_output .= $args->after;

		/**
		 * Filter a menu item's starting output.
		 *
		 * The menu item's starting output only includes $args->before, the opening <a>,
		 * the menu item's title, the closing </a>, and $args->after. Currently, there is
		 * no filter for modifying the opening and closing <li> for a menu item.
		 *
		 * @since 3.0.0
		 *
		 * @see wp_nav_menu()
		 *
		 * @param string $item_output The menu item's starting HTML output.
		 * @param object $item        Menu item data object.
		 * @param int    $depth       Depth of menu item. Used for padding.
		 * @param array  $args        An array of wp_nav_menu() arguments.
		 */
		$output .= apply_filters( 'walker_nav_menu_start_el', $item_output, $item, $depth, $args );
	}

	public function end_el( &$output, $item, $depth = 0, $args = array() ) {
		$output .= "</li>";
	}
}
