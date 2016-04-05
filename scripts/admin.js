(function($){
	Upfront = {
		post: function( data, data_type ){
			return $.post( ajaxurl, data, function () {}, data_type ? data_type : "json");
		}
	};

	/**
	 * General page
	 *
	 */

	// Reset Upfront cache
	$(document).on("click", "#upfront_reset_cache", function(e){
		e.preventDefault();

		$this = $(this);
		$this.addClass("loading");

		Upfront.post(  {
			action: "upfront_reset_cache"
		}).done(function(res){
			$this.removeClass("loading");
		}).fail( function(res){
			$this.removeClass("loading");
		} );

	});

	/**
	 * Reset layout
	 */
	$(document).on("change", ".upfront-layouts-list", function(e){
		$button = $("#upfront_reset_layout");
		if( $(this).val() === "0"  )
			$button.attr("disabled", true);
		else
			$button.attr("disabled", false);
	});

	$(document).on("click", "#upfront_reset_layout", function(e){
		e.preventDefault();

		var $this = $(this),
			$dropdown = $(".upfront-layouts-list"),
			layout = $dropdown.val(),
			label = $(".upfront-layouts-list option[value='"+  layout +"']").html(),
			confirm = window.confirm( Upfront_Data.l10n.sure_to_reset_layout.replace("{layout}", label) );

		if( confirm !== true ) return;

		$this.addClass("loading");

		Upfront.post(  {
			action: "upfront_reset_layout",
			layout: layout
		}).done(function(res){
			$this.removeClass("loading");
			if( $dropdown.find("option").length === 2 ){
				$dropdown.find("option[value="+ layout + "]").remove();
				$dropdown.val( 0 );
				$this.attr("disabled", true);
			}
		}).fail( function(res){
			$this.removeClass("loading");
		} );

	});

	/**
	 * Reset theme
	 */
	$(document).on("click", "#upfront_reset_theme", function(e){
		e.preventDefault();

		var $this = $(this),
			confirm = window.confirm( Upfront_Data.l10n.sure_to_reset_theme );

		if( confirm !== true ) return;

		$this.addClass("loading");

		Upfront.post(  {
			action: "upfront_reset_all_from_db"
		}).done(function(res){
			$this.removeClass("loading");
		}).fail( function(res){
			$this.removeClass("loading");
		} );

	})
}(jQuery));



/**
 * Upfront restrictions page procedures
 *
 */
;(function ($, undefined) {

	/**
	 * Gather roles info on which roles are able to perform a capability
	 *
	 * @param {String} capability Capability to filter the roles
	 *
	 * @return {Array}
	 */
	function get_roles (capability) {
		var roles = [];
		$('[data-capability_id="' + capability + '"] [data-role_id]').each(function () {
			var $me = $(this);
			roles.push({
				role: $me.attr("data-role_id"),
				able: !!$me.find(":checked").length
			});
		});
		return roles;
	}

	/**
	 * Process the checkbox states based on the editor boot capability
	 */
	function process_boot_upfront_state () {
		var roles = get_roles("boot_upfront");

		$.each(roles, function (idx, role) {
			if (!(role || {}).role) return true; // Unknown role, who knows what
			if ((role || {}).able) return true; // Role can boot, we're good

			var $roots = $('[data-role_id="' + role.role + '"]'),
				$checks = $roots.find(':checkbox')
			;
			$checks.each(function () {
				var $me = $(this);
				if (($me.attr("name") || "").match(/\[boot_upfront\]/)) return true; // This one we want to keep visible
				$me
					.attr("checked", false)
					.closest(".upfront_toggle").addClass("hide")
				;
			});
		});
	}

	/**
	 * Process the checkbox states based on the preset modification capability
	 */
	function process_modify_presets_state () {
		var roles = get_roles("modify_element_presets");

		$.each(roles, function (idx, role) {
			if (!(role || {}).role) return true; // Unknown role, who knows what
			if ((role || {}).able) return true; // Role can boot, we're good

			var $roots = $('[data-capability_id="delete_element_presets"] [data-role_id="' + role.role + '"]'),
				$checks = $roots.find(':checkbox')
			;
			$checks.each(function () {
				var $me = $(this);
				$me
					.attr("checked", false)
					.closest(".upfront_toggle").addClass("hide")
				;
			});
		});
	}

	/**
	 * Process all toggle states
	 */
	function process_toggles_state () {
		process_boot_upfront_state();
		process_modify_presets_state();
	}

	function handle_bootable_change (e) {
		var $check = $(this),
			checked = $check.is(":checked"),
			role = $check.closest('[data-role_id]').attr("data-role_id"),
			$target = $('[data-capability_id] [data-role_id="' + role + '"] .upfront_toggle')
		;
		$target.each(function () {
			var $me = $(this);
			if ($me.find('[name*="boot_upfront"]').length) return true;
			if (checked) $me.removeClass("hide");
			else $me.addClass("hide");
		});
		// Re-process bootable roles
		process_toggles_state();
	}

	function handle_modify_presets_change (e) {
		var $check = $(this),
			role = $check.closest('[data-role_id]').attr("data-role_id"),
			$del = $('[data-capability_id="delete_element_presets"] [data-role_id="' + role + '"]')
		;
		$del.find(":checkbox").attr("checked", false);
		if ($check.is(":checked")) {
			$del.find(".upfront_toggle").removeClass("hide");
		} else {
			$del.find(".upfront_toggle").addClass("hide");
		}
	}

	function boot_event_listeners () {
		$(document).on("change", '[data-capability_id="boot_upfront"] :checkbox', handle_bootable_change);
		$(document).on("change", '[data-capability_id="modify_element_presets"] :checkbox', handle_modify_presets_change);
	}

	function init () {
		if (!$("body").is(".wp-admin")) return false;
		if (!$("#upfront_user_restrictions_listing").length) return false;

		// Boot markup initial toggles state
		process_toggles_state();
		boot_event_listeners();
	}
	$(init);

})(jQuery);
