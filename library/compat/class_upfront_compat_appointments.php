<?php

/**
 * Ensure WPMU DEV Appointments+ plugin plays nice
 * 
 * Mostly ensure that the shortcodes it exposes can
 * be used in our text-like layout elements.
 *
 * The plugin itself will take care of the normal
 * content shortcode replacement and management.
 */
class Upfront_Compat_Appointments implements IUpfront_Server {

	private function __construct () {}

	public static function serve () {
		$me = new self;
		return $me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-shortcode-content', array($this, 'delegate_shortcode_dependencies'));
	}

	/**
	 * Checks to see whether we should include A+ FE deps
	 *
	 * This applies to content from text-like layout elements.
	 * If a shortcode is to be expanded there, go for it.
	 *
	 * @param string $content Raw (unexpanded) content to check
	 */
	public function delegate_shortcode_dependencies ($content) {
		if (!preg_match('/\[app_/', $content)) return false; // Nothing to do here

		// We found an A+ shortcode - we should inject our stuffs here
		add_action('wp_footer', array($this, 'inject_dependencies'), 0);
	}

	/**
	 * Actually injects the A+ FE dependencies
	 */
	public function inject_dependencies () {
		global $appointments;
		if (!isset($appointments) || !is_callable(array($appointments, 'load_scripts_styles'))) {
			return false;
		}

		$appointments->load_scripts_styles();
	}
}
