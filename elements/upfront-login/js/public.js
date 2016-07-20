;(function ($) {
$(function () {

	// replacing input submit into button
	var $login_input_button = $('.upfront_login-form .login-submit input.button-primary'),
			$login_button = $('.upfront_login-form button.upfront-login-button')
	;
	if ( $login_input_button.length ) $login_input_button.replaceWith($login_button);
	
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