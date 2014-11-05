define(function() {
	var NewPresetItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'or_divider',

		initialize: function(options) {
			this.options = options || {};

			var me = this;

			this.newPresetName = new Upfront.Views.Editor.Field.Text({
				model: this.model,
				compact: true,
				className: 'new_preset_name'
			});

			this.fields = _([
				this.newPresetName,
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: 'New Preset',
					className: 'new_preset',
					compact: true,
					on_click: function() {
						if (me.newPresetName.get_value().trim() === '') {
							alert('Preset name can not be empty.');
							return;
						}
						if (me.newPresetName.get_value().match(/[^A-Za-z0-9 ]/)) {
							alert('Preset name can contain only numbers, letters and spaces.');
							return;
						}
						me.trigger('upfront:presets:new', me.newPresetName.get_value().trim());
					}
				})
			]);
		},

		get_title: function() {
			return 'Or';
		}
	});

		return NewPresetItem;
});
