<?php

class Upfront_Server_TabPresetsServer extends Upfront_Server {

	protected function __construct() {
		parent::__construct();
		$this->db_key = 'upfront_' . get_stylesheet() . '_tab_presets';
	}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_get_tab_presets', array($this, 'get'));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_tab_preset', array($this, 'save'));
			upfront_add_ajax('upfront_delete_tab_preset', array($this, 'delete'));
		}
	}

	public function get() {
		$this->_out(new Upfront_JsonResponse_Success($this->get_presets()));
	}

	public function delete() {
		if (!isset($_POST['data'])) {
			return;
		}

		do_action('upfront_delete_tab_preset', $properties);

		if (!has_action('upfront_delete_tab_preset')) {
			$properties = $_POST['data'];

			$presets = $this->get_presets();

			$result = array();

			foreach ($presets as $preset) {
				if ($preset['id'] === $properties['id']) {
					continue;
				}
				$result[] = $preset;
			}

			$this->update_presets($result);
		}

		$this->_out(new Upfront_JsonResponse_Success('Deleted tab preset.'));
	}

	/**
	 * @return array saved presets
	 */
	protected function get_presets() {
		$presets = json_decode(get_option($this->db_key, '[]'), true);

		$presets = apply_filters(
			'upfront_get_tab_presets',
			$presets,
			array(
				'json' => false,
				'as_array' => true
			)
		);

		// Fail-safe
		if (is_array($presets) === false) {
			$presets = array();
		}

		return $presets;
	}

	protected function update_presets($presets = array()) {
		update_option($this->db_key, json_encode($presets));
	}

	public function save() {
		if (!isset($_POST['data'])) {
			return;
		}

		$properties = $_POST['data'];

		do_action('upfront_save_tab_preset', $properties);

		if (!has_action('upfront_save_tab_preset')) {
			$presets = $this->get_presets();

			$result = array();

			foreach ($presets as $preset) {
				if ($preset['id'] === $properties['id']) {
					continue;
				}
				$result[] = $preset;
			}

			$result[] = $properties;

			$this->update_presets($result);
		}

		$this->_out(new Upfront_JsonResponse_Success('Saved tab preset, yay.'));
	}
}

add_action('init', array('Upfront_Server_TabPresetsServer', 'serve'));
