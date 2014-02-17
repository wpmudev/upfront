(function($){

	function init_map ($el) {
		var data = JSON.parse($el.attr('data-bg-map')),
			options = {
				center: new google.maps.LatLng(data.center[0], data.center[1]),
				zoom: parseInt(data.zoom),
				mapTypeId: google.maps.MapTypeId[data.style],
				panControl: (data.controls.indexOf("pan") >= 0),
				zoomControl: (data.controls.indexOf("zoom") >= 0),
				mapTypeControl: (data.controls.indexOf("map_type") >= 0),
				scaleControl: (data.controls.indexOf("scale") >= 0),
				streetViewControl: (data.controls.indexOf("street_view") >= 0),
				overviewMapControl: (data.controls.indexOf("overview_map") >= 0),
				scrollwheel: false
			},
			map = new google.maps.Map($el.get(0), options);
	}

	function load_google_maps () {
		if ($(document).data("upfront-google_maps-loading")) return false;
		$(document).data("upfront-google_maps-loading", true);
		if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.Map === 'object') return upfront_bg_map_init();
		var protocol = '',
			script = document.createElement("script")
		;
		try { protocol = document.location.protocol; } catch (e) { protocol = 'http:'; }
		script.type = "text/javascript";
		script.src = protocol + "//maps.google.com/maps/api/js?v=3&libraries=places&sensor=false&callback=upfront_maps_loaded";
		document.body.appendChild(script);
	}

	function upfront_bg_map_init () {
		$("[data-bg-map]").each(function () {
			init_map($(this));
		});
	}
	
	$(document).on('upfront-google_maps-loaded', upfront_bg_map_init);

	if (!window.upfront_maps_loaded) {
		window.upfront_maps_loaded = window.upfront_maps_loaded || function () {
			$(document).trigger("upfront-google_maps-loaded");
			$(document).data("upfront-google_maps-loading", false);
		};
		$(load_google_maps);
	}

})(jQuery);
