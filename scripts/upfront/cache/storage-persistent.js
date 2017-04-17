;define([
	'scripts/upfront/cache/storage-memory'
], function (Memory) {

	return _.extend({}, Memory, {

		/**
		 * Storage object getter
		 *
		 * Placeholder for future sessionStorage implementation
		 *
		 * @return {Object} Internal storage representation
		 */
		get_storage: function () {
			return JSON.parse(sessionStorage.getItem('_upfront_cache') || '{}')
		},

		/**
		 * Storage object setter
		 *
		 * Placeholder for future sessionStorage implementation
		 *
		 * @return {Boolean} Status
		 */
		set_storage: function (obj) {
			return sessionStorage.setItem('_upfront_cache', JSON.stringify(obj));
		}
	});
});
