define([], function() {
	/**
	 * Provide rendering of regions and modules that will not block browsers
	 * event loop.
	 */
	var RenderQueue = function() {
		var renderingQueue = [];
		var renderingStack = [];
		var me = this;

		/**
		 * Add callback for non-blocking rendering, callbacks are simple
		 * to handle since we don't have to do lots of context management.
		 */
		this.add = function(callback) {
			Upfront.Events.trigger('upfront:renderingqueue:add');
			renderingQueue.push(function(next) {
				callback();
				Upfront.Events.trigger('upfront:renderingqueue:progress');
				setTimeout(function() {
					if (next) {
						if (renderingQueue.length > 0) {
							next(renderingQueue.shift());
						} else {
							next();
						}
					} else {
						Upfront.Events.trigger('upfront:renderingqueue:finished');
					}
				}, 0);// 0 is intentional, it will queue function on browser event loop
			});
		};

		/**
		 * Some functions need to be executed after all modules or regions are done
		 * rendering, do there in the reverse order than they are queued (stacked) so
		 * that it is possible to get correct order of events firing, just as before
		 * render queue was implemented.
		 */
		this.addToEnd = function(callback) {
			Upfront.Events.trigger('upfront:renderingqueue:add');
			renderingStack.push(function(next) {
				callback();
				Upfront.Events.trigger('upfront:renderingqueue:progress');
				setTimeout(function() {
					if (next) {
						if (renderingStack.length > 0) {
							next(renderingStack.pop());
						} else {
							next();
							Upfront.Events.trigger('upfront:renderingqueue:done');
						}
					}
				}, 0);// 0 is intentional, it will queue function on browser event loop
			});
		};

		this.start = function() {
			// Do delayed start since if callbacks are still added to renderingQueue
			// before rendering is started it can cause multiple triggering of
			// 'upfront:renderingqueue:finished' event
			setTimeout(function() {
				Upfront.Events.trigger('upfront:renderingqueue:start');
				if (renderingQueue.length > 1) {
					renderingQueue.shift()(renderingQueue.shift());
				} else if (renderingQueue.length > 0) {
					renderingQueue.shift()();
				}
			}, 500);
		};

		/**
		 * Do stack rendering in reverse order after queue has finished rendering,
		 * see addToEnd comment for more explanation.
		 */
		Upfront.Events.on('upfront:renderingqueue:finished', function() {
			if (renderingStack.length > 1) {
				renderingStack.pop()(renderingStack.pop());
			} else if (renderingStack.length > 0) {
				renderingStack.pop()();
			}
		});
	};

	var renderQueue = new RenderQueue();

	return renderQueue;
});
