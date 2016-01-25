;(function ($, undefined) {

	var $root;

	function dismiss (e) {
		if (e && e.preventDefault) e.preventDefault();
		if (e && e.stopPropagation) e.stopPropagation();

		$.post(
			ajaxurl, {
				action: "upfront_dismiss_update_notice"
			}
		).done(function () {
			$root.remove();
		});

		return false;
	}

	function init () {
		$root = $(".upfront-update");
		if (!$root.length) return false;

		$root.on('click', 'a[href="#dismiss"]', dismiss);
	}

	$(init);

})(jQuery);