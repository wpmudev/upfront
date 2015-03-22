<?php

/**
 * Keeps theme settings providing simple interface for getting
 * stored settings, updating and saving settings to file.
 */
class Upfront_Theme_Settings
{
	protected $filePath;
	protected $settings = array();

	public function __construct($filePath) {
		$this->filePath = $filePath;

		if (file_exists($this->filePath) === false) return;

		$this->settings = include $this->filePath;

		if ($this->settings === 1) $this->settings = array(); // happens with old format settings

		if (empty($this->settings)) {
			$this->tryOldSettingsFormat();
		}
	}

	public function get($name) {
		return isset($this->settings[$name]) ? stripslashes($this->settings[$name]) : null;
	}

	public function set($name, $value) {
		$this->settings[$name] = $value;//addslashes($value);
		$this->save();
	}

	protected function save() {
		$fileContents = "<?php\nreturn array(\n";
		foreach($this->settings as $setting=>$value) {
			$value = addcslashes($value, "'\\");
			$fileContents .= "\t'$setting' => '$value',\n";
		}
		$fileContents .= ");";

		file_put_contents($this->filePath, $fileContents);
	}

	/**
	 * Ensure backward compatibility.
	 */
	protected function tryOldSettingsFormat() {
		include $this->filePath;
		$settings = array('typography', 'layout_style', 'theme_fonts', 'theme_colors', 'layout_properties', 'menus');
		foreach($settings  as $setting) {
			if (isset($$setting)) $this->settings[$setting] = $$setting;
		}
	}
}
