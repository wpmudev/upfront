<?php

class Upfront_Editor_Ajax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {

		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;

		upfront_add_ajax('upfront-edit-publish', array($this, "publish_post"));

		upfront_add_ajax('upfront-create-post_type', array($this, "create_post_type"));

		upfront_add_ajax('upfront-edit-draft', array($this, "draft_post"));

		upfront_add_ajax('upfront-post-get_taxonomy', array($this, "get_post_taxonomy"));

		upfront_add_ajax('upfront-post-create_term', array($this, "create_new_term"));

		upfront_add_ajax('upfront-post-update_terms', array($this, "update_post_terms"));

		upfront_add_ajax('upfront-post-update_slug', array($this, "update_post_slug"));

		upfront_add_ajax('upfront-post-update_status', array($this, "update_post_status"));

		upfront_add_ajax('upfront-post-update_password', array($this, "update_post_password"));

		upfront_add_ajax('upfront-comments-approve', array($this, "approve_comment"));

		upfront_add_ajax('upfront-comments-unapprove', array($this, "unapprove_comment"));

		upfront_add_ajax('upfront-comments-thrash', array($this, "thrash_comment"));

		upfront_add_ajax('upfront-comments-unthrash', array($this, "unthrash_comment"));

		upfront_add_ajax('upfront-comments-spam', array($this, "spam_comment"));

		upfront_add_ajax('upfront-comments-unspam', array($this, "unthrash_comment"));

		upfront_add_ajax('upfront-comments-reply_to', array($this, "post_comment"));

		upfront_add_ajax('upfront-comments-update_comment', array($this, "update_comment"));

		upfront_add_ajax('upfront-wp-model', array($this, "handle_model_request"));
	}

	function handle_model_request(){
		$data = stripslashes_deep($_POST);
		$action = $data['model_action'];

		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) $this->_reject();

		if(!method_exists($this, $action))
			$this->_out(new Upfront_JsonResponse_Error($action . ' not implemented.'));

		call_user_func(array($this, $action), $data);
	}

	function create_post_type () {
		if (!Upfront_Permissions::current(Upfront_Permissions::CREATE_POST_PAGE)) {
			$this->_reject();
		}

		$data = wp_parse_args(
			stripslashes_deep($_POST['data']),
			array(
				'post_type' => 'post',
				'title' => 'Write a title...',
			)
		);

		$post = Upfront_PostModel::create($data['post_type'], $data['title']);
		if (!empty($data['permalink'])) $post->post_name = $this->_remove_unicodes_url($data['permalink']);
		// if (!empty($data['template'])) update_post_meta($post->ID, '_wp_page_template', $data['template']);

		$post->post_status = 'draft';
		Upfront_PostModel::save($post);
		$this->_out(new Upfront_JsonResponse_Success(array(
			'post_id' => $post->ID,
			'permalink' => get_permalink($post->ID),
		)));
	}

	function publish_post () {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		$this->_process_post('publish');
	}

	function draft_post () {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		$this->_process_post('draft');
	}

	private function _process_post ($status) {
		$data = stripslashes_deep($_POST['data']);
		$post_id = !empty($data['id']) ? $data['id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));

		$post['post_status'] = $status;
		$post['post_title'] = $data['title'];
		$post['post_content'] = $data['body'];

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	function update_post_slug () {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$slug = !empty($data['slug']) ? $data['slug'] : false;
		if (!$slug) $this->_out(new Upfront_JsonResponse_Error("No slug"));

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));
		$post['post_name'] = $this->_remove_unicodes_url($slug);

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	function update_post_status () {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$status = !empty($data['status']) ? $data['status'] : false;
		if (!$status) $this->_out(new Upfront_JsonResponse_Error("No status"));

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));
		$post['post_status'] = $status;

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	function update_post_password () {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$password = !empty($data['password']) ? $data['password'] : '';

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));
		$post['post_password'] = $password;

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	public function fetch_filter_data ($data) {
		$post_type = $data['postType'] ? $data['postType'] : 'post';
		$statuses = $this->_get_status_filter_data($post_type);
		$dates = $this->_get_date_filter_data($post_type);
		$categories = $this->_get_category_filter_data($post_type);
		// For CPTs filtering.
		$post_types = $this->_get_post_type_filter_data($post_type);

		return array(
			'statuses' => $statuses,
			'dates' => $dates,
			'categories' => $categories,
			'post_types' => $post_types,
		);
	}

	private function _get_post_type_filter_data($post_type) {
		// Quit fetching if not cpt.
		if ($post_type === 'post' || $post_type === 'page') return array();

		$args = array(
			// Only get public Pts.
			'public' => true,
			// Exclude WP core post types.
			'_builtin' => false,
		);
		// List of CPT objects.
		$post_types = get_post_types($args, 'objects');
		// Simplify and include counts.
		$pts_with_counts = array();
		// Total count of all CPTs.
		$total_count = 0;
		// Get data for each CPT.
		foreach($post_types as $pt) {
			$name = $pt->name;

			// Count total number of posts.
			$counts = wp_count_posts($name, 'readable');
			$count = 0;
			$count += (int)$counts->publish;
			$count += (int)$counts->future;
			$count += (int)$counts->draft;
			// Total count of all CPTs.
			$total_count += (int)$count;

			// PT data to Return.
			$pts_with_counts[] = array(
				'value' => $name,
				'label' => $pt->label . " ($count)",
			);
		}

		$l10n = Upfront_EditorL10n_Server::add_l10n_strings(array());
		$l10n = $l10n['global']['content'];
		$all_cpts_option = array(
			'value' => 'any',
			'label' => $l10n['all_cpts'] . " ($total_count)",
		);
		// Add All CPTs option to start of array.
		array_unshift($pts_with_counts, $all_cpts_option);
	
		// Return all CPTs options.
		return $pts_with_counts;
	}

	// Based off of core's method: WP_Posts_List_Table::get_views()
	private function _get_status_filter_data ($post_type) {
		$statuses = array();
		$num_posts = wp_count_posts( $post_type );
		$total_posts = array_sum( (array) $num_posts );
		// Subtract post types that are not included in the admin all list.
		foreach ( get_post_stati( array( 'show_in_admin_all_list' => false ) ) as $state ) {
			$total_posts -= $num_posts->$state;
		}

		$l10n = Upfront_EditorL10n_Server::add_l10n_strings(array());
		$l10n = $l10n['global']['content'];
		if ($post_type === 'post') {
			$label = $l10n['all_posts'];
		} elseif ($post_type === 'page') {
			$label = $l10n['all_pages'];
		} else {
			$label = $l10n['all_cpts'];
		}
		// Add All status option.
		$statuses['all'] = array(
			'label' => "$label ($total_posts)",
			'name' => 'all',
			'value' => 'any',
		);
		return array_merge($statuses, get_post_stati(array('show_in_admin_status_list' => true), 'objects'));
	}

	// Based off of core's method: WP_List_Table::months_dropdown()
	private function _get_date_filter_data ($post_type) {
		global $wpdb, $wp_locale;

		$extra_checks = "AND post_status != 'auto-draft'";
		if ( ! isset( $_GET['post_status'] ) || 'trash' !== $_GET['post_status'] ) {
			$extra_checks .= " AND post_status != 'trash'";
		} elseif ( isset( $_GET['post_status'] ) ) {
			$extra_checks = $wpdb->prepare( ' AND post_status = %s', $_GET['post_status'] );
		}

		// Prepare Array for SQL via placeholders for post types.
		if (gettype($post_type) === 'array' && count($post_type) > 1) {
			$post_type_count = count($post_type);
			$string_placeholders = array_fill(0, $post_type_count, '%s');
			$post_type_placeholders = implode(', ', $string_placeholders);
		} else {
			$post_type_placeholders = '%s';
		}

		$months = $wpdb->get_results( $wpdb->prepare( "
			SELECT DISTINCT YEAR( post_date ) AS year, MONTH( post_date ) AS month
			FROM $wpdb->posts
			WHERE post_type IN ($post_type_placeholders)
			$extra_checks
			ORDER BY post_date DESC
		", $post_type ) );

		$months = apply_filters( 'months_dropdown_results', $months, $post_type );
 
		$month_count = count( $months );
		// Array to return with values and labels of dates.
		$date_values_and_labels = array();
		$l10n = Upfront_EditorL10n_Server::add_l10n_strings(array());
		$l10n = $l10n['global']['content'];
 
		if ( !$month_count || ( 1 == $month_count && 0 == $months[0]->month ) )
			return;

		// Add All Dates option.
		$date_values_and_labels[] = array(
			'value' => 0,
			'name' => 'all',
			'label' => $l10n['all_dates'],
		);

		foreach ( $months as $arc_row ) {
			if ( 0 == $arc_row->year )
				continue;
 
			$month = zeroise( $arc_row->month, 2 );
			$year = $arc_row->year;
 
			$value = esc_attr( $year . $month );
			$label = sprintf( __( '%1$s %2$d' ), $wp_locale->get_month( $month ), $year );
			$date_values_and_labels[] = array(
				'value' => $value,
				'name' => $value,
				'label' => $label,
			);
		}
		return $date_values_and_labels;
	}

	// Based off of core's function: wp_dropdown_categories
	private function _get_category_filter_data ($post_type) {
		$defaults = array(
			'show_option_all'   => '',
			'show_option_none'  => '',
			'orderby'           => 'id',
			'order'             => 'ASC',
			'show_count'        => 0,
			'hide_empty'        => 1,
			'child_of'          => 0,
			'exclude'           => '',
			'echo'              => 1,
			'selected'          => 0,
			'hierarchical'      => 0,
			'name'              => 'cat',
			'id'                => '',
			'class'             => 'postform',
			'depth'             => 0,
			'tab_index'         => 0,
			'taxonomy'          => 'category',
			'hide_if_empty'     => false,
			'option_none_value' => -1,
			'value_field'       => 'term_id',
			'required'          => false,
		);
		$args = array();

		$defaults['selected'] = ( is_category() ) ? get_query_var( 'cat' ) : 0;

		$r = wp_parse_args( $args, $defaults );

		if ( ! isset( $r['pad_counts'] ) && $r['show_count'] && $r['hierarchical'] ) {
			$r['pad_counts'] = true;
		}

		$tab_index = $r['tab_index'];

		$tab_index_attribute = '';
		if ( (int) $tab_index > 0 ) {
			$tab_index_attribute = " tabindex=\"$tab_index\"";
		}

		// Avoid clashes with the 'name' param of get_terms().
		$get_terms_args = $r;
		unset( $get_terms_args['name'] );
		$categories = get_terms( $r['taxonomy'], $get_terms_args );

		// Add All Categories option.
		//$l10n = Upfront_EditorL10n_Server::add_l10n_strings(array());
		$l10n = apply_filters('upfront_l10n', array());
		$l10n = $l10n['global']['content'];
		$all_option = (object) array(
			'name' => $l10n['all_categories'],
			'value' => 0
		);
		// Prepend all categories option to categories array.
		array_unshift($categories, $all_option);

		return $categories;
	}



	function fetch_term($data) {
		if(!$data['taxonomy'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid taxonomy."));
		if(!$data['id'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid id."));

		$term = get_term(intval($data['id']), $data['taxonomy']);

		if(is_wp_error($term))
			$this->_out(new Upfront_JsonResponse_Error($term->get_error_message()));
		if(!$term)
			$this->_out(new Upfront_JsonResponse_Error("Term not found."));
		$this->_out(new Upfront_JsonResponse_Success($term));
	}



	function save_term($data){
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		if(!current_user_can('manage_categories'))
			$this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		if(!$data['taxonomy'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid taxonomy."));

		$term = get_term(intval($data['term_id']), $data['taxonomy']);

		if(!$term || is_wp_error($term)){
			$term = wp_insert_term($data['name'], $data['taxonomy'], $data);
		}
		else{
			$term = wp_update_term($data['term_id'], $data['taxonomy'], $data);
		}

		if(isset( $data['postId'] ))
			wp_set_object_terms($data['postId'], $term['term_id'], $data['taxonomy']);

		if(is_wp_error($term))
			$this->_out(new Upfront_JsonResponse_Error($term->get_error_message()));
		if(!$term)
			$this->_out(new Upfront_JsonResponse_Error("Term not found."));
		$this->_out(new Upfront_JsonResponse_Success($term));
	}

	function fetch_term_list($data){
		if(!$data['taxonomy'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid taxonomy."));
		$response = array();
		if($data['postId']){
			$response['results'] = array_values((array) get_the_terms($data['postId'], $data['taxonomy']));
			if($data['allTerms']){
				$response['allTerms'] = array_values((array)get_terms($data['taxonomy'], array('hide_empty' => false)));
			}
		}
		else{
			$response['results'] = array_values(get_terms($data['taxonomy'], array('hide_empty' => true)));
		}

		if(! $response['results'])
			$response['results'] = array();

		$response['taxonomy'] = get_taxonomy($data['taxonomy']);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	function save_term_list($data){
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		if(!$data['taxonomy'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid taxonomy."));

		if(!$data['postId'])
			$this->_out(new Upfront_JsonResponse_Error("No post id."));

		foreach($data['all'] as $term){
			$terms[] = $term['slug'] ? $term['slug'] : $term['name'];
		}

		$terms = wp_set_object_terms($data['postId'], $terms, $data['taxonomy']);
		if(is_wp_error($terms))
			$this->_out(new Upfront_JsonResponse_Error($terms->get_error_message()));

		$this->_out(new Upfront_JsonResponse_Success(get_the_terms($data['postId'], $data['taxonomy'])));
	}

	/**
	 * Updates the template file for a page.
	 * @param  Object $data The data sent to update the template, at least a postId and a template name are needed.
	 * @return null       Json response {postId, template}
	 */
	function update_page_template($data){
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();
		if(!current_user_can('edit_pages'))
			$this->_out(new Upfront_JsonResponse_Error("You can't do this."));

		if(!$data['postId'])
			$this->_out(new Upfront_JsonResponse_Error("No page id."));
		if(!$data['template'])
			$this->_out(new Upfront_JsonResponse_Error("No template given."));

		$key = '_wp_page_template';
		$post_id = $data['postId'];
		$template = $data['template'];
		$success_response = new Upfront_JsonResponse_Success(array(
			'template' => $data['template'],
			'postId' => $data['postId']
		));

		$tpl = get_post_meta($post_id, $key, true);
		if($template){
			if(update_post_meta($post_id, $key, $template))
				$this->_out($success_response);
		}
		else if(add_post_meta($post_id, $key, $template, true))
				$this->_out($success_response);

		$this->_out(new Upfront_JsonResponse_Error("There was an error saving the template." . $post_id . $key . $template));

	}

	function fetch_post($data) {
		if( is_numeric($data['id']) ){
			$post = get_post($data['id']);
		}elseif( $data['id'] === "fake_post" ){
			$posts = get_posts(array('orderby' => 'rand', 'posts_per_page' => 1));
			if (!empty($posts[0])) {
				$post = $posts[0];
			}else{
				return $this->_out(new Upfront_JsonResponse_Error('Error'));
			}
		}


		if($post){
			if(!empty($data['filterContent'])){
				$post->post_content = apply_filters('the_content', $post->post_content);
				$post->post_title = apply_filters('the_title', $post->post_title, $post->ID);
				$post->post_excerpt = apply_filters('the_excerpt', $post->post_excerpt);
			}
			if(!empty($data['withAuthor'])){
				$post->author = $this->remove_private_user_fields(new WP_User($post->post_author));
			}
			if(!empty($data['withMeta'])){
				$post->meta = $this->parse_single_meta(get_metadata('post', $post->ID));
			}

			$post->permalink = get_permalink($post->ID);
			$post->sticky = is_sticky($post->ID);
			$post->is_new = false;
			$post->server_time = date('m/d/Y h:i:s a', time());

			if ( empty($post->post_name) ) $post->post_name = $this->_remove_unicodes_url($post->post_title);

			$this->_out(new Upfront_JsonResponse_Success($post));
		}
		else if( $data['id'] === '0') { //New post
			$post_type = $data['post_type'] ? $data['post_type'] : 'post';
			$post = Upfront_PostModel::create($post_type, 'Please enter your new ' . $post_type . ' title here', 'Your ' . $post_type . ' content goes here. Have fun writing :)');

			if($post_type == 'page'){
				$post->post_content = 'Type your page content here. Feel free to add some elements from the left sidebar.';
			}

			$post->is_new = true;
			$post->sticky = false;
			$post->server_time = date('m/d/Y h:i:s a', time());

			$this->_out(new Upfront_JsonResponse_Success($post));
		}

		$this->_out(new Upfront_JsonResponse_Error("Post not found."));
	}

	function remove_private_user_fields($user) {
		if (!empty($user->data) && !empty($user->data->user_email)) $user->gravatar = md5($user->data->user_email);
		unset($user->data->user_pass);
		unset($user->data->user_registered);
		unset($user->data->user_activation_key);
		unset($user->data->user_email);
		return $user;
	}

	function fetch_post_list($data){
		if(!$data['postType'])
			$this->_out(new Upfront_JsonResponse_Error("Invalid post type."));

		$query = $this->_spawn_query($data['postType'], $data);
		$limit = isset($data['limit']) ? (int)$data['limit'] : 25;
		$page = isset($data['page']) ? (int)$data['page'] : 0;
		// For pages hierarchy.
		$walker = $this->walker($query->posts, $limit, $page);
		// If hierarchical, pass through query to walker.
		$posts = isset($data['hierarchical']) ? $walker['posts'] : $query->posts;
		// If hierarchical, pass through pages number to walker.
		// This is because child pages are placed on parent page despite page limit.
		$pages = (isset($data['hierarchical']) ? $walker['pages'] : (int)$query->found_posts / $limit);
		// Filtering dropdown data for post list.
		$filtering = $this->fetch_filter_data($data);

		if($posts) {
			for ($i=0; $i < sizeof($posts); $i++) {
				if(!empty($data['filterContent'])){
					$posts[$i]->post_content = apply_filters('the_content', $posts[$i]->post_content);
					$posts[$i]->post_title = apply_filters('the_title', $posts[$i]->post_title, $posts[$i]->ID);
					$posts[$i]->post_excerpt = apply_filters('the_excerpt', $posts[$i]->post_excerpt);
				}

				if($data['withAuthor']){
					$posts[$i]->author = $this->remove_private_user_fields(new WP_User($posts[$i]->post_author));
				}

				if($data['withThumbnail']){
					$posts[$i]->thumbnail = wp_get_attachment_image_src(get_post_thumbnail_id($posts[$i]->ID));
				}

				if($data['withMeta']){
					$posts[$i]->meta = $this->parse_single_meta(get_metadata('post', $posts[$i]->ID));
				}
				$posts[$i]->permalink = get_permalink($posts[$i]->ID);
			}
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			"results" => $posts,
			"filtering" => $filtering,
			"pagination" => array(
				"total" => $query->found_posts,
				"page_size" => $limit,
				"page" => $page,
				"pages" => $pages,
			)
		)));

	}

	function walker($posts, $limit, $page) {
		require_once(dirname(dirname(__FILE__)) . '/class_upfront_posts_walker.php');
		// Order by page hierarchy.
		$walker = new Upfront_Posts_Walker();
		// Get number of parent pages divided by pagination limit rounded up.
		$pages = ceil($walker->get_number_of_root_elements($posts) / $limit);
		return array(
			// Pages start with one.
			// Post order and pagination is handled by paged_walk.
			'posts' => $walker->paged_walk($posts, 0, $page + 1, $limit),
			// Max number of pagination pages.
			'pages' => $pages,
		);
	}

	function fetch_page_templates($data){
		$store_key = strtolower(str_replace('_dev','',Upfront_Layout::get_storage_key()));
		$template_type = isset($data['template_type'])
			? $data['template_type']
			: false
		;
		$dev_type = ( $data['load_dev'] == 1 )
			? Upfront_PageTemplate::LAYOUT_TEMPLATE_DEV_TYPE
			: Upfront_PageTemplate::LAYOUT_TEMPLATE_TYPE
		;
		$templates = ( $template_type == 'page' )
			? array((object) array(
					'name' => 'Default Template',
					'slug' => sanitize_title($store_key . '-default'),
					'file' => '',
					'template_type' => $template_type
				))
			: array()
		;

		if ( $template_type == 'page' ) {
			$page_templates = get_page_templates();
			foreach ( $page_templates as $template_name => $template_filename ) {
				array_push($templates, (object) array(
						'name' => $template_name,
						'slug' => sanitize_title($store_key . '-' . str_replace(' ','-',$template_name)),
						'file' => $template_filename,
						'template_type' => $template_type
					)
				);
			}
		} else {
			$custom_post_type_templates = Upfront_Server_PageTemplate::get_instance()->get_all_theme_templates($dev_type, $template_type);
			foreach ( $custom_post_type_templates as $custom_template ) {
				array_push($templates, (object) array(
					'slug' => sanitize_title($custom_template->post_name),
					'name' => Upfront_Server_PageTemplate::get_instance()->slug_layout_to_name($custom_template->post_name),
				));
			}
			// append layouts saved on options table (from old implementation)
			$db_option_layouts = Upfront_Layout::get_db_layouts();
			foreach ( $db_option_layouts as $key => $db_layout ) {
				if ( preg_match('/single-page/i', $db_layout) ) {
					array_push($templates, (object) array(
						'slug' => sanitize_title($db_layout),
						'name' => Upfront_Server_PageTemplate::get_instance()->db_layout_to_name($db_layout),
					));
				}
			}
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			"results" => $templates
		)));
	}

	function parse_single_meta($metadata){
		$parsed = array();
		foreach($metadata as $key => $val){
			if(is_array($val) && sizeof($val) == 1)
				$parsed[] = array('meta_key' => $key, 'meta_value' => maybe_unserialize($val[0]));
			else
				$parsed[] = array('meta_key' => $key, 'meta_value' => maybe_unserialize($val));
		}
		return $this->_remove_page_template_meta($parsed);
	}

	/**
	 * Handles post saving model requests
	 *
	 * JSON handler, dies at the end
	 *
	 * @param array $data Post hash
	 */
	function save_post ($data) {
		if (empty($data) || !is_array($data)) $this->_out(new Upfront_JsonResponse_Error("Invalid data"));

		if (!current_user_can('edit_posts')) {
			$this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		}

		if ('page' === $data['post_type'] && !current_user_can('edit_pages')) {
			$this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		}

		if ('publish' === $data['post_status']) {
			if (
				('post' === $data['post_type'] && !current_user_can('publish_posts'))
				||
				('page' === $data['post_type'] && !current_user_can('publish_pages'))
			) $this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		}

		// making sure post names/slugs are sanitized
		if (isset($data['post_name'])) $data['post_name'] = $this->_remove_unicodes_url($data['post_name']);

		// Sanitize post excerpt editing
		if (!empty($data['post_excerpt'])) {
			$data['post_excerpt'] = strip_shortcodes(wp_strip_all_tags($data['post_excerpt']));
		}

		// Re-sanitize the whole post
		$data = sanitize_post($data, 'edit');

		// Initialize data
		$post = false;
		$id = false;

		if (!$data['ID']) {
			unset($data['ID']);
			$id = wp_insert_post($data);
		} else {
			$post = get_post($data['ID']);
			if ('trash' === $post->post_status && 'trash' !== $data['post_status']) {
				$post = wp_untrash_post($data['ID']);
			} else if ('trash' !== $post->post_status && 'trash' === $data['post_status']) {
				$post = wp_trash_post($data['ID']);
			}

			//GMT date
			if ($data['post_date']) {
				$data['post_date_gmt'] = get_gmt_from_date($data['post_date']);
			}

			// Update if not deleted
			if ($post) $id = wp_update_post($data);
			else $id = 0;
		}

		// Error in processing the post
		if (is_wp_error($id)) $this->_out(new Upfront_JsonResponse_Error($id->get_error_message()));

		// Handle the sticky attribute
		if (isset($data['sticky']) && $data['sticky']) {
			// Make post sticky
			stick_post($data['ID']);
		} else {
			// Unstick post
			unstick_post($data['ID']);
		}


		$post = get_post($id);
		$slug = empty( $post->post_name )
			? $this->_remove_unicodes_url($post->post_title)
			: $post->post_name
		;

		$this->_out(new Upfront_JsonResponse_Success(array(
			'id' => $id,
			'post_name' => $slug,
			'permalink' => get_permalink($id)
		)));
	}

	function fetch_user($data) {
		$current_user = wp_get_current_user();
		$current_user = $current_user instanceof WP_User ? $current_user : new WP_User($current_user);
		$user = $this->remove_private_user_fields($current_user);

		$this->_out(new Upfront_JsonResponse_Success($user));
	}

	function fetch_comment ($data) {
		if(!$data['id'])
			$this->_out(new Upfront_JsonResponse_Error("No comment id given."));

		$comment = get_comment( $data['id'] );

		if(!$comment)
			$this->_out(new Upfront_JsonResponse_Error("Comment not found."));

		$comment->gravatar = md5($comment->comment_author_email);

		$this->_out(new Upfront_JsonResponse_Success($comment));
	}

	function save_comment ($data) {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		if($data['comment_ID']){
			if(wp_update_comment($data))
				$this->_out(new Upfront_JsonResponse_Success(array('comment_ID' => $data['comment_ID'])));
			$this->_out(new Upfront_JsonResponse_Error("Error saving the comment."));
		}
		else {
			$comment_id = wp_new_comment($data);
				$this->_out(new Upfront_JsonResponse_Success(array('comment_ID' => $comment_id)));
		}

	}

	function fetch_comment_list ($data) {
		$post_id = !empty($data['postId']) ? $data['postId'] : false;
		$orderby = !empty($data['orderby']) ? $data['orderby'] : 'comment_date';
		$order = !empty($data['order']) ? $data['order'] : 'ASC';
		$limit = isset($data['limit']) ? (int)$data['limit'] : 10;
		$page = isset($data['page']) ? (int)$data['page'] : 0;
		$search = !empty($data['search']) ? $data['search'] : false;

		if(!isset($data['commentType']) || $data['commentType'] == 'all')
			$comment_type = false;
		else if ($data['commentType'] == 'comment')
			$comment_type = '';
		else
			$comment_type = $data['commentType'];
		$comment_approved = !empty($data['comment_approved']) ? $data['comment_approved'] : false;

		global $wpdb;
		$where_query = array();

		if($post_id)
			$where_query[] = $wpdb->prepare('comment_post_ID=%d', $post_id);
		if($comment_type !== false)
			$where_query[] = $wpdb->prepare('comment_type=%s', $comment_type);
		if($comment_approved)
			$where_query[] = $wpdb->prepare('comment_approved=%s', $comment_approved);
		if($search)
			$where_query[] = "comment_content LIKE '%" . esc_sql(like_escape($search)) . "%'";

		$where = sizeof($where_query) ? 'WHERE ' . implode(' AND ', $where_query) : '';

		$sql = "SELECT * FROM {$wpdb->comments} "  . $where . $wpdb->prepare(" ORDER BY {$orderby} {$order} LIMIT %d, %d", ($page*$limit), $limit);

		$comments = $wpdb->get_results(
			$sql
		);

		foreach ($comments as $idx => $comment) {
			$comment->gravatar = md5($comment->comment_author_email);
		}

		$comments_count = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->comments} " . $where
		);

		$this->_out(new Upfront_JsonResponse_Success(array(
			"results" => $comments,
			"pagination" => array(
				"total" => $comments_count,
				"page_size" => $limit,
				"page" => $page,
			),
			"sql" => $sql,
			"comment_type" => $comment_type
		)));
	}

	/**
	 * Fetches the initial meta list
	 *
	 * Outputs JSON and dies
	 *
	 * @param array $data Submitted meta list descriptor
	 */
	function fetch_meta_list ($data) {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();

		$meta_type = $data['metaType'];
		if (!$meta_type && array_search($meta_type, array('comment', 'post')) === false) {
			$this->_out(new Upfront_JsonResponse_Error("Invalid meta type"));
		}

		$object_id = $data['objectId'];
		if (!$object_id) $this->_out(new Upfront_JsonResponse_Error("No object id given"));

		$meta = $this->parse_single_meta(get_metadata($meta_type, $object_id));

		// Extract values
		foreach ($meta as $key => $val) {
			if (is_array($val) && sizeof($val) == 1) $meta[$key] = $val[0];
		}

		$this->_out(new Upfront_JsonResponse_Success(array('results' => $meta)));
	}

	/**
	 * Saves meta list from the request
	 *
	 * Outputs JSON and dies
	 *
	 * @param array $data Submitted meta list, with descriptor
	 */
	function save_meta_list ($data) {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) $this->_reject();

		$meta_type = $data['metaType'];
		if (!$meta_type && array_search($meta_type, array('comment', 'post')) === false) {
			$this->_out(new Upfront_JsonResponse_Error("Invalid meta type"));
		}

		$object_id = $data['objectId'];
		if (!$object_id) $this->_out(new Upfront_JsonResponse_Error("No object id given"));

		if (
			($meta_type == 'post' && !current_user_can('edit_posts')) ||
			($meta_type == 'comment' && !current_user_can('moderate_comments')) ||
			($meta_type == 'user' && !current_user_can('edit_users'))
		) {
			$this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		}

		if (!empty($data['removed'])) {
			$data['removed'] = $this->_remove_page_template_meta($data['removed']);
			foreach($data['removed'] as $meta) {
				delete_metadata($meta_type, $object_id, $meta['meta_key']);
			}
		}

		if (!empty($data['added'])) {
			$data['added'] = $this->_remove_page_template_meta($data['added']);
			foreach($data['added'] as $meta) {
				update_metadata($meta_type, $object_id, $meta['meta_key'], (!empty($meta['meta_value']) ? $meta['meta_value'] : false));
			}
		}

		if (!empty($data['changed'])) {
			$data['changed'] = $this->_remove_page_template_meta($data['changed']);
			foreach($data['changed'] as $meta) {
				update_metadata($meta_type, $object_id, $meta['meta_key'], (!empty($meta['meta_value']) ? $meta['meta_value'] : false));
			}
		}

		if (!empty($data['all'])) {
			$data['all'] = $this->_remove_page_template_meta($data['all']);
		}

		/**
		 * Fires off after the meta list has been processed and
		 * before the response is generated
		 *
		 * @param array $data Sent meta list that's been processed
		 * @param string $meta_type Type of meta being being processed
		 * @param int $object_id Internal WP ID of the object that the meta belongs to
		 *
		 * @since v1.4-BETA-3
		 */
		do_action('upfront-meta_list-save', $data, $meta_type, $object_id);

		$meta = $this->parse_single_meta(get_metadata($meta_type, $object_id));

		$this->_out(new Upfront_JsonResponse_Success($meta));
	}

	function get_post_extra($data) {
		if(!$data['postId'])
			$this->_out(new Upfront_JsonResponse_Error("No post id."));

		$post_id = $data['postId'];

		$extra = array('postId' => $post_id);
		if(!empty($data['allTemplates']))
			$extra['allTemplates'] = get_page_templates();
		if(!empty($data['template']))
			$extra['template'] = get_page_template_slug($post_id);
		if(!empty($data['thumbnail'])){
			$size = $data['thumbnail'] ? $data['thumbnail'] : 'post-thumbnail';
				$extra['thumbnail'] = wp_get_attachment_image_src( get_post_thumbnail_id( $post_id ), $size );
		}

		$this->_out(new Upfront_JsonResponse_Success($extra));
	}

	private function _spawn_query ($post_type, $data=array()) {
		$sort = !empty($data['orderby']) ? str_replace('post_', '', $data['orderby']) : 'date';
		$direction = !empty($data['order']) ? $data['order'] : 'desc';
		$limit = isset($data['limit']) ? (int)$data['limit'] : 25;
		$hierarchical = !empty($data['hierarchical']) ? true : false;
		// Only use limit if not hierarchical (post limit then is handled by walker class).
		$posts_per_page = ($hierarchical ? -1 : $limit);
		$page = isset($data['page']) ? (int)$data['page'] + 1 : 1;
		$search = !empty($data['search']) ? $data['search'] : false;
		$status = !empty($data['post_status']) ? $data['post_status'] : false;
		$date = !empty($data['m']) ? $data['m'] : false;
		$category = !empty($data['cat']) ? $data['cat'] : false;

		$args = array(
			'orderby' => $sort,
			'order' => strtoupper($direction),
			'post_type' => $post_type,
			'posts_per_page' => $posts_per_page,
			'paged' => $page,
			'post_status' => $status,
			'm' => $date,
			'cat' => $category,
		);
		if ($search) $args['s'] = $search;

		return new WP_Query($args);
	}

	private function _get_post_hierarchy ($post) {
		if ($post->post_parent) return $this->_get_post_info($post->post_parent);
	}

	private function _get_post_featured_image ($post) {
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ) );
		if (!empty($image[0])) return $image[0];
		return 'http://imgsrc.hubblesite.org/hu/db/images/hs-2012-49-a-small_web.jpg';
	}

	private function _get_post_info ($post_id) {
		$post = get_post($post_id);
		$post->permalink = get_permalink($post->ID);
		$post->hierarchy = $this->_get_post_hierarchy($post);
		$post->featured_image = $this->_get_post_featured_image($post);
		return $post;
	}

	private function _remove_unicodes_url ($url) {
		// just in case not yet sanitize_title
		$url = sanitize_title($url);

		// removing unicodes
		$unicode_pattern = array(
			'/%e2%80%8b/', // zero width space
			'/%e2%80%8c/', // zero width non-joiner
			'/%e2%80%8d/', // zero width joiner
			'/%e2%80%8e/', // left to right mark
			'/%e2%80%8f/' // right to left mark
		);

		return preg_replace($unicode_pattern,'',$url);
	}

	/**
	* Removes any meta related to Page Templates,
	* those meta will be handled on Page Layout at class_upfront_ajax.php
	*/
	private function _remove_page_template_meta ($meta_list) {
		$store_key = strtolower(str_replace('_dev','',Upfront_Layout::get_storage_key()));
		$page_template_meta = array(
			$store_key . '-uf_wp_page_template',
			$store_key . '-template_post_id',
			$store_key . '-template_dev_post_id',
			'_wp_page_template'
		);
		$new_meta_list = array();
		foreach($meta_list as $index => $meta) {
			if ( !in_array($meta['meta_key'], $page_template_meta) )
				array_push($new_meta_list, $meta);
		}
		return $new_meta_list;
	}
}
add_action('init', array('Upfront_Editor_Ajax', 'serve'));
