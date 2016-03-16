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
	const SEE_USE_DEBUG = "see_use_debug";
	const MODIFY_RESTRICTIONS = "modify_restrictions";

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

	public static function is_nonce ($level, $value) {
		$keys = self::_get_nonce_keys();
		if (!in_array($level, $keys)) return false;

		$result = wp_verify_nonce($value, self::_to_nonce_key($level));
		return (bool)$result;
	}


	private function __construct () {
		$this->_levels_map = apply_filters('upfront-access-permissions_map', array(
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

	public static function boot () {
		if (!empty(self::$_me)) return self::$_me;
		self::$_me = new self;
		return self::$_me;
	}

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

	private static function _to_nonce_key ($key) {
		return "upfront-{$key}";
	}

	public function get_labels(){
	
		return apply_filters('upfront-access-permissions-labels', array(

			self::BOOT => __('Can Access Upfront Editor Mode', Upfront::TextDomain ),
			self::LAYOUT_MODE => __('Can Modify Upfront Layouts', Upfront::TextDomain ),
			self::POSTLAYOUT_MODE => __('Can Modify Single Post Layout', Upfront::TextDomain ),
			$this->_levels_map[self::UPLOAD] => __('Can Upload Media', Upfront::TextDomain ),
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
	 * Returns all restrictions
	 *
	 * @return mixed
	 */
	function get_restrictions(){
		self::boot();
		if( isset( $this->_cached_restrictions ) && array() !==  $this->_cached_restrictions  )
			return $this->_cached_restrictions;
		else
			$this->_cached_restrictions = get_site_option( self::RESTRICTIONS_KEY, array_keys( $this->_levels_map ) );
		return $this->_cached_restrictions ;
	}

	function update_restrictions( $value_array ){
	
		return update_site_option( self::RESTRICTIONS_KEY, $value_array );
	}
	
	
	/**
	 * Updates restriction for a given role and functionality
	 *
	 * @param string $role_id
	 * @param string $functionality_id functionality to update restrictions for
	 * @param bool $restriction  whether it's restricted or allowed
	 * @return bool
	 */
	function update_restriction( $role_id, $functionality_id , $restriction ){
		$restrictions = $this->get_restrictions();
		$restrictions[$role_id][$functionality_id] = (bool) $restriction;
		return update_site_option( self::RESTRICTIONS_KEY, $restrictions );
	}

	/**
	 * Returns restriction for specific role and functionality
	 *
	 * @param $role_id
	 * @param $functionality_id
	 * @return bool
	 */
	function get_restriction( $role_id, $functionality_id  ){
		$restrictions = $this->get_restrictions();
		return  isset( $restrictions[$role_id] ) && isset( $restrictions[$role_id][$functionality_id] ) ? $restrictions[$role_id][$functionality_id] : false;
	}
}