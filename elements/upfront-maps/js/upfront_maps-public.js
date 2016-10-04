(function ($) {

var DEFAULTS = {
	OPTIMUM_MAP_HEIGHT: 300,
	center: [-37.8180, 144.9760],
	zoom: 10,
	style: 'HYBRID',
	controls: {
		pan: false,
		zoom: false,
		map_type: false,
		scale: false,
		street_view: false,
		overview_map: false
	}
};

function init_map ($el) {
	var raw = JSON.parse($el.attr('data-map')),
		props = {
			center: raw.map_center || DEFAULTS.center,
			zoom: parseInt(raw.zoom, 10) || DEFAULTS.zoom,
			type: raw.style || DEFAULTS.style,
			panControl: raw.controls.indexOf("pan") >= 0 || DEFAULTS.controls.pan,
			zoomControl: raw.controls.indexOf("zoom") >= 0 || DEFAULTS.controls.zoom,
			mapTypeControl: raw.controls.indexOf("map_type") >= 0 || DEFAULTS.controls.map_type,
			scaleControl: raw.controls.indexOf("scale") >= 0 || DEFAULTS.controls.scale,
			streetViewControl: raw.controls.indexOf("street_view") >= 0 || DEFAULTS.controls.street_view,
			overviewMapControl: raw.controls.indexOf("overview_map") >= 0 || DEFAULTS.controls.overview_map,
			style_overlay: (raw.use_custom_map_code ? JSON.parse(raw.map_styles) || false : false),
			draggable: !!raw.draggable,
			scrollwheel: !!raw.scrollwheel,
			hide_markers: !!raw.hide_markers
		},
		markers = raw.markers || [],
		height = $el.closest(".upfront-output-module").height(),
		map = false
	;
	$el.height(height);
	map = new google.maps.Map($el.get(0), {
		center: new google.maps.LatLng(props.center[0], props.center[1]),
		zoom: props.zoom,
		mapTypeId: google.maps.MapTypeId[props.type],
		panControl: props.panControl,
		zoomControl: props.zoomControl,
		mapTypeControl: props.mapTypeControl,
		scaleControl: props.scaleControl,
		streetViewControl: props.streetViewControl,
		overviewMapControl: props.overviewMapControl,
		draggable: props.draggable,
		scrollwheel: props.scrollwheel
	});
	if (props.style_overlay) {
		map.setOptions({styles: props.style_overlay});
	}
	if (!props.hide_markers) {
		$.each(markers, function(index, marker) {
			var mrk = new google.maps.Marker({
				position: new google.maps.LatLng(marker.lat, marker.lng),
				draggable: false,
				icon: marker.icon ? marker.icon : '',
				map: map
			});
			if (marker.is_open && marker.content) {
				var info = new google.maps.InfoWindow({
					content: '<div>' + marker.content + '</div>'
				});
				info.open(map, mrk);
			}
		});
	}
	// Re-render the map when needed
	$(document).on('upfront-lightbox-open', function () {
		$el.height($el.closest(".upfront-output-module").height()); // This is to ensure the proper height once lightbox pops open
		setTimeout(function () {
			var center = map.getCenter();
			google.maps.event.trigger(map, 'resize');
			map.setCenter(center);
		}, 300);
	});
}


function load_google_maps () {
	if ($(document).data("upfront-google_maps-loading")) return false;
	$(document).data("upfront-google_maps-loading", true);
	if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.Map === 'object') return upfront_maps_public_init();
	var protocol = '',
		key = (window._upfront_api_keys || {})['gmaps'] || false,
		script = document.createElement("script")
	;
	try { protocol = document.location.protocol; } catch (e) { protocol = 'http:'; }
	key = key ? '&key=' + key : '';
	script.type = "text/javascript";
	script.src = protocol + "//maps.google.com/maps/api/js?v=3" + key + "&libraries=places&sensor=false&callback=upfront_maps_loaded";
	document.body.appendChild(script);
}
function upfront_maps_public_init () {
	$(".ufm-gmap-container").each(function () {
		init_map($(this));
	});
}
$(document).on("upfront-google_maps-loaded", upfront_maps_public_init);

if (!window.upfront_maps_loaded) {
	window.upfront_maps_loaded = window.upfront_maps_loaded || function () {
		$(document).trigger("upfront-google_maps-loaded");
		$(document).data("upfront-google_maps-loading", false);
	};
	$(load_google_maps);
}

})(jQuery);
