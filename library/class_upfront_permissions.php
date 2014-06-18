<?php

class Upfront_Permissions {

	const BOOT = 'boot_upfront';
	const EDIT = 'edit_posts';
	const EMBED = 'embed_stuff';
	const UPLOAD = 'upload_stuff';
	const SAVE = 'save_changes';

	const DEFAULT_LEVEL = 'save_changes';

	private $_levels_map = array();
	private static $_me;


	public static function current ($level) {
		self::boot();
		return self::$_me->_current_user_can($level);
	}


	private function __construct () {
		$this->_levels_map = array(
			self::BOOT => 'edit_posts',
			self::EDIT => 'edit_posts',
			self::EMBED => 'edit_posts',
			self::UPLOAD => 'upload_files',
			self::SAVE => 'edit_theme_options',

			self::DEFAULT_LEVEL => 'edit_theme_options',
		);
	}

	private static function boot () {
		if (!empty(self::$_me)) return self::$_me;
		self::$_me = new self;
	}

	private function _current_user_can ($level) {
		$level = in_array($level, $this->_levels_map) && !empty($this->_levels_map[$level])
			? $this->_levels_map[$level]
			: $this->_levels_map[self::DEFAULT_LEVEL]
		;
		if (empty($level)) return false;

		return current_user_can($level);
	}
}