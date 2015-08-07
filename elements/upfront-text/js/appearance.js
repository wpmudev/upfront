define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'text!elements/upfront-text/tpl/preset-style.html'
], function(ElementSettings, PresetManager, Util, TypographySettingsItem, ColorsSettingsItem, BorderSettingsItem, styleTpl) {
		var l10n = Upfront.Settings.l10n.text_element;

		var AppearancePanel = PresetManager.extend({
			mainDataCollection: 'textPresets',
			styleElementPrefix: 'text-preset',
			ajaxActionSlug: 'text',
			panelTitle: l10n.settings,
			presetDefaults: {
				'id': 'default',
				'name': l10n.default_preset,
				'bg_color': 'rgb(0, 0, 0)',
				'useborder': '',
				'border_width': 1,
				'border_style': 'solid',
				'border_color': 'rgb(0, 0, 0)',
				'fontface': 'Arial', 
				'fontstyle': '400 normal',
				'weight': '400',
				'style': 'normal',
				'fontsize': 14,
				'lineheight': 1,
				'color': 'rgb(0, 0, 0)',
			},
			styleTpl: styleTpl,
			stateFields: {
				Global: [
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: l10n.settings.colors_label,
							multiple: false,
							single: true,
							abccolors: [
								{
									name: 'bg_color',
									label: l10n.settings.content_area_bg
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
							title: l10n.settings.typography_label,
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
		
		// Generate presets styles to page
		Util.generatePresetsToPage('text', styleTpl);

		return AppearancePanel;
});
