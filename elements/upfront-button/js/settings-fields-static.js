define(function() {
	var l10n = Upfront.Settings.l10n.button_element;
	
	var FieldSeparator = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	//Create new field type Heading
	var FieldHeading = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});
	
	var ButtonSettingsStatic = Upfront.Views.Editor.Settings.Item.extend({
		className: 'button_settings_static',
		group: false,

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state;		
			
			this.fields = _([

				new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color backgroundColor sp-cf',
					model: this.model,
					name: 'bgcolor',
					blank_alpha : 0,
					label: l10n.bg_color,
					default_value: '#ccc',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bgcolor', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bgcolor', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator separator-background',
					name: 'presetseparator'
				}),
				
			]);
		}
	});

	return ButtonSettingsStatic;
});