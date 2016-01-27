<?php


class Upfront_Tests {

	public static function identify_as ($role) {
		$users = get_users(array('role' => $role));
		if (empty($users)) return false;
		$user = reset($users);
		wp_set_current_user($user->ID);
	}

	public static function stop_identifying () {
		wp_set_current_user(false);
	}

}