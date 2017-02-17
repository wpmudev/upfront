define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var ToggleSettingsModule = BaseModule.extend({
		className: 'settings_module toggle_settings_item clearfix',
		group: false,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this;
			
			if(this.options.as_field === true) {
				this.className = this.classStyle + ' uf_as_field';
			}

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: me.options.classStyle + ' checkbox-title',
					name: me.options.name,
					label: '',
					default_value: me.options.default_value,
					multiple: false,
					values: [
						{ label: me.options.label, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.name, value);
					},
					show: function(value, $el) {
						var $wrapper = $el.closest('.upfront-settings-post-wrapper');
						
						if(value == "yes") {
							_.each(me.options.fields, function(field) {
								$wrapper.find('.' + field).show();
							});
						} else {
							_.each(me.options.fields, function(field) {
								$wrapper.find('.' + field).hide();
							});
						}
					}
				}),
			]);
		},
	});

	return ToggleSettingsModule;
});
