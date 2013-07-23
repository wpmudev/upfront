var UmapSettings = {};
(function($){

	var panel = Upfront.Views.Editor.Settings.Panel.extend({

		initialize: function () {
			
			var render_all = function(){
				this.settings.invoke('render');
			}

			this.model.get('subviewModel').on('change:options', render_all, this);

			this.settings = _([
				new sLocation({model: this.model}),
				new sZoom({model: this.model}),
				new sOverlay({model: this.model}),
				new sControls({model: this.model})
			]);
		},
		get_label: function () {
			return "General";
		},

		get_title: function () {
			return "General Settings";
		}
	});


	var sLocation = Upfront.Views.Editor.Settings.Item.extend({
		events: {
			'click #geocode-address': 'geocode_address'
		},

		render: function () {
			this.$el.empty();

			var o = this.model.get('subviewModel').get('options'),
				address = this.model.get('subviewModel').get('address');

			// Wrap method accepts an object, with defined "title" and "markup" properties.
			// The "markup" one holds the actual Item markup.
			var data = {lat: o.center[0], lng: o.center[1], address: address};
			this.wrap({
				"title": "Location",
				"markup": _.template($('#ufm-map-setting-location').html(), data)
			});
		},

		geocode_address: function(){
			
			var address = $('input#address', this.$el).val(),
				geocoder = new google.maps.Geocoder(),
				map = Ufmap.Maps[this.model.get('subviewModel').cid],
				model = this.model.get('subviewModel')
			;

			model.set('address', address);

			geocoder.geocode( { 'address': address}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);
					var marker = new google.maps.Marker({
						position: results[0].geometry.location,
						map: map,
						title: address,
						draggable: true
						//icon: icon
					});
					model.save_marker(marker);
				} else {
					alert('Address not found.');
				}
			});

		},

		/**
		 * Defines under which Property name the value will be saved.
		 * @return {string} Property name
		 */
		get_name: function () {
			return false;
		},
		/**
		 * Extracts the finalized value from the setting markup.
		 * @return {mixed} Value.
		 */
		get_value: function () {
			var lat = this.$el.find('input[name="lat"]').val(),
				lng = this.$el.find('input[name="lng"]').val();
			
			var map = Ufmap.Maps[this.model.get('subviewModel').cid];
			map.setCenter(new google.maps.LatLng(lat, lng));
			return false;
		}
	});

	var sZoom = Upfront.Views.Editor.Settings.Item.extend({
		
		events: {
			'change select': 'setZoom' 
		},

		setZoom: function(){
			var zoom = parseInt(this.$el.find('select').val());
			var map = Ufmap.Maps[this.model.get('subviewModel').cid];
			map.setZoom(zoom);
		},

		render: function () {
			this.$el.empty();
			var o = this.model.get('subviewModel').get('options');

			var opt_val = 'value="'+o.zoom+'"';
			var select = $('#ufm-map-setting-zoom').html().replace(opt_val,  opt_val+' selected');
	
			this.wrap({
				"title": "Zoom",
				"markup": select
			});
		},

		get_name: function () {
			return false;
		},

		get_value: function () {
			return false;
		}
	});

	var sOverlay = Upfront.Views.Editor.Settings.Item.extend({
		events: {
			'change select': 'setType'
		},

		setType: function(){
			var mapTypeId = this.$el.find('select').val();
			var map = Ufmap.Maps[this.model.get('subviewModel').cid];
			map.setMapTypeId(mapTypeId);
		},

		render: function () {
			this.$el.empty();
			var o = this.model.get('subviewModel').get('options');

			var opt_val = 'value="'+o.mapTypeId+'"';
			var select = $('#ufm-map-setting-type').html().replace(opt_val,  opt_val+' selected');

			this.wrap({
				"title": "Type",
				"markup": select
			});
		},


		get_name: function () {
			return false;
		},

		get_value: function () {
			return false;
		}
	});


	var sControls = Upfront.Views.Editor.Settings.Item.extend({
		events: {
			'click input[type="checkbox"]': 'toggle_control'
		},

		render: function () {
			this.$el.empty();
			var o = this.model.get('subviewModel').get('options'),
				controls = {
					'panControl': 'Pan',
					'zoomControl': 'Zoom',
					'mapTypeControl': 'Map Type',
					'scaleControl': 'Scale',
					'streetViewControl': 'Street View',
					'overviewMapControl': 'Overview Map'
				};

			var html = '';
			_.each(controls, function(label, key){
				var d = {
					key: key,
					label: label,
					checked: o[key] ? 'checked' : ''
				};

				html = html + _.template($('#ufm-map-setting-control').html(), d);
			});			

			this.wrap({
				"title": "Show/Hide Controls",
				"markup": html
			});
		},

		toggle_control: function(e){
			var el = $(e.target),
				key = el.attr('name'),
				val = el.is(':checked'),
				map = Ufmap.Maps[this.model.get('subviewModel').cid],
				option = {};

			option[key] = val;
			map.setOptions(option);
			_.extend(this.model.get('subviewModel').get('options'), option);
		},

		get_name: function () {
			return false;
		},

		get_value: function () {
			return false;
		}
	});

	UmapSettings = Upfront.Views.Editor.Settings.Settings.extend({	

		initialize: function () {
			this.panels = _([
				new panel({model: this.model})
			]);
		},

		get_title: function () {
			return "Map Settings";
		}
	});


})(jQuery);