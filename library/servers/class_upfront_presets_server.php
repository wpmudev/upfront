<?php

abstract class Upfront_Presets_Server extends Upfront_Server {

	protected function __construct() {
		parent::__construct();
		$this->elementName = $this->get_element_name();
		$this->db_key = 'upfront_' . get_stylesheet() . '_' . $this->elementName . '_presets';
	}

	public abstract function get_element_name();

	protected function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_get_' . $this->elementName . '_presets', array($this, 'get'));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_' . $this->elementName . '_preset', array($this, 'save'));
			upfront_add_ajax('upfront_delete_' . $this->elementName . '_preset', array($this, 'delete'));
		}
	}

	public function get() {
		$this->_out(new Upfront_JsonResponse_Success($this->get_presets()));
	}

	public function delete() {
		if (!isset($_POST['data'])) {
			return;
		}

		do_action('upfront_delete_' . $this->elementName . '_preset', $properties);

		if (!has_action('upfront_delete_' . $this->elementName . '_preset')) {
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

		$this->_out(new Upfront_JsonResponse_Success('Deleted ' . $this->elementName . ' preset.'));
	}

	/**
	 * @return array saved presets
	 */
	public function get_presets() {
		$presets = json_decode(get_option($this->db_key, '[]'), true);

		$presets = apply_filters(
			'upfront_get_' . $this->elementName . '_presets',
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

		do_action('upfront_save_' . $this->elementName . '_preset', $properties);

		if (!has_action('upfront_save_' . $this->elementName . '_preset')) {
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

		$this->_out(new Upfront_JsonResponse_Success('Saved ' . $this->elementName . ' preset, yay.'));
	}

	public function get_presets_styles() {
		$presets = $this->get_presets();
		if (empty($presets)) {
			return '';
		}

		$styles = '';
		foreach ($presets as $preset) {
			$args = array('properties' => $preset);
			extract($args);
			ob_start();
			include $this->get_style_template_path();
			$styles .= ob_get_clean();
		}

		return $styles;
	}
}
