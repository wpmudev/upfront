define(function() {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var ColorsSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'settings_module colors_settings_item clearfix',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state,
				per_row = 'single',
				toggleClass = 'field-no-toggle',
				fields = [];
				
			if(this.options.single !== true) {
				per_row = 'two';
			}	
			// TODO: investigate why theme colors aren't pre-selected??
			_.each(this.options.abccolors, function(color) { 
				if(me.options.toggle === true) {
					toggleClass = 'field-toggle';
				}
				var colorField = new Upfront.Views.Editor.Field.Color({
					className: state + '-color-field upfront-field-wrap-color color-module module-color-field ' + toggleClass + ' ' + per_row,
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
			
			//Add toggle typography checkbox
			if(this.options.toggle === true) {			
				this.group = false;
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						className: 'useColors checkbox-title',
						name: me.options.fields.use,
						label: '',
						default_value: 1,
						multiple: false,
						values: [
							{ label: l10n.color, value: 'yes' }
						],
						change: function(value) {
							me.model.set(me.options.fields.use, value);
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_modules');
							//Toggle color fields
							if(value == "yes") {
								stateSettings.find('.'+ state +'-color-field').show();
							} else {
								stateSettings.find('.'+ state +'-color-field').hide();
							}
						}
					})	
				);
			}
		},
		render: function() {
			var me = this;
			this.constructor.__super__.render.call(this);
			this.fields.each( function (field) {
				if(typeof field.spectrumOptions !== "undefined") {
					var color = me.model.get(field.name);
					field.set_value(color);
					field.update_input_border_color(Upfront.Util.colors.to_color_value(color));
				}
            });
		}
	});

	return ColorsSettingsItem;
});
