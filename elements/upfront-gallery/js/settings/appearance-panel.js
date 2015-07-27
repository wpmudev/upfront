define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/radius-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/selectbox-settings-item',
	'elements/upfront-gallery/js/settings/caption-location',
	'text!elements/upfront-gallery/tpl/preset-style.html'
], function(ElementSettings, PresetManager, BorderSettingsItem, RadiusSettingsItem, ColorsSettingsItem, SelectboxSettingsItem, CaptionLocation, styleTpl) {

	var l10n = Upfront.Settings.l10n.gallery_element;

	var AppearancePanel = PresetManager.extend({
		mainDataCollection: 'galleryPresets',
		styleElementPrefix: 'gallery-preset',
		ajaxActionSlug: 'gallery',
		panelTitle: l10n.settings,
		presetDefaults: {
			'id': 'default',
			'name': l10n.default_preset
		},
		styleTpl: styleTpl,
		stateFields: {
			Global: [
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
					fieldClass: CaptionLocation,
					options: {
						state: 'global',
						fields: {
							caption: 'image-caption'
						}
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
	
	return AppearancePanel;
});
