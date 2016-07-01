<?php

class Upfront_ApiKeys_Model {

	const OPTION_KEY = 'upfront-api-keys';

	const SERVICE_GMAPS = 'google';

	public function __construct () {
		add_site_option(self::OPTION_KEY, array(), false);
	}

	/**
	 * Gets all known keys
	 *
	 * @return array
	 */
	public function get_all () {
		$result = array();
		$raw = get_site_option(self::OPTION_KEY, false);

		return (false === $raw) || !is_array($raw)
			? $result
			: $raw
		;
	}

	/**
	 * Returns an individual API key
	 *
	 * @param string $key API key index
	 *
	 * @return mixed API key as string on success, (bool)false on failure
	 */
	public function get ($key=false) {
		if (empty($key)) return false;

		$all = $this->get_all();
		return !empty($all[$key])
			? $all[$key]
			: false
		;
	}

	/**
	 * Convenience key getting method for individual key getting
	 *
	 * @param string $key API key index
	 *
	 * @return mixed API key as string on success, (bool)false on failure
	 */
	public static function get_key ($key=false) {
		$me = new self;
		return $me->get($key);
	}

	/**
	 * Saves the keys for later usage
	 *
	 * @param bool
	 */
	public function set_all ($keys) {
		if (!is_array($keys)) return false;
		return update_site_option(self::OPTION_KEY, $keys);
	}


}
