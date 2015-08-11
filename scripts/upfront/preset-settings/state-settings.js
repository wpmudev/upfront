define([
	'scripts/upfront/settings/modules-container',
	'scripts/upfront/settings/module-factory'
], function(ModulesContainer, ModuleFactory) {

	var StateSettings = ModulesContainer.extend({
		initialize: function(options) {
			this.options = options || {};

			if(this.options.state !== "Global") {
				this.$el.addClass('state_modules state_settings state_settings_' + this.options.state.toLowerCase());
			} else {
				this.$el.addClass('state_modules global_modules');
			}

			var modules = [],
				me = this
			;

			// Proxy the `change` callbacks, and reset as needed
			_.each(this.options.modules, function (module) {
				if (("change" in module.options)) {
					if (!module.options.preserved_preset_change) module.options.preserved_preset_change = module.options.change; // Store the old callback

					// Actually proxy the stored callback and use this as the new one
					module.options.change = function (value) {
						module.options.preserved_preset_change(value, me);
					};
				}

				var stateModule = ModuleFactory.createModule(module.moduleType, module.options, this.options.model);

				Upfront.Events.once('entity:settings:deactivate', function() {
					// Reset change callback to avoid zombies
					module.options.change = module.options.preserved_preset_change;
					//module.options.preserved_preset_change = false;
				});

				modules.push(stateModule);
			}, this);

			this.modules = _(modules);
		}
	});

	return StateSettings;
});
