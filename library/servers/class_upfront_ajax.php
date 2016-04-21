<?php

/**
 * Layout editor AJAX request hub.
 */
class Upfront_Ajax extends Upfront_Server {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	public static function serve () {
		$me = self::get_instance();
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_layout', array($this, "load_layout"));
			upfront_add_ajax('upfront_create_layout', array($this, "create_layout"));
            
            upfront_add_ajax('upfront_list_scoped_regions', array($this, "list_scoped_regions"));
            upfront_add_ajax('upfront_get_scoped_regions', array($this, "get_scoped_regions"));
            upfront_add_ajax('upfront_delete_scoped_regions', array($this, "delete_scoped_regions"));
			upfront_add_ajax('upfront_user_done_font_intro', array($this, "user_done_font_intro"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_layout', array($this, "save_layout"));
			upfront_add_ajax('upfront_reset_layout', array($this, "reset_layout"));
			upfront_add_ajax('upfront_reset_cache', array($this, "reset_cache"));
			upfront_add_ajax('upfront_reset_all_from_db', array($this, "reset_all_from_db"));
			upfront_add_ajax('upfront_update_layout_element', array($this, "update_layout_element"));

			upfront_add_ajax('upfront_update_insertcount', array($this, "update_insertcount"));
		}
	}

	public function user_done_font_intro() {
		$users = get_option('upfront_users_done_font_intro', array());
		$current_user = wp_get_current_user();
		if (!in_array($current_user->user_login, $users)) $users[] = $current_user->user_login;
		update_option('upfront_users_done_font_intro', $users);
	}

	// STUB LOADING
	function load_layout () {
	
		$layout_ids = $_POST['data'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = !empty($_POST['layout_slug']) ? $_POST['layout_slug'] : false;
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		
		if ( $post_id ) {
			// if page then skip to load_page_layout()
			$post = get_post($post_id);
			if ( $post->post_type === 'page' ) return $this->load_page_layout();
		}
		
		// if post_id is false, still load_page_layout()
		if ( !$post_id ) return $this->load_page_layout();

		//Check if assigned WP template and delete DB layout
		if(isset($_POST['post_id']) && !empty($_POST['post_id']) && isset($_POST['data']['specificity']) && !empty($_POST['data']['specificity'])) {
			$template = get_post_meta((int)$_POST['post_id'], '_wp_page_template', true);
			$theme = Upfront_ChildTheme::get_instance();
			$prefix = $theme->get_prefix();
			if(!empty($template) && $template != "default") {
				delete_option($prefix.'-'.$_POST['data']['specificity']);
			}
		}

		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}

		$layout = Upfront_Layout::from_entity_ids($layout_ids, $storage_key, $load_dev);

		if ($layout->is_empty()){
			// Instead of whining, create a stub layout and load that
			$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
		}

		global $post, $upfront_ajax_query;

		if(!$upfront_ajax_query)
			$upfront_ajax_query = false;

		if($post_type){
			$post = Upfront_PostModel::create($post_type);
			// set new layout IDS based on the created post ID
			$cascade = array(
				'type' => 'single',
				'item'=> $post_type,
				'specificity' => $post->ID
			);

			$layout_ids = Upfront_EntityResolver::get_entity_ids($cascade);
		}
		else {
			if($_POST['post_id']){
				$posts = get_posts(array('include' => $_POST['post_id'], 'suppress_filters' => false));
				if(sizeof($posts)) $post = $posts[0];
			}
			
			//TODO: remove page template related later if proven safe
			
			/* 
			$post = $post;
			if ($post && is_singular()) {
				if (!is_page($post->ID)) {
					$layout_ids = Upfront_EntityResolver::get_entity_ids();
				} else {
					// Deal with page templates
					$template = get_post_meta((int)$post->ID, '_wp_page_template', true);
					$theme = Upfront_ChildTheme::get_instance();
					$settings = $theme->get_theme_settings();
					if (!empty($template) && !empty($settings)) {
						$tpl = preg_replace('/page-(.*)\.php$/', '\1', $template);
						$required_pages = $settings->get('required_pages');
						if (!empty($required_pages)) $required_pages = json_decode($required_pages, true);
						$specificity = !empty($required_pages[$tpl]['layout']) ? $required_pages[$tpl]['layout'] : false;
						if (!empty($specificity)) {
							$template_layout = Upfront_Layout::from_entity_ids(array('specificity' => $specificity));
							if (!empty($template_layout) && !$template_layout->is_empty()) {
								$layout = $template_layout;
								$query = new WP_Query(array(
									'page_id' => (int)$post->ID,
								));
								$layout_ids = Upfront_EntityResolver::get_entity_ids(Upfront_EntityResolver::get_entity_cascade($query));
								$layout->set('layout', $layout_ids);
								$layout->set('current_layout', $layout_ids['specificity']);
							}
						}
					}
					// End page templates workaround
				}
			} else if($_POST['post_id']){
				$posts = get_posts(array('include' => $_POST['post_id'], 'suppress_filters' => false));
				if(sizeof($posts)) $post = $posts[0];
				
				// Deal with page templates
				$template = get_post_meta((int)$_POST['post_id'], '_wp_page_template', true);
				$theme = Upfront_ChildTheme::get_instance();
				$settings = $theme instanceof Upfront_ChildTheme ? $theme->get_theme_settings() : false;
				if (!empty($template) && !empty($settings)) {
					$tpl = preg_replace('/page-(.*)\.php$/', '\1', $template);
					$required_pages = $settings->get('required_pages');
					if (!empty($required_pages)) $required_pages = json_decode($required_pages, true);
					$specificity = !empty($required_pages[$tpl]['layout']) ? $required_pages[$tpl]['layout'] : false;
					if (!empty($specificity)) {
						$template_layout = Upfront_Layout::from_entity_ids(array('specificity' => $specificity));
						if (!empty($template_layout) && !$template_layout->is_empty()) {
							$layout = $template_layout;
							$query = new WP_Query(array(
								'page_id' => (int)$_POST['post_id'],
							));
							$layout_ids = Upfront_EntityResolver::get_entity_ids(Upfront_EntityResolver::get_entity_cascade($query));
							$layout->set('layout', $layout_ids);
							$layout->set('current_layout', $layout_ids['specificity']);
						}
					}
				}
				// End page templates workaround
			} */
		}

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'query' => $upfront_ajax_query
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}
	
	function load_page_layout () {
		// TODO: 
		// - new page not yet covered
		// - take care build preview
		
		$layout_ids = $_POST['data'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = !empty($_POST['layout_slug']) ? $_POST['layout_slug'] : false;
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;
		$load_from_options = true;
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;

		//Check if assigned WP template and delete DB layout
		if( $post_id && isset($_POST['data']['specificity']) && !empty($_POST['data']['specificity']) ) {
			$template = get_post_meta((int)$post_id, '_wp_page_template', true);
			$theme = Upfront_ChildTheme::get_instance();
			$prefix = $theme->get_prefix();
			if(!empty($template) && $template != "default") {
				delete_option($prefix.'-'.$_POST['data']['specificity']);
			}
		}
		
		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}
		
		global $post, $upfront_ajax_query;
		
		if(!$upfront_ajax_query)
			$upfront_ajax_query = false;
		
		$template_meta_name = ( $load_dev ) 
			? 'template_dev_post_id'
			: 'template_post_id'
		;
		
		if ( $post_id ) {
			$post = get_post($post_id);
			$template_post_id = get_post_meta($post_id, $template_meta_name, true);
		} else {
			// if special archive pages like homepage, use slug to get template post id
			$store_key = Upfront_Layout::get_storage_key() . '-' . $layout_ids['item'];
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($store_key, $load_dev);
		}
		
		if ( $template_post_id ) {
			$page_template = Upfront_Server_PageTemplate::get_instance()->get_template($template_post_id, $load_dev);
			if ( $page_template ) {
				$layout = Upfront_Layout::from_php($page_template, $storage_key);
				$load_from_options = false;
			}
		}
		
		// load previous page templates not yet saved using CPT
		if ( $load_from_options ) {
			$layout = Upfront_Layout::from_entity_ids($layout_ids, $storage_key, $load_dev);

			if ($layout->is_empty()){
				// Instead of whining, create a stub layout and load that
				$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
			}
			// Deal with page templates
			$template = get_post_meta((int)$_POST['post_id'], '_wp_page_template', true);
			$theme = Upfront_ChildTheme::get_instance();
			$settings = $theme instanceof Upfront_ChildTheme ? $theme->get_theme_settings() : false;
			if (!empty($template) && !empty($settings)) {
				$tpl = preg_replace('/page-(.*)\.php$/', '\1', $template);
				$required_pages = $settings->get('required_pages');
				if (!empty($required_pages)) $required_pages = json_decode($required_pages, true);
				$specificity = !empty($required_pages[$tpl]['layout']) ? $required_pages[$tpl]['layout'] : false;
				if (!empty($specificity)) {
					$template_layout = Upfront_Layout::from_entity_ids(array('specificity' => $specificity));
					if (!empty($template_layout) && !$template_layout->is_empty()) {
						$layout = $template_layout;
						$query = new WP_Query(array(
							'page_id' => (int)$_POST['post_id'],
						));
						$layout_ids = Upfront_EntityResolver::get_entity_ids(Upfront_EntityResolver::get_entity_cascade($query));
						$layout->set('layout', $layout_ids);
						$layout->set('current_layout', $layout_ids['specificity']);
					}
				}
			}
			// End page templates workaround
		}

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'template_post_id' => $template_post_id,
			'query' => $upfront_ajax_query
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	function create_layout () {
		$layout_ids = $_POST['data'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = !empty($_POST['layout_slug']) ? $_POST['layout_slug'] : false;
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;

		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}

		// Start by nulling out the layout
		$layout = false;

		// Check if we're to inherit a layout from a page template
		if (!empty($_POST['use_existing'])) {
			// Resolve existing page template to a layout
			$tpl = preg_replace('/page_tpl-(.*)\.php/', '\1', $_POST['use_existing']);
			$theme = Upfront_ChildTheme::get_instance();
			$settings = $theme->get_theme_settings();
			if (!empty($tpl) && !empty($settings)) {
				$required_pages = $settings->get('required_pages');
				if (!empty($required_pages)) $required_pages = json_decode($required_pages, true);
				$specificity = !empty($required_pages[$tpl]['layout']) ? $required_pages[$tpl]['layout'] : false;
				if (!empty($specificity)) {
					$template_layout = Upfront_Layout::from_entity_ids(array('specificity' => $specificity));
					if (!empty($template_layout) && !$template_layout->is_empty()) {
						$layout = $template_layout;
						$layout->set('layout', $layout_ids);
						$layout->set('current_layout', $layout_ids['specificity']);
					}
				}
			}
		}

		// If we still don't have a template set, make one up
		if (empty($layout)) {
			$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
		}

		global $post, $upfront_ajax_query;

		if(!$upfront_ajax_query)
			$upfront_ajax_query = false;

		if($post_type){
			$post = Upfront_PostModel::create($post_type);
			// set new layout IDS based on the created post ID
			$cascade = array(
				'type' => 'single',
				'item'=> $post_type,
				'specificity' => $post->ID
			);
			$layout_ids = Upfront_EntityResolver::get_entity_ids($cascade);
		}
		else {
			$post = $post;
			if ($post && is_singular())
				$layout_ids = Upfront_EntityResolver::get_entity_ids();
			else if($_POST['post_id']){
				$posts = get_posts(array('include' => $_POST['post_id'], 'suppress_filters' => false));
				if(sizeof($posts))
					$post = $posts[0];
			}
		}

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'query' => $upfront_ajax_query
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	function save_layout () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();
		if (!Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE)) $this->_reject();
		
		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'] ? $_POST['stylesheet'] : get_stylesheet();
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		
		if ( $post_id ) {
			// if page then skip to save_page_layout()
			$post = get_post($post_id);
			if ( $post->post_type === 'page' ) return $this->save_page_layout();
		}
		
		// if post_id is false, still use save_page_layout()
		if ( !$post_id ) return $this->save_page_layout();

		upfront_switch_stylesheet($stylesheet);

		$layout = Upfront_Layout::from_php($data, $storage_key);
		$key = $layout->save();
		
		// TODO: can be removed later if proven safe
		// For single page layouts, also drop page templates
		/* $layout_data = $layout->get('layout');
		if (!empty($layout_data['specificity']) && preg_match('/single-page-\d+$/', $layout_data['specificity'])) {
			$page_id = preg_replace('/single-page-(\d+)$/', '\1', $layout_data['specificity']);
			// If we have a page template set...
			if (!empty($page_id) && get_post_meta($page_id, '_wp_page_template', true)) {
				// Kill it, as we just saved the layout for it
				delete_post_meta($page_id, '_wp_page_template');
			}
			if (!empty($page_id)) {
				wp_update_post(array(
					'ID' => $page_id,
					'post_status' => 'publish',
				));
			}
		} */

		$this->_out(new Upfront_JsonResponse_Success($key));
	}
	
	function save_page_layout () {
		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'] ? $_POST['stylesheet'] : get_stylesheet();
		$template_post_id = false;
		$save_dev = $_POST['save_dev'] == 1 ? true : false;
		
		upfront_switch_stylesheet($stylesheet);
		
		$raw_data = stripslashes_deep($_POST);
		$json_data = !empty($raw_data['data']) ? $raw_data['data'] : '';
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		
		$layout = Upfront_Layout::from_json($json_data);
		
		if ( $post_id ) {
		
			$template_meta_name = ( $save_dev ) 
				? 'template_dev_post_id'
				: 'template_post_id'
			;
			
			// get corresponding template post id
			$template_post_id = get_post_meta((int)$post_id, $template_meta_name, true);
			// save the page template
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->save_template($template_post_id, $layout, $save_dev);
			// add/update the template post id
			if ( $template_post_id ) update_post_meta((int)$post_id, $template_meta_name, $template_post_id);
			
		} else {
			// if special archive pages like homepage, use slug to get template post id
			$template_slug = Upfront_Layout::get_storage_key() . '-' . $layout->get('layout')['item'];
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($template_slug, $save_dev);
			// save the page template
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->save_template($template_post_id, $layout, $save_dev);
		}
		
		// For single page layouts, also drop page templates
		$layout = Upfront_Layout::from_php($data, $storage_key);
		$layout_data = $layout->get('layout');
		if (!empty($layout_data['specificity']) && preg_match('/single-page-\d+$/', $layout_data['specificity'])) {
			$page_id = preg_replace('/single-page-(\d+)$/', '\1', $layout_data['specificity']);
			// If we have a page template set...
			if (!empty($page_id) && get_post_meta($page_id, '_wp_page_template', true)) {
				// Kill it, as we just saved the layout for it
				delete_post_meta($page_id, '_wp_page_template');
			}
			if (!empty($page_id)) {
				wp_update_post(array(
					'ID' => $page_id,
					'post_status' => 'publish',
				));
				
			}
		}
		$this->_out(new Upfront_JsonResponse_Success($template_post_id));
	}

    function list_scoped_regions () {
        $storage_key = $_POST['storage_key'];
        $scope = $_POST['scope'];
        $regions = Upfront_Layout::list_scoped_regions($scope, $storage_key);
        $this->_out(new Upfront_JsonResponse_Success($regions));
    }

    function get_scoped_regions () {
        $storage_key = $_POST['storage_key'];
        $scope = $_POST['scope'];
        $name = $_POST['name'];
        $regions = Upfront_Layout::get_scoped_regions($name, $scope, $storage_key);
        $this->_out(new Upfront_JsonResponse_Success($regions));
    }

    function delete_scoped_regions () {
        $storage_key = $_POST['storage_key'];
        $scope = $_POST['scope'];
        $name = $_POST['name'];
        $regions = Upfront_Layout::delete_scoped_regions($name, $scope, $storage_key);
        $this->_out(new Upfront_JsonResponse_Success($regions));
    }

	function reset_layout () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;
		$layout = !empty($data['layout']) && $data['layout'] !== "0" ? $data['layout'] : array();
		$stylesheet = isset( $data['stylesheet'] ) ? $data['stylesheet'] : get_stylesheet();
		$stylesheet_dev = false;
		if (!empty($data['dev'])) {
			$stylesheet_dev = "{$stylesheet}_dev"; // Handle dev-mode names
		}

		if( $layout === array() )
			$this->_out(new Upfront_JsonResponse_Error("Please specify layout to reset"));



		if( $stylesheet_dev ){
			$layout_key = $stylesheet_dev . "-" . $layout;
			$alternative_layout_key = wp_get_theme($stylesheet)->get("Name") . "_dev-" . $layout;
			delete_option( $layout_key );
			delete_option( $alternative_layout_key );
		}else{
			$layout_key = $stylesheet . "-" . $layout;
			$alternative_layout_key = wp_get_theme($stylesheet)->get("Name") . "-" . $layout;
			delete_option( $layout_key );
			delete_option( $alternative_layout_key );
		}

		$this->_out(new Upfront_JsonResponse_Success("Layout {$layout} reset"));
	}

	function reset_cache () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();
		$this->_reset_cache();
		$this->_out(new Upfront_JsonResponse_Success("All is well"));
	}

	private function _reset_cache () {
		global $wpdb;

		$keys = array(
			'js',
			'css',
			'grid',
			'grid_front_response',
			'styles_main',
		);
		$rx = '_transient(_timeout)?_(' . join("|", $keys) . ')(_uf_)?[a-f0-9]+';
		
		$sql = "DELETE FROM {$wpdb->options} WHERE option_name REGEXP %s";
		return $wpdb->query($wpdb->prepare($sql, $rx));
	}

	function reset_all_from_db () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;
		$stylesheet = isset( $data['stylesheet'] ) ? $data['stylesheet'] : get_stylesheet();

		global $wpdb;
		$theme_key = $wpdb->esc_like(Upfront_Model::get_storage_key()) . '%';
		$stylesheet_key = $wpdb->esc_like($stylesheet) . '%';
		$global_theme_key = 'upfront_' . $wpdb->esc_like($stylesheet) . '%';

		$sql = $wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s", $stylesheet_key, $global_theme_key, $theme_key);
		$wpdb->query($sql);

		// Do menus
		$child = Upfront_ChildTheme::get_instance();
		if ($child instanceof Upfront_ChildTheme) {
			$settings = $child->get_theme_settings();
			if (is_callable(array($settings, 'get'))) {
				// Get all theme-defined menus
				$menus = json_decode($settings->get('menus'), true);
				if (!empty($menus) && is_array($menus)) foreach ($menus as $menu) {
					if (empty($menu['slug'])) continue; // We don't know what this is
					wp_delete_nav_menu($menu['slug']);
				}
			}
		}

		$this->_reset_cache(); // When resetting all, also do cache.
		
		$this->_out(new Upfront_JsonResponse_Success("All is well"));
	}

	function update_layout_element() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;

		if(!$data)
			return $this->_out(new Upfront_JsonResponse_Error("No data"));
		if(empty($data['layout']))
			return $this->_out(new Upfront_JsonResponse_Error("No layout id given"));
		if(empty($data['element']))
			return $this->_out(new Upfront_JsonResponse_Error("No element data given"));

		$element = json_decode($data['element'], true);

		$layout = Upfront_Layout::from_entity_ids($data['layout'], $data['storage_key']);
		if(empty($layout))
			return $this->_out(new Upfront_JsonResponse_Error("Unkown layout"));

		$updated = $layout->set_element_data($element);
		if(!$updated)
			return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));

		$layout->save();
		$this->_out(new Upfront_JsonResponse_Success("Layout updated"));
	}

	function update_insertcount() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$insertcount = get_option('ueditor_insert_count');
		if(!$insertcount)
			$insertcount = 0;
		$insertcount++;
		update_option('ueditor_insert_count', $insertcount);
		$this->_out(new Upfront_JsonResponse_Success("Insert count updated"));
	}

}
