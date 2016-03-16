<?php

class Upfront_Permissions {

	const BOOT = 'boot_upfront';
	const EDIT = 'edit_posts';
	const EMBED = 'embed_stuff';
	const UPLOAD = 'upload_stuff';
	const RESIZE = 'resize_media';
	const SAVE = 'save_changes';
	const SAVE_REVISION = 'save_changes';
	const OPTIONS = 'change_options';
	const CREATE_POST_PAGE = 'create_post_page';
	const SEE_USE_DEBUG = 'see_use_debug';
	const MODIFY_RESTRICTIONS = 'modify_restrictions';

	const DEFAULT_LEVEL = 'save_changes';

	const LAYOUT_MODE = 'layout_mode';
	const CONTENT_MODE = 'content_mode';
	const THEME_MODE = 'theme_mode';
	const POSTLAYOUT_MODE = 'postlayout_mode';
	const RESPONSIVE_MODE = 'responsive_mode';
	
	const ANONYMOUS = '::anonymous::';

	const RESTRICTIONS_KEY = "upfront_user_restrictions";

	private $_levels_map = array();

	private $_cached_restrictions = array();

	/**
	 * Instance of Upfront_Permissions class
	 * @var Upfront_Permissions
	 */
	private static $_me;


	/**
	 * Checks if current user is able to do $level
	 *
	 * @param $level
	 * @return bool
	 */
	public static function current ($level) {
		self::boot();
		return self::$_me->_current_user_can($level);
	}

	public static function nonces () {
		static $nonces = array();
		if (!empty($nonces)) return $nonces;

		$keys = self::_get_nonce_keys();
		foreach ($keys as $key) {
			$nonces[$key] = wp_create_nonce(self::_to_nonce_key($key));
		}
		return $nonces;
	}

	public static function nonce ($level) {
		$nonces = self::nonces();
		if (!self::current($level) && !empty($nonces[self::ANONYMOUS])) return $nonces[self::ANONYMOUS];
		
		if (!empty($nonces[$level])) return $nonces[$level];
		
		return !empty($nonces[self::ANONYMOUS])
			? $nonces[self::ANONYMOUS]
			: false
		;
	}

	/**
	 * Checkes if value is an upfront permission nonce
	 *
	 * @param $level
	 * @param $value
	 * @return bool
	 */
	public static function is_nonce ($level, $value) {
		$keys = self::_get_nonce_keys();
		if (!in_array($level, $keys)) return false;

		$result = wp_verify_nonce($value, self::_to_nonce_key($level));
		return (bool)$result;
	}


	private function __construct () {
		add_filter("upfront-access-permissions-map", array( $this, "filter_permissions_map" ));
		$this->_levels_map = $this->_get_default_levels_map();

	}

	/**
	 * Sets default access levels
	 *
	 *
	 */
	private function _get_default_levels_map(){
		return apply_filters('upfront-access-permissions-map', array(
			self::BOOT => 'edit_theme_options',// 'edit_posts',
			self::EDIT =>  'edit_theme_options',// 'edit_posts',
			self::RESIZE => 'edit_theme_options',// 'edit_posts',
			self::EMBED => 'edit_theme_options',// 'edit_posts',
			self::UPLOAD => 'upload_files',
			self::SAVE => 'edit_theme_options',
			self::OPTIONS => 'manage_options',
			self::SEE_USE_DEBUG => "edit_themes",
			self::LAYOUT_MODE => 'edit_theme_options',
			self::CONTENT_MODE => 'edit_theme_options',// 'edit_posts',
			self::THEME_MODE => 'edit_theme_options',
			self::POSTLAYOUT_MODE => 'edit_theme_options',
			self::RESPONSIVE_MODE => 'edit_theme_options',

			self::DEFAULT_LEVEL => 'edit_theme_options',
		));
	}

	/**
	 * Returns upfront capability map
	 *
	 * @return array
	 */
	function get_upfront_capability_map(){
		return array(
			self::BOOT => "upfront_boot",
			self::LAYOUT_MODE => "upfront_layout_mode",
			self::POSTLAYOUT_MODE => "upfront_postlayout_mode",
			self::UPLOAD => "upfront_upload_stuff",
			self::RESIZE => "upfront_resize_media",
			self::OPTIONS => "upfront_change_options",
			self::CREATE_POST_PAGE => "upfront_create_post_page",
			self::EDIT => "upfront_edit_posts",
			self::EMBED => "upfront_embed_stuff",
			self::RESPONSIVE_MODE => "upfront_responsive_mode",
			self::MODIFY_RESTRICTIONS => "upfront_modify_restrictions",
			self::SEE_USE_DEBUG => "upfront_see_use_debug"
		);
	}

	/**
	 * Filters upfront-access-permissions-map map to place upfront specific capabilities into the permissions map
	 *
	 * @param $default_permissions
	 * @return array
	 */
	function filter_permissions_map( $default_permissions ){
		return shortcode_atts( $default_permissions, $this->get_upfront_capability_map() );
	}

	/**
	 * Initiates class and returns an instance
	 *
	 * @return Upfront_Permissions
	 */
	public static function boot () {
		if (!empty(self::$_me)) return self::$_me;
		self::$_me = new self;
		return self::$_me;
	}

	/**
	 * Checks if current user is able to perform $level
	 *
	 * @param $level
	 * @param bool $arg
	 * @return bool
	 */
	private function _current_user_can ($level, $arg=false) {
		$level = in_array($level, array_keys($this->_levels_map)) && !empty($this->_levels_map[$level])
			? $this->_levels_map[$level]
			: $this->_levels_map[self::DEFAULT_LEVEL]
		;
		if (empty($level)) return false;
		if (
			!is_user_logged_in() &&
			!(defined('UPFRONT_ALLOW_ANONYMOUS_BOOT') && UPFRONT_ALLOW_ANONYMOUS_BOOT)
		) return false;

		// Allow anonymous boot
		if (defined('UPFRONT_ALLOW_ANONYMOUS_BOOT') && UPFRONT_ALLOW_ANONYMOUS_BOOT && self::ANONYMOUS === $level) return true;

		return !empty($arg)
			? current_user_can($level, $arg)
			: current_user_can($level)
		;
	}

	/**
	 * Returns nonce keys
	 *
	 * @return array
	 */
	private static function _get_nonce_keys () {
		return array(
			self::BOOT,
			self::EDIT,
			self::EMBED,
			self::UPLOAD,
			self::RESIZE,
			self::SAVE,

			self::ANONYMOUS,
		);
	}

	/**
	 * Converts $key to upfront permission nonce
	 *
	 * @param $key
	 * @return string
	 */
	private static function _to_nonce_key ($key) {
		return "upfront-{$key}";
	}

	/**
	 * Returns upfront capability labels
	 *
	 * @return mixed|void
	 */
	public function get_capability_labels(){
	
		return apply_filters('upfront-access-permissions-labels', array(

			self::BOOT => __('Can Access Upfront Editor Mode', Upfront::TextDomain ),
			self::LAYOUT_MODE => __('Can Modify Upfront Layouts', Upfront::TextDomain ),
			self::POSTLAYOUT_MODE => __('Can Modify Single Post Layout', Upfront::TextDomain ),
			self::UPLOAD => __('Can Upload Media', Upfront::TextDomain ),
			self::RESIZE => __('Can Resize Media (in Layouts)', Upfront::TextDomain ),
			self::OPTIONS => __('Can Modify / Save Global Options <p class="description">(Theme Colors, Comments etc.)</p>', Upfront::TextDomain ),
			self::CREATE_POST_PAGE => __('Can Create Posts & Pages From Upfront', Upfront::TextDomain ),
			self::EDIT => __('Can Edit Existing Posts & Pages', Upfront::TextDomain ),
			self::EMBED => __('Can Use Embeds (Code El, Media Embeds)', Upfront::TextDomain ),
			self::RESPONSIVE_MODE => __('Can Enter & Modify Layouts in Responsive Mode', Upfront::TextDomain ),
			self::MODIFY_RESTRICTIONS => __('Can Modify User Restrictions', Upfront::TextDomain ),
			self::SEE_USE_DEBUG => __('Can See / Use Debug Controls', Upfront::TextDomain )

		));
	}

	/**
	 * Returns levels map
	 *
	 * @return array
	 */
	public function get_level_map() {
		return $this->_levels_map;
	}
	
	/**
	 * Add or remove role capability
	 * @param WP_Role $role  WordPress role object
	 * @param string $capability of the role
	 * @param bool $add  whether to add or remove
	 */
	public function toggle_capability ($role, $capability, $add ) {
		if ( is_a( $role,  'WP_Role')) {
			if ( $add ) {
				$role->add_cap($capability);
			} else {
				$role->remove_cap($capability);
			}
		}
	}

	/**
	 * Checks if $role_id is capable of the $capability
	 *
	 * @param string $role_id role name
	 * @param string $capability capability name
	 * @return bool
	 */
	function is_capable($role_id, $capability  ){
		$role = get_role( $role_id );
		return $role->has_cap( $capability );
	}

}