(function ($) {

// I have removed logic that checks if google maps are loaded. In current
// app setup maps will always we loaded before this script.
define([
	'maps_context_menu',
	'text!elements/upfront-maps/css/edit.css',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/inline-panels/map-editor',
	'text!upfront/templates/api_key_overlay_element.html'
], function (
	_ctx,
	maps_style,
	ElementSettings,
	RootSettingsPanel,
	MapEditorView,
	api_key_overlay_element_template
) {

	var DEFAULTS = {
		OPTIMUM_MAP_HEIGHT: 300,
		center: [-37.8180, 144.9760],
		zoom: 10,
		style: 'ROADMAP',
		use_custom_map_code: false,
		controls: {
			pan: false,
			zoom: false,
			map_type: false,
			scale: false,
			street_view: false,
			overview_map: false
		}
	};

	var l10n = Upfront.Settings.l10n.maps_element;

	$("head").append("<style>" + maps_style + "</style>");

	var MapModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.umaps.defaults);

			DEFAULTS.center = properties.map_center; // Keep the center position as set on PHP side
			if (navigator && navigator.geolocation) delete(properties.map_center); // ... but do NOT initialize it as a model property

			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
			this.init_properties(properties);
		}
	});

	var Maps_Fields_Simple_Checkbox = Upfront.Views.Editor.Field.Checkboxes.extend({
		multiple: false
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
		className: "upfront_map-fields-simple_location map_location clearfix",
		events: {
			keypress: "wait_for_enter"
		},
		initialize: function (opts) {
			this.options = opts;
			if(! (this.model instanceof MapModel)){
				this.model = new MapModel({properties: this.model.get('properties')});
			}

			var options = _.extend({}, opts);

			this.options.field = new Upfront.Views.Editor.Field.Text(options);
			this.options.locate = new Map_Fields_Simple_Refresh(options);

			this.property = this.options.field.property;

			this.options.locate.on("refresh", this.geocode, this);
			this.model.on("options:location:geocode", this.geocode, this);
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

			var address = this.model.get_property_value_by_name("address") || '';
			this.options.field.set_value(address);

			this.$el.append(this.options.field.$el);
			this.$el.append(this.options.locate.$el);
		},
		get_value: function () { return this.options.field.get_value(); },
		get_saved_value: function () { return this.options.field.get_saved_value(); },
		geocode: function () {
			if ("undefined" === typeof window.google) return false;
			var location = this.options.field.get_value(),
				element_id = this.model.get_property_value_by_name("element_id"),
				old_location = $(document).data(element_id + "-location"),
				old_address = this.model.get_property_value_by_name("address"),
				geocoder = new google.maps.Geocoder(),
				me = this
			;
			if (!location || location === old_location) return false;
			// Do not geocode if no API Key has been set.
			if (!(window._upfront_api_keys || {})['gmaps']) return false;
			if (location === old_address) return false; // Do not re-geocode the same location
			if (this._geocoding_in_progress) return false;
			this._geocoding_in_progress = true;
			geocoder.geocode({address: location}, function (results, status) {
				if (status != google.maps.GeocoderStatus.OK) {
					me._geocoding_in_progress = false;
					return false;
				}
				var pos = results[0].geometry.location;
				var markers = me.model.get_property_value_by_name("markers") || [];
				markers.push({lat:pos.lat(), lng:pos.lng()});
				me.model.set_property("markers", markers, true);
				me.model.set_property("address", location, true);

				me.model.set_property("map_center", [pos.lat(), pos.lng()], false);

				$(document).data(element_id + "-location", location);
				me._geocoding_in_progress = false;
			});
		}
	});

	var UmapView = Upfront.Views.ObjectView.extend({
		map: false,

		init: function () {
			this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.refresh_map);
		},

		on_element_resize: function (attr) {
			//Refresh Map size when resize finish
			this.refresh_map();

			// Add/remove multiple module class.
			$object = this.$el.find('.upfront-editable_entity:first');
			this.add_multiple_module_class($object);
		},

		on_render: function () {
			this.update_properties();
			var me = this,
				$el = this.$el.find('.ufm-gmap-container:first'),
				height = (this.model.get_breakpoint_property_value("row", true) ? this.model.get_breakpoint_property_value("row", true) : this.parent_module_view.model.get_breakpoint_property_value("row", true)),
				controls = this.model.get_property_value_by_name("controls") || [],
				props = {
					center: this.model.get_property_value_by_name("map_center") || DEFAULTS.center,
					zoom: parseInt(this.model.get_property_value_by_name("zoom"), 10) || DEFAULTS.zoom,
					type: this.model.get_property_value_by_name("style") || DEFAULTS.style,
					panControl: controls.indexOf("pan") >= 0 || DEFAULTS.controls.pan,
					zoomControl: controls.indexOf("zoom") >= 0 || DEFAULTS.controls.zoom,
					mapTypeControl: controls.indexOf("map_type") >= 0 || DEFAULTS.controls.map_type,
					scaleControl: controls.indexOf("scale") >= 0 || DEFAULTS.controls.scale,
					streetViewControl: controls.indexOf("street_view") >= 0 || DEFAULTS.controls.street_view,
					overviewMapControl: controls.indexOf("overview_map") >= 0 || DEFAULTS.controls.overview_map,
					style_overlay: (this.model.get_property_value_by_name("use_custom_map_code") ? JSON.parse(this.model.get_property_value_by_name("map_styles")) || false : false),
					draggable: !!this.model.get_property_value_by_name("draggable"),
					scrollwheel: !!this.model.get_property_value_by_name("scrollwheel")
				}
			;
			height = height ? parseInt(height,10) * Upfront.Settings.LayoutEditor.Grid.baseline : DEFAULTS.OPTIMUM_MAP_HEIGHT;
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

			if ("undefined" !== typeof window.google) {
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
					draggable: props.draggable,
					scrollwheel: props.scrollwheel
				});
				if (props.style_overlay) {
					this.map.setOptions({styles: props.style_overlay});
				}
				// If no location and API key
				// overlay is not there, show location overlay.
				if (
					!this.model.get_property_value_by_name("map_center")
					&& (window._upfront_api_keys || {})['gmaps']
				) {
					this.add_location_overlay();
				}

				// Display Empty API Key Overlay.
				if (
					!(window._upfront_api_keys || {})['gmaps']
					&& Upfront.Application.user_can_modify_layout()
					// Warn if invalid API Key.
					|| typeof google_maps_auth_error !== 'undefined'
				) {
					this.add_api_key_overlay();
				}

				// Re-render the map when needed
				setTimeout(function () {
					var center = me.map.getCenter();
					google.maps.event.trigger(me.map, 'resize');
					me.map.setCenter(center);
				}, 300);
				this.add_stored_markers();
				this.init_rightclick_context_menu();
			} else {
				$el.html("<p class='upfront-util-icon'>" + l10n.connectivity_warning + "</p>");
			}
		},

		refresh_map: function () {
			var $el = this.$el.find('.ufm-gmap-container:first'),
				height = (this.model.get_breakpoint_property_value("row", true) ? this.model.get_breakpoint_property_value("row", true) : this.parent_module_view.model.get_breakpoint_property_value("row", true));
			height = height ? parseInt(height,10) * Upfront.Settings.LayoutEditor.Grid.baseline : DEFAULTS.OPTIMUM_MAP_HEIGHT;
			$el.css({
				'height': height + 'px'
			});
			google.maps.event.trigger(this.map, 'resize');
		},

		// If no API Key, display notice.
		add_api_key_overlay: function() {
			// Hide Map in background.
			this.el.querySelector('.upfront-map_element-object').style.opacity = 0;
			this.$el.append(
				_.template(api_key_overlay_element_template)
			);
		},

		add_location_overlay: function () {
			var me = this,
				$location = this.$el.find("#upfront_map-location_overlay-wrapper")
			;
			if (!$location.length && Upfront.Application.user_can_modify_layout()) {
				// Hide Map in background.
				this.el.querySelector('.upfront-map_element-object').style.opacity = 0;
				this.$el.append(
					'<div id="upfront_map-location_overlay-wrapper" class="upfront-initial-overlay-wrapper">' +
						'<div id="upfront_map-location_overlay" class="uf_el_map_initial-overlay upfront-initial-overlay-wrapper">' +
							'<p id="upfront_map-location_overlay-instruction">' + l10n.instructions + '</p>' +
							'<div id="upfront_map-location_overlay-address" class="upfront-ui uf-address">' +
								'<input type="text" id="upfront_map-location_overlay-location"/>' +
								'<button type="button" id="upfront_map-location_overlay-use_location" class="upfront-field-icon upfront-icon-map-refresh"></button></div>' +
								'<span class="uf-current-location">' + l10n.or + ' <a id="upfront_map-location_overlay-use_current">' + l10n.use_current_location + '</a></span>' +
						'</div>' +
					'</div>'
				);
				$location = this.$el.find("#upfront_map-location_overlay-wrapper");
			} else if (!Upfront.Application.user_can_modify_layout()) {
				this.$el.empty();
			}

			$location
				.find("#upfront_map-location_overlay-use_location").off("click").on("click", function () {
					var $address = me.$el.find("#upfront_map-location_overlay-wrapper #upfront_map-location_overlay-location"),
						geocoder = new google.maps.Geocoder(),
						element_id = me.model.get_property_value_by_name("element_id"),
						add = $address.length ? $address.val() : ''
					;
					// If no address or no API Key, return false.
					if (!add || !(window._upfront_api_keys || {})['gmaps']) return false;

					geocoder.geocode({address: add}, function (results, status) {
						if (status != google.maps.GeocoderStatus.OK) return false;
						var pos = results[0].geometry.location;

						var markers = me.model.get_property_value_by_name("markers") || [];
						markers.push({lat:pos.lat(), lng:pos.lng()});
						me.model.set_property("markers", markers, true);
						me.model.set_property("address", add, true);

						me.model.set_property("map_center", [pos.lat(), pos.lng()], false);

						$(document).data(element_id + "-location", location);
					});
				}).end()
				.find("#upfront_map-location_overlay-location")
					.off("keydown").on("keydown", function (e) {
						if (13 === e.which) {
							$location.find("#upfront_map-location_overlay-use_location").click();
							Upfront.Events.trigger("upfront:element:edit:stop"); // Trigger this so we can drag maps with enter-submitted locations
						}
					})
					.off("click").on("click", function (e) {
						$(this).focus();
					})
				.end()
				.off("dblclick").on("dblclick", function (e) {
					e.preventDefault();
					e.stopPropagation();
				})
			;

			var $current = $location.find("#upfront_map-location_overlay-use_current");
			if (navigator && navigator.geolocation) {
				$current.off("click").on("click", function () {
					if (!(navigator && navigator.geolocation)) return false;
					var markers = me.model.get_property_value_by_name("markers") || [];
					navigator.geolocation.getCurrentPosition(
						// Success!
						function (position) {
							markers.push({lat:position.coords.latitude, lng:position.coords.longitude});
							me.model.set_property("markers", markers, true);
							me.model.set_property("map_center", [position.coords.latitude, position.coords.longitude], false);
						},
						// Error, boo!
						function () {
							$current.closest(".uf-current-location").text(l10n.unable_to_geolocate);
						}
					);
				});
			} else {
				// No geolocation, no link
				if (($current || {}).remove) $current.remove();
			}

			this.$el.find(".upfront-entity_meta").hide();
		},

		get_content_markup: function () {
			return '<div class="ufm-gmap-container"><p>' + l10n.hold_on + '</p></div>';
		},

		update_properties: function () {
			this.model.trigger("options:location:geocode");
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
			menuItems.push({className:'ufm-context-menu-item', eventName:'center_map', label:l10n.menu.center_map});
			menuItems.push({className:'ufm-context-menu-item', eventName:'add_marker', label:l10n.menu.add_marker});
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
			menuItems.push({className:'ufm-context-menu-item', eventName:'remove_marker', label:l10n.menu.remove_marker});
			menuItems.push({className:'ufm-context-menu-item', eventName:'change_icon', label:l10n.menu.change_icon});
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
			if (!!this.model.get_property_value_by_name("hide_markers")) return false;
			var me = this,
				mrk = new google.maps.Marker({
					position: new google.maps.LatLng(marker.lat, marker.lng),
					draggable: false,
					icon: marker.icon ? marker.icon : '',
					map: this.map
				}),
				$info = $('<div contenteditable="true">' + (marker.content ? marker.content : l10n.edit_this) + '</div>'),
				info = new google.maps.InfoWindow({
					content: $info.get(0)
				})
			;
			mrk._raw = marker;
			$info.on('input', function () {
				marker.content = $info.text();
				me.update_marker(marker);
			});
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
							'<label for="marker-url">' + l10n.image_url + '</label>' +
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
					all_imgs = all_imgs + '<div class="ufm-marker-demo ufm-rounded"> <img src="'+img_dir+img+'" /> </div>';
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
					var url = $(this).val();
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
			};

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
			};

			a.prototype.onRemove = function(){
				this.div.parentNode.removeChild(this.div);
				this.div = null;
			};

			return a;
		}
	});

	var MapElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 50,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-maps');
			this.$el.html(l10n.element_name);
		},

		add_element: function () {
			var object = new MapModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c12 upfront-map_element-module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(330)}
					],
					"objects": [object]
				})
			;
			this.add_module(module);
		}
	});

	var MapSettings_Panel = RootSettingsPanel.extend({
		title: l10n.general_settings,
		initialize: function (opts) {
			this.options = opts;
			this.settings = _([
				new MapSettings_Field_Location({model: this.model}),
				new MapSettings_Settings({model: this.model}),
				new Upfront.Views.Editor.Settings.Settings_CSS({model: this.model })
			]);
		},

		get_label: function () {
			return l10n.label;
		},
		get_title: function () {
			return l10n.label;
		}
	});

	var MapSettings = ElementSettings.extend({
		panels: {
			'Settings' : MapSettings_Panel
		},
		title: l10n.settings
	});

	var MapSettings_Field_Location = Upfront.Views.Editor.Settings.Item.extend({
		className: "upfront-settings-item-maps_element-location general_settings_item",
		initialize: function () {
			this.fields = _([
				new Map_Fields_Simple_Location({
					model: this.model,
					hide_label: true,
					property: 'location'
				})
			]);
		},
		get_title: function () {
			return l10n.location_label;
		}
	});

	var MapSettings_Settings = Upfront.Views.Editor.Settings.Item.extend({
		events: {
			"click .open-map-code-panel-button": "init_code_panel"
		},
		className: "general_settings_item",
		initialize: function () {
			var zooms = [],
				saved_zoom = this.model.get_property_value_by_name("zoom")
			;
			if (!saved_zoom) this.model.set_property("zoom", DEFAULTS.zoom, true);
			_(_.range(1,19)).each(function (idx) {
				zooms.push({label: idx, value: idx});
			});
			var saved_style = this.model.get_property_value_by_name("style"),
				styles = [
					{label: l10n.style.roadmap, value: "ROADMAP"},
					{label: l10n.style.satellite, value: "SATELLITE"},
					{label: l10n.style.hybrid, value: "HYBRID"},
					{label: l10n.style.terrain, value: "TERRAIN"}
				]
			;
			if (!saved_style) this.model.set_property("style", DEFAULTS.style, true);
			var controls = [
				{label: l10n.ctrl.pan, value: "pan"},
				{label: l10n.ctrl.zoom, value: "zoom"},
				{label: l10n.ctrl.type, value: "map_type"},
				{label: l10n.ctrl.scale, value: "scale"},
				{label: l10n.ctrl.street_view, value: "street_view"},
				{label: l10n.ctrl.overview, value: "overview_map"}
			];
			this.fields = _([
				new Upfront.Views.Editor.Field.Slider({
					className: 'upfront-field-wrap upfront-field-wrap-slider map-zoom-level',
					model: this.model,
					label: l10n.zoom_level,
					property: 'zoom',
					min: 1,
					max: 19,
					change: function () { this.property.set({value: this.get_value()}); }
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					label: l10n.map_style,
					className: 'map-style',
					property: 'style',
					values: styles,
					change: function () { this.property.set({value: this.get_value()}); }
				}),
				new Upfront.Views.Editor.Field.Multiple_Chosen_Select({
					model: this.model,
					label: l10n.map_controls,
					placeholder: "Choose map controls",
					property: 'controls',
					select_width: '225px',
					multiple: true,
					values: controls,
					change: function () { this.property.set({value: this.get_value()}); }
				}),
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					label: l10n.draggable_map,
					property: "draggable",
					className: 'draggable-checkbox',
					hide_label: true,
					values: [{label: l10n.draggable_map, value: 1}],
					multiple: false,
					change: function () { this.property.set({value: this.get_value()}); }
				}),
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					label: l10n.hide_markers,
					className: 'markers-checkbox',
					property: "hide_markers",
					hide_label: true,
					values: [{label: l10n.hide_markers, value: 1}],
					multiple: false,
					change: function () { this.property.set({value: this.get_value()}); }
				}),
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					label: l10n.use_custom_map_code,
					property: "use_custom_map_code",
					className: "upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes custom-map-code",
					hide_label: true,
					values: [{label: l10n.use_custom_map_code + '<span class="checkbox-info" title="' + l10n.use_custom_map_code_info + '"></span>', value: 1}],
					multiple: false,
					change: function () {
						var value = this.get_value();

						this.property.set({value: value});
					},
					show: function (value, $el) {
						if(value == 1) {
							$('.open-map-code-panel-button', $el.parent()).show();
						}
						else {
							$('.open-map-code-panel-button', $el.parent()).hide();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.open_map_code_panel,
					className: "open-map-code-panel-button",
					compact: true
				})
			]);
		},
		get_title: function () {
			return l10n.settings;
		},
		init_code_panel: function () {
			var view = new MapEditorView({model: this.model});
			view.render();
		}
	});

	Upfront.Application.LayoutEditor.add_object("Map", {
		"Model": MapModel,
		"View": UmapView,
		"Element": MapElement,
		"Settings": MapSettings,
		cssSelectors: {
			'.ufm-gmap-container': {label: l10n.css.label, info: l10n.css.info}
		},
		cssSelectorsId: Upfront.data.umaps.defaults.type
	});
	Upfront.Models.MapModel = MapModel;
	Upfront.Views.UmapView = UmapView;
});

})(jQuery);
