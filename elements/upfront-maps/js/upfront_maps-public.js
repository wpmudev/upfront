(function ($) {

var DEFAULTS = {
	OPTIMUM_MAP_HEIGHT: 300,
	center: [10.722250, 106.730762],
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
			style_overlay: raw.styles || false
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
	});
	if (props.style_overlay) {
		map.setOptions({styles: props.style_overlay});
	}
	_(markers).each(function (marker) {
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


function load_google_maps () {
	if (typeof google === 'object' && typeof google.maps === 'object') return upfront_maps_public_init();
	var protocol = '',
		script = document.createElement("script")
	;
	try { protocol = document.location.protocol; } catch (e) { protocol = 'http:'; }
	script.type = "text/javascript";
	script.src = protocol + "//maps.google.com/maps/api/js?v=3&libraries=places&sensor=false&callback=upfront_maps_public_init";
	document.body.appendChild(script);
}

window.upfront_maps_public_init = function () {
	$(".upfront_map-public").each(function () {
		init_map($(this));
	})
};

$(load_google_maps);

})(jQuery);