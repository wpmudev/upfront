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
			upfront_add_ajax('upfront_save_layout_meta', array($this, "save_page_layout_meta"));
			upfront_add_ajax('upfront_reset_layout', array($this, "reset_layout"));
			upfront_add_ajax('upfront_reset_cache', array($this, "reset_cache"));
			upfront_add_ajax('upfront_reset_all_from_db', array($this, "reset_all_from_db"));
			upfront_add_ajax('upfront_update_layout_element', array($this, "update_layout_element"));
			upfront_add_ajax('upfront_add_custom_thumbnail_size', array($this, "add_custom_thumbnail_size"));
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
		
		
		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}
		
		if ( $post_id ) {
			$post = get_post($post_id);
			// if page then skip to load_page_layout()
			if ( $post->post_type === 'page' ) return $this->load_page_layout();
		}
		
		// if post_id is false, still load_page_layout()
		if ( !$post_id ) return $this->load_page_layout();

		$layout = Upfront_Layout::from_entity_ids($layout_ids, $storage_key, $load_dev);

		if ($layout->is_empty()){
			// Instead of whining, create a stub layout and load that
			$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
		}

		global $upfront_ajax_query;

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

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'query' => $upfront_ajax_query
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}
	
	function load_page_layout () {		
		$layout_ids = $_POST['data'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = !empty($_POST['layout_slug']) ? $_POST['layout_slug'] : false;
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;
		$load_from_options = true;
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		$template_slug = false;
		
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
		
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		$template_meta_name = ( $load_dev ) 
			? $store_key . '-template_dev_post_id'
			: $store_key . '-template_post_id'
		;
		
		if ( $post_id ) {
			$post = get_post($post_id);
			$template_post_id = get_post_meta($post_id, $template_meta_name, true);
			$template_file = get_post_meta($post_id, '_wp_page_template', true);
			
			if ( $template_file ) {
				// save post meta backup for template file, we need this later when resetting layouts
				update_post_meta($post_id, 'orig_wp_page_template', $template_file);
				
				// taking care $template_slug
				$page_templates = get_page_templates();
				foreach ( $page_templates as $template_name => $template_filename ) {
					if ( $template_filename == $template_file ) {
						$template_slug = $store_key . '-' . str_replace(' ','-',strtolower($template_name));
						break;
					}
				}
			}
			// if no template yet from custom post type for this page 
			// try to check/get if same layout already saved 
			if ( !$template_post_id && $template_slug ) {
				// use the slug to get template post id
				$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($template_slug, $load_dev);
			} elseif ( !$template_post_id && !$template_slug ) {
				$template_slug = $store_key . '-default';
				$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($template_slug, $load_dev);
			}
			
			if ( $template_post_id ) {
				// update post meta for template from custom post type
				update_post_meta($post_id, $template_meta_name, $template_post_id);
				// remove _wp_page_template since we have already using existing template from custom post type
				delete_post_meta($post_id, '_wp_page_template');
				// needs to provide $template_slug for saving layout
				if ( !$template_slug ) {
					$template_post = get_post($template_post_id);
					$template_slug = $template_post->post_name;
				}
			}
		} else {
			// if special archive pages like homepage, use slug to get template post id
			$store_key = $store_key . '-' . $layout_ids['item'];
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($store_key, $load_dev);
			// if no template slug then it is the default template
			if ( !$template_slug ) $template_slug = $store_key . '-default';
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
		}
		
		if ( $template_post_id ) {
			$template_type = get_post_meta($template_post_id, 'template_type', true);
			if ( !$template_type ) $template_type =  $layout->get('template_type');
		} else {
			$template_type =  $layout->get('template_type');
		}
		
		// if layout loaded from a file then it belongs to Page Template type
		if ( $template_type == 'file' ) {
			$template_type =  'page';
			
			if ( !$template_slug && $post_id ) {
				$page_templates = get_page_templates();
				foreach ( $page_templates as $template_name => $template_filename ) {
					$filename = preg_replace('/page_tpl-(.*)\.php$/', '\1', $template_filename);
					if ( $filename == $post->post_name ) {
						$template_slug = $store_key . '-' . str_replace(' ','-',strtolower($template_name));
						break;
					}
				}
				// if still empty template slug then it is the default template
				if ( !$template_slug ) $template_slug = $store_key . '-default';
			}
		}
		
		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'template_post_id' => $template_post_id,
			'template_type' => $template_type,
			'template_slug' => $template_slug,
			'template_file' => $template_file,
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
			$post = get_post($post_id);
			// if page then skip to save_page_layout()
			if ( $post->post_type === 'page' ) return $this->save_page_layout();
		}
		
		// if post_id is false, still use save_page_layout()
		if ( !$post_id ) return $this->save_page_layout();

		upfront_switch_stylesheet($stylesheet);
	
		// for post still save on options
		$layout = Upfront_Layout::from_php($data, $storage_key);
		$key = $layout->save();

		$this->_out(new Upfront_JsonResponse_Success($key));
	}
	
	function save_page_layout () {
		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));
		$template_type = $_POST['template_type'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = ($_POST['stylesheet']) ? $_POST['stylesheet'] : get_stylesheet();
		$template_post_id = false;
		$save_as = $_POST['save_as'] == 1 ? true : false;
		$save_dev = $_POST['save_dev'] == 1 ? true : false;
		$template_slug = (!empty($_POST['template_slug'])) ? $_POST['template_slug'] : false;
		
		upfront_switch_stylesheet($stylesheet);
		
		$raw_data = stripslashes_deep($_POST);
		$json_data = !empty($raw_data['data']) ? $raw_data['data'] : '';
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		
		$layout = Upfront_Layout::from_json($json_data);
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		if ( $post_id ) {
		
			$template_meta_name = ( $save_dev ) 
				? $store_key . '-template_dev_post_id'
				: $store_key . '-template_post_id'
			;
			// get corresponding template post id only if not "save as"
			if ( $save_as ) {
				$template_slug = $store_key . '-' . str_replace(' ','-',strtolower($template_slug));
				// check if already existing
				$original_slug = $template_slug;
				$slug_num = (int) $template_slug;
				while ( $this->_check_template_slug($template_slug) ) {
					$slug_num++;
					$slug_num_padded = sprintf("%02s", $slug_num);
					$template_slug = $original_slug . $slug_num_padded;
				}
			} else {
				$template_post_id = get_post_meta((int)$post_id, $template_meta_name, true);
			}
			// create or update page template
			$saved_template_post_id = Upfront_Server_PageTemplate::get_instance()->save_template($template_post_id, $layout, $save_dev, $template_slug);
			// add/update the template post id
			if ( $saved_template_post_id ) {
				update_post_meta((int)$post_id, $template_meta_name, $saved_template_post_id);
				// remove _wp_page_template since we have already saved it on custom post type
				delete_post_meta($post_id, '_wp_page_template');
			}
		} else {
			// if special archive pages like homepage, use slug to get template post id
			$slug = $store_key . '-' . $layout->get('layout')['item'];
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($slug, $save_dev);
			// save the page template
			$saved_template_post_id = Upfront_Server_PageTemplate::get_instance()->save_template($template_post_id, $layout, $save_dev);
		}
		
		// post meta for layout_type if this is for Page or Layout template
		if ( $saved_template_post_id && !empty($template_type) ) update_post_meta((int)$saved_template_post_id, 'template_type', $template_type);
		
		$this->_out(new Upfront_JsonResponse_Success((object) array(
			'saved_template_post_id' => $saved_template_post_id,
			'template_slug' => $template_slug
		)));
	}
	
	private function _check_template_slug ($template_slug) {
		$templates = $this->_parse_all_template_slugs();
		return ( empty($templates) )
			? false
			: in_array($template_slug, $templates, true)
		;
	}
	
	private function _parse_all_template_slugs () {
		$templates = array();
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		array_push($templates, $store_key . '-default');
		
		$page_templates = get_page_templates();
		foreach ( $page_templates as $template_name => $template_filename ) {
			array_push($templates, $store_key . '-' . str_replace(' ','-',strtolower($template_name)));
		}
		
		$custom_post_type_templates = Upfront_Server_PageTemplate::get_instance()->get_all_theme_templates('all', 'layout');
		foreach ( $custom_post_type_templates as $custom_template ) {
			array_push($templates, $custom_template->post_name);
		}
		
		// append layouts saved on options table (from old implementation)
		$db_option_layouts = Upfront_Layout::get_db_layouts();
		foreach ( $db_option_layouts as $key => $db_layout ) {
			array_push($templates, $db_layout);
		}
		
		return $templates;
	}
	
	function save_page_layout_meta () {
		$template_type = $_POST['template_type'];
		$template_post_id = false;
		$save_dev = $_POST['save_dev'] == 1 ? true : false;
		$template_slug = (!empty($_POST['template_slug'])) ? $_POST['template_slug'] : false;
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		if ( $post_id ) {
		
			$template_meta_name = ( $save_dev ) 
				? $store_key . '-template_dev_post_id'
				: $store_key . '-template_post_id'
			;
			
			// get the template_post_id of selected template slug
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($template_slug, $save_dev);
			
			// add/update the template post id
			if ( $template_post_id ) {
				update_post_meta((int)$post_id, $template_meta_name, $template_post_id);
				// remove _wp_page_template since we are already using custom post type template
				delete_post_meta($post_id, '_wp_page_template');
			} elseif ( $template_slug ) {
				// meaning selected template slug coming from a file
				$page_templates = get_page_templates();
				foreach ( $page_templates as $template_name => $template_filename ) {
					$slug = $store_key . '-' . str_replace(' ','-',strtolower($template_name));
					if ( $slug == $template_slug ) {
						update_post_meta($post_id, '_wp_page_template', $template_filename);
						update_post_meta($post_id, 'orig_wp_page_template', $template_filename);
						break;
					}
				}
				// since we are now using a template file, remove any existing post meta for custom post type template
				delete_post_meta($post_id, $template_meta_name);
			}
		}
		
		// post meta for layout_type if this is for Page or Layout template
		if ( $template_post_id && !empty($template_type) ) update_post_meta((int)$template_post_id, 'template_type', $template_type);
		
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
		$is_dev = ( !empty($data['is_dev']) )
			? (bool) $data['is_dev']
			: false
		;
		
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		// if resetting from UF editor via Delete Template button and template_slug contains the full slug
		if ( isset($data['template_slug']) && !empty($data['template_slug']) ) {
			$to_clear = $store_key . '-';
			$layout = str_replace($to_clear, '', $data['template_slug']);
		}
		
		if( $layout === array() )
			$this->_out(new Upfront_JsonResponse_Error("Please specify layout to reset"));
		
		// delete first custom post type template
		$key = $store_key . '-' . $layout;
		$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($key, $is_dev);
		
		if( $template_post_id ) {
			Upfront_Server_PageTemplate::get_instance()->delete_template((int)$template_post_id, $is_dev);
			
			// get all pages that were using this custom post type template
			$template_meta_name = ( $is_dev ) 
				? $store_key . '-template_dev_post_id'
				: $store_key . '-template_post_id'
			;
			$pages = Upfront_Server_PageTemplate::get_instance()->get_pages_by_template((int)$template_post_id, $template_meta_name);
			foreach ( $pages as $page ) {
				// delete reference to custom post type template
				delete_post_meta($page->ID, $template_meta_name);
				// revert back to template file
				$template_file = get_post_meta($page->ID, 'orig_wp_page_template', true);
				update_post_meta($page->ID, '_wp_page_template', $template_file);
			}
		}
			
		
		// deletes what's in option table from previous implementation
		if ($is_dev) {
			$stylesheet_dev = "{$stylesheet}_dev"; // Handle dev-mode names
		}

		if( $stylesheet_dev ){
			$layout_key = $stylesheet_dev . "-" . $layout;
			$alternative_layout_key = wp_get_theme($stylesheet)->get("Name") . "_dev-" . $layout;
			delete_option( $layout_key );
			delete_option( $alternative_layout_key );
		}else{
			$layout_key = $store_key . "-" . $layout;
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
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		// delete all layout from custom post type for this theme
		Upfront_Server_PageTemplate::get_instance()->delete_all_theme_templates();
		
		// delete all post meta for custom post type templates
		delete_post_meta_by_key( $store_key . '-template_post_id' );
		delete_post_meta_by_key( $store_key . '-template_dev_post_id' );
		
		// delete from options table (previous implementation)
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
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;

		if(!$data)
			return $this->_out(new Upfront_JsonResponse_Error("No data"));
		if(empty($data['layout']))
			return $this->_out(new Upfront_JsonResponse_Error("No layout id given"));
		if(empty($data['element']))
			return $this->_out(new Upfront_JsonResponse_Error("No element data given"));

		$element = json_decode($data['element'], true);
		
		if ( $post_id ) {
			$post = get_post($post_id);
			// if page then skip to update_page_layout_element()
			if ( $post->post_type === 'page' ) return $this->update_page_layout_element();
		}
		
		// if post_id is false, still use update_page_layout_element()
		if ( !$post_id ) return $this->update_page_layout_element();

		$layout = Upfront_Layout::from_entity_ids($data['layout'], $data['storage_key']);
		if(empty($layout))
			return $this->_out(new Upfront_JsonResponse_Error("Unkown layout"));

		$updated = $layout->set_element_data($element);
		if(!$updated)
			return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));

		$layout->save();
		
		$this->_out(new Upfront_JsonResponse_Success("Layout updated"));
	}
	
	function update_page_layout_element() {
		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;
		$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : false;
		$element = json_decode($data['element'], true);
		$layout_ids = $_POST['layout_ids'];
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$load_from_options = true;
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		
		$template_meta_name = ( $load_dev ) 
			? $store_key . '-template_dev_post_id'
			: $store_key . '-template_post_id'
		;
		
		if ( $post_id ) {
			$post = get_post($post_id);
			$template_post_id = get_post_meta($post_id, $template_meta_name, true);
		} else {
			// if special archive pages like homepage, use slug to get template post id
			$key = $store_key . '-' . $layout_ids['item'];
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($key, $load_dev);
		}
		
		if ( $template_post_id ) {
			$page_template = Upfront_Server_PageTemplate::get_instance()->get_template($template_post_id, $load_dev);
			if ( $page_template ) {
				$layout = Upfront_Layout::from_php($page_template, $storage_key);
				
				$updated = $layout->set_element_data($element);
				if(!$updated)
					return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));
				
				// save the layout on CPT
				$template_post_id = Upfront_Server_PageTemplate::get_instance()->save_template($template_post_id, $layout, $load_dev);
				// update the template post id
				if ( $template_post_id && $post_id ) update_post_meta((int)$post_id, $template_meta_name, $template_post_id);
				$load_from_options = false;
			}
		}
		
		if ( $load_from_options ) {
			$layout = Upfront_Layout::from_entity_ids($data['layout'], $data['storage_key']);
			if(empty($layout))
				return $this->_out(new Upfront_JsonResponse_Error("Unkown layout"));

			$updated = $layout->set_element_data($element);
			if(!$updated)
				return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));

			$layout->save();
		} 
		
		$this->_out(new Upfront_JsonResponse_Success("Layout updated"));
	}
	
	function add_custom_thumbnail_size() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();
		
		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;

		if(!$data)
			return $this->_out(new Upfront_JsonResponse_Error("No data"));
		if( !isset($data['layout']) || empty($data['layout']) )
			return $this->_out(new Upfront_JsonResponse_Error("No layout id given"));
		if( !isset($data['thumbnail_size']) || empty($data['thumbnail_size']) )
			return $this->_out(new Upfront_JsonResponse_Error("No thumbnail size given"));
			
		$thumbnail_size = json_decode($data['thumbnail_size']);
		if( $thumbnail_size->name != 'uf_custom_thumbnail_size' )
			return $this->_out(new Upfront_JsonResponse_Error("Incorrect thumbnail size"));
		if( empty($thumbnail_size->thumbnail_width) )
			return $this->_out(new Upfront_JsonResponse_Error("No thumbnail width given"));
		if( empty($thumbnail_size->thumbnail_height) )
			return $this->_out(new Upfront_JsonResponse_Error("No thumbnail height given"));
		
		update_option('upfront_custom_thumbnail_size', $data['thumbnail_size']);
		
		$this->_out(new Upfront_JsonResponse_Success("Custom thumbnail size saved"));
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
