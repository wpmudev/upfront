define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-button/tpl/preset-style.html',
	'elements/upfront-button/js/settings-fields-static',
	'elements/upfront-button/js/settings-fields-hover',
], function(PresetManager, Util, styleTpl, ButtonSettingsStatic, ButtonSettingsHover) {
	var l10n = Upfront.Settings.l10n.button_element;
	
	var me = this;

	//Create new field type Separator
	var FieldSeparator = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	//Create new field type Heading
	var FieldHeading = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	var Settings = PresetManager.extend({
		mainDataCollection: 'buttonPresets',
		styleElementPrefix: 'button-preset',
		ajaxActionSlug: 'button',
		panelTitle: l10n.settings,
		styleTpl: styleTpl,
		presetDefaults: {
			'useborder': 'yes',
			'bordertype': 'solid',
			'borderwidth': 4,
			'bordercolor': 'rgb(66, 127, 237)',
			'useradius': 'yes',
			'borderradiuslock': 'yes',
			'borderradius1': 100,
			'borderradius2': 100,
			'borderradius3': 100,
			'borderradius4': 100,
			'bgcolor': 'rgb(255, 255, 255)',
			'fontsize': 16,
			'fontface': 'Arial',
			'fontstyle': '600 normal',
			'fontstyle_weight': '600',
			'fontstyle_style': 'normal',
			'lineheight': 3,
			'color': 'rgb(66, 127, 237)',
			'hov_bordertype': 'solid',
			'hov_borderwidth': 4,
			'hov_bordercolor': 'rgb(66, 127, 237)',
			'hov_borderradiuslock': 'yes',
			'hov_borderradius1': 100,
			'hov_borderradius2': 100,
			'hov_borderradius3': 100,
			'hov_borderradius4': 100,
			'hov_bgcolor': 'rgb(66, 127, 237)',
			'hov_fontsize': 16,
			'hov_fontface': 'Arial',
			'hov_fontstyle': '600 normal',
			'hov_fontstyle_weight': '600',
			'hov_fontstyle_style': 'normal',
			'hov_lineheight': 3,
			'hov_color': 'rgb(255, 255, 255)',
			'hov_duration': 0.25,
			'hov_transition': 'linear',
			'id': 'default',
			'name': l10n.default_preset
		},
		stateFields: {
			Static: [
				{
					fieldClass: ButtonSettingsStatic,
					options: {
						state: 'static'
					}
				}
			],
			Hover: [
				{
					fieldClass: ButtonSettingsHover,
					options: {
						state: 'hover'
					}
				}
			]
		}
	});
	
	// Generate presets styles to page
	Util.generatePresetsToPage('button', styleTpl);

	return Settings;
});
