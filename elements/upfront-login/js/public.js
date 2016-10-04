;(function ($) {
$(function () {
	$(document).on("click", ".upfront_login.upfront_login-click .upfront_login-trigger", function () {
		var $root = $(this).closest(".upfront_login-click");
		$root
			.addClass("active")
			.one("click", function () {
				$root.removeClass("active");
				return false;
			})
			.find(".upfront_login-form").on("click", function (e) {
				e.stopPropagation();
			})
		;
		return false;
	});
});
})(jQuery);