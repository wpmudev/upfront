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
						preferredFormat: 'rgb',
						change: function(value) {
							me.model.set(color.name, value.toRgbString());
						},
						move: function(value) {
							me.model.set(color.name, value.toRgbString());
						}
					}
				});
				//colorField.update_input_border_color('rgb(180, 83, 83)')
				fields.push(colorField);
				//console.log('this is happening');

				//colorField.update_input_border_color('rgb(180, 83, 83)');
			});

			this.fields = _(fields);
		},
		render: function() {
			var me = this;
			this.constructor.__super__.render.call(this);
			//console.log(this.model.get('active-header-bg-color'));

			this.fields.each( function (field) {
				//console.log(field.name);
                field.update_input_border_color(me.model.get(field.name));
            });
		}
	});

	return ColorsSettingsItem;
});
