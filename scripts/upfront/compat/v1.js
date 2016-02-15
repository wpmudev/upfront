;(function ($, undefined) {

/**
 * This holds a reference to `Upfront.Application.start()`
 * method, so we can dispatch it down the line, if needed
 */
var _start;

/**
 * This holds a reference to pre-start processing
 */
var _callback = function () {}

/**
 * Return backup notice popup string
 *
 * @return {String} Backup notice markup
 */
function get_backup_notice () {
	var notice = ((Upfront.data || {}).Compat || {}).notice,
		url = ((Upfront.data || {}).Compat || {}).snapshot_url,
		msg = ((Upfront.data || {}).Compat || {}).snapshot_msg || 'Install Snapshot',
		has_snapshot_class = url.match(/snapshots_new_panel/) ? 'has-snapshot' : ''
	;
	_callback = function () {
		return $.post(Upfront.Settings.ajax_url, {action: "upfront-notices-dismiss"});
	};

	return '' + 
		'<div class="upfront-version_compatibility-nag">' +
			'<p>' + notice + '</p>' +
			'<div>' +
				'<a class="boot ' + has_snapshot_class + '" href="#boot">Proceed to edit</a>' +
				(url ? '<a class="update ' + has_snapshot_class + '" href="' + url + '">' + msg + '</a>' : '') +
			'</div>' +
		'</div>' +
	'';
}

/**
 * Return theme notice popup string
 *
 * @return {String} Theme notice markup
 */
function get_theme_notice () {
	var theme = ((Upfront.data || {}).Compat || {}).theme || 'your current theme',
		url = ((Upfront.data || {}).Compat || {}).theme_url
	;
	return '' + 
		'<div class="upfront-version_compatibility-nag">' +
			'<p>A new version of <b>' + theme + '</b> is available. We recommend you Update <b>' + theme + '</b> before making any edits.</p>' +
			'<div>' +
				'<a class="boot" href="#boot">Proceed to edit</a>' +
				(url ? '<a class="update" href="' + url + '">Update ' + theme + '</a>' : '') +
			'</div>' +
		'</div>' +
	'';
}

/**
 * Dispatch the update screen version based on the snapshot URL presence
 *
 * @return {String} Popup markup
 */
function get_popup_markup () {
	var url = ((Upfront.data || {}).Compat || {}).snapshot_url || false;
	return url ? get_backup_notice() : get_theme_notice();
}

/**
 * Overridden Upfront.Application.start
 *
 * Actual application starting.
 *
 * @return {Boolean}
 */
function application_override () {
	
	_nag = $.magnificPopup.open({
		items: {
	    	src: get_popup_markup(),
	    	type: 'inline',
	  	},
	    mainClass: 'uf-upgrade-notice'
	});
	$(".upfront-version_compatibility-nag")
		.find('a[href="#boot"]')
			.off("click")
			.on('click', function (e) {
				if (e.preventDefault) e.preventDefault();
				if (e.stopPropagation) e.stopPropagation();
				
				$.magnificPopup.close();
				// Shim the start method back in
				Upfront.Application.start = _start;

				// Don't forget to actually boot :)
				_start.apply(Upfront.Application);

				// Apply pre-boot callback
				if (_callback && 'function' === typeof _callback) _callback.apply(this);
				
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