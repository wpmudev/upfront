define([
	'scripts/upfront/settings/module-factory'
],function(ModuleFactory) {
	var ModulesContainer = Backbone.View.extend({
		initialize: function(options) {
			this.options = options || {};

			var modules = [],
				me = this,
				modulesConfig = this.options.modules;

			// Try to get from child class if there is none in options
			if (_.isUndefined(modulesConfig)) modulesConfig = this.modules;

			if (typeof this.getAdditionalModules === 'function') {
				modulesConfig = this.getAdditionalModules(_.clone(modulesConfig));
			}

			// Create modules
			_.each(modulesConfig, function (moduleConfig) {
				moduleConfig.options = moduleConfig.options || {};

				// Proxy the 'change' callback, and revert when finished
				if (("change" in moduleConfig.options)) {
					if (!moduleConfig.options.preservedChangeCallback) {
						// Store the callback
						moduleConfig.options.preservedChangeCallback = moduleConfig.options.change;
					}

					// Proxy the stored callback to provide context
					moduleConfig.options.change = function (value) {
						moduleConfig.options.preservedChangeCallback(value, me);
					};

					// Reset change callback to avoid zombies
					Upfront.Events.once('entity:settings:deactivate', function() {
						moduleConfig.options.change = moduleConfig.options.preservedChangeCallback;
					});
				}

				var module = ModuleFactory.createModule(
					moduleConfig.moduleType, moduleConfig.options || {}, this.options.model
				);

				module.panel = this;
				modules.push(module);
			}, this);

			this.modules = _(modules);

			if (this.onInitialize) this.onInitialize(options);
		},

		render: function () {
			this.$el.html('');
			this.$el.append('<div class="upfront-settings-item-content"></div>');

			var $content = this.$el.find('.upfront-settings-item-content');
			this.modules.each(function(module){
				module.render();
				module.delegateEvents();
				
				// Add option to remove borders
				if(module.options.noborder === true) {
					module.$el.addClass('module_no_border');
				}
				
				$content.append(module.el);
			});
		},

		save_settings: function () {
			if (!this.modules) return;

			var me = this;
			this.modules.each(function (module) {
				if ( module.fields.size() > 0 ) {
					module.save_fields();
				}
			});
		}
	});

	return ModulesContainer;
});
