define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/radius-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/typography-settings-item',
	'text!elements/upfront-button/tpl/preset-style.html',
], function(ElementSettings, PresetManager, Util, BorderSettingsItem, RadiusSettingsItem, ColorsSettingsItem, TypographySettingsItem, styleTpl) {
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

	var ButtonAppearance = PresetManager.extend({
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
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'bgcolor',
								label: 'Button Background'
							},
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						state: 'static',
						title: 'Typography',
						fields: {
							typeface: 'fontface', 
							fontstyle: 'fontstyle',
							weight: 'fontstyle_weight',
							style: 'fontstyle_style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
						}
					}
				},	
				{
					fieldClass: RadiusSettingsItem,
					options: {
						state: 'static',
						max_value: 100,
						fields: {
							use: 'useradius', 
							lock: 'borderradiuslock',
							radius: 'radius',
							radius_number: 'radius_number',
							radius1: 'borderradius1',
							radius2: 'borderradius2',
							radius3: 'borderradius3',
							radius4: 'borderradius4'
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'static',
						fields: {
							use: 'useborder', 
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				}	
			],
			Hover: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						state: 'hover',
						title: 'Colors',
						multiple: false,
						toggle: true,
						single: true,
						abccolors: [
							{
								name: 'hov_bgcolor',
								label: 'Button Background'
							},
						],
						fields: {
							use: 'hov_usebgcolor'
						}
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						state: 'hover',
						title: 'Typography',
						toggle: true,
						fields: {
							typeface: 'hov_fontface', 
							fontstyle: 'hov_fontstyle',
							weight: 'hov_fontstyle_weight',
							style: 'hov_fontstyle_style',
							size: 'hov_fontsize',
							line_height: 'hov_lineheight',
							color: 'hov_color',
							use: 'hov_usetypography'
						}
					}
				},	
				{
					fieldClass: RadiusSettingsItem,
					options: {
						state: 'hover',
						max_value: 100,
						fields: {
							use: 'hov_useradius', 
							lock: 'hov_borderradiuslock',
							radius: 'hov_radius',
							radius_number: 'hov_radius_number',
							radius1: 'hov_borderradius1',
							radius2: 'hov_borderradius2',
							radius3: 'hov_borderradius3',
							radius4: 'hov_borderradius4'
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'hover',
						fields: {
							use: 'hov_useborder', 
							width: 'hov_borderwidth',
							type: 'hov_bordertype',
							color: 'hov_bordercolor',
						}
					}
				}
			],
			Focus: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						state: 'focus',
						title: 'Colors',
						multiple: false,
						toggle: true,
						single: true,
						abccolors: [
							{
								name: 'focus_bgcolor',
								label: 'Button Background'
							},
						],
						fields: {
							use: 'focus_usebgcolor'
						}
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						state: 'focus',
						title: 'Typography',
						toggle: true,
						fields: {
							typeface: 'focus_fontface', 
							fontstyle: 'focus_fontstyle',
							weight: 'focus_fontstyle_weight',
							style: 'focus_fontstyle_style',
							size: 'focus_fontsize',
							line_height: 'focus_lineheight',
							color: 'focus_color',
							use: 'focus_usetypography'
						}
					}
				},	
				{
					fieldClass: RadiusSettingsItem,
					options: {
						state: 'focus',
						max_value: 100,
						fields: {
							use: 'focus_useradius', 
							lock: 'focus_borderradiuslock',
							radius: 'focus_radius',
							radius_number: 'focus_radius_number',
							radius1: 'focus_borderradius1',
							radius2: 'focus_borderradius2',
							radius3: 'focus_borderradius3',
							radius4: 'focus_borderradius4'
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'focus',
						fields: {
							use: 'focus_useborder', 
							width: 'focus_borderwidth',
							type: 'focus_bordertype',
							color: 'focus_bordercolor',
						}
					}
				}
			]
		}
	});
	
	var ButtonSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new ButtonAppearance({
					model: this.model
				})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},

		get_title: function () {
			return l10n.settings.label;
		}
	});
	
	// Generate presets styles to page
	Util.generatePresetsToPage('button', styleTpl);

	return ButtonSettings;
});
