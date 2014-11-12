<?php

/**
 * Layout editor AJAX request hub.
 */
class Upfront_Ajax extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_layout', array($this, "load_layout"));
			upfront_add_ajax('upfront_create_layout', array($this, "create_layout"));
			upfront_add_ajax('upfront_list_available_layout', array($this, "list_available_layout"));
			upfront_add_ajax('upfront_list_theme_layouts', array($this, "list_theme_layouts"));
			upfront_add_ajax('upfront_list_saved_layout', array($this, "list_saved_layout"));
			upfront_add_ajax('upfront_user_done_font_intro', array($this, "user_done_font_intro"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_layout', array($this, "save_layout"));
			upfront_add_ajax('upfront_reset_layout', array($this, "reset_layout"));
			upfront_add_ajax('upfront_reset_all_from_db', array($this, "reset_all_from_db"));
			upfront_add_ajax('upfront_update_layout_element', array($this, "update_layout_element"));

			//upfront_add_ajax('upfront_build_preview', array($this, "build_preview")); // No more previews building

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
			$post = $post;
			if ($post && is_singular()) {
				if (!is_page($post->ID)) {
					$layout_ids = Upfront_EntityResolver::get_entity_ids();
				} else {
					// Deal with page templates
					$template = get_post_meta((int)$post->ID, '_wp_page_template', true);
					$theme = Upfront_ChildTheme::get_instance();
					if (!empty($template) && !empty($theme->themeSettings)) {
						$tpl = preg_replace('/page-(.*)\.php$/', '\1', $template);
						$required_pages = $theme->themeSettings->get('required_pages');
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
				if (!empty($template) && !empty($theme->themeSettings)) {
					$tpl = preg_replace('/page-(.*)\.php$/', '\1', $template);
					$required_pages = $theme->themeSettings->get('required_pages');
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
		}

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
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

		/*
		if (!empty($_POST['use_existing'])) {
			// Resolve existing page template
			// to a layout
		} else {
			$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
		}
		*/
		$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);

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

		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'] ? $_POST['stylesheet'] : get_stylesheet();

		upfront_switch_stylesheet($stylesheet);

		$layout = Upfront_Layout::from_php($data, $storage_key);
		$key = $layout->save();

		// For single page layouts, also drop page templates
		$layout_data = $layout->get('layout');
		if (!empty($layout_data['specificity']) && preg_match('/single-page-\d+$/', $layout_data['specificity'])) {
			$page_id = preg_replace('/single-page-(\d+)$/', '\1', $layout_data['specificity']);
			// If we have a page template set...
			if (!empty($page_id) && get_post_meta($page_id, '_wp_page_template', true)) {
				// Kill it, as we just saved the layout for it
				delete_post_meta($page_id, '_wp_page_template');
			}
		}

		$this->_out(new Upfront_JsonResponse_Success($key));
	}

	function list_available_layout () {
		$layouts = Upfront_Layout::list_available_layout();
		$this->_out(new Upfront_JsonResponse_Success($layouts));
	}

	function list_theme_layouts() {
		$layouts = Upfront_Layout::list_theme_layouts();
		$this->_out( new Upfront_JsonResponse_Success($layouts) );
	}

	function list_saved_layout () {
		$storage_key = $_POST['storage_key'];
		$layouts = Upfront_Layout::list_saved_layout($storage_key);
		$this->_out(new Upfront_JsonResponse_Success($layouts));
	}

	function reset_layout () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;
		$layout = !empty($data['layout']) ? $data['layout'] : array();
		$storage_key = $data['storage_key'];
		$stylesheet = $data['stylesheet'] ? $data['stylesheet'] : get_stylesheet();
		$stylesheet_dev = false;
		if (!empty($data['dev'])) {
			$stylesheet_dev = "{$stylesheet}_dev"; // Handle dev-mode names
		}

		upfront_switch_stylesheet($stylesheet);

		//$layout = Upfront_Layout::from_php($data, $storage_key);
		$layout = Upfront_Layout::from_entity_ids($layout, null, !empty($stylesheet_dev));
		$layout->delete(true);
		delete_option('upfront_' . $stylesheet . '_styles');
		delete_option('upfront_' . $stylesheet . '_theme_colors');
		delete_option('upfront_' . $stylesheet . '_button_presets');
		if (!empty($stylesheet_dev)) delete_option('upfront_' . $stylesheet_dev . '_styles');
		if (!empty($stylesheet_dev)) delete_option('upfront_' . $stylesheet_dev . '_theme_colors');
		if (!empty($stylesheet_dev)) delete_option('upfront_' . $stylesheet_dev . '_button_presets');
		$this->_out(new Upfront_JsonResponse_Success("Layout reset"));
	}

	function reset_all_from_db () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;
		$stylesheet = $data['stylesheet'] ? $data['stylesheet'] : get_stylesheet();

		global $wpdb;
		$theme_key = $wpdb->esc_like($stylesheet) . '%';
		$global_theme_key = 'upfront_' . $wpdb->esc_like($stylesheet) . '%';
		$sql = $wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s", $theme_key, $global_theme_key);
		$wpdb->query($sql);
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
