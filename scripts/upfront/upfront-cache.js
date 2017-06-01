;define([
	'scripts/upfront/cache/storage',
	'scripts/upfront/cache/request'
], function (Cache, Request) {
	return {
		Storage: Cache,
		Request: Request
	};
});
