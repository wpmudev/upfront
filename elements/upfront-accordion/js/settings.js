define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/hov-animation-settings-item',
	'text!elements/upfront-accordion/tpl/preset-style.html'
], function(ElementSettings, PresetManager, Util, TypographySettingsItem, ColorsSettingsItem, BorderSettingsItem, HovAnimationSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var AccordionAppearance = PresetManager.extend({
		mainDataCollection: 'accordionPresets',
		styleElementPrefix: 'accordion-preset',
		ajaxActionSlug: 'accordion',
		panelTitle: l10n.settings,
		styleTpl: styleTpl,
		presetDefaults: {
			'active-font-size': 14,
			'active-font-family': 'Arial',
			'active-font-color': 'rgb(128, 128, 128)',
			'active-header-bg-color': 'rgb(0, 0, 0)',
			'active-content-bg-color': 'rgb(0, 0, 0)',
			'active-triangle-icon-color': 'rgb(255, 255, 255)',
			'static-font-size': 14,
			'static-font-family': 'Arial',
			'static-font-color': 'rgb(96, 96, 96)',
			'static-header-bg-color': 'rgb(0, 0, 0)',
			'static-triangle-icon-color': 'rgb(255, 255, 255)',
			'id': 'default',
			'name': l10n.default_preset
		},
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
								name: 'active-content-bg-color',
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
					toggle: false,
					options: {
						title: 'Colors',
						abccolors: [
							{
								name: 'static-header-bg-color',
								label: 'Header BG'
							},
							{
								name: 'static-triangle-icon-color',
								label: 'Triangle Icon'
							}
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					toggle: false,
					options: {
						state: 'static',
						title: 'Tab Label Typography',
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
						toggle: true,
						fields: {
							use: 'hover-use-colors'
						},
						abccolors: [
							{
								name: 'hover-header-bg-color',
								label: 'Header BG'
							},
							{
								name: 'hover-triangle-icon-color',
								label: 'Triangle Icon'
							}
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						state: 'hover',
						toggle: true,
						title: 'Tab Label Typography',
						fields: {
							use: 'hover-use-typography',
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
						toggle: true,
						fields: {
							use: 'hover-use-animation',
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
						toggle: true,
						fields: {
							use: 'active-use-color'
						},
						abccolors: [
							{
								name: 'active-header-bg-color',
								label: 'Header BG'
							},
							{
								name: 'active-triangle-icon-color',
								label: 'Triangle Icon'
							}
						]
					}
				},
				{
					fieldClass: TypographySettingsItem,
					options: {
						state: 'active',
						toggle: true,
						title: 'Tab Label Typography',
						fields: {
							use: 'active-use-typography',
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
			],
		}
	});

	var AccordionSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new AccordionAppearance({
					model: this.model
				})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},

		get_title: function () {
			return l10n.settings;
		}
	});

	return AccordionSettings;
});