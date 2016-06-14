define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-login/tpl/preset-style.html'
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.login_element;

	var LoginPresetSettings = {
		mainDataCollection: 'loginPresets',
		styleElementPrefix: 'login-preset',
		ajaxActionSlug: 'login',
		panelTitle: l10n.settings,
		presetDefaults: Upfront.mainData.presetDefaults.login,
		styleTpl: styleTpl,
		stateModules: {
			Global: [
				{
					moduleType: 'Selectbox',
					options: {
						state: 'global',
						default_value: 'element_wrapper',
						title: '',
						custom_class: 'image_style',
						label: l10n.preset.part_to_style,
						fields: {
							name: 'partStyle'
						},
						values: [
							{ label: "Element Wrapper", value: 'element_wrapper' },
							{ label: "Field Labels", value: 'field_labels' },
							{ label: "Input Fields", value: 'input_fields' },
							{ label: "Button", value: 'button' },
							{ label: "Lost Password Text", value: 'lost_password_text' },
							{ label: "Log in Trigger", value: 'login_trigger' },
						]
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'element_wrapper_settings',
						abccolors: [
							{
								name: 'wrapper_background',
								label: 'Wrapper Background'
							}
						]
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'element_wrapper_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'element_wrapper_settings',
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
				
			],
			Static: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'input_fields_settings',
						abccolors: [
							{
								name: 'field_background',
								label: 'Field Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'input_fields_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'button_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'button_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'lost_password_text_settings',
						abccolors: [
							{
								name: 'link_color',
								label: 'Link Color'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'lost_password_text_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'login_trigger_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'login_trigger_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
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
			],
			Hover: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'input_fields_settings',
						abccolors: [
							{
								name: 'field_background',
								label: 'Field Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'input_fields_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'button_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'button_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'lost_password_text_settings',
						abccolors: [
							{
								name: 'link_color',
								label: 'Link Color'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'lost_password_text_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'login_trigger_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'login_trigger_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
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
			],
			Focus: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'input_fields_settings',
						abccolors: [
							{
								name: 'field_background',
								label: 'Field Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'input_fields_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'button_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'button_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
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
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'lost_password_text_settings',
						abccolors: [
							{
								name: 'link_color',
								label: 'Link Color'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'lost_password_text_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'login_trigger_settings',
						abccolors: [
							{
								name: 'button_background',
								label: 'Button Background'
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'login_trigger_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'fontface',
							fontstyle: 'fontstyle',
							weight: 'weight',
							style: 'style',
							size: 'fontsize',
							line_height: 'lineheight',
							color: 'color',
							use: 'usetypography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
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
			]
		}
	};

	return LoginPresetSettings;
});
