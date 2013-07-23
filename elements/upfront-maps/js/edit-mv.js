/* 
Extends the visitor views to include events for editing content, such as double clicking on images to change their source.
This allows interactive views for the edit/upfront mode.
*/

(function ($){

	var init_map = Ufmap.View.map.prototype.init_map;
	Ufmap.View.map = Ufmap.View.map.extend({
		init_map: function(){
			var self = this;

			// prevent upfront from moving the module when user clicks map
			this.$el.on('click mousedown mouseup', function(e){
				e.cancelBubble = true;
				if (e.stopPropagation) {
					e.stopPropagation();
				}
			});
			
			setTimeout(function(){
				// create map, without setTimeout tiles only show in upper-left quadrant
				var gmap = init_map.apply(self, arguments);
			
				self.add_map_events(gmap);
				self.init_rightclick_context_menu(gmap);
				// google.maps.event.trigger(gmap, 'resize');
			}, 1);

		},

		add_map_events: function(map){
			var self = this;

			google.maps.event.addListener(map, 'zoom_changed', function() {
				self.model.get('options').zoom = map.getZoom();
				self.model.trigger('change:options');
			});

			google.maps.event.addListener(map, 'center_changed', function() {
				var c = map.getCenter();
				self.model.get('options').center = [c.lat(), c.lng()];
				self.model.trigger('change:options');
			});

			google.maps.event.addListener(map, 'maptypeid_changed', function() {
				self.model.get('options').mapTypeId = map.getMapTypeId();
				self.model.trigger('change:options');
			});
		},

		init_rightclick_context_menu: function(gmap){
			var contextMenu = this.get_context_menu(gmap);

			//	display the ContextMenu on a Map right click
			google.maps.event.addListener(gmap, 'rightclick', function(mouseEvent){
				contextMenu.show(mouseEvent.latLng);
			});
			
			//	listen for the ContextMenu 'menu_item_selected' event
			var self = this;
			google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
				//	latLng is the position of the ContextMenu
				//	eventName is the eventName defined for the clicked ContextMenuItem in the ContextMenuOptions
				switch(eventName){
					case 'add_marker':
						var marker = self.add_marker(gmap, latLng);
						self.save_marker(marker);
						self.add_infowindow(gmap, marker);
					break;
					case 'center_map':
						gmap.panTo(latLng);
					break;
				}
			});
		},


		get_context_menu: function(gmap){
			//	create the ContextMenuOptions object
			var contextMenuOptions={};
			contextMenuOptions.classNames={menu:'ufm-context-menu', menuSeparator:'context_menu_separator'};
			
			//	create an array of ContextMenuItem objects
			var menuItems=[];
			menuItems.push({className:'ufm-context-menu-item', eventName:'center_map', label:'Center Map Here'});
			menuItems.push({className:'ufm-context-menu-item', eventName:'add_marker', label:'Add Marker'});
			contextMenuOptions.menuItems=menuItems;

			//	create the ContextMenu object
			return new ContextMenu(gmap, contextMenuOptions);
		},



		init_marker_context_menu: function(gmap, marker){
			
			// create next context menu based on marker state
			var contextMenu = this.get_marker_context_menu(gmap);

			google.maps.event.addListener(marker, 'rightclick', function(mouseEvent){
				contextMenu.show(mouseEvent.latLng);
			});

			var self = this;
			google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
				//	latLng is the position of the ContextMenu
				//	eventName is the eventName defined for the clicked ContextMenuItem in the ContextMenuOptions
				switch(eventName){
					case 'remove_marker':
						self.remove_marker(marker);
					break;
					case 'change_icon':
						self.show_icon_select(gmap, marker);
					break;
				}
			});
			
			//google.maps.event.clearListeners(map, 'bounds_changed');

		},

		get_marker_context_menu: function(gmap){
			//	create the ContextMenuOptions object
			var contextMenuOptions={};
			contextMenuOptions.classNames={menu:'ufm-context-menu', menuSeparator:'context_menu_separator'};
			
			//	create an array of ContextMenuItem objects
			var menuItems=[];
			menuItems.push({className:'ufm-context-menu-item', eventName:'remove_marker', label:'Remove Marker'});
			menuItems.push({className:'ufm-context-menu-item', eventName:'change_icon', label:'Change Icon'});
			contextMenuOptions.menuItems=menuItems;

			//	create the ContextMenu object
			return new ContextMenu(gmap, contextMenuOptions);
		},

		add_marker: function(gmap, latLng, icon, id){
			var marker = new google.maps.Marker({
				position: latLng,
				draggable: true,
				map: gmap,
				title: "",
				icon: icon
			});

			if(typeof id != 'undefined'){
				marker.set('id', id);
			}

			this.init_marker_context_menu(gmap, marker);

			var self = this;
			google.maps.event.addListener(marker, 'dragend', function(){
				var p = marker.getPosition();
				self.update_marker(marker, p.lat(), p.lng());
			});
			google.maps.event.addListener(marker, 'icon_changed', function(){
				var markers = self.model.get('markers'),
					id = marker.get('id'),
					a = marker.getIcon();

				markers[id].icon = typeof a === 'string' ? a : null;
			});


			return marker;
		},

		save_marker: function (marker) {
			return this.model.save_marker(marker);
		},

		update_marker: function(marker, lat, lng){
			var markers = this.model.get('markers'),
				id = marker.get('id');

			if(id!=false && id in markers){
				markers[id].latLng = [lat, lng];
			}
		},

		remove_marker: function(marker){
			marker.setMap(null);

			// remove from model
			var markers = this.model.get('markers');
			delete markers[marker.get('id')];
			this.model.set('markers', markers);
		},

		add_infowindow: function(gmap, marker){
			var id = marker.get('id'),
				el_id = 'infowindow-'+this.model.cid+'-'+id,
				markers = this.model.get('markers'),
				data = markers[id]['infowindow'];

			var infowindow = new google.maps.InfoWindow({
				content: '<div contenteditable="true" id="'+el_id+'">'+(data.content != 0 ? data.content : 'Edit this...')+'</div>'
			});

			if(data.open==1){
				infowindow.open(gmap, marker);
			}

			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(gmap, marker);
				
				// highlight text to prepare for edit
				setTimeout(function(){
					if($('#'+el_id).length == 1){
						selectText(el_id);
					}
				}, 400);

				data.open = 1;
			});

			google.maps.event.addListener(infowindow, 'closeclick', function(){
				data.open = 0;
			});

			// update model when infowindow contents are changed
			$(this.$el).on("input", '#'+el_id, function(event){
				data.content = $(this).html();
			});
		},

		remove_infowindow: function(gmap){

		},

		show_icon_select: function(gmap, marker){
			var IconSelectOverlay = this.get_icon_select_overlay();
			this.icon_select_overlay = new IconSelectOverlay(gmap, marker);
			


		},

		// Returns a function that is a subclass of google.maps.OverlayView.
		// The custom OverlayView displays alternative icons for map markers.
		get_icon_select_overlay: function(map, marker){
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
				var t = $($("#ufm-map-marker-select").html()); // t = template instance
				this.div = t.get(0);

				// add images
				var img_names = ['POI.png', 'arts.png', 'bar.png', 'blue-dot.png', 'blue-pushpin.png', 'blue.png', 'bus.png', 'cabs.png', 'camera.png', 'campfire.png', 'campground.png', 'casetta_base.png', 'casetta_brown.png', 'casetta_green.png', 'casetta_red.png', 'casetta_yellow.png', 'caution.png', 'coffeehouse.png', 'convienancestore.png', 'cycling.png', 'dollar.png', 'drinking_water.png', 'earthquake.png', 'electronics.png', 'euro.png', 'fallingrocks.png', 'ferry.png', 'firedept.png', 'fishing.png', 'flag.png', 'gas.png', 'golfer.png', 'grocerystore.png', 'hiker.png', 'homegardenbusiness.png', 'hospitals.png', 'info_circle.png', 'man.png', 'marina.png', 'marker.png', 'plane.png', 'snack_bar.png', 'sportvenue.png', 'toilets.png', 'trail.png', 'tree.png', 'wheel_chair_accessible.png', 'woman.png'],
					img_dir = upfrontMap.pluginPath+'/img/markers/',
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

	// edit version has content editable for paragraph
	Ufmap.View.mapDesc = Ufmap.View.mapDesc.extend({
		events: {
			'input .content-editable': 'saveContent'
		},

		saveContent: function(ev){
			this.model.set('content', $(ev.currentTarget).html());
		},

		render:function () {
			this.$el.html(this.renderHTML());
			$('.content-editable', this.$el).attr('contenteditable', 'true');
			return this;
		}
	});


	function selectText(element) {
		var doc = document
			, text = doc.getElementById(element)
			, range, selection
		;    
		if (doc.body.createTextRange) {
			range = document.body.createTextRange();
			range.moveToElementText(text);
			range.select();
		} else if (window.getSelection) {
			selection = window.getSelection();        
			range = document.createRange();
			range.selectNodeContents(text);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

})(jQuery);