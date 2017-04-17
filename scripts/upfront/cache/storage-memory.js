;define([], function () {

	/**
	 * Maximum key length
	 * @var {Number}
	 */
	var KEY_SIZE_LIMIT = 128;

	/**
	 * Default storage bucket identifier
	 */
	var GENERAL_STORAGE_BUCKET = 'general';

	/**
	 * @see http://stackoverflow.com/q/7616461/940217
	 * @see http://stackoverflow.com/a/20156012
	 * @return {number}
	 */
	var hash = function (s) {
		if (Array.prototype.reduce){
			return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
		}
		var hash = 0;
		if (s.length === 0) return hash;
		for (var i = 0; i < this.length; i++) {
			var character  = s.charCodeAt(i);
			hash  = ((hash<<5)-hash)+character;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	var Cache = {

		/**
		 * Gets hash as string
		 *
		 * Proxies `hash()`
		 *
		 * @param {String} s String to hash
		 *
		 * @return {String} Hash
		 */
		get_hash: function (s) {
			if (!s) return '';
			return '' + hash(s);
		},

		/**
		 * Storage object getter
		 *
		 * Placeholder for future sessionStorage implementation
		 *
		 * @return {Object} Internal storage representation
		 */
		get_storage: function () {
			return window._upfront_cache || {};
		},

		/**
		 * Storage object setter
		 *
		 * Placeholder for future sessionStorage implementation
		 *
		 * @return {Boolean} Status
		 */
		set_storage: function (obj) {
			window._upfront_cache = obj;
			return true;
		},

		/**
		 * Gets valid key
		 *
		 * @param {mixed} key Key
		 *
		 * @return {String|Boolean} Validated key as string, or (bool)false on failure
		 */
		get_valid_key: function (key) {
			if (!key) return false;
			if ('string' !== typeof key) key = this.get_hash(JSON.stringify(key));

			if (key.length > KEY_SIZE_LIMIT) return false; // Too large

			return key;
		},

		/**
		 * Sets internal cache storage to a value
		 *
		 * @param {mixed} key Key
		 * @param {mixed) value Value
		 * @param {String} bucket Optiona section, defaults to general one
		 *
		 * @return {Boolean}
		 */
		set: function (key, value, bucket) {
			key = this.get_valid_key(key);
			if (!key) return false;
			bucket = bucket || GENERAL_STORAGE_BUCKET;

			var cache = this.get_storage();
			cache[bucket] = cache[bucket] || {};
			cache[bucket][key] = value;

			return this.set_storage(cache);
		},

		/**
		 * Checks if we have a key set in cache
		 *
		 * @param {mixed} key Key
		 * @param {String} bucket Optiona section, defaults to general one
		 *
		 * @return {Boolean}
		 */
		has: function (key, bucket) {
			key = this.get_valid_key(key);
			if (!key) return false;
			bucket = bucket || GENERAL_STORAGE_BUCKET;

			var cache = this.get_storage();
			cache[bucket] = cache[bucket] || {};

			return !!(key in cache[bucket]);
		},

		/**
		 * Unsets cache key value
		 *
		 * @param {mixed} key Key
		 * @param {String} bucket Optiona section, defaults to general one
		 *
		 * @return {Boolean} Status
		 */
		unset: function (key, bucket) {
			key = this.get_valid_key(key);
			if (!key) return false;
			bucket = bucket || GENERAL_STORAGE_BUCKET;

			if (!this.has(key, bucket)) return false;

			var cache = this.get_storage();
			cache[bucket] = cache[bucket] || {};
			delete cache[bucket][key];

			return this.set_storage(cache);
		},

		/**
		 * Purges all cached values
		 *
		 * @return {Boolean}
		 */
		purge: function () {
			return this.set_storage({});
		},

		/**
		 * Purges just a specific cache bucket
		 *
		 * @param {String} bucket Bucket to purge
		 *
		 * @return {Boolean} Status
		 */
		purge_bucket: function (bucket) {
			bucket = bucket || GENERAL_STORAGE_BUCKET;

			var cache = this.get_storage();
			cache[bucket] = cache[bucket] || {};
			cache[bucket] = {};

			return this.set_storage(cache);
		},

		/**
		 * Gets cached value
		 *
		 * @param {mixed} key Key
		 * @param {String} bucket Optiona section, defaults to general one
		 *
		 * @return {mixed} Value
		 */
		get: function (key, bucket) {
			key = this.get_valid_key(key);
			if (!key) return false;
			bucket = bucket || GENERAL_STORAGE_BUCKET;
			if (!this.has(key, bucket)) return false;

			var cache = this.get_storage();
			cache[bucket] = cache[bucket] || {};

			return cache[bucket][key];
		}
	};

	return Cache;
});
