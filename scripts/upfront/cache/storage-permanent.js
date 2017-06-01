;define([
	'scripts/upfront/cache/storage-stub'
], function (Stub) {

	/**
	 * Permanent cache implementation
	 *
	 * Cached data persists across page reloads,
	 * as well as window/tab closing
	 */
	return _.extend({}, Stub, {

		/**
		 * Storage object getter
		 *
		 * @return {Object} Internal storage representation
		 */
		get_storage: function () {
			return JSON.parse(localStorage.getItem(Stub.get_storage_id()) || '{}')
		},

		/**
		 * Storage object setter
		 *
		 * @return {Boolean} Status
		 */
		set_storage: function (obj) {
			return localStorage.setItem(Stub.get_storage_id(), JSON.stringify(obj));
		}
	});
});
