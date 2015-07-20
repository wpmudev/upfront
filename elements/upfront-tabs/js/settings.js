define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/hov-animation-settings-item',
	'text!elements/upfront-tabs/tpl/preset-style.html'
], function(ElementSettings, PresetManager, Util, TypographySettingsItem, ColorsSettingsItem, BorderSettingsItem, HovAnimationSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var TabsAppearance = PresetManager.extend({
		mainDataCollection: 'tabPresets',
		styleElementPrefix: 'tab-preset',
		ajaxActionSlug: 'tab',
		panelTitle: l10n.settings,
		presetDefaults: {
			'active-font-size': 14,
			'active-font-family': 'Arial',
			'active-font-color': 'rgb(128, 128, 128)',
			'hover-font-size': 14,
			'hover-font-family': 'Arial',
			'hover-font-color': 'rgb(0, 0, 0)',
			'hover-transition-duration': 0.3,
			'hover-transition-easing': 'ease-in-out',
			'static-font-size': 14,
			'static-font-family': 'Arial',
			'static-font-color': 'rgb(0, 0, 0)',
			'id': 'default',
			'name': l10n.default_preset
		},
		styleTpl: styleTpl,
		stateFields: {
			Global: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Content Area Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'global-content-bg',
								label: 'Content Area BG'
							},
						]
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'static',
						title: '',
						fields: {
							use: 'global-useborder',
							width: 'global-borderwidth',
							type: 'global-bordertype',
							color: 'global-bordercolor',
						}
					}
				}
			],
			Static: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'static-tab-bg',
								label: 'Tab Background'
							},
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						title: 'Tab Label Typography',
						state: 'static',
						fields: {
							typeface: 'static-font-family',
							fontstyle: 'static-font-style',
							weight: 'static-weight',
							style: 'static-style',
							size: 'static-font-size',
							line_height: 'static-line-height',
							color: 'static-font-color',
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'static',
						title: '',
						fields: {
							use: 'static-useborder',
							width: 'static-borderwidth',
							type: 'static-bordertype',
							color: 'static-bordercolor',
						}
					}
				}
			],

			Hover: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'hover-tab-bg',
								label: 'Tab Background'
							},
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						title: 'Tab Label Typography',
						state: 'hover',
						fields: {
							typeface: 'hover-font-family',
							fontstyle: 'hover-font-style',
							weight: 'hover-weight',
							style: 'hover-style',
							size: 'hover-font-size',
							line_height: 'hover-line-height',
							color: 'hover-font-color',
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'hover',
						title: '',
						fields: {
							use: 'hover-useborder',
							width: 'hover-borderwidth',
							type: 'hover-bordertype',
							color: 'hover-bordercolor',
						}
					}
				},
				{
					fieldClass: HovAnimationSettingsItem,
					options: {
						state: 'hover',
						title: '',
						fields: {
							duration: 'hover-transition-duration',
							easing: 'hover-transition-easing',
						}
					}
				}
			],

			Active: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: true,
						abccolors: [
							{
								name: 'active-tab-bg',
								label: 'Tab Background'
							},
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						title: 'Tab Label Typography',
						state: 'active',
						fields: {
							typeface: 'active-font-family',
							fontstyle: 'active-font-style',
							weight: 'active-weight',
							style: 'active-style',
							size: 'active-font-size',
							line_height: 'active-line-height',
							color: 'active-font-color',
						}
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'active',
						title: '',
						fields: {
							use: 'active-useborder',
							width: 'active-borderwidth',
							type: 'active-bordertype',
							color: 'active-bordercolor',
						}
					}
				}
			]
		}
	});

	var TabsSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new TabsAppearance({
					model: this.model
				})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},

		get_title: function () {
			return 'Tabs Settings';
		}
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('tab', styleTpl);

	return TabsSettings;
});
