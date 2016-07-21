/*
* Field names properies
* `name` - Select box name
*/
define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var SelectboxSettingsModule = BaseModule.extend({
		className: 'settings_module selectbox_settings_item clearfix',
		group: true,
		get_title: function() {
			return this.options.title;
		},
		initialize: function(options) {
			this.options = options || {};

			if(typeof this.options.title === "undefined") {
				this.group = false;
			}

			var me = this,
				custom_class = this.options.custom_class,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module ' + custom_class,
					name: me.options.fields.name,
					default_value: me.options.default_value,
					label: me.options.label,
					values: me.options.values,
					change: function(value) {
						me.model.set(me.options.fields.name, value);
					}
				})
			]);
		}
	});

	return SelectboxSettingsModule;
});
