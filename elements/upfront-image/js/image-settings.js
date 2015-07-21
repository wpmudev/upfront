define([
	'elements/upfront-image/js/settings/description-panel',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/radius-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/selectbox-settings-item',
	'elements/upfront-image/js/settings/caption-location',
	'text!elements/upfront-image/tpl/preset-style.html'
], function(DescriptionPanel, ElementSettings, PresetManager, BorderSettingsItem, RadiusSettingsItem, ColorsSettingsItem, SelectboxSettingsItem, CaptionLocation, styleTpl) {
	var l10n = Upfront.Settings.l10n.image_element;

	var ImageAppearance = PresetManager.extend({
		mainDataCollection: 'imagePresets',
		styleElementPrefix: 'image-preset',
		ajaxActionSlug: 'image',
		panelTitle: l10n.settings,
		presetDefaults: {
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
						title: 'Image Style',
						custom_class: 'image_style',
						label: 'Image Element Shape:',
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
						title: 'Content Area Colors',
						multiple: false,
						single: false,
						abccolors: [
							{
								name: 'caption-text',
								label: 'Captiong Text'
							},
							{
								name: 'caption-bg',
								label: 'Captiong BG'
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
				new DescriptionPanel({model: this.model})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},
		get_title: function () {
			return l10n.settings.label;
		}
	});

	return ImageSettings;
});
