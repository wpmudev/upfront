(function ($) {
define([
	'scripts/upfront/element-settings/settings-container',
	'scripts/upfront/element-settings/root-panel-mixin',
	'scripts/upfront/settings/field-factory'
], function (SettingsContainer, RootPanelMixin, FieldFactory) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var RootSettingsPanel = SettingsContainer.extend(_.extend({}, RootPanelMixin, {
		initialize: function (options) {
			var me = this,
				settings = [];

			this.options = options;
			this.settings = _(this.settings);

			this.settings.each(function(settingOptions){
				var setting = new Upfront.Views.Editor.Settings.Item({
					title: settingOptions.title,
					model: me.model,
					fields: []
				});

				if (settingOptions.className) setting.className = settingOptions.className;

				_.each(settingOptions.fields, function(fieldOptions) {
					var field;

					// Proxy the 'change' callback, and revert when finished
					if ("change" in fieldOptions) {
						if (!fieldOptions.preservedChangeCallback) {
							// Store the callback
							fieldOptions.preservedChangeCallback = fieldOptions.change;
						}

						// Proxy the stored callback to provide context
						fieldOptions.change = function (value) {
							fieldOptions.preservedChangeCallback(value, me);
						};

						// Reset change callback to avoid zombies
						Upfront.Events.once('entity:settings:deactivate', function() {
							fieldOptions.change = fieldOptions.preservedChangeCallback;
						});
					}

					field = FieldFactory.createField(fieldOptions.type, _.extend({ model: me.model }, _.omit(fieldOptions, ['type'])));

					setting.fields.push(field);
				});
				setting.panel = me;
				setting.trigger('panel:set');

				settings.push(setting);
			});

			this.settings = _(settings);
		},

		getBody: function () {
			var $body = $('<div />');

			this.settings.each(function (setting) {
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				$body.append(setting.el)
			});

			return $body;
		}
	}));

	return RootSettingsPanel;
});
})(jQuery);
