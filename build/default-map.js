!function(o){function e(o){if(!o.data("map")){var e=JSON.parse(o.attr("data-bg-map")),t={center:new google.maps.LatLng(e.center[0],e.center[1]),zoom:parseInt(e.zoom),mapTypeId:google.maps.MapTypeId[e.style],panControl:e.controls&&e.controls.indexOf("pan")>=0,zoomControl:e.controls&&e.controls.indexOf("zoom")>=0,mapTypeControl:e.controls&&e.controls.indexOf("map_type")>=0,scaleControl:e.controls&&e.controls.indexOf("scale")>=0,streetViewControl:e.controls&&e.controls.indexOf("street_view")>=0,overviewMapControl:e.controls&&e.controls.indexOf("overview_map")>=0,scrollwheel:!1,styles:e.use_custom_map_code?JSON.parse(e.styles)||!1:!1},n=new google.maps.Map(o.get(0),t);if(o.data("map",n),e.show_markers){new google.maps.Marker({position:t.center,draggable:!1,map:n})}}}function t(){if(o(document).data("upfront-google_maps-loading"))return!1;if(o(document).data("upfront-google_maps-loading",!0),"object"==typeof google&&"object"==typeof google.maps&&"object"==typeof google.maps.Map)return n();var e="",t=document.createElement("script");try{e=document.location.protocol}catch(a){e="http:"}t.type="text/javascript",t.src=e+"//maps.google.com/maps/api/js?v=3&libraries=places&sensor=false&callback=upfront_maps_loaded",document.body.appendChild(t)}function n(){o("[data-bg-map]").each(function(){"none"!=o(this).css("display")&&e(o(this))})}function a(){if(!("Upfront"in window||o("[data-bg-map]").length))return!1;o(document).on("upfront-google_maps-loaded",n);var e=r(n,100);window.upfront_maps_loaded||(window.upfront_maps_loaded=window.upfront_maps_loaded||function(){o(document).trigger("upfront-google_maps-loaded"),o(document).data("upfront-google_maps-loading",!1),o(window).on("resize",e)},t())}var r=function(o,e,t){var n,a,r,l=null,p=0;t||(t={});var s=function(){p=t.leading===!1?0:(new Date).getTime(),l=null,r=o.apply(n,a),l||(n=a=null)};return function(){var c=(new Date).getTime();p||t.leading!==!1||(p=c);var i=e-(c-p);return n=this,a=arguments,0>=i||i>e?(clearTimeout(l),l=null,p=c,r=o.apply(n,a),l||(n=a=null)):l||t.trailing===!1||(l=setTimeout(s,i)),r}};o(a)}(jQuery);