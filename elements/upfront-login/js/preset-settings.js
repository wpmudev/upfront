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
						default_value: 'form_wrapper',
						title: '',
						custom_class: 'image_style',
						label: l10n.preset.part_to_style,
						fields: {
							name: 'part_style'
						},
						values: [
							{ label: l10n.preset.form_wrapper, value: 'form_wrapper' },
							{ label: l10n.preset.field_labels, value: 'field_labels' },
							{ label: l10n.preset.input_fields, value: 'input_fields' },
							{ label: l10n.preset.button, value: 'button' },
							{ label: l10n.preset.lost_password, value: 'lost_password_text' },
							{ label: l10n.preset.login_trigger, value: 'login_trigger' },
							{ label: l10n.preset.logout_link, value: 'logout_link' }
						]
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						className: 'upfront-field-padding-top',
						state: 'form_wrapper_settings',
						abccolors: [
							{
								name: 'form_wrapper_background',
								label: l10n.preset.wrapper_background
							}
						]
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'form_wrapper_settings',
						title: '',
						fields: {
							use: 'form_wrapper_use_border',
							width: 'form_wrapper_border_width',
							type: 'form_wrapper_border_type',
							color: 'form_wrapper_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'form_wrapper_settings',
						max_value: 100,
						fields: {
							use: 'form_wrapper_use_radius',
							lock: 'form_wrapper_border_radius_lock',
							radius: 'form_wrapper_radius',
							radius_number: 'form_wrapper_radius_number',
							radius1: 'form_wrapper_border_radius1',
							radius2: 'form_wrapper_border_radius2',
							radius3: 'form_wrapper_border_radius3',
							radius4: 'form_wrapper_border_radius4'
						}
					}
				}

			],
			Static: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						className: 'upfront-field-padding-top',
						global_typography: false,
						fields: {
							typeface: 'field_labels_font_face',
							fontstyle: 'field_labels_font_style',
							weight: 'field_labels_weight',
							style: 'field_labels_style',
							size: 'field_labels_font_size',
							line_height: 'field_labels_line_height',
							color: 'field_labels_color',
							use: 'field_labels_use_typography'
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
								name: 'input_fields_background',
								label: l10n.preset.field_background
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
							typeface: 'input_fields_font_face',
							fontstyle: 'input_fields_font_style',
							weight: 'input_fields_weight',
							style: 'input_fields_style',
							size: 'input_fields_font_size',
							line_height: 'input_fields_line_height',
							color: 'input_fields_color',
							use: 'input_fields_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'input_fields_use_border',
							width: 'input_fields_border_width',
							type: 'input_fields_border_type',
							color: 'input_fields_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
						max_value: 100,
						fields: {
							use: 'input_fields_use_radius',
							lock: 'input_fields_border_radius_lock',
							radius: 'input_fields_radius',
							radius_number: 'input_fields_radius_number',
							radius1: 'input_fields_border_radius1',
							radius2: 'input_fields_border_radius2',
							radius3: 'input_fields_border_radius3',
							radius4: 'input_fields_border_radius4'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						className: 'upfront-field-padding-top',
						state: 'button_settings',
						abccolors: [
							{
								name: 'button_background',
								label: l10n.preset.button_background
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
							typeface: 'button_font_face',
							fontstyle: 'button_font_style',
							weight: 'button_weight',
							style: 'button_style',
							size: 'button_font_size',
							line_height: 'button_line_height',
							color: 'button_color',
							use: 'button_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'button_use_border',
							width: 'button_border_width',
							type: 'button_border_type',
							color: 'button_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
						max_value: 100,
						fields: {
							use: 'button_use_radius',
							lock: 'button_border_radius_lock',
							radius: 'button_radius',
							radius_number: 'button_radius_number',
							radius1: 'button_border_radius1',
							radius2: 'button_border_radius2',
							radius3: 'button_border_radius3',
							radius4: 'button_border_radius4'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						className: 'upfront-field-padding-top',
						state: 'lost_password_text_settings',
						abccolors: [
							{
								name: 'lost_password_text_link_color',
								label: l10n.preset.link_color
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
							typeface: 'lost_password_text_font_face',
							fontstyle: 'lost_password_text_font_style',
							weight: 'lost_password_text_weight',
							style: 'lost_password_text_style',
							size: 'lost_password_text_font_size',
							line_height: 'lost_password_text_line_height',
							color: 'lost_password_text_color',
							use: 'lost_password_text_use_typography'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						className: 'upfront-field-padding-top',
						state: 'login_trigger_settings',
						abccolors: [
							{
								name: 'login_trigger_button_background',
								label: l10n.preset.button_background
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
							typeface: 'login_trigger_font_face',
							fontstyle: 'login_trigger_font_style',
							weight: 'login_trigger_weight',
							style: 'login_trigger_style',
							size: 'login_trigger_font_size',
							line_height: 'login_trigger_line_height',
							color: 'login_trigger_color',
							use: 'login_trigger_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'login_trigger_use_border',
							width: 'login_trigger_border_width',
							type: 'login_trigger_border_type',
							color: 'login_trigger_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
						max_value: 100,
						fields: {
							use: 'login_trigger_use_radius',
							lock: 'login_trigger_border_radius_lock',
							radius: 'login_trigger_radius',
							radius_number: 'login_trigger_radius_number',
							radius1: 'login_trigger_border_radius1',
							radius2: 'login_trigger_border_radius2',
							radius3: 'login_trigger_border_radius3',
							radius4: 'login_trigger_border_radius4'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						className: 'upfront-field-padding-top',
						state: 'logout_link_settings',
						abccolors: [
							{
								name: 'logout_link_button_background',
								label: l10n.preset.button_background
							}
						]
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'logout_link_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						fields: {
							typeface: 'logout_link_font_face',
							fontstyle: 'logout_link_font_style',
							weight: 'logout_link_weight',
							style: 'logout_link_style',
							size: 'logout_link_font_size',
							line_height: 'logout_link_line_height',
							color: 'logout_link_color',
							use: 'logout_link_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'logout_link_settings',
						title: '',
						fields: {
							use: 'logout_link_use_border',
							width: 'logout_link_border_width',
							type: 'logout_link_border_type',
							color: 'logout_link_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'logout_link_settings',
						max_value: 100,
						fields: {
							use: 'logout_link_use_radius',
							lock: 'logout_link_border_radius_lock',
							radius: 'logout_link_radius',
							radius_number: 'logout_link_radius_number',
							radius1: 'logout_link_border_radius1',
							radius2: 'logout_link_border_radius2',
							radius3: 'logout_link_border_radius3',
							radius4: 'logout_link_border_radius4'
						}
					}
				}
			],
			Hover: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_field_labels_font_face',
							fontstyle: 'hover_field_labels_font_style',
							weight: 'hover_field_labels_weight',
							style: 'hover_field_labels_style',
							size: 'hover_field_labels_font_size',
							line_height: 'hover_field_labels_line_height',
							color: 'hover_field_labels_color',
							use: 'hover_field_labels_use_typography'
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
						prepend: 'hover_',
						toggle: true,
						abccolors: [
							{
								name: 'hover_input_fields_background',
								label: l10n.preset.field_background
							}
						],
						fields: {
							use: 'hover_use_input_fields_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'input_fields_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_input_fields_font_face',
							fontstyle: 'hover_input_fields_font_style',
							weight: 'hover_input_fields_weight',
							style: 'hover_input_fields_style',
							size: 'hover_input_fields_font_size',
							line_height: 'hover_input_fields_line_height',
							color: 'hover_input_fields_color',
							use: 'hover_input_fields_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						prepend: 'hover_',
						fields: {
							use: 'hover_input_fields_use_border',
							width: 'hover_input_fields_border_width',
							type: 'hover_input_fields_border_type',
							color: 'hover_input_fields_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
						max_value: 100,
						prepend: 'hover_',
						fields: {
							use: 'hover_input_fields_use_radius',
							lock: 'hover_input_fields_border_radius_lock',
							radius: 'hover_input_fields_radius',
							radius_number: 'hover_input_fields_radius_number',
							radius1: 'hover_input_fields_border_radius1',
							radius2: 'hover_input_fields_border_radius2',
							radius3: 'hover_input_fields_border_radius3',
							radius4: 'hover_input_fields_border_radius4'
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
						prepend: 'hover_',
						toggle: true,
						abccolors: [
							{
								name: 'hover_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'hover_use_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'button_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_button_font_face',
							fontstyle: 'hover_button_font_style',
							weight: 'hover_button_weight',
							style: 'hover_button_style',
							size: 'hover_button_font_size',
							line_height: 'hover_button_line_height',
							color: 'hover_button_color',
							use: 'hover_button_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						prepend: 'hover_',
						fields: {
							use: 'hover_button_use_border',
							width: 'hover_button_border_width',
							type: 'hover_button_border_type',
							color: 'hover_button_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
						max_value: 100,
						prepend: 'hover_',
						fields: {
							use: 'hover_button_use_radius',
							lock: 'hover_button_border_radius_lock',
							radius: 'hover_button_radius',
							radius_number: 'hover_button_radius_number',
							radius1: 'hover_button_border_radius1',
							radius2: 'hover_button_border_radius2',
							radius3: 'hover_button_border_radius3',
							radius4: 'hover_button_border_radius4'
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
						prepend: 'hover_',
						toggle: true,
						abccolors: [
							{
								name: 'hover_lost_password_text_link_color',
								label: l10n.preset.link_color
							}
						],
						fields: {
							use: 'hover_use_lost_password_text_link_color'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'lost_password_text_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_lost_password_text_font_face',
							fontstyle: 'hover_lost_password_text_font_style',
							weight: 'hover_lost_password_text_weight',
							style: 'hover_lost_password_text_style',
							size: 'hover_lost_password_text_font_size',
							line_height: 'hover_lost_password_text_line_height',
							color: 'hover_lost_password_text_color',
							use: 'hover_lost_password_text_use_typography'
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
						prepend: 'hover_',
						toggle: true,
						abccolors: [
							{
								name: 'hover_login_trigger_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'hover_use_login_trigger_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'login_trigger_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_login_trigger_font_face',
							fontstyle: 'hover_login_trigger_font_style',
							weight: 'hover_login_trigger_weight',
							style: 'hover_login_trigger_style',
							size: 'hover_login_trigger_font_size',
							line_height: 'hover_login_trigger_line_height',
							color: 'hover_login_trigger_color',
							use: 'hover_login_trigger_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						prepend: 'hover_',
						fields: {
							use: 'hover_login_trigger_use_border',
							width: 'hover_login_trigger_border_width',
							type: 'hover_login_trigger_border_type',
							color: 'hover_login_trigger_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
						max_value: 100,
						prepend: 'hover_',
						fields: {
							use: 'hover_login_trigger_use_radius',
							lock: 'hover_login_trigger_border_radius_lock',
							radius: 'hover_login_trigger_radius',
							radius_number: 'hover_login_trigger_radius_number',
							radius1: 'hover_login_trigger_border_radius1',
							radius2: 'hover_login_trigger_border_radius2',
							radius3: 'hover_login_trigger_border_radius3',
							radius4: 'hover_login_trigger_border_radius4'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'logout_link_settings',
						prepend: 'hover_',
						toggle: true,
						abccolors: [
							{
								name: 'hover_logout_link_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'hover_use_logout_link_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'logout_link_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'hover_',
						fields: {
							typeface: 'hover_logout_link_font_face',
							fontstyle: 'hover_logout_link_font_style',
							weight: 'hover_logout_link_weight',
							style: 'hover_logout_link_style',
							size: 'hover_logout_link_font_size',
							line_height: 'hover_logout_link_line_height',
							color: 'hover_logout_link_color',
							use: 'hover_logout_link_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'logout_link_settings',
						title: '',
						prepend: 'hover_',
						fields: {
							use: 'hover_logout_link_use_border',
							width: 'hover_logout_link_border_width',
							type: 'hover_logout_link_border_type',
							color: 'hover_logout_link_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'logout_link_settings',
						max_value: 100,
						prepend: 'hover_',
						fields: {
							use: 'hover_logout_link_use_radius',
							lock: 'hover_logout_link_border_radius_lock',
							radius: 'hover_logout_link_radius',
							radius_number: 'hover_logout_link_radius_number',
							radius1: 'hover_logout_link_border_radius1',
							radius2: 'hover_logout_link_border_radius2',
							radius3: 'hover_logout_link_border_radius3',
							radius4: 'hover_logout_link_border_radius4'
						}
					}
				}
			],
			Focus: [
				{
					moduleType: 'Typography',
					options: {
						state: 'field_labels_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_field_labels_font_face',
							fontstyle: 'focus_field_labels_font_style',
							weight: 'focus_field_labels_weight',
							style: 'focus_field_labels_style',
							size: 'focus_field_labels_font_size',
							line_height: 'focus_field_labels_line_height',
							color: 'focus_field_labels_color',
							use: 'focus_field_labels_use_typography'
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
						prepend: 'focus_',
						toggle: true,
						abccolors: [
							{
								name: 'focus_input_fields_background',
								label: l10n.preset.field_background
							}
						],
						fields: {
							use: 'focus_use_input_fields_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'input_fields_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_input_fields_font_face',
							fontstyle: 'focus_input_fields_font_style',
							weight: 'focus_input_fields_weight',
							style: 'focus_input_fields_style',
							size: 'focus_input_fields_font_size',
							line_height: 'focus_input_fields_line_height',
							color: 'focus_input_fields_color',
							use: 'focus_input_fields_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						prepend: 'focus_',
						fields: {
							use: 'focus_input_fields_use_border',
							width: 'focus_input_fields_border_width',
							type: 'focus_input_fields_border_type',
							color: 'focus_input_fields_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
						max_value: 100,
						prepend: 'focus_',
						fields: {
							use: 'focus_input_fields_use_radius',
							lock: 'focus_input_fields_border_radius_lock',
							radius: 'focus_input_fields_radius',
							radius_number: 'focus_input_fields_radius_number',
							radius1: 'focus_input_fields_border_radius1',
							radius2: 'focus_input_fields_border_radius2',
							radius3: 'focus_input_fields_border_radius3',
							radius4: 'focus_input_fields_border_radius4'
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
						prepend: 'focus_',
						toggle: true,
						abccolors: [
							{
								name: 'focus_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'focus_use_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'button_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_button_font_face',
							fontstyle: 'focus_button_font_style',
							weight: 'focus_button_weight',
							style: 'focus_button_style',
							size: 'focus_button_font_size',
							line_height: 'focus_button_line_height',
							color: 'focus_button_color',
							use: 'focus_button_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						prepend: 'focus_',
						fields: {
							use: 'focus_button_use_border',
							width: 'focus_button_border_width',
							type: 'focus_button_border_type',
							color: 'focus_button_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
						max_value: 100,
						prepend: 'focus_',
						fields: {
							use: 'focus_button_use_radius',
							lock: 'focus_button_border_radius_lock',
							radius: 'focus_button_radius',
							radius_number: 'focus_button_radius_number',
							radius1: 'focus_button_border_radius1',
							radius2: 'focus_button_border_radius2',
							radius3: 'focus_button_border_radius3',
							radius4: 'focus_button_border_radius4'
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
						prepend: 'focus_',
						toggle: true,
						abccolors: [
							{
								name: 'focus_lost_password_text_link_color',
								label: l10n.preset.link_color
							}
						],
						fields: {
							use: 'focus_use_lost_password_text_link_color'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'lost_password_text_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_lost_password_text_font_face',
							fontstyle: 'focus_lost_password_text_font_style',
							weight: 'focus_lost_password_text_weight',
							style: 'focus_lost_password_text_style',
							size: 'focus_lost_password_text_font_size',
							line_height: 'focus_lost_password_text_line_height',
							color: 'focus_lost_password_text_color',
							use: 'focus_lost_password_text_use_typography'
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
						prepend: 'focus_',
						toggle: true,
						abccolors: [
							{
								name: 'focus_login_trigger_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'focus_use_login_trigger_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'login_trigger_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_login_trigger_font_face',
							fontstyle: 'focus_login_trigger_font_style',
							weight: 'focus_login_trigger_weight',
							style: 'focus_login_trigger_style',
							size: 'focus_login_trigger_font_size',
							line_height: 'focus_login_trigger_line_height',
							color: 'focus_login_trigger_color',
							use: 'focus_login_trigger_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						prepend: 'focus_',
						fields: {
							use: 'focus_login_trigger_use_border',
							width: 'focus_login_trigger_border_width',
							type: 'focus_login_trigger_border_type',
							color: 'focus_login_trigger_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
						max_value: 100,
						prepend: 'focus_',
						fields: {
							use: 'focus_login_trigger_use_radius',
							lock: 'focus_login_trigger_border_radius_lock',
							radius: 'focus_login_trigger_radius',
							radius_number: 'focus_login_trigger_radius_number',
							radius1: 'focus_login_trigger_border_radius1',
							radius2: 'focus_login_trigger_border_radius2',
							radius3: 'focus_login_trigger_border_radius3',
							radius4: 'focus_login_trigger_border_radius4'
						}
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
						state: 'logout_link_settings',
						prepend: 'focus_',
						toggle: true,
						abccolors: [
							{
								name: 'focus_logout_link_button_background',
								label: l10n.preset.button_background
							}
						],
						fields: {
							use: 'focus_use_logout_link_button_background'
						}
					}
				},
				{
					moduleType: 'Typography',
					options: {
						state: 'logout_link_settings',
						title: Upfront.Settings.l10n.global.views.typography,
						toggle: true,
						global_typography: false,
						prepend: 'focus_',
						fields: {
							typeface: 'focus_logout_link_font_face',
							fontstyle: 'focus_logout_link_font_style',
							weight: 'focus_logout_link_weight',
							style: 'focus_logout_link_style',
							size: 'focus_logout_link_font_size',
							line_height: 'focus_logout_link_line_height',
							color: 'focus_logout_link_color',
							use: 'focus_logout_link_use_typography'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'logout_link_settings',
						title: '',
						prepend: 'focus_',
						fields: {
							use: 'focus_logout_link_use_border',
							width: 'focus_logout_link_border_width',
							type: 'focus_logout_link_border_type',
							color: 'focus_logout_link_border_color'
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'logout_link_settings',
						max_value: 100,
						prepend: 'focus_',
						fields: {
							use: 'focus_logout_link_use_radius',
							lock: 'focus_logout_link_border_radius_lock',
							radius: 'focus_logout_link_radius',
							radius_number: 'focus_logout_link_radius_number',
							radius1: 'focus_logout_link_border_radius1',
							radius2: 'focus_logout_link_border_radius2',
							radius3: 'focus_logout_link_border_radius3',
							radius4: 'focus_logout_link_border_radius4'
						}
					}
				}
			]
		}
	};

	return LoginPresetSettings;
});
