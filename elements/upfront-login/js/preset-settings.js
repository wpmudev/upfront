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
							{ label: l10n.preset.logout_link, value: 'logout_link' },
						]
					}
				},
				{
					moduleType: 'Colors',
					options: {
						title: '',
						multiple: false,
						single: true,
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
							color: 'form_wrapper_border_color',
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
							color: 'input_fields_border_color',
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
							color: 'button_border_color',
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
							color: 'login_trigger_border_color',
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
							color: 'logout_link_border_color',
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
							typeface: 'field_labels_font_face_hover',
							fontstyle: 'field_labels_font_style_hover',
							weight: 'field_labels_weight_hover',
							style: 'field_labels_style_hover',
							size: 'field_labels_font_size_hover',
							line_height: 'field_labels_line_height_hover',
							color: 'field_labels_color_hover',
							use: 'field_labels_use_typography_hover'
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
								name: 'input_fields_background_hover',
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
							typeface: 'input_fields_font_face_hover',
							fontstyle: 'input_fields_font_style_hover',
							weight: 'input_fields_weight_hover',
							style: 'input_fields_style_hover',
							size: 'input_fields_font_size_hover',
							line_height: 'input_fields_line_height_hover',
							color: 'input_fields_color_hover',
							use: 'input_fields_use_typography_hover'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'input_fields_use_border_hover',
							width: 'input_fields_border_width_hover',
							type: 'input_fields_border_type_hover',
							color: 'input_fields_border_color_hover',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
						max_value: 100,
						fields: {
							use: 'input_fields_use_radius_hover',
							lock: 'input_fields_border_radius_lock_hover',
							radius: 'input_fields_radius_hover',
							radius_number: 'input_fields_radius_number_hover',
							radius1: 'input_fields_border_radius1_hover',
							radius2: 'input_fields_border_radius2_hover',
							radius3: 'input_fields_border_radius3_hover',
							radius4: 'input_fields_border_radius4_hover'
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
								name: 'button_background_hover',
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
							typeface: 'button_font_face_hover',
							fontstyle: 'button_font_style_hover',
							weight: 'button_weight_hover',
							style: 'button_style_hover',
							size: 'button_font_size_hover',
							line_height: 'button_line_height_hover',
							color: 'button_color_hover',
							use: 'button_use_typography_hover'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'button_use_border_hover',
							width: 'button_border_width_hover',
							type: 'button_border_type_hover',
							color: 'button_border_color_hover',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
						max_value: 100,
						fields: {
							use: 'button_use_radius_hover',
							lock: 'button_border_radius_lock_hover',
							radius: 'button_radius_hover',
							radius_number: 'button_radius_number_hover',
							radius1: 'button_border_radius1_hover',
							radius2: 'button_border_radius2_hover',
							radius3: 'button_border_radius3_hover',
							radius4: 'button_border_radius4_hover'
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
								name: 'lost_password_text_link_color_hover',
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
							typeface: 'lost_password_text_font_face_hover',
							fontstyle: 'lost_password_text_font_style_hover',
							weight: 'lost_password_text_weight_hover',
							style: 'lost_password_text_style_hover',
							size: 'lost_password_text_font_size_hover',
							line_height: 'lost_password_text_line_height_hover',
							color: 'lost_password_text_color_hover',
							use: 'lost_password_text_use_typography_hover'
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
								name: 'login_trigger_button_background_hover',
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
							typeface: 'login_trigger_font_face_hover',
							fontstyle: 'login_trigger_font_style_hover',
							weight: 'login_trigger_weight_hover',
							style: 'login_trigger_style_hover',
							size: 'login_trigger_font_size_hover',
							line_height: 'login_trigger_line_height_hover',
							color: 'login_trigger_color_hover',
							use: 'login_trigger_use_typography_hover'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'login_trigger_use_border_hover',
							width: 'login_trigger_border_width_hover',
							type: 'login_trigger_border_type_hover',
							color: 'login_trigger_border_color_hover',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
						max_value: 100,
						fields: {
							use: 'login_trigger_use_radius_hover',
							lock: 'login_trigger_border_radius_lock_hover',
							radius: 'login_trigger_radius_hover',
							radius_number: 'login_trigger_radius_number_hover',
							radius1: 'login_trigger_border_radius1_hover',
							radius2: 'login_trigger_border_radius2_hover',
							radius3: 'login_trigger_border_radius3_hover',
							radius4: 'login_trigger_border_radius4_hover'
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
						abccolors: [
							{
								name: 'logout_link_button_background_hover',
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
							typeface: 'logout_link_font_face_hover',
							fontstyle: 'logout_link_font_style_hover',
							weight: 'logout_link_weight_hover',
							style: 'logout_link_style_hover',
							size: 'logout_link_font_size_hover',
							line_height: 'logout_link_line_height_hover',
							color: 'logout_link_color_hover',
							use: 'logout_link_use_typography_hover'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'logout_link_settings',
						title: '',
						fields: {
							use: 'logout_link_use_border_hover',
							width: 'logout_link_border_width_hover',
							type: 'logout_link_border_type_hover',
							color: 'logout_link_border_color_hover',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'logout_link_settings',
						max_value: 100,
						fields: {
							use: 'logout_link_use_radius_hover',
							lock: 'logout_link_border_radius_lock_hover',
							radius: 'logout_link_radius_hover',
							radius_number: 'logout_link_radius_number_hover',
							radius1: 'logout_link_border_radius1_hover',
							radius2: 'logout_link_border_radius2_hover',
							radius3: 'logout_link_border_radius3_hover',
							radius4: 'logout_link_border_radius4_hover'
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
							typeface: 'field_labels_font_face_focus',
							fontstyle: 'field_labels_font_style_focus',
							weight: 'field_labels_weight_focus',
							style: 'field_labels_style_focus',
							size: 'field_labels_font_size_focus',
							line_height: 'field_labels_line_height_focus',
							color: 'field_labels_color_focus',
							use: 'field_labels_use_typography_focus'
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
								name: 'input_fields_background_focus',
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
							typeface: 'input_fields_font_face_focus',
							fontstyle: 'input_fields_font_style_focus',
							weight: 'input_fields_weight_focus',
							style: 'input_fields_style_focus',
							size: 'input_fields_font_size_focus',
							line_height: 'input_fields_line_height_focus',
							color: 'input_fields_color_focus',
							use: 'input_fields_use_typography_focus'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'input_fields_settings',
						title: '',
						fields: {
							use: 'input_fields_use_border_focus',
							width: 'input_fields_border_width_focus',
							type: 'input_fields_border_type_focus',
							color: 'input_fields_border_color_focus',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'input_fields_settings',
						max_value: 100,
						fields: {
							use: 'input_fields_use_radius_focus',
							lock: 'input_fields_border_radius_lock_focus',
							radius: 'input_fields_radius_focus',
							radius_number: 'input_fields_radius_number_focus',
							radius1: 'input_fields_border_radius1_focus',
							radius2: 'input_fields_border_radius2_focus',
							radius3: 'input_fields_border_radius3_focus',
							radius4: 'input_fields_border_radius4_focus'
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
								name: 'button_background_focus',
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
							typeface: 'button_font_face_focus',
							fontstyle: 'button_font_style_focus',
							weight: 'button_weight_focus',
							style: 'button_style_focus',
							size: 'button_font_size_focus',
							line_height: 'button_line_height_focus',
							color: 'button_color_focus',
							use: 'button_use_typography_focus'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'button_settings',
						title: '',
						fields: {
							use: 'button_use_border_focus',
							width: 'button_border_width_focus',
							type: 'button_border_type_focus',
							color: 'button_border_color_focus',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'button_settings',
						max_value: 100,
						fields: {
							use: 'button_use_radius_focus',
							lock: 'button_border_radius_lock_focus',
							radius: 'button_radius_focus',
							radius_number: 'button_radius_number_focus',
							radius1: 'button_border_radius1_focus',
							radius2: 'button_border_radius2_focus',
							radius3: 'button_border_radius3_focus',
							radius4: 'button_border_radius4_focus'
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
								name: 'lost_password_text_link_color_focus',
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
							typeface: 'lost_password_text_font_face_focus',
							fontstyle: 'lost_password_text_font_style_focus',
							weight: 'lost_password_text_weight_focus',
							style: 'lost_password_text_style_focus',
							size: 'lost_password_text_font_size_focus',
							line_height: 'lost_password_text_line_height_focus',
							color: 'lost_password_text_color_focus',
							use: 'lost_password_text_use_typography_focus'
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
								name: 'login_trigger_button_background_focus',
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
							typeface: 'login_trigger_font_face_focus',
							fontstyle: 'login_trigger_font_style_focus',
							weight: 'login_trigger_weight_focus',
							style: 'login_trigger_style_focus',
							size: 'login_trigger_font_size_focus',
							line_height: 'login_trigger_line_height_focus',
							color: 'login_trigger_color_focus',
							use: 'login_trigger_use_typography_focus'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'login_trigger_settings',
						title: '',
						fields: {
							use: 'login_trigger_use_border_focus',
							width: 'login_trigger_border_width_focus',
							type: 'login_trigger_border_type_focus',
							color: 'login_trigger_border_color_focus',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'login_trigger_settings',
						max_value: 100,
						fields: {
							use: 'login_trigger_use_radius_focus',
							lock: 'login_trigger_border_radius_lock_focus',
							radius: 'login_trigger_radius_focus',
							radius_number: 'login_trigger_radius_number_focus',
							radius1: 'login_trigger_border_radius1_focus',
							radius2: 'login_trigger_border_radius2_focus',
							radius3: 'login_trigger_border_radius3_focus',
							radius4: 'login_trigger_border_radius4_focus'
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
						abccolors: [
							{
								name: 'logout_link_button_background_focus',
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
							typeface: 'logout_link_font_face_focus',
							fontstyle: 'logout_link_font_style_focus',
							weight: 'logout_link_weight_focus',
							style: 'logout_link_style_focus',
							size: 'logout_link_font_size_focus',
							line_height: 'logout_link_line_height_focus',
							color: 'logout_link_color_focus',
							use: 'logout_link_use_typography_focus'
						}
					}
				},
				{
					moduleType: 'Border',
					options: {
						state: 'logout_link_settings',
						title: '',
						fields: {
							use: 'logout_link_use_border_focus',
							width: 'logout_link_border_width_focus',
							type: 'logout_link_border_type_focus',
							color: 'logout_link_border_color_focus',
						}
					}
				},
				{
					moduleType: 'Radius',
					options: {
						state: 'logout_link_settings',
						max_value: 100,
						fields: {
							use: 'logout_link_use_radius_focus',
							lock: 'logout_link_border_radius_lock_focus',
							radius: 'logout_link_radius_focus',
							radius_number: 'logout_link_radius_number_focus',
							radius1: 'logout_link_border_radius1_focus',
							radius2: 'logout_link_border_radius2_focus',
							radius3: 'logout_link_border_radius3_focus',
							radius4: 'logout_link_border_radius4_focus'
						}
					}
				},
			]
		}
	};

	return LoginPresetSettings;
});
