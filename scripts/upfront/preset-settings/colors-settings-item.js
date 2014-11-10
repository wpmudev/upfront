define(function() {
	var ColorsSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'colors_settings_item clearfix',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				fields = [];

			_.each(this.options.abccolors, function(color) {
				var colorField = new Upfront.Views.Editor.Field.Color({
					blank_alpha : 0,
					model: this.model,
					name: color.name,
					label_style: 'inline',
					label: color.label,
					spectrum: {
						preferredFormat: 'hex',
						change: function(value) {
							me.model.set(color.name, value.toHex());
						},
						move: function(value) {
							me.model.set(color.name, value.toHex());
						}
					}
				});

				fields.push(colorField);
			});

			this.fields = _(fields);
		}
	});

	return ColorsSettingsItem;
});
