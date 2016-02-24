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

	const DEFAULT_LEVEL = 'save_changes';

	const LAYOUT_MODE = 'layout_mode';
	const CONTENT_MODE = 'content_mode';
	const THEME_MODE = 'theme_mode';
	const POSTLAYOUT_MODE = 'postlayout_mode';
	const RESPONSIVE_MODE = 'responsive_mode';
	
	const ANONYMOUS = '::anonymous::';

	private $_levels_map = array();
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

			self::LAYOUT_MODE => 'edit_theme_options',
			self::CONTENT_MODE => 'edit_theme_options',// 'edit_posts',
			self::THEME_MODE => 'edit_theme_options',
			self::POSTLAYOUT_MODE => 'edit_theme_options',
			self::RESPONSIVE_MODE => 'edit_theme_options',

			self::DEFAULT_LEVEL => 'edit_theme_options',
		));
	}

	private static function boot () {
		if (!empty(self::$_me)) return self::$_me;
		self::$_me = new self;
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
}