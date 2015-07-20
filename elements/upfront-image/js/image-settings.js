define([
	'elements/upfront-image/js/settings/description-panel',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/border-settings-item',
	'text!elements/upfront-image/tpl/preset-style.html'
], function(DescriptionPanel, ElementSettings, PresetManager, BorderSettingsItem, styleTpl) {
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
