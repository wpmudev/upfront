define(function() {
	var ShowStateSettingsButton = Upfront.Views.Editor.Field.Button.extend({
		className: 'state_settings_button',

		initialize: function(options) {
			this.options = options || {};
			this.label = this.options.state;
			this.options.compact = true;
			this.$el.addClass('state_settings_button_' + this.options.state.toLowerCase());
		},

		on_click: function() {
			this.trigger('upfront:presets:state_show', this.options.state.toLowerCase());
		}
	});

	return ShowStateSettingsButton;
});
