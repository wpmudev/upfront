define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/selectbox-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'text!elements/upfront-slider/tpl/preset-style.html'
], function(ElementSettings, PresetManager, Util, SelectboxSettingsItem, ColorsSettingsItem, styleTpl) {
		var l10n = Upfront.Settings.l10n.slider_element;

		var AppearancePanel = PresetManager.extend({
			mainDataCollection: 'sliderPresets',
			styleElementPrefix: 'slider-preset',
			ajaxActionSlug: 'slider',
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
							default_value: 'notext',
							title: l10n.slider_styles,
							custom_class: 'slide_style',
							label: l10n.image_caption_position,
							fields: {
								name: 'primaryStyle'
							},
							values: [
								{ label: l10n.notxt, value: 'notext', icon: 'nocaption' },
								{ label: l10n.txtb, value: 'below', icon: 'below' },
								{ label: l10n.txto, value: 'over', icon: 'bottomOver' },
								{ label: l10n.txts, value: 'side', icon: 'right' }/*,
								{ label: "txt / widget only", value: 'onlytext', icon: 'textonly' }*/
							]
						}
					},
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: 'Colors',
							multiple: false,
							single: true,
							abccolors: [
								{
									name: 'captionBackground',
									label: 'Caption BG'
								},
							]
						}
					},
				]
			}
		});

		return AppearancePanel;
});
