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
			style_overlay: (raw.use_custom_map_code ? JSON.parse(raw.map_styles) || false : false),
			hide_markers: !!raw.hide_markers
		},
		markers = raw.markers || [],
		height = $el.closest(".upfront-output-module").height(),
		width = $el.closest(".upfront-output-module").width(),
		map = false,
		scale = 1
	;
	// Google Maps API free size limit is 640x640 (larger does not work).
	if(parseInt(height,10) > 640) {
		height = 640;
		scale = 2;
	}
	if(parseInt(width,10) > 640) {
		width = 640;
		scale = 2;
	}
	var query_strings = 'center=' + props.center[0] + ',' + props.center[1] +
		'&size=' + width + 'x' + height +
		'&zoom=' + props.zoom +
		'&scale=' + scale +
		'&maptype=' + props.type.toLowerCase();

	if (!props.hide_markers) {
		$.each(markers, function(index, marker) {
			var mrk = '&markers=' +
				'%7C' + marker.lat + ',' + marker.lng;
			query_strings += mrk;
		});
	}
	// Get Div with Map Background Image
	var img = load_static_img(query_strings);

	$el.height(height);
	$el.empty();
	$el.append(img)
}

function load_static_img (query_strings) {
	var key = (window._upfront_api_keys || {})['gmaps'] || false;
	// Create Image Element.
	var image = document.createElement("img");

	// Use Google Maps API Key.
	key = key ? 'key=' + key + '&': '';
	image.src = "//maps.googleapis.com/maps/api/staticmap?" + key + query_strings;
	image.className = 'upfront-map_element_static';
	return image;
}

function upfront_maps_public_init () {
	$(".ufm-gmap-static-container").each(function () {
		init_map($(this));
	});
}

upfront_maps_public_init();

})(jQuery);
