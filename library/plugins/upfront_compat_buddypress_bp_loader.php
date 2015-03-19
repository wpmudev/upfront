<?php

class Upfront_Compat_Buddypress_Bp_loader extends Upfront_Server {

	private $_cached_query;

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (!function_exists('buddypress')) return false;

		// Pickle the query before BP kicks in and fucks shit up.
		add_action('wp', array($this, 'cache_query_locally'));

		// Augment cascade specificity for a particular layout
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'augment_upfront_entity_cascade'), 10, 2);

		// Check if we're about to save an augmented specificity item and re-augment if so
		add_filter('upfront-model-save_key', array($this, 'replace_bp_items_storage_key'), 10, 2);

		// Clean up after BP so we can actually have some proper data there...
		add_action('wp_footer', array($this, 'clean_after_bp_because_it_wont'), 0);

		// Show proper page titles where we're committed to BP.
		add_filter('upfront_post_part_replacements', array($this, 'restore_post_data_bp_killed'), 10, 2);

		// NASTINESS!!! This is only so we can get this post to cooperate
		add_filter('upfront-data-post_id', array($this, 'augment_singular_entity_id'));
		add_action('wp_ajax_upfront-wp-model', array($this, 'prepare_for_editor_output'), 9);
		add_action('wp_ajax_this_post-get_markup', array($this, 'prepare_editor_markup'), 9);

		// Shove some styles into footer
		add_action('wp_footer', array($this, 'inject_editor_styles'));
	}

	/**
	 * Cache the *normal* WP query for re-using later on.
	 */
	public function cache_query_locally () {
		global $wp_query;
		$this->_cached_query = $wp_query;
	}

	/**
	 * BuddyPress won't clean up after itself, so we have to.
	 */
	public function clean_after_bp_because_it_wont () {
		if (!is_buddypress()) return false;

		wp_reset_query();
		
		// The above isn't enough - let's make super-sure we're thoroughly resetting stuffs here.
		$post = get_queried_object();

		global $wp_query;
		$wp_query->post = $post;
		$wp_query->posts = array($post);

		// And again...
		wp_reset_postdata();
	}

	/**
	 * Yeah, titles get nuked. Restore them here.
	 * Just the titles though, as BP will take care of the content :P
	 *
	 * @param array $rpl ThisPost replacement array
	 * @param string $type Post part type to process
	 *
	 * @return array Overridden replacements.
	 */
	public function restore_post_data_bp_killed ($rpl, $type) {
		if (!is_buddypress()) return $rpl; // Not an active BP component, carry on...

		if ('title' !== Upfront_ThisPostView::$PARTNAMES['TITLE']) return $rpl;

		if (!empty($this->_cached_query->queried_object_id)) {
			if (isset($rpl['%title%'])) $rpl['%title%'] = get_the_title($this->_cached_query->queried_object_id);
			if (isset($rpl['%permalink%'])) $rpl['%permalink%'] = get_permalink($this->_cached_query->queried_object_id);
		} else if (!empty($this->_cached_query->post->post_title) && !empty($this->_cached_query->query['pagename'])) {
			if (isset($rpl['%title%'])) $rpl['%title%'] = apply_filters('the_title', $this->_cached_query->post->post_title, $this->_cached_query->queried_object_id);
			if (isset($rpl['%permalink%'])) $rpl['%permalink%'] = home_url($this->_cached_query->query['pagename']); // ??? o.0
		}

		return $rpl;
	}

	/**
	 * Check things that don't necessarily have a dedicated page ID.
	 * Specifically, deal nested items (e.g. personal profiles) and
	 * assign them virtual specificity, if we can.
	 *
	 * @param array $resolved Resolved layout IDs cascade
	 * @param array $raw Raw cascade passed to resolver
	 *
	 * @return array Augmented resolved cascade
	 */
	public function augment_upfront_entity_cascade ($resolved, $raw) {
		if (!is_buddypress()) return $resolved; // Not an active BP component, carry on...

		$component = bp_current_component();
		$specificity = bp_is_user() ? 'user' : 'global';
		$scope = $this->_get_scope($resolved);

		if (empty($resolved['specificity'])) $resolved['specificity'] = "{$scope}-{$component}-{$specificity}";

		return $resolved;
	}

	/**
	 * Catch augmented BP specificities and use that to build storage key.
	 * Check if the specificity is present and matches the augmented BP
	 * specificity format (check augment_upfront_entity_cascade method).
	 *
	 * @param string $key Resolved storage key for saving layout
	 * @param Upfront_Model $model Model instance
	 *
	 * @return string Processed new key
	 */
	public function replace_bp_items_storage_key ($key, $model) {
		$layout = $model->get('layout');
		if (empty($layout['specificity'])) return $key;

		$known_components = bp_core_admin_get_components();
		if (empty($known_components)) return $key;
		
		$scope = $this->_get_scope($layout);
		$components = join('|', array_map('preg_quote', array_keys($known_components)));

		$rx = '/^' . preg_quote($scope) . '-(' . $components . ')-(user|global)$/';

		// Do we have specificity set to something we understand as being part of BP?
		if (!preg_match($rx, $layout['specificity'])) return $key;

		$storage_key = Upfront_Model::get_storage_key();
		return $storage_key . '-' . $layout['specificity'];
	}

	/**
	 * Scope resolution helper
	 *
	 * @param array $layout Layout cascade to work with
	 *
	 * @return string Resolved scope.
	 */
	private function _get_scope ($layout) {
		return !empty($resolved['item'])
			? $layout['item']
			: (!empty($layout['type']) ? $layout['type'] : '')
		;
	}

// NASTINESS ENSUES!!!

	public function prepare_for_editor_output () {
		$data = stripslashes_deep($_POST);

		if ('fetch_post' !== $data['model_action']) return false;
		if (is_numeric($data['id'])) return false;

		if (!preg_match('/^bp_compat-/', $data['id'])) return false;
		$this->_out(new Upfront_JsonResponse_Success(array(
			'ID' => 0,
			'post_title' => 'NANANA',
			'post_content' => 'NANANA',
		)));
	}

	public function prepare_editor_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (empty($data['post_id'])) return false;
		if (!preg_match('/^bp_compat-/', $data['post_id'])) return false;

		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => '<div class="upfront-buddypress_compat"><p>BuddyPress specific content</p></div>'
		)));
	}


	public function augment_singular_entity_id ($post_id) {
		if (!is_buddypress()) return $post_id;

		$layout = Upfront_EntityResolver::get_entity_ids();
		return !empty($layout['specificity'])
			? 'bp_compat-' . $layout['specificity']
			: $post_id
		;
	}

	public function inject_editor_styles () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;
		echo <<<EO_BP_STYLES
<style>
.upfront-buddypress_compat {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 100%;
	text-align: center;
	opacity: .2;

}
.upfront-buddypress_compat p {
	text-align: center;
	width: 100%;
	font-size: 3em;
}
</style>
EO_BP_STYLES;
	}
}
Upfront_Compat_Buddypress_Bp_loader::serve();