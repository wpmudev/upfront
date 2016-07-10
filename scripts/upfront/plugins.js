define([], function() {

	var Plugins = function() {
		var plugins = [];

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
		 * one callback for given callbackId.
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

