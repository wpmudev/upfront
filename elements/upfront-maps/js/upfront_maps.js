(function ($) {

if (!window.google) require(['async!https://maps.google.com/maps/api/js?v=3&libraries=places&sensor=false'], init);
else init();

function init () {
require(['maps_context_menu', 'text!' + Upfront.data.upfront_maps.root_url + 'css/edit.css'], function (_ctx, maps_style) {

	$("head").append("<style>" + maps_style + "</style>");

	var MapModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			this.init_property("type", "MapModel");
			this.init_property("view_class", "MapView");
			
			this.init_property("element_id", Upfront.Util.get_unique_id("upfront-map_element-object"));
			this.init_property("class", "c22 upfront-map_element-object");
			this.init_property("has_settings", 1);
		}
	});

	var Map_SettingsItem_ComplexItem = Upfront.Views.Editor.Settings.Item.extend({
		save_fields: function () {
			var model = this.model;
			this.fields.each(function (field) {
				var data = field.get_value();
				_(data).each(function (val, idx) {
					model.set_property(idx, val);
				});
			});
		}
	});

	var Maps_Fields_Simple_Checkbox = Upfront.Views.Editor.Field.Checkboxes.extend({
		multiple: false
	});


	var Map_Fields_Complex_BooleanDropdown = Backbone.View.extend({
		className: "upfront_map-fields-complex_boolean",
		initialize: function () {
			var model = this.options.model,
				boolean_values = this.options.boolean_field.values || []
			;
			if (!boolean_values.length) {
				boolean_values.push({label: "", value: "1"});
			}

			this.options.field = new Maps_Fields_Simple_Checkbox(_.extend(
				this.options.boolean_field, {
					model: model,
					values: boolean_values
			}));
			this.options.subfield = new Upfront.Views.Editor.Field.Select(_.extend(
				this.options.dropdown_field, {
					model: model
			}));
		},
		render: function () {
			this.$el.empty();

			this.options.subfield.render();
			this.options.field.render();

			this.$el.append(this.options.field.$el)
			this.$el.append(this.options.subfield.$el)
		},
		get_value: function () {
			var data = {};
			data[this.options.field.get_name()] = this.options.field.get_value();
			data[this.options.subfield.get_name()] = this.options.subfield.get_value();
			return data;
		}
	});

	var Map_Fields_Simple_Refresh = Upfront.Views.Editor.Field.Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-refresh',
		events: function () {
			return _.extend(
				{},
				Upfront.Views.Editor.Field.Text.prototype.events,
				{click: "propagate_activation_request"}
			);
		},
		get_field_html: function () {
			return '<button type="button"><img src="' + Upfront.data.upfront_maps.root_url + 'img/refresh.png" /></button>';
		},
		propagate_activation_request: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.trigger("refresh");
		}
	});

	var Map_Fields_Simple_Location = Backbone.View.extend({
		className: "upfront_map-fields-simple_location clearfix",
		events: {
			keypress: "wait_for_enter"
		},
		initialize: function () {
			var options = _.extend({}, this.options);
			this.options.field = new Upfront.Views.Editor.Field.Text(options);
			this.options.locate = new Map_Fields_Simple_Refresh(options);

			this.property = this.options.field.property;

			this.options.locate.on("refresh", this.geocode, this);
		},
		wait_for_enter: function (e) {
			if (13 == e.which) {
				e.stopPropagation();
				e.preventDefault();
				this.geocode();
			}
		},
		render: function () {
			this.$el.empty();

			this.options.locate.render();
			this.options.field.render();

			this.$el.append(this.options.field.$el);
			this.$el.append(this.options.locate.$el);
		},
		get_value: function () { return this.options.field.get_value(); },
		get_saved_value: function () { return this.options.field.get_saved_value(); },
		geocode: function () {
			var location = this.options.field.get_value(),
				element_id = this.model.get_property_value_by_name("element_id"),
				old_location = $(document).data(element_id + "-location"),
				geocoder = new google.maps.Geocoder(),
				me = this
			;
			if (!location || location == old_location) return false;
			geocoder.geocode({address: location}, function (results, status) {
				if (status != google.maps.GeocoderStatus.OK) return false;
				var pos = results[0].geometry.location;

				var markers = me.model.get_property_value_by_name("markers") || [];
				markers.push({lat:pos.lat(), lng:pos.lng()});
				me.model.set_property("markers", markers, true);

				me.model.set_property("map_center", [pos.lat(), pos.lng()], false);

				$(document).data(element_id + "-location", location);
			});
		}
	});

	var MapView = Upfront.Views.ObjectView.extend({
		OPTIMUM_MAP_HEIGHT: 300,
		map: false,

		on_render: function () {
			this.update_properties();
			var me = this,
				$el = this.$el.find('.ufm-gmap-container:first'),
				height = this.parent_module_view.model.get_property_value_by_name("row"),
				controls = this.model.get_property_value_by_name("controls") || [],
				props =	 {
					center: this.model.get_property_value_by_name("map_center") || [10.722250, 106.730762],
					zoom: parseInt(this.model.get_property_value_by_name("use_zoom"), 10) ? parseInt(this.model.get_property_value_by_name("zoom"), 10) : 10,
					type: parseInt(this.model.get_property_value_by_name("use_style"), 10) ? this.model.get_property_value_by_name("style") : 'HYBRID',
					panControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("pan") >= 0 : false,
					zoomControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("zoom") >= 0 : false,
					mapTypeControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("map_type") >= 0 : false,
					scaleControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("scale") >= 0 : false,
					streetViewControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("street_view") >= 0 : false,
					overviewMapControl: parseInt(this.model.get_property_value_by_name("use_controls"), 10) ? controls.indexOf("overview_map") >= 0 : false,
				}
			;
			height = height ? parseInt(height,10) * Upfront.Settings.LayoutEditor.Grid.baseline : height = this.OPTIMUM_MAP_HEIGHT;
			$el.css({
				'width': '100%',
				'height': height + 'px'
			});
			$el.on('click mousedown mouseup', function(e){
			//$el.on('click', function(e){
				e.cancelBubble = true;
				if (e.stopPropagation) {
					e.stopPropagation();
				}
			});
			this.map = new google.maps.Map($el.get(0), {
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
			// Re-render the map when needed
			setTimeout(function () {
				var center = me.map.getCenter();
				google.maps.event.trigger(me.map, 'resize');
				me.map.setCenter(center);
			}, 300);
			this.add_stored_markers();
			this.init_rightclick_context_menu();
		},

		get_content_markup: function () {
			return '<div class="ufm-gmap-container"><p>Please, hold on</p></div>';
		},

		update_properties: function () {
			/*
			var location = this.model.get_property_value_by_name("location"),
				element_id = this.model.get_property_value_by_name("element_id"),
				old_location = $(document).data(element_id + "-location"),
				geocoder = new google.maps.Geocoder(),
				me = this
			;
			if (!location || location == old_location) return false;
			geocoder.geocode({address: location}, function (results, status) {
				if (status != google.maps.GeocoderStatus.OK) return false;
				var pos = results[0].geometry.location;
				me.model.set_property("map_center", [pos.lat(), pos.lng()]);
				me.map.setCenter(pos);
				$(document).data(element_id + "-location", location);
			});
			*/
		},

		center_map: function (lat, lng) {
			var pos = new google.maps.LatLng(lat, lng);
			this.map.setCenter(pos);
			this.model.set_property("map_center", [lat, lng]);
		},

		init_rightclick_context_menu: function () {
			//	create the ContextMenuOptions object
			var contextMenuOptions = {};
			contextMenuOptions.classNames={menu:'ufm-context-menu', menuSeparator:'context_menu_separator'};
			
			//	create an array of ContextMenuItem objects
			var menuItems=[];
			menuItems.push({className:'ufm-context-menu-item', eventName:'center_map', label:'Center Map Here'});
			menuItems.push({className:'ufm-context-menu-item', eventName:'add_marker', label:'Add Marker'});
			contextMenuOptions.menuItems=menuItems;

			//	create the ContextMenu object
			var contextMenu = new ContextMenu(this.map, contextMenuOptions);

			//	display the ContextMenu on a Map right click
			google.maps.event.addListener(this.map, 'rightclick', function (mouseEvent) {
				contextMenu.show(mouseEvent.latLng);
			});
			
			//	listen for the ContextMenu 'menu_item_selected' event
			var me = this;
			google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
				//	latLng is the position of the ContextMenu
				//	eventName is the eventName defined for the clicked ContextMenuItem in the ContextMenuOptions
				switch(eventName){
					case 'add_marker':
						me.add_marker(latLng.lat(), latLng.lng());
					break;
					case 'center_map':
						me.center_map(latLng.lat(), latLng.lng());
					break;
				}
			});
		},

		init_marker_context_menu: function (marker) {
			var contextMenuOptions={};
			contextMenuOptions.classNames={menu:'ufm-context-menu', menuSeparator:'context_menu_separator'};
			
			//	create an array of ContextMenuItem objects
			var menuItems=[];
			menuItems.push({className:'ufm-context-menu-item', eventName:'remove_marker', label:'Remove Marker'});
			menuItems.push({className:'ufm-context-menu-item', eventName:'change_icon', label:'Change Icon'});
			contextMenuOptions.menuItems=menuItems;
			
			// create next context menu based on marker state
			var contextMenu = new ContextMenu(this.map, contextMenuOptions);

			google.maps.event.addListener(marker, 'rightclick', function(mouseEvent){
				contextMenu.show(mouseEvent.latLng);
			});

			var me = this;
			google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
				switch(eventName){
					case 'remove_marker':
						me.remove_map_marker(marker);
						break;
					case 'change_icon':
						me.show_icon_select(marker);
						break;
				}
			});
		},

		add_marker: function (lat, lng) {
			var markers = this.model.get_property_value_by_name("markers") || [];
			markers.push({lat:lat, lng:lng});
			this.model.set_property("markers", markers);
			this.add_map_marker({lat:lat, lng:lng});
		},

		update_marker: function (marker) {
			var markers = this.model.get_property_value_by_name("markers") || [];
			_(markers).each(function (mrk, idx) {
				if (mrk.lat === marker.lat && mrk.lng === marker.lng) markers[idx] = marker;
			});
			this.model.set_property("markers", markers);
		},

		add_map_marker: function (marker) {
			var me = this,
				mrk = new google.maps.Marker({
					position: new google.maps.LatLng(marker.lat, marker.lng),
					draggable: false,
					icon: marker.icon ? marker.icon : '',
					map: this.map
				}),
				$info = $('<div contenteditable="true">' + (marker.content ? marker.content : 'Edit this...') + '</div>'),
				info = new google.maps.InfoWindow({
					content: $info.get(0)
				})
			;
			mrk._raw = marker;
			$info.on('input', function () {
				marker.content = $info.text();
				me.update_marker(marker);
			})
			if (marker.is_open) info.open(me.map, mrk);
			google.maps.event.addListener(mrk, 'click', function() {
				if (!marker.is_open) {
					info.open(me.map, mrk);
					marker.is_open = true;
				} else {
					marker.is_open = false;
					info.close();
				}
				me.update_marker(marker);
			});
			this.init_marker_context_menu(mrk);
		},

		remove_map_marker: function (marker) {
			var pos = marker._raw,
				markers = this.model.get_property_value_by_name("markers") || [],
				new_markers = []
			;
			_(markers).each(function (mrk, idx) {
				if (mrk.lat !== pos.lat || mrk.lng !== pos.lng) new_markers.push(mrk);
			});
			this.model.set_property("markers", new_markers);
			marker.setMap(null);
		},

		add_stored_markers: function () {
			var me = this,
				markers = this.model.get_property_value_by_name("markers") || []
			;
			_(markers).each(function (marker) {
				me.add_map_marker(marker);
			});
		},

		show_icon_select: function (marker) {
			var IconSelectOverlay = this.get_icon_select_overlay();
			this.icon_select_overlay = new IconSelectOverlay(this.map, marker);
		},

		// Returns a function that is a subclass of google.maps.OverlayView.
		// The custom OverlayView displays alternative icons for map markers.
		get_icon_select_overlay: function (marker) {
			var map = this.map,
				me = this
			;
			function a(map, marker) {
				this.map = map;
				this.marker = marker;
				this.div = null;
				this.setMap(map);
			}

			a.prototype = new google.maps.OverlayView();

			a.prototype.onAdd = function() {
				var self = this;

				// create DOM node for overlay
				var t = $(
					'<div class="ufm-map-marker-select ufm-rounded">' +
						'<div class="marker-imgs"></div>' +
						'<div class="marker-url">' +
							'<label for="marker-url">Image URL (.png):</label>' +
							'<textarea id="marker-url" name="marker-url" value="" rows="4"/></textarea>' +
						'</div>' +
					'</div>'
				); // t = template instance
				this.div = t.get(0);

				// add images
				var img_names = ['POI.png', 'arts.png', 'bar.png', 'blue-dot.png', 'blue-pushpin.png', 'blue.png', 'bus.png', 'cabs.png', 'camera.png', 'campfire.png', 'campground.png', 'casetta_base.png', 'casetta_brown.png', 'casetta_green.png', 'casetta_red.png', 'casetta_yellow.png', 'caution.png', 'coffeehouse.png', 'convienancestore.png', 'cycling.png', 'dollar.png', 'drinking_water.png', 'earthquake.png', 'electronics.png', 'euro.png', 'fallingrocks.png', 'ferry.png', 'firedept.png', 'fishing.png', 'flag.png', 'gas.png', 'golfer.png', 'grocerystore.png', 'hiker.png', 'homegardenbusiness.png', 'hospitals.png', 'info_circle.png', 'man.png', 'marina.png', 'marker.png', 'plane.png', 'snack_bar.png', 'sportvenue.png', 'toilets.png', 'trail.png', 'tree.png', 'wheel_chair_accessible.png', 'woman.png'],
					img_dir = Upfront.data.upfront_maps.markers,
					all_imgs = '';

				_.each(img_names, function(img){
					all_imgs = all_imgs + '<div class="ufm-marker-demo ufm-rounded"> <img src="'+img_dir+img+'" /> </div>'
				});

				$('.marker-imgs', t).html(all_imgs);
				
				// on image click set icon img src
				$('.marker-imgs img', t).on('click dblclick', function(){
					var contain = $(this).parent(),
						v = contain.hasClass('ufm-current') ? 
								'' :
								$(this).attr('src');

					$('div', contain.parent()).removeClass('ufm-current');
					
					if(v!==''){
						contain.addClass('ufm-current');
					}
					url_textarea.val(v).trigger('change');
					
				});

				// close window on icon dbl click, or OK btn click
				$('.marker-imgs img', t).on('dblclick', function(){
					self.setMap(null);
				});
				$('.marker-url button', t).click(function(){
					self.setMap(null);
				});

				var url_textarea = $('.marker-url [name="marker-url"]', t);
				
				var a = this.marker.getIcon(),
					src = typeof a === 'string' ? a : '';

				$('img[src="'+src+'"]',t).parent().addClass('ufm-current');
				url_textarea.val(src);

				url_textarea.click(function(){this.focus();});
				
				url_textarea.on('input propertychange change', function(){
					var url = $(this).val(),
						url = url === '' ? null : url;

					if(/png$/.test(url) || url === null){
						self.marker._raw.icon = url;
						me.update_marker(self.marker._raw);
						self.marker.setIcon(url);
					}
				});

				// prevent map zoom or pan when events occur on overlay DOM node
				var stopPropagation = function(e){
					e.cancelBubble = true;
					if (e.stopPropagation) {
						e.stopPropagation();
					}
				};
				google.maps.event.addDomListener(this.div, 'click', stopPropagation);
				google.maps.event.addDomListener(this.div, 'dblclick', stopPropagation);
				$(this.div).on('click mousedown mouseup', stopPropagation);

				// close overlay when user clicks on map
				var closeOverlay = function(e){
					self.setMap(null);
				};
				google.maps.event.addListener(this.map, 'click', closeOverlay);
				google.maps.event.addListener(this.map, 'rightclick', closeOverlay);

				var panes = this.getPanes();
				panes.floatPane.appendChild(this.div);
			}

			a.prototype.draw = function(){

				// Size and position the overlay. We use a southwest and northeast
				// position of the overlay to peg it to the correct position and size.
				// We need to retrieve the projection from this overlay to do this.
				var overlayProjection = this.getProjection();

				// Retrieve the southwest and northeast coordinates of this overlay
				// in latlngs and convert them to pixels coordinates.
				// We'll use these coordinates to resize the DIV.
				var latlng = this.marker.getPosition();
				var xy = overlayProjection.fromLatLngToDivPixel(latlng);

				// Resize the image's DIV to fit the indicated dimensions.
				var div = this.div;
				div.style.left = (xy.x-170) + 'px';
				div.style.top = (xy.y + 15) + 'px';
				div.style.width = '320px';
			}

			a.prototype.onRemove = function(){
				this.div.parentNode.removeChild(this.div);
				this.div = null;
			}

			return a;
		}
	});

	var MapElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 40,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-maps');
			this.$el.html('Map');
		},

		add_element: function () {
			var object = new MapModel(),
				module = new Upfront.Models.Module({ 
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c12 upfront-map_element-module"},
						{"name": "has_settings", "value": 0}
					],
					"objects": [object]
				})
			;
			this.add_module(module);
		}
	});

	var MapSettings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function () {
			this.panels = _([
				new MapSettings_Panel({model: this.model})
			]);
		},
		get_title: function () {
			return "Map settings";
		}
	});
		var MapSettings_Panel = Upfront.Views.Editor.Settings.Panel.extend({
			initialize: function () {
				this.settings = _([
					new MapSettings_Field_Location({model: this.model}),
					new MapSettings_Field_Zoom({model: this.model}),
					new MapSettings_Field_Style({model: this.model}),
					new MapSettings_Field_Controls({model: this.model})
				]);
			},
			render: function () {
				Upfront.Views.Editor.Settings.Panel.prototype.render.call(this);
				this.$el.addClass("ufpront-maps_element-settings_panel");
			},
			get_label: function () {
				return "Google Map";
			},
			get_title: function () {
				return "Google Map";
			}
		});

			var MapSettings_Field_Location = Upfront.Views.Editor.Settings.Item.extend({
				className: "upfront-settings-item-maps_element-location",
				initialize: function () {
					this.fields = _([
						new Map_Fields_Simple_Location({
							model: this.model,
							property: 'location'
						})
					]);
				},
				get_title: function () {
					return "Location";
				}
			});

			var MapSettings_Field_Zoom = Map_SettingsItem_ComplexItem.extend({
				initialize: function () {
					var zooms = [],
						saved = this.model.get_property_value_by_name("zoom")
					;
					if (!saved) this.model.set_property("zoom", 10, true);
					_(_.range(1,19)).each(function (idx) {
						zooms.push({label: idx, value: idx});
					});
					this.fields = _([
						new Map_Fields_Complex_BooleanDropdown({
							model: this.model,
							boolean_field: {
								property: 'use_zoom',
							},
							dropdown_field: {
								property: 'zoom',
								values: zooms
							}
						})
					]);
				},
				get_title: function () {
					return "Map Zoom";
				}
			});

			var MapSettings_Field_Style = Map_SettingsItem_ComplexItem.extend({
				initialize: function () {
					var styles = [
						{label: "Roadmap", value: "ROADMAP"},
						{label: "Satellite", value: "SATELLITE"},
						{label: "Hybrid", value: "HYBRID"},
						{label: "Terrain", value: "TERRAIN"},
					];
					this.fields = _([
						new Map_Fields_Complex_BooleanDropdown({
							model: this.model,
							boolean_field: {
								property: 'use_style',
							},
							dropdown_field: {
								property: 'style',
								values: styles
							}
						})
					]);
				},
				get_title: function () {
					return "Map Style";
				}
			});

			var MapSettings_Field_Controls = Map_SettingsItem_ComplexItem.extend({
				initialize: function () {
					var controls = [
						{label: "Pan", value: "pan"},
						{label: "Zoom", value: "zoom"},
						{label: "Map Type", value: "map_type"},
						{label: "Scale", value: "scale"},
						{label: "Street View", value: "street_view"},
						{label: "Overview Map", value: "overview_map"},
					];
					this.fields = _([
						new Map_Fields_Complex_BooleanDropdown({
							model: this.model,
							boolean_field: {
								property: 'use_controls',
							},
							dropdown_field: {
								property: 'controls',
								multiple: true,
								values: controls
							}
						})
					]);
				},
				get_title: function () {
					return "Controls";
				}
			});


	Upfront.Application.LayoutEditor.add_object("Map", {
		"Model": MapModel,
		"View": MapView,
		"Element": MapElement,
		"Settings": MapSettings
	});
	Upfront.Models.MapModel = MapModel;
	Upfront.Views.MapView = MapView;

	Upfront.Events.trigger("elements:requirements:async:added");

});
};

})(jQuery);