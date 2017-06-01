;define([
	'scripts/upfront/cache/storage-stub',
	'scripts/upfront/cache/storage-memory',
	'scripts/upfront/cache/storage-persistent',
	'scripts/upfront/cache/storage-permanent',
], function (Stub, Memory, Persistent, Permanent) {

	var implementation = Stub;

	switch (
		((Upfront || {}).mainData || {}).response_cache_level
	) {

		case 'memory':
			implementation = Memory;
			break;
		case 'persistent':
			implementation = Persistent;
			break;
		case 'permanent':
			implementation = Permanent;
			break;
		default:
			implementation = Stub;
			break;
	}

	// Dispatch implementation event listening
	if (!implementation.is_listening()) implementation.listen();

	return implementation;
});
