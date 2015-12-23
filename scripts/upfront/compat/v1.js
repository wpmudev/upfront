;(function ($, undefined) {

/**
 * This holds a reference to `Upfront.Application.start()`
 * method, so we can dispatch it down the line, if needed
 */
var _start;

/**
 * Overridden Upfront.Application.start
 *
 * Actual application starting.
 *
 * @return {Boolean}
 */
function application_override () {
	var theme = ((Upfront.data || {}).Compat || {}).theme || 'your current theme',
		url = ((Upfront.data || {}).Compat || {}).theme_url
	;
	_nag = $.magnificPopup.open({
		items: {
	    	src: '' + 
	    		'<div class="upfront-version_compatibility-nag">' +
	    			'<p>A new version of <b>' + theme + '</b> is available. We recommend you Update <b>' + theme + '</b> before making any edits.</p>' +
	    			'<div>' +
	    				'<a class="boot" href="#boot">Proceed to edit</a>' +
	    				(url ? '<a class="update" href="' + url + '">Update ' + theme + '</a>' : '') +
	    			'</div>' +
	    		'</div>' +
	    	'',
	    	type: 'inline'
	  	}
	});
	$(".upfront-version_compatibility-nag")
		.find('a[href="#boot"]')
			.off("click")
			.on('click', function (e) {
				if (e.preventDefault) e.preventDefault();
				if (e.stopPropagation) e.stopPropagation();
				
				$.magnificPopup.close()
				_start.apply(Upfront.Application);
				
				return false;
			})
		.end()
	;
	return false;
}

(function boot () {
	if (!((window.Upfront || {}).Events || {}).on) return setTimeout(boot);
	Upfront.Events.on("application:loaded:layout_editor", function () {
		_start = Upfront.Application.start;
		// Monkeypatch the Application.start method so we can't run whatsoever
		Upfront.Application.start = application_override;
	});
})();

})(jQuery);