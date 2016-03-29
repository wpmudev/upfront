<?php

class Upfront_Permissions {

	const BOOT = 'boot_upfront';
	const EDIT = 'edit_posts';
	const EMBED = 'embed_stuff';
	const UPLOAD = 'upload_stuff';
	const RESIZE = 'resize_media';
	const MODIFY_ELEMENT_PRESETS = 'modify_element_presets';
	const CREATE_ELEMENT_PRESETS = 'create_element_presets';
	const SWITCH_ELEMENT_PRESETS = 'switch_element_presets';
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

	const RESTRICTIONS_KEY = "upfront-options-user_restrictions";

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
	public static function current ($level, $arg=false) {
		self::boot();
		return self::$_me->_current_user_can($level, $arg);
	}

	/**
	 * User ability check public access point
	 *
	 * @param int $user_id WP user ID
	 * @param string $level Upfront access level to check
	 *
	 * @return bool
	 */
	public static function user ($user_id, $level) {
		self::boot();
		return self::$_me->_user_can($user_id, $level);
	}

	/**
	 * Role ability check public access point
	 *
	 * @param string $role_id WP role ID
	 * @param string $level Upfront access level to check
	 *
	 * @return bool
	 */
	public static function role ($role_id, $level) {
		self::boot();
		return self::$_me->_role_can($role_id, $level);
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
		$this->_levels_map = wp_parse_args(
			$this->get_restrictions(),
			$this->_get_default_levels_map()
		);
		
	}

	/**
	 * Sets default access levels
	 *
	 *
	 */
	private function _get_default_levels_map(){
		return apply_filters('upfront-access-permissions-map', array(
			self::BOOT => 'edit_theme_options',// 'edit_posts',
			self::LAYOUT_MODE => 'edit_theme_options',
			self::POSTLAYOUT_MODE => 'edit_theme_options',
			self::UPLOAD => 'upload_files',
			self::RESIZE => 'edit_theme_options',// 'edit_posts',
			self::MODIFY_ELEMENT_PRESETS => 'edit_theme_options',
			self::CREATE_ELEMENT_PRESETS => 'edit_theme_options',
			self::SWITCH_ELEMENT_PRESETS => 'edit_theme_options',
			self::OPTIONS => 'manage_options',
			self::CREATE_POST_PAGE => 'edit_posts',
			self::EDIT =>  'edit_theme_options',// 'edit_posts',
			self::EMBED => 'edit_theme_options',// 'edit_posts',
			self::RESPONSIVE_MODE => 'edit_theme_options',
			self::MODIFY_RESTRICTIONS => 'promote_users',
			self::SEE_USE_DEBUG => "edit_themes",
			
			self::SAVE => 'edit_theme_options',
			self::CONTENT_MODE => 'edit_theme_options',// 'edit_posts',
			self::THEME_MODE => 'edit_theme_options',
			self::DEFAULT_LEVEL => 'edit_theme_options',
		));
	}

	/**
	 * Returns upfront capability map
	 *
	 * @return array
	 */
	function get_upfront_capability_map(){
		$levels = $this->_get_default_levels_map();
		if (isset($levels[self::DEFAULT_LEVEL])) unset($levels[self::DEFAULT_LEVEL]);
		if (isset($levels[self::CONTENT_MODE])) unset($levels[self::CONTENT_MODE]);
		if (isset($levels[self::THEME_MODE])) unset($levels[self::THEME_MODE]);
		return $levels;
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
	 * Sets stored userland restrictions
	 *
	 * @param array $restrictions Access levels map to store
	 *
	 * @return bool
	 */
	public function set_restrictions ($restrictions) {
		if (!current_user_can('manage_options')) return false;

		return !!update_option(self::RESTRICTIONS_KEY, $restrictions, false);
	}

	/**
	 * Gets stored userland restrictions
	 *
	 * @return array Upfront access levels map
	 */
	public function get_restrictions () {
		$map = get_option(self::RESTRICTIONS_KEY, array());
		return !empty($map)
			? $map
			: $this->_get_default_levels_map()
		;
	}

	/**
	 * Resolves Upfront access level to an actual WordPress capability
	 *
	 * @param string $level Access level to resolve
	 *
	 * @return array WP capabilities/roles array
	 */
	private function _resolve_level_to_capability ($level) {
		$level = in_array($level, array_keys($this->_levels_map)) && !empty($this->_levels_map[$level])
			? $this->_levels_map[$level]
			: $this->_levels_map[self::DEFAULT_LEVEL]
		;
		return is_array($level)
			? $level
			: array($level)
		;
	}

	/**
	 * Checks if current user is able to perform $level
	 *
	 * @param $level
	 * @param bool $arg
	 * @return bool
	 */
	private function _current_user_can ($level, $arg=false) {
		$level = $this->_resolve_level_to_capability($level);
		if (empty($level)) return false;
		if (
			!is_user_logged_in() &&
			!(defined('UPFRONT_ALLOW_ANONYMOUS_BOOT') && UPFRONT_ALLOW_ANONYMOUS_BOOT)
		) return false;

		// Allow anonymous boot
		if (defined('UPFRONT_ALLOW_ANONYMOUS_BOOT') && UPFRONT_ALLOW_ANONYMOUS_BOOT && array(self::ANONYMOUS) === $level) return true;

		$allowed = false;
		foreach ($level as $lev) {
			$allowed = !empty($arg)
				? current_user_can($lev, $arg)
				: current_user_can($lev)
			;
			if ($allowed) break;
		}

		return (bool)$allowed;
	}

	/**
	 * Checks if an user is able to perform a certain Upfront action
	 *
	 * @param int $user_id User ID
	 * @param string $level Upfront action level to check
	 *
	 * @return bool
	 */
	private function _user_can ($user_id, $level) {
		$level = $this->_resolve_level_to_capability($level);
		if (empty($level)) return false;

		if (empty($user_id)) return defined('UPFRONT_ALLOW_ANONYMOUS_BOOT') && 'UPFRONT_ALLOW_ANONYMOUS_BOOT' && array(self::ANONYMOUS) === $level;

		$allowed = false;
		foreach ($level as $lev) {
			$allowed = (bool)user_can($user_id, $lev);
			if ($allowed) break;
		}

		return (bool)$allowed;
	}

	/**
	 * Checks if a certain user role is able to perform a certain Upfront action
	 *
	 * @param string $role_id WordPress role ID
	 * @param string $level Upfront action level to check
	 *
	 * @return bool
	 */
	private function _role_can ($role_id, $level) {
		if (empty($role_id)) return false;

		$level = $this->_resolve_level_to_capability($level);
		if (empty($level)) return false;

		$role = get_role( $role_id );
		if (!is_object($role)) return false;

		$allowed = false;
		foreach ($level as $lev) {
			$allowed = $role->name === $lev
				? true
				: (bool)$role->has_cap($lev)
			;
			if ($allowed) break;
		}

		return (bool)$allowed;
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
			self::MODIFY_ELEMENT_PRESETS => __('Can Modify Element Presets', Upfront::TextDomain ),
			self::CREATE_ELEMENT_PRESETS => __('Can Create Element Presets', Upfront::TextDomain ),
			self::SWITCH_ELEMENT_PRESETS => __('Can Switch Between Element Presets', Upfront::TextDomain ),
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
		/*
		if ( is_a( $role,  'WP_Role')) {
			if ( $add ) {
				$role->add_cap($capability);
			} else {
				$role->remove_cap($capability);
			}
		}
		*/
	}

	/**
	 * Checks if $role_id is capable of the $capability
	 *
	 * @param string $role_id role name
	 * @param string $capability capability name
	 * @return bool
	 */
	function is_capable($role_id, $capability  ){
		/*
		$role = get_role( $role_id );
		return $role->has_cap( $capability );
		*/
	}

}