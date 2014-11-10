<?php


/**
 * Dictates scheduled (web cron) runs.
 */
class Upfront_Server_Schedule implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		// Debug line
		//add_action('init', create_function('', "do_action('upfront_hourly_schedule');"), 999); return false;
		// Sets up hourly schedule
		if (!wp_next_scheduled('upfront_hourly_schedule')) {
			wp_schedule_event(time(), 'hourly', 'upfront_hourly_schedule');
		}
	}

}
Upfront_Server_Schedule::serve();