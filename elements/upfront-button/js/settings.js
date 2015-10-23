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
			'borderwidth': 2,
			'bordercolor': 'rgb(0, 0, 0)',
			'useradius': '',
			'borderradiuslock': '',
			'borderradius1': 0,
			'borderradius2': 0,
			'borderradius3': 0,
			'borderradius4': 0,
			'bgcolor': 'rgb(255, 255, 255)',
			'fontsize': 14,
			'fontface': 'Arial',
			'fontstyle': '600 normal',
			'fontstyle_weight': '600',
			'fontstyle_style': 'normal',
			'lineheight': 2,
			'color': 'rgb(0, 0, 0)',
			'hov_useborder': 'yes',
			'hov_bordertype': 'solid',
			'hov_borderwidth': 2,
			'hov_bordercolor': 'rgb(0, 0, 0)',
			'hov_borderradiuslock': '',
			'hov_borderradius1': 0,
			'hov_borderradius2': 0,
			'hov_borderradius3': 0,
			'hov_borderradius4': 0,
			'hov_usetypography': 'yes',
			'hov_usebgcolor': 'yes',
			'hov_bgcolor': 'rgb(0, 0, 0)',
			'hov_fontsize': 14,
			'hov_fontface': 'Arial',
			'hov_fontstyle': '600 normal',
			'hov_fontstyle_weight': '600',
			'hov_fontstyle_style': 'normal',
			'hov_lineheight': 2,
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
