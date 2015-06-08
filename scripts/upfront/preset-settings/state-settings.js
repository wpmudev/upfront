define(
function() {
	var StateSettings = Upfront.Views.Editor.Settings.Item.extend({
		group: false,

		initialize: function(options) {
			this.options = options || {};

			this.$el.addClass('state_settings state_settings_' + this.options.state.toLowerCase());

			var fields = [];

			_.each(this.options.fields, function(field) {
				var fieldOnChangeCallback = field.options.change;
				var me = this;
				if (fieldOnChangeCallback) {
					// Proxy change callback and tie to this
					field.options.change = function(value) {
						fieldOnChangeCallback(value, me);
					};
				}
				
				field.options.render = function() {
					console.log('asdasd');
				}
								
				var stateField = new field.fieldClass(_.extend({
						model: this.options.model
					}, field.options)
				);
				
				Upfront.Events.once('entity:settings:deactivate', function() {
					// Reset change callback to avoid zombies
					field.options.change = fieldOnChangeCallback;
				});
				
				fields.push(stateField);
			}, this);

			this.fields = _(fields);
		}
	});

	return StateSettings;
});
