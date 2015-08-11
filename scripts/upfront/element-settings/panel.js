(function ($) {
define([
	'scripts/upfront/element-settings/root-panel',
	'scripts/upfront/settings/fields/slides'
], function (RootPanel, SlidesField) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var ElementSettingsPanel = RootPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel upfront-settings_panel_wrap',
		getTitle: function () {
			var title = this.options.title ? this.options.title : this.title;
			title = title ? title : 'Element Settings Panel';
			return title;
		},

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
					var field = me.getField(fieldOptions.type, _.extend({ model: me.model }, _.omit(fieldOptions, ['type'])));

					setting.fields.push(field);
				});
				setting.panel = me;
				setting.trigger('panel:set');

				settings.push(setting);
			});

			this.settings = _(settings);
		},

		getField: function(type, options) {
			var fieldClasses = {
				'SlidesField': SlidesField
			};
			var fieldClass = Upfront.Views.Editor.Field[type];
			if (_.isUndefined(fieldClass)) {
				fieldClass = fieldClasses[type];
			}
			return new fieldClass(options);
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
	});

	return ElementSettingsPanel;
});
})(jQuery);
