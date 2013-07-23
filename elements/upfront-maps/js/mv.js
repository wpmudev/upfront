/* Contains base backbone model/views for a visitor */
var Ufmap = _.extend(
	{
		'googleMapsLoaded': false,
		'Model':{}, 
		'View':{},
		'Maps':{}
	},
	Backbone.Events
);

// load google maps asynchronously
function google_maps_loaded(){
	require(['m-map/ContextMenu'], function(){
		Ufmap.googleMapsLoaded = true;
		Ufmap.trigger('google_maps_loaded', '');
	});
}
require(['https://maps.googleapis.com/maps/api/js?libraries=places&sensor=false&callback=google_maps_loaded'], function(){});

(function ($){

	// map description
	Ufmap.Model.mapDesc = Backbone.Model.extend({
		defaults:{
			content: "Enter your content here."
		}
	});

	Ufmap.View.mapDesc = Backbone.View.extend({
		template: $("#ufm-map-description").html(),

		renderHTML: function(){
			return _.template(this.template, this.model.toJSON());
		},

		render:function () {
			this.$el.html(this.renderHTML());
			return this;
		}
	});


	// map
	Ufmap.Model.map = Backbone.Model.extend({

		defaults:{
			options:{
				center: [10.722250, 106.730762],
				zoom: 8,
				mapTypeId: 'roadmap',

				panControl: true,
				zoomControl: true,
				mapTypeControl: true,
				scaleControl: false,
				streetViewControl: false,
				overviewMapControl: false
			},
			markers: {},
			address: ''
		},
		save_marker: function(marker){
			// store marker JSON data in the backbone model.
			var markers = this.get('markers'),
				next_id = parseInt(_.max(_.keys(markers), function(v){return parseInt(v);}))+1,
				lat = marker.position.lat(),
				lng = marker.position.lng();

			if(!next_id){
				markers = {}; // PHP json_encode converts an empty JS object to an array. re-init 'markers' to a JS object.
				next_id=1;
			}

			marker.set('id', next_id);

			markers[next_id] = {
				latLng: [lat, lng],
				infowindow: {content:0, open:0},
				icon: null 
			};



			this.set('markers', markers);

			return marker;
		}
	});

	Ufmap.View.map = Backbone.View.extend({
		template: $("#ufm-map-main").html(),

		initialize: function(){				
			_.bindAll(this);
		},

		init_map_when_possible: function(){
			Ufmap.googleMapsLoaded ?
				this.init_map() :
				Ufmap.on('google_maps_loaded', this.init_map);
		},

		init_map: function(){
			var o = this.model.get('options');
			
			var g_options = _.extend({}, o);
			g_options.center = new google.maps.LatLng(o.center[0], o.center[1]);

			var gmap = new google.maps.Map(this.$el.find('.ufm-gmap-container').get(0), g_options);
			Ufmap.Maps[this.model.cid] = gmap; // cannot store gmap in the model as when it is saved to the server an error occurs.

			this.add_markers(gmap);

			return gmap;
		},

		renderHTML: function(){
			return _.template(this.template, this.model.toJSON());
		},

		render:function () {
			this.$el.html(this.renderHTML());
			this.init_map_when_possible();
			return this;
		},

		add_markers: function(gmap){
			var all = this.model.get('markers'),
				self = this;

			_.each(all, function(el, i){
				var latLng = new google.maps.LatLng(el.latLng[0], el.latLng[1]);
				var marker = self.add_marker(gmap, latLng, el.icon, i);
				self.add_infowindow(gmap, marker, el.infowindow);
			});
		},

		add_marker: function(gmap, latLng, icon){
			var marker = new google.maps.Marker({
				position: latLng,
				map: gmap,
				title: "",
				icon: icon
			});
			return marker;
		},

		add_infowindow: function(gmap, marker, data){
			if(data.content==0 || data.open==0){
				return false;
			}

			var infowindow = new google.maps.InfoWindow({
				content: '<div class="ufm-infowindow">'+data.content+'</div>'
			});
			infowindow.open(gmap, marker);
			return infowindow;
		}
	});

})(jQuery);