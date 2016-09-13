<?php

class Upfront_Server_Metadata implements IUpfront_Server {

	const KEY_METADESC = '_upfront_metadesc';

	private static $_instance;

	public static function serve () {
		$me = self::get_instance();
		$me->_add_hooks();
	}

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}

	private function _add_hooks () {
		// Listen to meta list saving and update proper fields
		add_action('upfront-meta_list-save', array($this, 'process_metadata_saving'), 10, 3);

		// Add main data info
		add_filter('upfront_data', array($this, 'inject_editor_data'));

		// Output meta info
		add_action('wp_head', array($this, 'dispatch_meta_output'), 1);
	}

	/**
	 * Gets a list of supported meta description postmeta keys
	 *
	 * @return array
	 */
	public static function get_supported_metadesc_keys () {
		return apply_filters('upfront-meta_list-supported_metadesc_keys', array(
			self::KEY_METADESC,
			'_wds_metadesc',
			'_yoast_wpseo_metadesc',
		));
	}

	/**
	 * Injects the meta data info into main data array
	 *
	 * @param array $data Main data hash
	 *
	 * @return array
	 */
	public function inject_editor_data ($data) {
		if (!empty($data['metadata'])) return $data;

		$metadesc_length = defined('WDS_METADESC_LENGTH_CHAR_COUNT_LIMIT') && is_numeric(WDS_METADESC_LENGTH_CHAR_COUNT_LIMIT)
			? WDS_METADESC_LENGTH_CHAR_COUNT_LIMIT
			: 160
		;

		$data['metadata'] = array(
			'metadesc_key' => self::KEY_METADESC,
			'supported_metadesc_keys' => self::get_supported_metadesc_keys(),
			'metadesc_length' => $metadesc_length
		);

		return $data;
	}

	/**
	 * Dispatches meta header output by cascade type
	 *
	 * @return bool
	 */
	public function dispatch_meta_output () {
		$cascade = Upfront_EntityResolver::get_entity_ids();
		if (!is_array($cascade) || empty($cascade['type'])) return false;

		$callback = array($this, "handle_{$cascade['type']}_meta_output");
		if (!is_callable($callback)) return false; // We don't know what to do with this, carry on

		return call_user_func($callback);
	}

	/**
	 * Handles singular pages meta header output
	 *
	 * @return bool
	 */
	public function handle_single_meta_output () {
		$post_id = get_queried_object_id();
		if (empty($post_id) || !is_numeric($post_id)) return false;

		// Do meta description
		$metadesc = get_post_meta($post_id, '_metadesc', true);
		$metadesc = trim(wp_strip_all_tags(strip_shortcodes($metadesc))); // Clean up
		if (!empty($metadesc)) {
			// Case one - we have SmartCrawl. Pass through and trust it'll do the right thing all the way
			if (class_exists('WDS_OnPage')) return true; // We're already handling this

			// Case two - other SEO plugins. Pass through and trust it'll do the right thing all the way
			if (class_exists('WPSEO_Frontend')) return true;

			// Case three - still here, do our thing
			echo '<meta name="description" content="' . esc_attr($metadesc) . '" />' . "\n";
		}

		return true;
	}

	/**
	 * Meta list save action listener
	 *
	 * @param array $data Sent meta list that's been processed
	 * @param string $meta_type Type of meta being being processed
	 * @param int $object_id Internal WP ID of the object that the meta belongs to
	 *
	 * @return bool
	 */
	public function process_metadata_saving ($data, $meta_type, $object_id) {
		if (empty($meta_type) || !is_array($data) || !is_numeric($object_id)) return false; // Say what

		$callback = array($this, "process_{$meta_type}_meta_update");
		if (!is_callable($callback)) return false; // We don't know what to do with this, carry on

		$update_actions = array('all'); // Only process selected queues
		$meta_list = array();

		// Compile a hash of actionable metas, indexed by meta key
		foreach ($data as $action => $list) {
			if (!in_array($action, $update_actions)) continue;
			foreach ($list as $item) {
				if (empty($item['meta_key'])) continue;
				$meta_list[$item['meta_key']] = !empty($item['meta_value'])
					? $item['meta_value']
					: false
				;
			}
		}

		return call_user_func_array($callback, array($meta_list, $object_id));
	}

	/**
	 * Process the post meta updates
	 *
	 * @param array $meta_list Hash of meta fields that need processing
	 * @param int $post_id Post ID
	 *
	 * @return bool
	 */
	public function process_post_meta_update ($meta_list, $post_id) {
		if (empty($meta_list) || !is_array($meta_list) || !is_numeric($post_id)) return false;
		if (!current_user_can('edit_post', $post_id)) return false;

		$post_id = (int)$post_id;
		if (empty($post_id)) return false;

		// Process meta description
		if (isset($meta_list[self::KEY_METADESC])) {
			$value = sanitize_text_field($meta_list[self::KEY_METADESC]);
			$keys = self::get_supported_metadesc_keys();
			foreach ($keys as $key) {
				update_post_meta($post_id, $key, $value);
			}
		}

		return true;
	}
}
add_action('init', array('Upfront_Server_Metadata', 'serve'));
