<?php

require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';

class Upfront_Button_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	protected function __construct() {
		parent::__construct();

		$this->update_preset_values();
	}
	public function get_element_name() {
		return 'button';
	}

	public static function serve () {
		self::$instance = new self;
		self::$instance->_add_hooks();
		add_filter( 'get_element_preset_styles', array(self::$instance, 'get_preset_styles_filter')) ;
	}

	public static function get_instance() {
		return self::$instance;
	}

	public function get_preset_styles_filter($style) {
		$style .= $this->get_presets_styles();
		return $style;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-button/tpl/preset-style.html');
	}

	public function get() {
		$this->_out(new Upfront_JsonResponse_Success($this->get_presets(true)));
	}

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
		
		$presets = $this->replace_new_lines($presets);

		// Fail-safe
		if (is_array($presets) === false) {
			$presets = array();
		}

		return $presets;
	}

	public function clearPreset($preset) {
		$preset = str_replace(' ', '-', $preset);
		$preset = preg_replace('/[^-a-zA-Z0-9]/', '', $preset);

		return $preset; // Removes special chars.
	}

	public function update_preset_values() {
		$presets = $this->get_presets();

		$update_settings = array();
		$result = array();

		$count = 0;
		//Check if old preset data and enable preset options
		foreach($presets as $preset_options) {
			//If empty preset continue
			if(empty($preset_options['id'])) {
				continue;
			}

			//Enable all checkboxes for button preset
			if(!isset($preset_options['lineheight'])) {
				$preset_options['useborder'] = 'yes';
				$preset_options['useradius'] = 'yes';
				$preset_options['hov_usetypography'] = 'yes';
				$preset_options['hov_useborder'] = 'yes';
				$preset_options['hov_useradius'] = 'yes';
				$preset_options['hov_usebgcolor'] = 'yes';
				$preset_options['hov_use_animation'] = 'yes';
				$preset_options['lineheight'] = 1;
				$count++;
			}
			
			//Enable Use Animation
			if(!isset($preset_options['focus_borderradiuslock'])) {
				$preset_options['hov_use_animation'] = 'yes';
				$preset_options['focus_borderradiuslock'] = 'yes';
				$count++;
			}

			$update_settings[] = $preset_options;
		}

		//If changed presets update database
		if($count > 0 && !empty($update_settings)) {
			$this->update_presets($update_settings);
		}

		$i = 0;
		foreach ($presets as $preset) {
			$new_preset = $this->clearPreset($preset['id']);

			//Check if preset is valid else strip special characters
			if($preset['id'] != $new_preset) {
				$preset['id'] = $new_preset;
				$i++;
			}

			$result[] = $preset;
		}

		//If result is not empty update presets
		if($i > 0 && !empty($result)) {
			$this->update_presets($result);
			$presets = $result;
		}
	}

	public static function get_preset_defaults() {
		return array(
			'useborder' => 'yes',
			'bordertype' => 'solid',
			'borderwidth' => 4,
			'bordercolor' => 'rgb(66, 127, 237)',
			'useradius' => 'yes',
			'borderradiuslock' => 'yes',
			'borderradius1' => 100,
			'borderradius2' => 100,
			'borderradius3' => 100,
			'borderradius4' => 100,
			'bgcolor' => 'rgb(255, 255, 255)',
			'fontsize' => 16,
			'fontface' => 'Arial',
			'fontstyle' => '600 normal',
			'fontstyle_weight' => '600',
			'fontstyle_style' => 'normal',
			'lineheight' => 3,
			'color' => 'rgb(66, 127, 237)',
			'hov_bordertype' => 'solid',
			'hov_borderwidth' => 4,
			'hov_bordercolor' => 'rgb(66, 127, 237)',
			'hov_borderradiuslock' => 'yes',
			'hov_borderradius1' => 100,
			'hov_borderradius2' => 100,
			'hov_borderradius3' => 100,
			'hov_borderradius4' => 100,
			'hov_bgcolor' => 'rgb(66, 127, 237)',
			'hov_fontsize' => 16,
			'hov_fontface' => 'Arial',
			'hov_fontstyle' => '600 normal',
			'hov_fontstyle_weight' => '600',
			'hov_fontstyle_style' => 'normal',
			'hov_lineheight' => 3,
			'hov_color' => 'rgb(255, 255, 255)',
			'hov_duration' => 0.25,
			'hov_transition' => 'linear',
			'hov_duration' => 0.3,
			'hov_easing' => 'ease-in-out',
			'focus_bordertype' => 'solid',
			'focus_borderwidth' => 4,
			'focus_bordercolor' => 'rgb(66, 127, 237)',
			'focus_borderradiuslock' => 'yes',
			'focus_borderradius1' => 100,
			'focus_borderradius2' => 100,
			'focus_borderradius3' => 100,
			'focus_borderradius4' => 100,
			'focus_bgcolor' => 'rgb(66, 127, 237)',
			'focus_fontsize' => 16,
			'focus_fontface' => 'Arial',
			'focus_fontstyle' => '600 normal',
			'focus_fontstyle_weight' => '600',
			'focus_fontstyle_style' => 'normal',
			'focus_lineheight' => 3,
			'focus_color' => 'rgb(255, 255, 255)',
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

add_action('init', array('Upfront_Button_Presets_Server', 'serve'));
