define(
function() {
	var StateSettings = Upfront.Views.Editor.Settings.Item.extend({
		group: false,

		initialize: function(options) {
			this.options = options || {};

			this.$el.addClass('state_settings state_settings_' + this.options.state.toLowerCase());

			var fields = [],
				me = this
			;

			// Proxy the `change` callbacks, and reset as needed
			_.each(this.options.fields, function (field) {
				if (!("change" in field.options)) return true; // Nothing to do here
				if (!field.options.preserved_preset_change) field.options.preserved_preset_change = field.options.change; // Store the old callback

				// Actually proxy the stored callback and use this as the new one
				field.options.change = function (value) {
					field.options.preserved_preset_change(value, me);
				};

				var stateField = new field.fieldClass(_.extend({
						model: this.options.model
					}, field.options)
				);
				
				Upfront.Events.once('entity:settings:deactivate', function() {
					// Reset change callback to avoid zombies
					field.options.change = field.options.preserved_preset_change;
					field.options.preserved_preset_change = false;
				});

				fields.push(stateField);
			}, this);

			this.fields = _(fields);
		}
	});

	return StateSettings;
});
