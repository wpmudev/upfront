define([
	'elements/upfront-tabs/js/settings/presets-field'
], function(PresetsField) {
	var PresetsItem = Upfront.Views.Editor.Settings.Item.extend({

		initialize: function (opts) {
			this.options = opts;
			var presets = this.get_presets(),
			 me = this;

			this.presetsfield = new PresetsField({
					model: this.model, property: 'currentpreset',
					values: presets,
					change: function() {
						me.$el.trigger('itemselected');
					}
				});

			this.options.fields = _([
				me.presetsfield
			]);

			Upfront.Views.Editor.Settings.Item.prototype.initialize.call(this, this.options);
		},

		get_presets: function () {
			return [];
		},

		get_values: function () {
			return this.fields._wrapped[0].get_value();
		}
	});

	return PresetsItem;
});
