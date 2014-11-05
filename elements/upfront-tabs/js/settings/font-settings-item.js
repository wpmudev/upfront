define(function() {
	var FontSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'font_settings_item',
		group: false,

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Number({
					className: 'font-size',
					model: this.model,
					name: state + '-font-size',
					min: 8,
					suffix: 'px',
					label: 'Tab Trigger Font:',
					change: function(value) {
						me.model.set(state + '-font-size', value);
					}
				}),

				new Upfront.Views.Editor.Field.Select({
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					model: this.model,
					name: state + '-font-family',
					label_style: 'inline',
					className: 'font-face',
					change: function(value) {
						me.model.set(state + '-font-family', value);
					}
				}),

				new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf font-color',
					blank_alpha : 0,
					model: this.model,
					name: state + '-font-color',
					label_style: 'inline',
					label: '',
					spectrum: {
						preferredFormat: 'hex',
						change: function(value) {
							me.model.set(state + '-font-color', value.toHex());
						},
						move: function(value) {
							me.model.set(state + '-font-color', value.toHex());
						}
					}
				})
			]);
		}
	});

	return FontSettingsItem;
});
