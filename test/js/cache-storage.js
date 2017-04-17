var assert = require('assert');
describe('Cache', function () {
	describe('Storage', function () {
		before(function () {
			global.Testable = {};
			global.window = {};
			/**
			 * Mock define implementation.
			 * Assigns whatever gets defined to the Testable object
			 */
			global.define = function () {
				var args = Array.prototype.slice.call(arguments),
					cback = args.pop()
				;
				Testable.Storage = cback.apply(this, []);
			};

			delete require.cache[require.resolve('../../scripts/upfront/cache/storage-memory')];
			require('../../scripts/upfront/cache/storage-memory');
		});

		it('should have access to cache', function () {
			assert.ok('Storage' in Testable);
			assert.ok('get_hash' in Testable.Storage);
		});

		it('knows how to hash strings', function () {
			assert.ok('get_hash' in Testable.Storage);
			assert.equal(typeof Testable.Storage.get_hash('test'), 'string');

			assert.deepEqual('', Testable.Storage.get_hash(''));
			assert.notDeepEqual('test', Testable.Storage.get_hash('test'));
			assert.notEqual('test'.repeat(20).length, Testable.Storage.get_hash('test'.repeat(20)).length);
		});

		it('sets objects using keys', function () {
			var test_str = 'This is my test string, used as cache value',
				test_obj = {
					prop1: 'Prop value 1',
					prop2: 2,
					prop3: [1,2,3]
				},
				key = 'test'
			;

			assert.ok(Testable.Storage.set(key, test_str));
			assert.ok(Testable.Storage.has(key));

			assert.equal(Testable.Storage.set(false, test_str), false);
			assert.equal(Testable.Storage.set(false, test_str), false);

			assert.equal(Testable.Storage.has(0), false);
			assert.equal(Testable.Storage.has(0), false);

			assert.ok(Testable.Storage.set(test_obj, test_str));
			assert.ok(Testable.Storage.has(test_obj));
		});

		it('gets objects using keys', function () {
			var test_str = 'This is my test string, used as cache value',
				test_obj = {
					prop1: 'Prop value 1',
					prop2: 2,
					prop3: [1,2,3]
				},
				key = 'test'
			;

			assert.ok(Testable.Storage.set(key, test_str));
			assert.deepEqual(Testable.Storage.get(key), test_str);

			assert.ok(Testable.Storage.set(test_obj, test_str));
			assert.deepEqual(Testable.Storage.get(test_obj), test_str);

			assert.ok(Testable.Storage.set(key, test_obj));
			assert.deepEqual(Testable.Storage.get(key), test_obj);

			assert.equal(Testable.Storage.get('unknown'), false);
		});

		it('unsets cached values', function () {
			var value = 'Test cached value',
				key = 'Test key'
			;

			assert.ok(Testable.Storage.set(key, value));
			assert.equal(Testable.Storage.get(key), value);

			assert.ok(Testable.Storage.unset(key));
			assert.equal(Testable.Storage.get(key), false);
		});

		it('purges proper buckets', function () {
			var value = 'Test cached value',
				key = 'Test key'
			;

			assert.ok(Testable.Storage.set(key, value ,'bucket 1'));
			assert.ok(Testable.Storage.set(key, value ,'bucket 2'));

			assert.equal(Testable.Storage.get(key, 'bucket 1'), value);
			assert.equal(Testable.Storage.get(key, 'bucket 2'), value);

			assert.ok(Testable.Storage.purge_bucket('bucket 1'));

			assert.equal(Testable.Storage.get(key, 'bucket 1'), false);
			assert.equal(Testable.Storage.get(key, 'bucket 2'), value);
		});

		it('purges all buckets', function () {
			var value = 'Test cached value',
				key = 'Test key'
			;

			assert.ok(Testable.Storage.set(key, value ,'bucket 1'));
			assert.ok(Testable.Storage.set(key, value ,'bucket 2'));

			assert.equal(Testable.Storage.get(key, 'bucket 1'), value);
			assert.equal(Testable.Storage.get(key, 'bucket 2'), value);

			assert.ok(Testable.Storage.purge());

			assert.equal(Testable.Storage.get(key, 'bucket 1'), false);
			assert.equal(Testable.Storage.get(key, 'bucket 2'), false);
		});

	});
});
