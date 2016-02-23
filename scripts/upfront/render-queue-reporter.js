define([], function() {
	/**
	 * Render reporting, just a event API at which we can plug in anything in UI to show progress.
	 *
	 * The important thing to know is that total of stuff to render is not known at the beginning of
	 * the render, total gets updated as more stuff is edded to RenderQeueue.
	 * This means that we can't use it for 100% type of reporting but 3/27 style in which the later
	 * number might get increased over time. This is due to the asynchrounous execution of render
	 * queue.
	 */
	var RenderQueueReporter = function(onRenderStart, onRenderProgress, onRenderFinished) {
		var totalOfStuffToRender = 0;
		var getTotalStuff = function() {
			return totalOfStuffToRender;
		};
		var doneStuffToRender = 0;

		// Update total
		Upfront.Events.on('upfront:renderingqueue:add', function() {
			totalOfStuffToRender++;
		});

		// Handle callbacks
		if (onRenderStart && typeof onRenderStart === 'function') {
			Upfront.Events.on('upfront:renderingqueue:start', onRenderStart);
		}

		Upfront.Events.on('upfront:renderingqueue:progress', function() {
			doneStuffToRender++;
			if (onRenderProgress && typeof onRenderProgress === 'function') {
				onRenderProgress(doneStuffToRender, totalOfStuffToRender);
			}
		});

		Upfront.Events.on('upfront:renderingqueue:done', function() {
			totalOfStuffToRender = 0;
			doneStuffToRender = 0;
			if (onRenderFinished && typeof onRenderFinished === 'function') {
				onRenderFinished();
			}
		});
	};

	return RenderQueueReporter;
});
