<?php
/**
 * Core Upfront server classes.
 * All AJAX requests should be routed through a Server implementation,
 * in order to leverage joint debugging, server response standards and compression.
 */



interface IUpfront_Server {
	public static function serve ();
}

abstract class Upfront_Server implements IUpfront_Server {

	const REJECT_NOT_ALLOWED = "not allowed";

	protected $_debugger;

	protected function __construct () {
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public static function name_to_class ($name, $check_existence=false) {
		$parts = array_map('ucfirst', array_map('strtolower', explode('_', $name)));
		$valid = 'Upfront_' . join('', $parts);
		if (!$check_existence) return $valid;
		return class_exists($valid) ? $valid : false;
	}

	/**
	 * Server output handler
	 *
	 * @param Upfront_HttpResponse $out One of the known response objects
	 * @param bool $cacheable Whether this request can be cached
	 */
	protected function _out (Upfront_HttpResponse $out, $cacheable=false) {
		// If we're running phpunit tests, make sure we don't leak out
		if (defined('IS_UPFRONT_TESTING_ENVIRONMENT') && IS_UPFRONT_TESTING_ENVIRONMENT) {
			return $out->get_output();
		}

		if (!Upfront_Behavior::debug()->is_active(Upfront_Behavior::debug()->constant('RESPONSE')) && extension_loaded('zlib') && Upfront_Behavior::compression()->has_compression()) {
			ob_start('ob_gzhandler');
		}
		status_header($out->get_status());
		header("Content-type: " . $out->get_content_type() . "; charset=utf-8");

		if ($cacheable && Upfront_Behavior::compression()->has_experiments()) {
			$offset = is_numeric($cacheable) ? (int)$cacheable : (DAY_IN_SECONDS * 365);
			header('Expires: ' . gmdate( "D, d M Y H:i:s", time() + $offset ) . ' GMT');
			header("Cache-Control: private, max-age={$offset}");
			header("Pragma: cache");
		}

		die($out->get_output());
	}

	/**
	 * Quick request rejection handler
	 *
	 * @param string $reason Optional reason for request rejection
	 */
	protected function _reject ($reason=false) {
		$reason = $reason ? $reason : self::REJECT_NOT_ALLOWED;
		$msg = new Upfront_JsonResponse_Error($reason);
		$this->_out($msg);
	}
}

/** --- Load up the implementations --- **/

require_once('servers/class_upfront_page_template.php');
require_once('servers/class_upfront_ajax.php');
require_once('servers/class_upfront_javascript_main.php');
require_once('servers/class_upfront_stylesheet_main.php');
require_once('servers/class_upfront_stylesheet_editor.php');
require_once('servers/class_upfront_core_dependencies_server.php');
require_once('servers/class_upfront_element_styles.php');
require_once('servers/class_upfront_layout_revisions.php');
require_once('servers/class_upfront_server_schedule.php');
require_once('servers/class_upfront_server_media_cleanup.php');
require_once('servers/class_upfront_google_fonts_server.php');
require_once('servers/class_upfront_responsive_server.php');
require_once('servers/class_upfront_theme_fonts_server.php');
require_once('servers/class_upfront_theme_colors_server.php');
require_once('servers/class_upfront_server_post_image_variants.php');
require_once('servers/class_upfront_markup_server.php');
require_once('servers/class_upfront_editor_l10n_server.php');
