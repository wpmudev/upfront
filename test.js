(function() {
	var css = document.getElementById('css');
	var original = document.getElementById('original');
	var result = document.getElementById('result');
	original.value = css.innerText;

	var brokenByStart = css.innerText.split('/*');
	var sortedByStart = [];
	brokenByStart.forEach(function(arg) {
	  if (arg.trim() === '') {
			sortedByStart.push(arg);
			return;
		}
		sortedByStart.push('/*' + arg);
	});

	var brokenByEnd = [];

	sortedByStart.forEach(function(arg) {
		if (arg.match(/\*\//) === null) {
			brokenByEnd.push(arg);
			return;
		}
		var parts = arg.split('*/');
		parts.forEach(function(part) {
			if (part.trim() === '') {
				brokenByEnd.push(part);
				return;
			}
			if (part.match(/\/\*/) === null) {
				brokenByEnd.push(part);
				return;
			}
			brokenByEnd.push(part + '*/');
		});
	});

	/* Separated rules, comments and whitespace */
	var separated = [];
	var lastDone = 0;
	brokenByEnd.forEach(function(arg, i) {
		if (lastDone > i) {
			return;
		}
		lastDone = i;
		if (arg.trim() === '') {
			separated.push(arg);
			return;
		}
		if (arg.charAt(0) === "/") {
			separated.push(arg);
			return;
		}
		var openings = arg.match(/{/g);
		openings = openings === null ? 0 : openings.length;

		var closings = arg.match(/}/g);
		closings = closings === null ? 0 : closings.length;

		if (openings === closings) {
			separated.push(arg);
			return;
		}
		var sub = arg;
		i++;
		for (; i < brokenByEnd.length; i++) {
			sub += brokenByEnd[i];

			openings = sub.match(/{/g);
			openings = openings === null ? 0 : openings.length;
			closings = sub.match(/}/g);
			closings = closings === null ? 0 : closings.length;

			if (openings === closings) {
				i++;
				separated.push(sub);
				break;
			}
		}
		lastDone = i;
	});

	var spacesep = [];

	separated.forEach( function(arg, i) {
		if (arg.trim() === '') {
			spacesep.push(arg);
			return;
		}
		if (arg.charAt(0) === "/") {
			spacesep.push(arg);
			return;
		}
		/* Trim start */
		while(arg.charAt(0).trim() === '') {
			spacesep.push(arg.charAt(0));
			arg = arg.substring(1);
		}
		/* Trim end */
		var end = '';
		while (arg.charAt(arg.length - 1).trim() === '') {
			end += arg.charAt(arg.length - 1);
			arg = arg.substring(0, arg.length - 1);
		}
		spacesep.push(arg);
		spacesep.push(end);
	});

	console.log(brokenByStart, sortedByStart, brokenByEnd, separated, spacesep);



	result.value = spacesep.join('');

}());
