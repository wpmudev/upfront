(function ($) {
define([
	'scripts/upfront/element-settings/settings-container',
	'scripts/upfront/element-settings/root-panel-mixin',
	'scripts/upfront/settings/field-factory',
	'scripts/upfront/settings/module-factory'
], function (SettingsContainer, RootPanelMixin, FieldFactory, ModuleFactory) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var RootSettingsPanel = SettingsContainer.extend(_.extend({}, RootPanelMixin, {
		initialize: function (options) {
			var pluginLayout = Upfront.Application.is_plugin_layout();
			if (pluginLayout) {
				return;
			}
			var me = this,
				settings = [];

			this.options = options;
			this.settings = _(this.settings);

			this.settings.each(function(settingOptions){
				var setting;
				if (settingOptions.type === 'SettingsItem') {
					setting = new Upfront.Views.Editor.Settings.Item({
						title: settingOptions.title,
						model: me.model,
						className: settingOptions.className,
						fields: []
					});
				} else {
					setting = ModuleFactory.createModule(
						settingOptions.type, settingOptions || {}, me.model
					);
				}

				if(settingOptions.identifier) {
					// Use for selecting settings instead crawling DOM
					setting.identifier = settingOptions.identifier;
				}

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
					if ("show" in fieldOptions) {
						if (!fieldOptions.preservedShowCallback) {
							// Store the callback
							fieldOptions.preservedShowCallback = fieldOptions.show;
						}

						// Proxy the stored callback to provide context
						fieldOptions.show = function (value) {
							fieldOptions.preservedShowCallback(value, me);
						};

						// Reset show callback to avoid zombies
						Upfront.Events.once('entity:settings:deactivate', function() {
							fieldOptions.show = fieldOptions.preservedShowCallback;
						});
					}

					field = FieldFactory.createField(fieldOptions.type, _.extend({ model: me.model }, _.omit(fieldOptions, ['type'])));

					if (settingOptions.triggerChange) {
						me.listenTo(field, 'change changed', function() {
							me.save_settings();
							me.model.trigger('change', me.model);
						});
					}

					if(fieldOptions.identifier) {
						// Use for selecting field instead crawling DOM
						field.identifier = fieldOptions.identifier;
					}

					setting.fields.push(field);
				});
				setting.panel = me;
				setting.trigger('panel:set');

				settings.push(setting);
			});

			this.settings = _(settings);
		},

		getBody: function () {
			var $body = $('<div />'),
				me = this;

			// This would probably be better to handle on case by case basis in implementations
			// depending on how specs go about this
			var pluginLayout = Upfront.Application.is_plugin_layout();
			if (pluginLayout) {
				$body.append('<div>This content is handled by ' + pluginLayout.pluginName + '.</div>');
				return $body;
			}

			this.settings.each(function (setting) {
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				$body.append(setting.el);
			});

			return $body;
		}
	}));

	return RootSettingsPanel;
});
})(jQuery);
