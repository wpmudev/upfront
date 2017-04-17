;(function ($) {
define([
	'scripts/upfront/cache/storage'
], function (Storage) {

	/**
	 * List of cacheable AJAX actions
	 * @var {Array}
	 */
	var WHITELISTED_ACTIONS = [
		'__whitelisted__',
		'upfront_list_google_fonts',
		'upfront-wp-model',
		'upfront-edia-get_labels',
		'upfront-post_data-post-specific',
		'upfront_posts-load',
		'upfront_posts-data',
		'upfront_new_menu_from_slug',
		'upfront_new_load_menu_array',
		'upfront-media-list_media',
		'upfront_post-data-load',
	];

	var Request = {

		BUCKET: 'request',

		/**
		 * Actually sends the POST reuest
		 *
		 * @param {Object} request AJAX POST request object
		 * @param {String} data_type Optional data type, defaults to 'json'
		 *
		 * @return {Object} Deferred
		 */
		send: function (request, data_type) {
			return $.post(
				Upfront.Settings.ajax_url,
				request,
				function () {},
				data_type ? data_type : "json"
			);
		},

		/**
		 * Gets deferred promise augmented with jQuery legacy methods
		 *
		 * @param {Object} dfr jQuery.Deferred object
		 *
		 * @return {Object} Augmented promise
		 */
		get_promise: function (dfr) {
			var prm = dfr.promise();
			// Shim in legacy jQuery promise handlers
			prm.success = prm.done;
			prm.error = prm.fail;
			return prm;
		},

		/**
		 * Proxies the actual POST request and caches the data
		 *
		 * @param {Object} request AJAX POST request object
		 * @param {String} data_type Optional data type, defaults to 'json'
		 *
		 * @return {Object} Deferred promise
		 */
		get_response: function (request, data_type) {
			var action = (request || {}).action || false;
			if (!action || !Request.is_whitelisted_action(action)) return Request.send(request, data_type);

			var cache_key = Storage.get_valid_key(request),
				cached = Request.get_cached(request),
				dfr = $.Deferred(),
				me = this
			;
			me.__waiting = me.__waiting || {};

			if (cached) {
				Upfront.Util.log("Cache HIT! No request will be sent", action);
				setTimeout(function () {
					dfr.resolveWith(this, [cached]);
				});
				return Request.get_promise(dfr);
			}

			if (me.__waiting[cache_key]) {
				return Request.get_promise(me.__waiting[cache_key]);
			}

			me.__waiting[cache_key] = dfr;
			dfr = Request.send(request, data_type);
			dfr.done(function (data) {
				Request.set_cached(request, data);
			});
			dfr.always(function () {
				delete me.__waiting[cache_key];
			});
			return dfr;
		},

		/**
		 * Cache getter proxying method
		 *
		 * Used in POST requests, to proxy the result via cache
		 *
		 * @param {Object} payload AJAX POST object
		 *
		 * @return {Object|Boolean} Cached object on success, (bool)false on failure
		 */
		get_cached: function (payload) {
			var action = (payload || {}).action || false;
			if (!action || !Request.is_whitelisted_action(action)) return false;

			var key = Storage.get_valid_key(payload);
			if (!Storage.has(key, Request.BUCKET)) return false;

			return Storage.get(key, Request.BUCKET);
		},

		/**
		 * Cache setter proxying method
		 *
		 * Used to set POST request value on success
		 *
		 * @param {Object} payload AJAX POST object
		 * @param {mixeed} Response
		 *
		 * @return {Boolean} Status
		 */
		set_cached: function (payload, value) {
			var action = (payload || {}).action || false;
			if (!action || !Request.is_whitelisted_action(action)) return false;

			return Storage.set(payload, value, Request.BUCKET);
		},

		/**
		 * Cache unsetter proxying method
		 *
		 * Used to set POST request value on success
		 *
		 * @param {Object} payload AJAX POST object
		 *
		 * @return {Boolean} Status
		 */
		unset_cached: function (payload) {
			var action = (payload || {}).action || false;
			if (!action || !Request.is_whitelisted_action(action)) return false;

			return Storage.unset(payload, Request.BUCKET);
		},

		/**
		 * Purges whole request cache
		 *
		 * @return {Boolean} Status
		 */
		purge: function () {
			return Storage.purge_bucket(Request.BUCKET);
		},

		/**
		 * Checks if a given action is cacheable
		 *
		 * @param {String} action Action to check
		 *
		 * @return {Boolean}
		 */
		is_whitelisted_action: function (action) {
			return WHITELISTED_ACTIONS.indexOf(action) >= 0;
		},

		/**
		 * Bootstraps automatic cache listening
		 *
		 * @return {Boolean} Status
		 */
		listen: function () {
			Request.stop_listening();

			Upfront.Events.on("menu_element:menu_deleted", Request.purge);
			Upfront.Events.on("menu_element:menu_created", Request.purge);
			Upfront.Events.on("menu_element:edit", Request.purge);

			return true;
		},

		/**
		 * Stops automatic cache listening
		 *
		 * @return {Boolean} Status
		 */
		stop_listening: function () {
			Storage.purge_bucket(Request.BUCKET);

			Upfront.Events.off("menu_element:menu_deleted", Request.purge);
			Upfront.Events.off("menu_element:menu_created", Request.purge);
			Upfront.Events.off("menu_element:edit", Request.purge);


			return false;
		}
	};

	return Request;
});
})(jQuery);
