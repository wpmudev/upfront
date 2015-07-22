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
		var l10n = Upfront.Settings.l10n.text_element;

		var AppearancePanel = PresetManager.extend({
			mainDataCollection: 'textPresets',
			styleElementPrefix: 'text-preset',
			ajaxActionSlug: 'tab',
			panelTitle: l10n.settings,
			presetDefaults: {
				'id': 'default',
				'name': l10n.default_preset
			},
			styleTpl: styleTpl,
			stateFields: {
				Global: [
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: 'Colors',
							multiple: false,
							single: true,
							abccolors: [
								{
									name: 'bg_color',
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
								use: 'useborder',
								width: 'border_width',
								type: 'border_style',
								color: 'border_color',
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
								typeface: 'fontface', 
								fontstyle: 'fontstyle',
								weight: 'weight',
								style: 'style',
								size: 'fontsize',
								line_height: 'lineheight',
								color: 'color',
							},
							elements: [
								{ label: l10n.h1, value: "h1" },
								{ label: l10n.h2, value: "h2" },
								{ label: l10n.h3, value: "h3" },
								{ label: l10n.h4, value: "h4" },
								{ label: l10n.h5, value: "h5" },
								{ label: l10n.h6, value: "h6" },
								{ label: l10n.p, value: "p" },
								{ label: l10n.a, value: "a" },
								{ label: l10n.ahover, value: "a:hover" },
								{ label: l10n.ul, value: "ul" },
								{ label: l10n.ol, value: "ol" },
								{ label: l10n.bq, value: "blockquote" },
								{ label: l10n.bqalt, value: "blockquote.upfront-quote-alternative" },
							],
						}
					},	
				]
			}
		});

		return AppearancePanel;
});
