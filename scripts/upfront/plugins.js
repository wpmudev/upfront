define([], function() {

	var Plugins = function() {
		var plugins = [];

		/*
		 * Adds plugin.
		 *
		 * Plugin is added in following form:
		 *
		 * Upfront.plugins.addPlugin({
		 *   name: 'Plugin Name', // not required
		 *   forbidden: [], // array of actions that is forbidden by plugin
		 *   required: [], // array of actions that are required by plugin
		 *   callbacks: {
		 *    'callback-name': function(parameters) {
		 *      // use parameters to do something
		 *      // return value if needed
		 *    }
		 *   }
		 * });
		 *
		 * forbidden and required actions and callback names are defined in various points
		 * in Upfront execution, so it gives plugins ability to prevent or enforce some actions
		 * or to provide custom functionality.
		 *
		 * @params plugin - Object - described above
		 */
		this.addPlugin = function(plugin) {
			plugins.push(plugin);
		};

		this.isRequiredByPlugin = function(condition) {
			var result = false;
			for (var i = 0; i < plugins.length; i++) {
				if (plugins[i].required && _.indexOf(plugins[i].required, condition) > -1) result = true;
				break;
			}

			return result;
		};

		this.isForbiddenByPlugin = function(condition) {
			var result = false;
			for (var i = 0; i < plugins.length; i++) {
				if (plugins[i].forbidden && _.indexOf(plugins[i].forbidden, condition) > -1) result = true;
				break;
			}

			return result;
		};

		/**
		 * Allows Upfront to call callbacks defined by plugins. Will call only
		 * one callback for given callbackId. It will provide in return value
		 * information if any callback was called and result if any is available.
		 *
		 * @param callbackId - string
		 * @param parameters - Object
		 *
		 * @return Object - keys: status - either 'called' either 'none'
		 *                        result - result of the called callback
		 */
		this.call = function(callbackId, parameters) {
			for (var i = 0; i < plugins.length; i++) {
				if (plugins[i].callbacks[callbackId]) {
					return {
						"status": 'called',
						result: plugins[i].callbacks[callbackId](parameters)
					};
				}
			}

			return {
				"status": 'none'
			};
		};
	};

	return Plugins;
});
