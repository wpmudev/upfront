;define([
	'scripts/upfront/cache/storage-stub'
], function (Stub) {

	/**
	 * In-memory cache implementation
	 *
	 * Cached data will not survive page reload.
	 */
	return _.extend({}, Stub, {

		/**
		 * Storage object getter
		 *
		 * @return {Object} Internal storage representation
		 */
		get_storage: function () {
			return window[Stub.get_storage_id()] || {};
		},

		/**
		 * Storage object setter
		 *
		 * @return {Boolean} Status
		 */
		set_storage: function (obj) {
			window[Stub.get_storage_id()] = obj;
			return true;
		}
	});
});
