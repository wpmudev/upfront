<?php

class Upfront_Server_ResponsiveServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_get_breakpoints', array($this, 'get_breakpoints'));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_update_breakpoints', array($this, 'update_breakpoints'));
		}
	}

	public function get_breakpoints() {
		$responsive_settings = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
		if(empty($responsive_settings)) {
			// Add defaults
			$defaults = Upfront_Grid::get_grid()->get_default_breakpoints();
			$responsive_settings = json_encode($defaults);
		}
		$this->_out(new Upfront_JsonResponse_Success($responsive_settings));
	}

	public function update_breakpoints() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$breakpoints = isset($_POST['breakpoints']) ? $_POST['breakpoints'] : array();
		// Parse data types
		foreach ($breakpoints as $index=>$breakpoint) {
			$breakpoints[$index]['enabled'] = filter_var($breakpoint['enabled'], FILTER_VALIDATE_BOOLEAN);
			$breakpoints[$index]['default'] = filter_var($breakpoint['default'], FILTER_VALIDATE_BOOLEAN);
			$breakpoints[$index]['width'] = filter_var($breakpoint['width'], FILTER_VALIDATE_INT);
			$breakpoints[$index]['columns'] = filter_var($breakpoint['columns'], FILTER_VALIDATE_INT);
			if (isset($breakpoint['fixed'])) {
				$breakpoints[$index]['fixed'] = filter_var($breakpoint['fixed'], FILTER_VALIDATE_BOOLEAN);
			}
		}

		$responsive_settings = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
		$responsive_settings = apply_filters('upfront_get_responsive_settings', $responsive_settings);
		if (empty($responsive_settings)) {
			$responsive_settings = array('breakpoints' => $breakpoints);
		} else {
			if (is_string($responsive_settings)) {
				$responsive_settings = json_decode($responsive_settings);
			}
			$responsive_settings = (array) $responsive_settings;
			$responsive_settings['breakpoints'] = $breakpoints;
		}

		do_action('upfront_update_responsive_settings', $responsive_settings);

		if (!has_action('upfront_update_responsive_settings')) {
			update_option('upfront_' . get_stylesheet() . '_responsive_settings', json_encode($responsive_settings));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' responsive settings updated'));
	}
}
//Upfront_Server_ResponsiveServer::serve();
add_action('init', array('Upfront_Server_ResponsiveServer', 'serve'));
