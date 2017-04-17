var assert = require('assert');
describe('Cache', function () {
	describe('Request', function () {
		before(function () {
			global.Testable = {};
			global.jQuery = {
				Deferred: function () {
					var prm = {
						queue: [],
						done: function (cback) {
							prm.queue.push(cback);
						},
						always: function (cback) {
							prm.queue.push(cback);
						},
						set_data: function (data) {
							prm.data = data;
							return prm;
						}
					};
					var def = function () {
						return prm;
					};

					def.resolveWith = function (ctx, d) {
						prm.queue.forEach(function (cb) {
							var data = prm.data ? [prm.data] : d;
							cb.apply(ctx, data);
						});
					}
					def.promise = function () {
						return prm;
					};

					return def;
				},
				post: function () {
					var dfr = jQuery.Deferred();
					setTimeout(function () {
						dfr.resolveWith(this, [{test: 123}]);
					}, 1);
					return dfr.promise();
				}
			};
			global.window = {};
			global.Upfront = {
				Settings: {ajax_url: ''},
				Util: { log: function () {} },
				Events: {
					on: function (nme, cback) {
						this._queue = this._queue || {};
						this._queue[nme] = this._queue[nme] || [];
						this._queue[nme].push(cback);
					},
					off: function (nme, cback) {
						this._queue = this._queue || {};
						this._queue[nme] = this._queue[nme] || [];
						var idx = this._queue[nme].indexOf(cback);
						if (idx < 0) return false;
						delete this._queue[nme][idx];
					},
					trigger: function (nme) {
						this._queue = this._queue || {};
						this._queue[nme] = this._queue[nme] || [];
						this._queue[nme].forEach(function (cb) {
							cb.apply(this, []);
						});
					}
				}
			};
			var Cache = {};
			/**
			 * Mock define implementation.
			 * Assigns whatever gets defined to the Testable object
			 */
			global.define = function () {
				var args = Array.prototype.slice.call(arguments),
					cback = args.pop()
				;
				var obj = cback.apply(this, []);
				if ('get_hash' in obj) Cache = obj;
				else {
					Testable.Request = cback.apply(this, [Cache]);
				}
			};

			delete require.cache[require.resolve('../../scripts/upfront/cache/storage-memory')];
			require('../../scripts/upfront/cache/storage-memory');
			require('../../scripts/upfront/cache/request');
		});


		it('should have access to request', function () {
			assert.ok('Request' in Testable);
			assert.ok('send' in Testable.Request);
		});

		it('should send out requests', function (done) {
			Testable.Request.send({action: 'test'}).set_data({expected: 'string'}).done(function (data) {
				assert.ok('expected' in data);
				done();
			});
		});

		it('should accept whitelisted action', function () {
			assert.equal(Testable.Request.is_whitelisted_action('__whitelisted__'), true);
		});

		it('should reject non-whitelisted action', function () {
			assert.equal(Testable.Request.is_whitelisted_action('my fake action'), false);
		});

		it('should cache data properly', function () {
			var request = {
				action: '__whitelisted__',
				test: 'unit test manual data caching'
			};
			var cached = {
				list: [1,2,3],
				str: 'test test'
			};

			assert.equal(Testable.Request.get_cached(request), false);
			assert.ok(Testable.Request.set_cached(request, cached));
			assert.deepEqual(Testable.Request.get_cached(request), cached);
		});

		it('should purge data properly', function () {
			var request = {
				action: '__whitelisted__',
				test: 'unit test manual data purging'
			};
			var cached = {
				list: [1,2,3],
				str: 'test test'
			};

			assert.equal(Testable.Request.get_cached(request), false);
			assert.ok(Testable.Request.set_cached(request, cached));
			assert.deepEqual(Testable.Request.get_cached(request), cached);

			assert.ok(Testable.Request.purge());
			assert.equal(Testable.Request.get_cached(request), false);
		});

		it('should unset cached data properly', function () {
			var request = {
				action: '__whitelisted__',
				test: 'unit test manual data unsetting'
			};
			var cached = {
				list: [1,2,3],
				str: 'test test'
			};

			assert.equal(Testable.Request.get_cached(request), false);
			assert.ok(Testable.Request.set_cached(request, cached));
			assert.deepEqual(Testable.Request.get_cached(request), cached);

			assert.ok(Testable.Request.unset_cached(request));
			assert.equal(Testable.Request.get_cached(request), false);
		});

		it('should return cached data from request', function (done) {
			var request = {
				action: '__whitelisted__',
				test: 'unit test request caching'
			};
			var cached = {
				list: [1,2,3],
				str: 'test test'
			};

			Testable.Request.get_response(request).set_data(cached).done(function (data1) {
				assert.deepEqual(data1, cached);
				Testable.Request.get_response(request).done(function (data2) {
					assert.deepEqual(data2, cached);
					done();
				});
			});
		});

		it('should recognize trappable actions', function () {
			assert.ok(Testable.Request.is_trapped_action('__trapped__'));
		});

		it('should fire event on trappable actions', function (done) {
			Upfront.Events.on('cache:request:action', function () {
				assert.ok(true);
				done();
			});
			Testable.Request.listen();
			Testable.Request.get_response({action: '__trapped__'});
			Testable.Request.stop_listening();
		});

	});
});
