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
				per_row = 'single';
				fields = [];
				
			if(this.options.single !== true) {
				per_row = 'two';
			}	
			// TODO: investigate why theme colors aren't pre-selected??
			_.each(this.options.abccolors, function(color) {
				var colorField = new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap-color color-module module-color-field ' + per_row,
					blank_alpha : 0,
					model: this.model,
					name: color.name,
					label_style: 'inline',
					label: color.label,
					spectrum: {
						preferredFormat: 'hex',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(color.name, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(color.name, c);
						}
					}
				});
				fields.push(colorField);
			});

			this.fields = _(fields);
		},
		render: function() {
			var me = this;
			this.constructor.__super__.render.call(this);
			
			this.fields.each( function (field) {
				var color = me.model.get(field.name);
				field.set_value(color);
                field.update_input_border_color(Upfront.Util.colors.to_color_value(color));
            });
		}
	});

	return ColorsSettingsItem;
});
