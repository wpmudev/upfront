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
		var percentDone = 0;

		// Update total
		// I have tried to calculate the exact number of items in layout but that
		// didn't work, It should amount to number of regions * 2 plus number of
		// modules in each regions plus some fixed number of actions that are always
		// called but for some reason the actual number of stuff to render is about
		// 25% greater, after looking into it for some time I decided to ditch it to
		// not waste time. This solutions works fine also.
		Upfront.Events.on('upfront:renderingqueue:add', function() {
			totalOfStuffToRender++;
		});

		// Handle callbacks
		if (onRenderStart && typeof onRenderStart === 'function') {
			Upfront.Events.on('upfront:renderingqueue:start', onRenderStart);
		}

		Upfront.Events.on('upfront:renderingqueue:progress', function() {
			var newPercent;
			doneStuffToRender++;
			// Since we don't know th actual number of items we do a bit trickery here
			// do not allow percent to become less than it was already shown.
			newPercent = Math.floor(doneStuffToRender / totalOfStuffToRender * 100);
			percentDone = newPercent > percentDone ? newPercent : percentDone;
			if (onRenderProgress && typeof onRenderProgress === 'function') {
				onRenderProgress(percentDone);
			}
		});

		Upfront.Events.on('upfront:renderingqueue:done', function() {
			totalOfStuffToRender = 0;
			doneStuffToRender = 0;
			percentDone = 0;
			if (onRenderFinished && typeof onRenderFinished === 'function') {
				onRenderFinished();
			}
		});
	};

	return RenderQueueReporter;
});
