define([
	'scripts/upfront/settings/modules-container'
], function(ModulesContainer) {

	var StateSettings = ModulesContainer.extend({
		onInitialize: function(options) {
			if(this.options.state !== "Global") {
				this.$el.addClass('state_modules state_settings state_settings_' + this.options.state.toLowerCase());
			} else {
				this.$el.addClass('state_modules global_modules');
			}
		}
	});

	return StateSettings;
});
