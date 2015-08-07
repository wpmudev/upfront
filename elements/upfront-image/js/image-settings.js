define([
	'scripts/upfront/preset-settings/util',
	'elements/upfront-image/js/settings/description-panel',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/radius-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/selectbox-settings-item',
	'elements/upfront-image/js/settings/caption-location',
	'text!elements/upfront-image/tpl/preset-style.html'
], function(Util,DescriptionPanel, ElementSettings, PresetManager, BorderSettingsItem, RadiusSettingsItem, ColorsSettingsItem, SelectboxSettingsItem, CaptionLocation, styleTpl) {
	var l10n = Upfront.Settings.l10n.image_element;

	var ImageAppearance = PresetManager.extend({
		mainDataCollection: 'imagePresets',
		styleElementPrefix: 'image-preset',
		ajaxActionSlug: 'image',
		panelTitle: l10n.settings,
		presetDefaults: {
			'image-style': 'default',
			'useradius': '',
			'borderradiuslock': 'yes',
			'borderradius1': 0,
			'borderradius2': 0,
			'borderradius3': 0,
			'borderradius4': 0,
			'useborder': '',
			'bordertype': 'solid',
			'borderwidth': 4,
			'bordercolor': 'rgb(0, 0, 0)',
			'caption-text': 'rgb(0, 0, 0)',
			'caption-bg': 'rgb(255, 255, 255)',
			'use_captions': '',
			'caption-position-value': 'nocaption',
			'caption-trigger': 'hover_show',
			'id': 'default',
			'name': l10n.default_preset
		},
		styleTpl: styleTpl,
		stateFields: {
			Global: [
				{
					//TODO: We should add values when provided
					fieldClass: SelectboxSettingsItem,
					options: {
						state: 'global',
						default_value: 'default',
						title: l10n.settings.image_style_label,
						custom_class: 'image_style',
						label: l10n.settings.image_style_info,
						fields: {
							name: 'image-style'
						},
						values: [
							{ label: "Default", value: 'default', icon: 'contact-above-field' },
						]
					}
				},
				{
					fieldClass: CaptionLocation,
					options: {
						state: 'global',
						fields: {
							caption: 'image-caption'
						}
					}
				},
				{
					fieldClass: RadiusSettingsItem,
					options: {
						state: 'global',
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
					fieldClass: ColorsSettingsItem,
					options: {
						title: l10n.settings.content_area_colors_label,
						multiple: false,
						single: false,
						abccolors: [
							{
								name: 'caption-text',
								label: l10n.settings.caption_text_label
							},
							{
								name: 'caption-bg',
								label: l10n.settings.caption_bg_label
							},
						]
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'global',
						title: '',
						fields: {
							use: 'useborder',
							width: 'borderwidth',
							type: 'bordertype',
							color: 'bordercolor',
						}
					}
				}
			]
		}
	});

	var ImageSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new ImageAppearance({
					model: this.model
				}),
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
	Util.generatePresetsToPage('image', styleTpl);

	return ImageSettings;
});
