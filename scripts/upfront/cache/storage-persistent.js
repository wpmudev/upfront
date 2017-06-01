;define([
	'scripts/upfront/cache/storage-stub'
], function (Stub) {

	/**
	 * Session storage cache implementation
	 *
	 * Cached data will survive page reloads,
	 * but not window/tab closing.
	 */
	return _.extend({}, Stub, {

		/**
		 * Storage object getter
		 *
		 * @return {Object} Internal storage representation
		 */
		get_storage: function () {
			return JSON.parse(sessionStorage.getItem(Stub.get_storage_id()) || '{}')
		},

		/**
		 * Storage object setter
		 *
		 * @return {Boolean} Status
		 */
		set_storage: function (obj) {
			return sessionStorage.setItem(Stub.get_storage_id(), JSON.stringify(obj));
		}
	});
});
