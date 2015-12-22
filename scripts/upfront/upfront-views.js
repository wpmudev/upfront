(function ($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	"text!upfront/templates/object.html",
	"text!upfront/templates/module.html",
	"text!upfront/templates/module_group.html",
	"text!upfront/templates/region_container.html",
	"text!upfront/templates/region.html",
	"text!upfront/templates/wrapper.html",
	"text!upfront/templates/layout.html"
], function () {
  var _template_files = [
    "text!upfront/templates/object.html",
    "text!upfront/templates/module.html",
    "text!upfront/templates/module_group.html",
    "text!upfront/templates/region_container.html",
    "text!upfront/templates/region.html",
    "text!upfront/templates/wrapper.html",
    "text!upfront/templates/layout.html"
];

	// Auto-assign the template contents to internal variable
	var _template_args = arguments,
		_Upfront_Templates = {}
	;
	_(_template_files).each(function (file, idx) {
		_Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
	});

	var
		_dispatcher = _.clone(Backbone.Events),

		_Upfront_ViewMixin = {
			"dispatcher": _dispatcher
		},

	/* ----- Core View Mixins ----- */

		FixedObject_Mixin = {
			activate_condition: function () {
				return false;
			}
		},

		FixedObjectInAnonymousModule_Mixin = {
			activate_condition: function () {
				var parent_view = this.parent_module_view,
					parent_model = parent_view && parent_view.model ? parent_view.model : false
				;
				if (!parent_model) return true; // Something went wrong, assume we're not in anonymos module
				return !!parent_model.get("name").length; // Anonymous parent check
			}
		},

		Anchorable_Mixin = {
			anchor: {
				is_target: true,
				is_trigger: false
			}
		},

	/* ----- Core views ----- */

		_Upfront_SingularEditor = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
			initialize: function (opts) {
				// this.model.bind("change", this.render, this);
				this.options = opts;
				this.listenTo(this.model, "change", this.render);
				if (this.init) this.init();
			},
			_get_full_size_el: function ($el, ratio, inside) {
				var width = $el.width(),
					height = $el.height();
				return this._get_full_size(width, height, ratio, inside);
			},
			_get_full_size: function (width, height, ratio, inside) {
				if ( !inside ) {
					if ( Math.round(height/width*100)/100 > ratio ) {
						var w = (height/ratio);
						return [ w, height, (width-w)/2, 0 ];
					} else {
						var h = (width*ratio);
						return [ width, h, 0, (height-h)/2 ];
					}
				} else {
					if ( Math.round(height/width*100)/100 < ratio ) {
						var w = (height/ratio);
						return [ w, height, (width-w)/2, 0 ];
					} else {
						var h = (width*ratio);
						return [ width, h, 0, (height-h)/2 ];
					}
				}
			},
			update_background: function () {
				var me = this,
					is_layout = ( this instanceof Layout ),
					$bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					type = this.model.get_breakpoint_property_value('background_type', true),
					$overlay = $bg.children('.upfront-region-bg-overlay');

				if ( type != 'featured' && me.$el.children('.feature_image_selector').length > 0 ) {
					me.$el.children('.feature_image_selector').remove();
				}
				if ( !type || type == 'color') {
					this.update_background_color();
					if ( $overlay.length ) {
						$overlay.hide();
					}
				} else {
					if ( ! $overlay.length ) {
						$overlay = $('<div class="upfront-region-bg-overlay" />');
						$bg.append($overlay);
					} else {
						$overlay.show();
					}
					var $type = $overlay.find('.upfront-region-bg-'+type);
					if ( ! $type.length ) {
						$type = $('<div class="upfront-region-bg upfront-region-bg-' + type + '" />');
						$overlay.append($type);
					} else {
						$type.show();
					}
					$overlay.find('.upfront-region-bg').not($type).hide();
					$bg.css({
						backgroundColor: "",
						backgroundImage: "none",
						backgroundSize: "",
						backgroundRepeat: "",
						backgroundPosition: ""
					});
					switch ( type ) {
						case 'image':
							this.update_background_image($type, $overlay);
							break;
						case 'featured':
							this.update_background_featured($type, $overlay);
							break;
						case 'map':
							this.update_background_map($type, $overlay);
							break;
						case 'slider':
							this.update_background_slider($type, $overlay);
							break;
						case 'video':
							this.update_background_video($type, $overlay);
							break;
					}
				}
				Upfront.Events.trigger("entity:background:update", this, this.model);
			},
			update_background_color: function () {
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					color = this.model.get_breakpoint_property_value('background_color', true)
				;
				if ( color ) {
					$bg.css('background-color', color);
				} else {
					$bg.css('background-color', '');
				}
			},
			_update_background_image_from_data: function (data, $type, $overlay) {
				var is_layout = ( this instanceof Layout ),
					repeat = this.model.get_breakpoint_property_value('background_repeat', true),
					position = this.model.get_breakpoint_property_value('background_position', true),
					style = this.model.get_breakpoint_property_value('background_style', true)
				;
				if ( data.image ){
					$type.css('background-image', "url('" + data.image + "')");
					// If parallax, then run parallax first so it applies correct background size
					// Destroy old instance first if exists
					if ( $overlay.data('uparallax') ) {
						$overlay.uparallax('destroy');
					}
					if ( style == 'parallax' ) {
						$overlay.uparallax({
							element: $type,
							overflowTop: 0,
							overflowBottom: 0
						});
					}
					if ( style == 'full' || style == 'parallax' ){
						var size = this._get_full_size_el((is_layout ? $(window) : $type), data.ratio, false);
						$type.data('bg-position-y', size[3]);
						$type.data('bg-position-x', size[2]);
						$type.css({
							backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
							backgroundRepeat: "no-repeat",
							backgroundPosition: size[2] + "px " + size[3] + "px"
						});
					} else {
						$type.css({
							backgroundSize: "auto auto",
							backgroundRepeat: repeat,
							backgroundPosition: position
						});
					}
					if ( is_layout ) {
						$type.css('background-attachment', 'fixed');
					}
				} else {
					$type.css({
						backgroundImage: "none",
						backgroundSize: "",
						backgroundRepeat: "",
						backgroundPosition: "",
						backgroundAttachment: ""
					});
				}
			},
			update_background_image: function ($type, $overlay) {
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					image = this.model.get_breakpoint_property_value('background_image', true),
					ratio = parseFloat(this.model.get_breakpoint_property_value('background_image_ratio', true))
				;
				this.update_background_color();
				this._update_background_image_from_data({
					image: image,
					ratio: ratio
				}, $type, $overlay);
			},
			update_background_featured: function ($type, $overlay) {
				var me = this;
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el;
				this.update_background_color();

				if(me.$el.children('.feature_image_selector').length < 1) {
					var feature_selector = $('<a href="#" class="feature_image_selector"></a>');
					feature_selector.bind('click', function() {
							Upfront.Views.Editor.ImageSelector.open().done(function(images){
								var sizes = {},
									imageId = 0
								;
								_.each(images, function(image, id){
									sizes = image;
									imageId = id;
								});
								var imageInfo = {
										src: sizes.medium ? sizes.medium[0] : sizes.full[0],
										srcFull: sizes.full[0],
										srcOriginal: sizes.full[0],
										fullSize: {width: sizes.full[1], height: sizes.full[2]},
										size: sizes.medium ? {width: sizes.medium[1], height: sizes.medium[2]} : {width: sizes.full[1], height: sizes.full[2]},
										position: false,
										rotation: 0,
										id: imageId
									}
								;
								$('<img>').attr('src', imageInfo.srcFull).load(function(){
									var post = Upfront.data.posts[_upfront_post_data.post_id];
									post.meta.setValue('_thumbnail_id', imageInfo.id);
									post.meta.setValue('_thumbnail_data', imageInfo);

									post.meta.save().done(function(){
										$('<img>').attr('src', imageInfo.srcOriginal).load(function() {
											me.update_background();
											Upfront.Views.Editor.ImageSelector.close();
										});
									});
								});
							});
						});
					me.$el.append(feature_selector);
				}

				Upfront.Util.post({action: 'this_post-get_thumbnail', post_id: _upfront_post_data.post_id})
					.done(function(response){
						if(typeof(response.data.featured_image) != 'undefined') {

							if (response.data.featured_image != '') {
								me.$el.children('.feature_image_selector').addClass('change_feature_image');
							} else {
								me.$el.children('.feature_image_selector').removeClass('change_feature_image');
							}

							image = response.data.featured_image;
							var temp_image = $('<img>').attr('src', response.data.featured_image);
							temp_image.load(function(){
								ratio = parseFloat(Math.round(this.height/this.width*100)/100);
								$bg.data('bg-featured-image-ratio', ratio);

								me._update_background_image_from_data({
									image: image,
									ratio: ratio
								}, $type, $overlay);

							});
						} else {
							me._update_background_image_from_data({
								image: false,
								ratio: 0
							}, $type, $overlay);
						}
					})
				;
			},
			postpone_map_init: function ($type, $overlay) {
				var me = this;
				$(document).one("upfront-google_maps-loaded", function () {
					me.update_background_map($type, $overlay);
				});
			},
			update_background_map: function ($type, $overlay) {
				try {
					if (!window.google.maps.Map) return this.postpone_map_init($type, $overlay);
				} catch (e) {
					return this.postpone_map_init($type, $overlay);
				}
				var me = this,
					center = this.model.get_breakpoint_property_value('background_map_center', true),
					zoom = this.model.get_breakpoint_property_value('background_map_zoom', true),
					style = this.model.get_breakpoint_property_value('background_map_style', true),
					controls = this.model.get_breakpoint_property_value('background_map_controls', true),
					show_markers = this.model.get_breakpoint_property_value('background_show_markers', true),
					styles = (this.model.get_breakpoint_property_value("background_use_custom_map_code", true) ? JSON.parse(this.model.get_breakpoint_property_value("map_styles", true)) : false),
					options = {
						center: new google.maps.LatLng(center[0], center[1]),
						zoom: parseInt(zoom),
						mapTypeId: google.maps.MapTypeId[style],
						panControl: (controls.indexOf("pan") >= 0),
						zoomControl: (controls.indexOf("zoom") >= 0),
						mapTypeControl: (controls.indexOf("map_type") >= 0),
						scaleControl: (controls.indexOf("scale") >= 0),
						streetViewControl: (controls.indexOf("street_view") >= 0),
						overviewMapControl: (controls.indexOf("overview_map") >= 0),
						scrollwheel: false,
						styles: styles
					}
				;
				if ( !this.bg_map ) {
					this.bg_map = new google.maps.Map($type.get(0), options);
					if (styles) {
						this.bg_map.setOptions({styles: styles});
					}
				} else {
					$type.show();
					this.bg_map.setOptions(options);
					if (styles) {
						this.bg_map.setOptions({styles: styles});
					}
					setTimeout(function(){
						me.bg_map.setCenter(options.center);
					}, 500);
				}
				if (!!show_markers) {
					var mrk = new google.maps.Marker({
						position: options.center,
						draggable: false,
						map: this.bg_map
					});
				}
			},
			update_background_slider: function ($type, $overlay) {
				var me = this,
					slide_images = this.model.get_breakpoint_property_value('background_slider_images', true),
					rotate = this.model.get_breakpoint_property_value('background_slider_rotate', true),
					rotate_time = this.model.get_breakpoint_property_value('background_slider_rotate_time', true),
					control = this.model.get_breakpoint_property_value('background_slider_control', true),
					transition = this.model.get_breakpoint_property_value('background_slider_transition', true);
				if ( slide_images ) {
					if ( rotate ) {
						$type.attr('data-slider-auto', 1);
						$type.attr('data-slider-interval', rotate_time*1000);
					} else {
						$type.attr('data-slider-auto', 0);
					}
					$type.attr('data-slider-show-control', control);
					$type.attr('data-slider-effect', transition);
					if (!_.isUndefined(Upfront.themeExporter)) {
						// In builder always replace slide_images with server response
						Upfront.Views.Editor.ImageEditor.getImageData(slide_images).done(function(response){
							var images = response.data.images;
							// Rewrite slide images because in builder mode they will be just paths of theme images
							// and slider needs image objects to work.
							//slide_images = images;
							_.each(slide_images, function(id){
								var image = _.isNumber(id) || id.match(/^\d+$/) ? images[id] : _.find(images, function(img){
										return img.full[0].split(/[\\/]/).pop() == id.split(/[\\/]/).pop();
									}),
									$image = $('<div class="upfront-default-slider-item" />');
								if (image && image.full) $image.append('<img src="' + image.full[0] + '" />');
								$type.append($image);
							});
							me.slide_images = slide_images;
							$type.trigger('refresh');
						});
						return;
					}
					if ( (this.slide_images != slide_images) && slide_images.length > 0 ) {
						Upfront.Views.Editor.ImageEditor.getImageData(slide_images).done(function(response){
							var images = response.data.images;
							_.each(slide_images, function(id){
								var image = images[id],
									$image = $('<div class="upfront-default-slider-item" />');
								if (image && image.full) $image.append('<img src="' + image.full[0] + '" />');
								$type.append($image);
							});
							me.slide_images = slide_images;
							$type.trigger('refresh');
						});
					} else {
						$type.trigger('refresh');
					}

					//If all images deleted remove content
					if(slide_images.length == 0) {
						$type.find('.upfront-default-slider-wrap').html('');
						$type.trigger('refresh');
					}
				}
			},
			update_background_video: function ($type, $overlay) {
				var me = this,
					is_layout = ( this instanceof Layout ),
					$bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					color = this.model.get_breakpoint_property_value('background_color', true),
					video = this.model.get_breakpoint_property_value('background_video', true),
					embed = this.model.get_breakpoint_property_value('background_video_embed', true),
					width = this.model.get_breakpoint_property_value('background_video_width', true),
					height = this.model.get_breakpoint_property_value('background_video_height', true),
					style = this.model.get_breakpoint_property_value('background_video_style', true) || 'crop',
					ratio, $embed;
				if ( style == 'inside' && color ) {
					$bg.css('background-color', color);
				} else {
					$bg.css('background-color', '');
				}
				if ( is_layout ) {
					$overlay.css('position', 'fixed');
				}
				if ( video && embed && ( this._prev_video && this._prev_video != video || !this._prev_video ) ) {
					ratio = height/width;
					$embed = $(embed);
					$embed.css('position', 'absolute').appendTo($type);
					if ( style == 'crop' || style == 'inside' ) {
						var size = this._get_full_size_el( ( is_layout ? $(window) : $type ), ratio, (style == 'inside') );
						$embed.css({
							width: size[0],
							height: size[1],
							left: size[2],
							top: size[3]
						});
					} else if ( style == 'full' ) {
						$embed.css({
							width: is_layout ? $(window).width() : $type.width(),
							height: is_layout ? $(window).height() : $type.height(),
							left: 0,
							top: 0
						});
					}
					this._prev_video = video;
				} else if ( !video || !embed ) {
					this.remove_background();
				} else {
					this.refresh_background();
				}
			},
			refresh_background: function () {
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					type = this.model.get_breakpoint_property_value('background_type', true),
					$overlay = $bg.children('.upfront-region-bg-overlay'),
					$type = $overlay.find('.upfront-region-bg-' + type)
				;
				switch ( type ) {
					case 'image':
						this.refresh_background_image($type, $overlay);
						break;
					case 'featured':
						this.refresh_background_featured($type, $overlay);
						break;
					case 'map':
						this.refresh_background_map($type, $overlay);
						break;
					case 'slider':
						this.refresh_background_slider($type, $overlay);
						break;
					case 'video':
						this.refresh_background_video($type, $overlay);
						break;
				}
			},
			_refresh_background_image_from_data: function (data, $type, $overlay) {
				var style = this.model.get_breakpoint_property_value('background_style', true);
				// If parallax, then run parallax first so it applies correct background size
				if ( style == 'parallax' && $overlay.data('uparallax') ) {
					$overlay.uparallax('refresh');
					setTimeout(function(){
						// Do another refresh later to make sure it renders properly
						if ( $overlay.data('uparallax') ) $overlay.uparallax('refresh');
					}, 2000);
				}
				if ( style == 'full' || style == 'parallax' ) {
					var size = this._get_full_size_el($type, data.ratio, false);
					$type.data('bg-position-y', size[3]);
					$type.data('bg-position-x', size[2]);
					$type.css({
						backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
						backgroundRepeat: "no-repeat",
						backgroundPosition: size[2] + "px " + size[3] + "px"
					});
				}
			},
			refresh_background_image: function ($type, $overlay) {
				var ratio = this.model.get_breakpoint_property_value('background_image_ratio', true);
				this._refresh_background_image_from_data({
					ratio: ratio
				}, $type, $overlay);
			},
			refresh_background_featured: function ($type, $overlay) {
				var ratio = $type.data('bg-featured-image-ratio');
				this._refresh_background_image_from_data({
					ratio: ratio
				}, $type, $overlay);
			},
			refresh_background_map: function ($type, $overlay) {
				if ( !this.bg_map ) return;
				google.maps.event.trigger(this.bg_map, 'resize');
			},
			refresh_background_video: function ($type, $overlay) {
				var video = this.model.get_breakpoint_property_value('background_video', true),
					embed = this.model.get_breakpoint_property_value('background_video_embed', true),
					width = this.model.get_breakpoint_property_value('background_video_width', true),
					height = this.model.get_breakpoint_property_value('background_video_height', true),
					style = this.model.get_breakpoint_property_value('background_video_style', true) || 'crop',
					ratio,
					$embed = $type.children('iframe');
				if ( video && embed ) {
					ratio = height/width;
					if ( style == 'crop' || style == 'inside' ){
						var size = this._get_full_size_el($type, ratio, (style == 'inside'));
						$embed.css({
							width: size[0],
							height: size[1],
							left: size[2],
							top: size[3]
						});
					} else if ( style == 'full' ){
						$embed.css({
							width: $type.width(),
							height: $type.height(),
							left: 0,
							top: 0
						});
					}
				}
			},
			refresh_background_slider: function ($type, $overlay) {
				$type.trigger('refresh');
			},
			remove_background: function () {
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					$overlay = this.$el.find('.upfront-region-bg-overlay');
				if ( $overlay.length ) {
					$overlay.hide();
				}
				$bg.css({
					backgroundColor: "",
					backgroundImage: "none",
					backgroundSize: "",
					backgroundRepeat: "",
					backgroundPosition: ""
				});
			},
			on_window_resize: function (e) {
				if ( e.target != window || !e.data.model) return;

				var me = e.data;
				me.refresh_background();
			}
		})),

		_Upfront_EditableEntity = _Upfront_SingularEditor.extend({
			/*events: {
				"click .upfront-entity_meta a": "on_settings_click",
				"click .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
			},*/
			// Propagate collection sorting event
			resort_bound_collection: function () {
				this.$el.trigger("resort", [this]);
			},
			get_settings: function () {
				return '';
			},
			on_click: function () {
				// We don't want to activate the element when Settings sidebar is open
				if($('#element-settings-sidebar').html() !== '' || $('#settings').html() !== '') return false;
				this.activate();
				Upfront.Events.trigger("entity:contextmenu:deactivate", this);
				//return false;
			},
			deactivate: function () {
				this.$el.removeClass("upfront-active_entity");
				this.check_deactivated();
				this.trigger("upfront:entity:deactivate", this);
			},
			activate: function () {
				var me= this,
					currentEntity = Upfront.data.currentEntity
				;
				if (this.activate_condition && !this.activate_condition()) return false;
				if (currentEntity && currentEntity == this) return false;
				if (!(this instanceof ObjectView)) return;
				if (currentEntity && currentEntity != this) {
					//If the current entity is my child we are ok
					if(Upfront.data.currentEntity.$el.closest(me.$el).length)
						return;
					Upfront.data.currentEntity.trigger('deactivated');
				}

				Upfront.data.currentEntity = this;
				this.trigger("upfront:entity:activate", this);
				this.trigger("activated", this);
				this.listenToOnce(this, 'deactivated', this.deactivate);

				this.$el.addClass("upfront-active_entity");
			},
			// Stub handlers
			on_meta_click: function () {},
			on_delete_click: function () {
				this.$el.trigger("upfront:entity:remove", [this]);
				return false; // Stop propagation in order not to cause error with missing sortables etc
			},
			on_context_menu: function(e) {

				if($(e.target).closest('.redactor-editor').length > 0) {
					e.stopPropagation();
					return;
				}

				if (Upfront.Settings.Application.no_context_menu) return;

				e.stopPropagation();
				// disable context menu if the element is in text edit mode, in order to enable spell check
				if ($(e.target).closest('.redactor_box').length > 0) return;

				e.preventDefault();

				this.event = e;
				Upfront.Events.trigger("entity:contextmenu:activate", this);
			},
			on_settings_click: function (e) {
				if( typeof e !== "undefined" ) {
					e.preventDefault();
				}
				Upfront.Events.trigger("entity:settings:activate", this);
			},
			on_hide_click: function (e) {
				e.preventDefault();
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					data = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(data[breakpoint.id]) )
					data[breakpoint.id] = {};
				if ( data[breakpoint.id].hide == 1 )
					data[breakpoint.id].hide = 0;
				else
					data[breakpoint.id].hide = 1;
				this.model.set_property('breakpoint', data);
			},
			check_deactivated: function () {
				if (Upfront.data.currentEntity == this) Upfront.data.currentEntity = false;
			},
			create_size_hint: function ($el) {
				var me = this,
					$el = $el ? $el : this.$el.find('.upfront-editable_entity:first');
				if ( !$el.children('.upfront-entity-size-hint').length ) {
					this.$size_hint = $('<div class="upfront-entity-size-hint upfront-ui"></div>');
					$el.append(this.$size_hint);
				}
				setTimeout(function(){ me.update_size_hint(); }, 500);
			},
			update_size_hint: function (width, height) {
				if ( !this.$size_hint ) return;

				var $el = this.$size_hint.parent(),
					column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
					hPadding = parseInt( this.model.get_breakpoint_property_value('left_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('right_padding_num') || column_padding ),
					vPadding = parseInt( this.model.get_breakpoint_property_value('top_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('bottom_padding_num') || column_padding ),
					width = width ? width - hPadding : $el.width() - hPadding,
					height = height ? height - vPadding : $el.height() - vPadding,
					hint = '<b>w:</b>' + width + 'px <b>h:</b>' + height + 'px';
				this.$size_hint.html(hint);
			},
			apply_breakpoint_position: function ($el, $toggle) {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid;
				if ( !breakpoint ) return;
				var me = this,
					data = this.model.get_property_value_by_name('breakpoint'),
					row = this.model.get_property_value_by_name('row'),
					default_hide = this.model.get_property_value_by_name('default_hide'),
					toggle_hide = this.model.get_property_value_by_name('toggle_hide'),
					hide = this.model.get_property_value_by_name('hide'),
					breakpoint_data = data[breakpoint.id],
					$wrapper = this.$el.parent('.upfront-wrapper'),
					has_sibling = $wrapper.length > 0 ? ( $wrapper.children(':not(.upfront-wrapper-meta)').length > 1 ) : false,
					width_col = breakpoint_data ? breakpoint_data.left+breakpoint_data.col : 0
				;
				if ( has_sibling ) {
					width_col = Upfront.Util.width_to_col($wrapper.width());
				}
				if ( breakpoint_data && "hide" in breakpoint_data ) {
					hide = breakpoint_data.hide;
				}
				else {
					if ( !breakpoint.default || hide === false ) hide = default_hide;
				}
				if ( !hide ) $el.show();
				else $el.hide();
				if ( $toggle && $toggle.length > 0 ) {
					if ( ( toggle_hide !== false && toggle_hide == 0 )|| !hide ) $toggle.hide();
					else if ( hide ) $toggle.show();
				}
				if ( breakpoint_data && typeof breakpoint_data.col == 'number' ) {
					$el.css('width', (breakpoint_data.col/width_col*100) + '%');
					$el.data('breakpoint_col', breakpoint_data.col);
				}
				else {
					$el.css('width', '');
					$el.removeData('breakpoint_col');
				}
				if ( breakpoint_data && typeof breakpoint_data.left == 'number' ) {
					$el.css('margin-left', (breakpoint_data.left/width_col*100) + '%');
					$el.data('breakpoint_left', breakpoint_data.left);
				}
				else {
					$el.css('margin-left', '');
					$el.removeData('breakpoint_left');
				}
				if ( breakpoint_data && typeof breakpoint_data.top == 'number' ) {
					$el.css('margin-top', (breakpoint_data.top*grid.baseline) + 'px');
					$el.data('breakpoint_top', breakpoint_data.top);
				}
				else {
					$el.css('margin-top', '');
					$el.removeData('breakpoint_top');
				}
				if ( breakpoint_data && typeof breakpoint_data.row == 'number' ) {
					$el.css('min-height', (breakpoint_data.row*grid.baseline) + 'px');
					$el.data('breakpoint_row', breakpoint_data.row);
				}
				else {
					$el.css('min-height', (row*grid.baseline) + 'px');
					$el.removeData('breakpoint_row');
				}
				// order is applied to the view.$el
				if ( breakpoint_data && typeof breakpoint_data.order == 'number' ) {
					this.$el.css('order', breakpoint_data.order);
					$el.data('breakpoint_order', breakpoint_data.order);
				}
				else {
					this.$el.css('order', '');
					$el.removeData('breakpoint_order');
				}
				//this.apply_paddings($el);
			},
			apply_paddings: function ($el) {
				var top_padding_use = this.model.get_breakpoint_property_value('top_padding_use', true),
					bottom_padding_use = this.model.get_breakpoint_property_value('bottom_padding_use', true),
					left_padding_use = this.model.get_breakpoint_property_value('left_padding_use', true),
					right_padding_use = this.model.get_breakpoint_property_value('right_padding_use', true),
					top_padding_num = this.model.get_breakpoint_property_value('top_padding_num', true),
					bottom_padding_num = this.model.get_breakpoint_property_value('bottom_padding_num', true),
					left_padding_num = this.model.get_breakpoint_property_value('left_padding_num', true),
					right_padding_num = this.model.get_breakpoint_property_value('right_padding_num', true)
				;
				$el.css({
					paddingTop: top_padding_use && top_padding_num !== false ? top_padding_num + 'px' : '',
					paddingBottom: bottom_padding_use && bottom_padding_num !== false ? bottom_padding_num + 'px' : '',
					paddingLeft: left_padding_use && left_padding_num !== false ? left_padding_num + 'px' : '',
					paddingRight: right_padding_use && right_padding_num !== false ? right_padding_num + 'px' : ''
				});
			},
			show_top_padding_hint: function (value) {
				var me               = this,
					top_padding_hint = this.$el.parents('.upfront-module').find('.upfront-entity-top-padding-hint')
				;
				if(!this.top_padding_hint_flag) {
					this.top_padding_hint_flag = true;
					return;
				}
				if(!top_padding_hint.length) {
					top_padding_hint = $('<div class="upfront-ui upfront-entity-padding-hint upfront-entity-top-padding-hint"></div>').appendTo(this.$el.parents('.upfront-module'));
				}
				top_padding_hint.css({
					height: value + 'px',
					opacity: 1
				});
				clearTimeout(this.top_padding_hint_timer);
				this.top_padding_hint_timer = setTimeout(function() {
					me.hide_top_padding_hint();
				}, 1000);
			},
			hide_top_padding_hint: function () {
				if(!this.padding_hint_locked) {
					this.$el.parents('.upfront-module').find('.upfront-entity-top-padding-hint').css({
						opacity: 0
					});
				}
			},
			show_bottom_padding_hint: function (value) {
				var me                  = this,
					bottom_padding_hint = this.$el.parents('.upfront-module').find('.upfront-entity-bottom-padding-hint')
				;
				if(!this.bottom_padding_hint_flag) {
					this.bottom_padding_hint_flag = true;
					return;
				}
				if(!bottom_padding_hint.length) {
					bottom_padding_hint = $('<div class="upfront-ui upfront-entity-padding-hint upfront-entity-bottom-padding-hint"></div>').appendTo(this.$el.parents('.upfront-module'));
				}
				bottom_padding_hint.css({
					height: value + 'px',
					opacity: 1
				});
				clearTimeout(this.bottom_padding_hint_timer);
				this.bottom_padding_hint_timer = setTimeout(function() {
					me.hide_bottom_padding_hint();
				}, 1000);
			},
			hide_bottom_padding_hint: function () {
				if(!this.padding_hint_locked) {
					this.$el.parents('.upfront-module').find('.upfront-entity-bottom-padding-hint').css({
						opacity: 0
					});
				}
			},
			updateControls: function() {
				var elementControlsTpl = '<div class="upfront-element-controls upfront-ui"></div>';

				if(this.paddingControl && typeof this.paddingControl.isOpen !== 'undefined' && this.paddingControl.isOpen)	return;

				if (!this.controls) {
					this.controls = this.createControls();
				}

				if (this.controls === false) return;

				this.controls.render();
				if (!this.$control_el || this.$control_el.length === 0) {
					this.$control_el = this.$el;
				}
				if (this.$control_el.find('>.upfront-element-controls').length === 0) {
					this.$control_el.append(elementControlsTpl);
					this.$control_el.find('>.upfront-element-controls').html('').append(this.controls.$el);
				}
				this.controls.delegateEvents();
			},
			createControls: function() {
				var me = this,
					panel = new Upfront.Views.Editor.InlinePanels.Panel()
					;

				panel.items = this.getControlItems();

				return panel;
			},
			createControl: function(icon, tooltip, click){
				var me = this,
					item = new Upfront.Views.Editor.InlinePanels.Control();
				item.icon = icon;
				item.tooltip = tooltip;
				if(click){
					this.listenTo(item, 'click', function(e){
						me[click](e);
					});
				}

				return item;
			},
			createPaddingControl: function(){
				this.paddingControl = new Upfront.Views.Editor.InlinePanels.PaddingControl({
					model: this.model
				});

				this.paddingControl.icon = 'padding';
				this.paddingControl.tooltip = l10n.padding_settings;

				return this.paddingControl;
			},
			getControlItems: function(){
				return _([
					this.createPaddingControl(),
					this.createControl('settings', l10n.settings, 'on_settings_click')
				]);
			}
		}),

		_Upfront_EditableContentEntity = _Upfront_EditableEntity.extend({
			events: {
				"click": "on_click",
				"dblclick": "on_edit"
			},
			on_edit: function () {
				// We don't want to activate the Entity when Settings sidebar is open
				if($('#element-settings-sidebar').html() !== '' || $('#settings').html() !== '') return false;
				var contentEditable = this.$el.find('[contenteditable]');
				if (contentEditable.length > 0) {
					contentEditable[0].focus();
				} else {
					// Trigger settings popup
					Upfront.Events.trigger("entity:settings:activate", this);
				}
				return false;
			}
        }),

		_Upfront_PluralEditor = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
			initialize: function () {
				// this.model.bind("change", this.render, this);
				// this.model.bind("add", this.render, this);
				// this.model.bind("remove", this.render, this);
				this.listenTo(this.model, 'change', this.render);
				this.listenTo(this.model, 'add', this.render);
				this.listenTo(this.model, 'remove', this.render);

				if (this.init) this.init();
			},
		})),

		_Upfront_EditableEntities = _Upfront_PluralEditor.extend({
			"events": {
				"resort": "on_resort_collection",
				"upfront:entity:remove": "on_entity_remove"
			},

			on_resort_collection: function () {
				var models = [],
					collection = this.model
				;
				this.$el.find(".upfront-editable_entity, .upfront-module-group").each(function () {
					var element_id = $(this).attr("id"),
						model = collection.get_by_element_id(element_id)
					;
					model && models.push(model);
				});
				this.model.reset(models);
				return false; // Don't bubble up
			},
			on_entity_remove: function (e,view) {
				view.remove();
				this.model.remove(view.model);
			},
			on_activate: function (view) {
				this.model.active_entity = view.model;
				//Upfront.data.currentEntity = view;
				Upfront.Events.trigger("entity:activated", view, view.model);
				this.trigger('activated');
			},
			deactivate: function (removed) {
				if (removed == this.model.active_entity) this.model.active_entity = false;
				//this.check_deactivated();
				Upfront.Events.trigger("entity:deactivated", removed);
				this.trigger('deactivated');
			},

			fix_flexbox_clear: function ($el) {
				// @TODO Experiment: don't need flexbox clearing workaround as elements will always take the whole width!
				/*var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					off = $el.offset(),
					width = $el.width(),
					$prev;
				$el.children().each(Upfront.Util.normalize_sort_elements_cb).sort(Upfront.Util.sort_elements_cb).filter(function(){
					return $(this).children().size() > 0;
				}).each(function(){
					var order = $(this).data('breakpoint_order') || 0,
						clear = $(this).data('breakpoint_clear'),
						prev_off, margin;
					$(this).css('margin-right', 0);
					if ( $prev && ( ( ( !breakpoint || breakpoint.default ) && $(this).hasClass('clr') ) || ( breakpoint && !breakpoint.default && clear) ) ) {
						prev_off = $prev.offset();
						margin = Math.floor( (off.left+width) - (prev_off.left+$prev.width()) );
						$prev.css('margin-right', (margin/width*100-1) + '%' ); // Add -1 to prevent rounding error
					}
					$prev = $(this);
				});*/
			},

			fix_wrapper_height: function (modules, wrappers, col) {
				Upfront.Behaviors.GridEditor.time_start('fn fix_wrapper_height');
				var me = this,
					ed = Upfront.Behaviors.GridEditor,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					lines = ed.parse_modules_to_lines(modules, wrappers, breakpoint.id, _.isNumber(col) ? col : breakpoint.columns)
				;
				Upfront.Events.trigger('upfront:wrappers:before_fix_height', this);
				_.each(lines, function (l) {
					var wraps = [];
					_.each(l.wrappers, function (w) {
						var wrapper_view = Upfront.data.wrapper_views[w.model.cid];
						if ( !wrapper_view ) return;
						wraps.push(wrapper_view.$el);
					});
					me._apply_wrapper_height(wraps);
				});
				Upfront.Events.trigger('upfront:wrappers:after_fix_height', this);
				Upfront.Behaviors.GridEditor.time_end('fn fix_wrapper_height');
			},
			_apply_wrapper_height: function (wraps) {
				// Reset height first
				_.each(wraps, function ($wrap) {
					$wrap.css('min-height', '');
				});
				// Find max height and apply to all
				var wraps_height = _.map(wraps, function($wrap){
						return parseFloat($wrap.css('height'));
					}),
					height = _.max(wraps_height, function(h){
						return h;
					})
				;
				_.each(wraps, function ($wrap, index) {
					var prev_is_spacer = index > 0 ? wraps[index-1].hasClass('upfront-wrapper-spacer') : false,
						next_is_spacer = index < wraps.length-1 ? wraps[index+1].hasClass('upfront-wrapper-spacer') : false
					;
					$wrap.removeAttr('data-first-in-row');
					$wrap.removeAttr('data-last-in-row');
					$wrap.removeAttr('data-prev-spacer');
					$wrap.removeAttr('data-next-spacer');
					if ( index == 0 ) $wrap.attr('data-first-in-row', '1');
					if ( index == wraps.length-1 ) $wrap.attr('data-last-in-row', '1');
					if ( prev_is_spacer ) $wrap.attr('data-prev-spacer', '1');
					if ( next_is_spacer ) $wrap.attr('data-next-spacer', '1');
					$wrap.css('min-height', height);
				});
			}
		}),

		ContextMenuItem = Backbone.View.extend({
			tagName: 'li',
			initialize: function(opts){
				this.options = opts;
				this.label = this.options.get_label;
				this.action = this.options.action;

				if ( typeof this.options.in_context == 'function' ) {
					this.in_context = this.options.in_context;
				}
			},
			render: function () {
				var me = this,
					cls = 'upfront-ctx-' + this.label().replace(/[^a-z0-9]/ig, '_').toLowerCase()
				;
				this.$el.empty().addClass(cls);
				this.$el.append(this.label);

				this.$el.bind('click', function(e) {
					e.preventDefault();
					me.action(this.for_view, e);
					Upfront.Events.trigger("entity:contextmenu:deactivate", this);
				});
			},
			remove: function(){
				this.parent_view = false;
				this.for_view = false;
				Backbone.View.prototype.remove.call(this);
			},
			in_context: function(){
				// Allow additional context for individual menuitem
				return true;
			}
		}),

		ContextMenuList = Backbone.View.extend({
			tagName: 'ul',
			initialize: function (opts) {
				this.options = opts;
				this.for_view = this.options.for_view;
			},

			render: function () {
				var me = this;
				this.$el.empty();
				this.menuitems.each(function(menuitem) {
					if ( ! menuitem.menulist ) menuitem.menulist = me;
					menuitem.for_view = me.for_view;
					if ( !menuitem.in_context() ) // Don't render if the item is not in context
						return;
					menuitem.render();
					menuitem.parent_view = me;
					me.$el.append(menuitem.el);
				});
			},
			remove: function(){
				if (this.menuitems) {
					this.menuitems.each(function(itemView){
						itemView.remove();
					});
				}
				this.for_view = false;
				this.parent_view = false;
				this.options = false;
				Backbone.View.prototype.remove.call(this);
			}

		}),
		DefaultMenuList = ContextMenuList.extend({
			className: 'upfront-default_ctx_list',
			initialize: function() {
				var menuitems = [];

				if (Upfront.Application.get_current() != "theme") {
					if (!Upfront.Settings.Application.NO_SAVE) {
						menuitems.push(new Upfront.Views.ContextMenuItem({
							get_label: function() {
								return l10n.save;
							},
							action: function() {
								var savelayout = new Upfront.Views.Editor.Command_SaveLayout();
								savelayout.on_click();
							}
						}));
					}
					menuitems.push(new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return l10n.undo;
						},
						action: function(for_view) {
							var undo = new Upfront.Views.Editor.Command_Undo({"model": Upfront.Application.layout});
							undo.on_click();
						}
					}));
				}

				menuitems.push(new Upfront.Views.ContextMenuItem({
					get_label: function() {
						return Upfront.Application.get_gridstate() ? l10n.hide_grid: l10n.show_grid;
					},
					action: function() {
						var togglegrid = new Upfront.Views.Editor.Command_ToggleGrid();
						togglegrid.on_click();
					}
				}));

				menuitems.push(new Upfront.Views.ContextMenuItem({
					get_label: function() {
						return l10n.clone;
					},
					in_context: function() {
						// Only show this menu on ObjectView instance
						return this.for_view instanceof Upfront.Views.ObjectView;
					},
					action: function(for_view, e) {
						var module_view = this.for_view.parent_module_view,
							module = module_view.model,
							parent_region_view = module_view.group_view ? module_view.group_view : module_view.region_view,
							modules = parent_region_view.model.get('modules'),
							wrappers = parent_region_view.model.get('wrappers'),
							wrap_model = wrappers.get_by_wrapper_id(module.get_property_value_by_name('wrapper_id')),
							data = Upfront.Util.model_to_json(module),
							new_model = new Upfront.Models.Module(data),
							wrapper_id = Upfront.Util.get_unique_id("wrapper"),
							wrap_data = Upfront.Util.model_to_json(wrap_model),
							new_wrap_model = new Upfront.Models.Wrapper(wrap_data),
							index = modules.indexOf(module),
							models = [];

						// Make sure new model element ids and wrapper id is unique
						new_wrap_model.set_property('wrapper_id', wrapper_id);
						new_model.set_property('wrapper_id', wrapper_id);
						new_model.set_property('element_id', Upfront.Util.get_unique_id('module'));
						new_model.get('objects').each(function(obj){
							obj.set_property('element_id', Upfront.Util.get_unique_id('object'));
						});
						// Add to layout now
						wrappers.add(new_wrap_model);
						//new_model.add_to(modules, index+1);
						modules.add(new_model);
						// Normalize layout
						var ed = Upfront.Behaviors.GridEditor,
							new_module_view =  Upfront.data.module_views[new_model.cid],
							$new_module_view = new_module_view.$el,
							$new_module = $new_module_view.find(".upfront-module"),
							off = $new_module.offset(),
							pos = $new_module.position(),
							h = $new_module.outerHeight(),
							w = $new_module.outerWidth();
						ed.start(new_module_view, new_model);
						ed.normalize(ed.els, ed.wraps);

						// properly position the new module and show it under the cursor
						$new_module.css({
							position: "relative",
							top: ( e.pageY-off.top-(h/2) ),
							left: ( e.pageX-off.left-(w/2) )
						});

						// Simulate and mousedown and actually trigger drag
					    $new_module.simulate("mousedown", {
					        clientX: e.clientX,
					        clientY: e.clientY
					    });

					}
				}));
				this.menuitems = _(menuitems);
			}

		}),
		ContextMenu = Backbone.View.extend({
			initialize: function(opts) {
				this.options = opts;
				this.for_view = this.options.for_view;
				this.menulists = _([]);
			},
			render: function () {

				var me = this;

				this.$el
					.empty()
					.show()
				;

				this.menulists.each(function (menulist) {
					menulist.for_view = me.for_view;
					menulist.render();
					menulist.parent_view = me;
					me.$el.append(menulist.el);
				});

				var defaultmenulist = new DefaultMenuList();
				defaultmenulist.for_view = me.for_view;
				defaultmenulist.render();
				defaultmenulist.parent_view = me;
				me.$el.append(defaultmenulist.el);

				this.$el
				.css({
					"position": "absolute",
					"z-index": 10000000,
					"display": "block"
				})
				.offset({
					"top":me.for_view.event.pageY,
					"left": me.for_view.event.pageX-(($(document).width()-me.for_view.event.pageX <= this.$el.width() )?this.$el.width():0)
				})
				.addClass('uf-context-menu')
				;

			},

			remove: function(){
				if (this.menulists) {
					this.menulists.each(function(list){
						list.remove();
					});
				}
				Backbone.View.prototype.remove.call(this);
				if (!$('#contextmenu').length) {
					$('body').append('<div id="contextmenu">');
				}
			}

		}),

		ObjectView = _Upfront_EditableContentEntity.extend({
			className: "upfront-object-view",
			display_size_hint: true,
			events: {
				// "click .upfront-object > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
                "click .upfront-object > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-object > .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
				//"dblclick": "on_edit",
				"contextmenu": "on_context_menu"
			},
			initialize: function () {
				var callback = this.update || this.render;
				this.listenTo(this.model.get("properties"), 'change', callback);
				this.listenTo(this.model.get("properties"), 'add', callback);
				this.listenTo(this.model.get("properties"), 'remove', callback);

				this.listenTo(Upfront.Events, 'entity:resize_start', this.close_settings);
				this.listenTo(Upfront.Events, 'entity:drag_start', this.close_settings);
				this.listenTo(Upfront.Events, 'upfront:element:edit:start', this.on_element_edit_start);
				this.listenTo(Upfront.Events, 'upfront:element:edit:stop', this.on_element_edit_stop);
				this.listenTo(Upfront.Events, 'entity:module:update', this.on_module_update);
				this.listenTo(Upfront.Events, 'layout:after_render', this.on_after_layout_render);
				this.listenTo(Upfront.Events, 'layout:after_render', this.checkUiOffset);

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);

				if (this.init) this.init();
			},
			close_settings: function () {
				Upfront.Events.trigger("entity:settings:deactivate");
			},
			render: function () {
				var props = {},
					me = this,
					buttons = (this.get_buttons ? this.get_buttons() : ''),
					extra_buttons = (this.get_extra_buttons ? this.get_extra_buttons() : ''),
					content = (this.get_content_markup ? this.get_content_markup() : ''),
					column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
					height, model, template
				;
				// Force add upfront-object-view class as element object can override the view and left without this class
				this.$el.addClass('upfront-object-view');

				// Id the element by anchor, if anchor is defined
				var the_anchor = this.model.get_property_value_by_name("anchor");
				if (the_anchor && the_anchor.length) {
					this.el.id = the_anchor;
				}

				this.model.get("properties").each(function (prop) {
					props[prop.get("name")] = prop.get("value");
				});

				// Check if theme_style was removed and remove class from element,
				// this happens when element style is migrated to preset
				var oldThemeStyle = '';
				_.each(this.model._previousAttributes.properties, function(property) {
					if (typeof property === 'undefined') return;
					if (property.name === 'theme_style') {
						oldThemeStyle = property.value;
					}
				});
				// And now update classes properly (because template re-render does not affect this)
				if (oldThemeStyle && props.theme_style === '') {
					this.$el.removeClass(oldThemeStyle);
					this.$el.addClass(props.preset);
				}


				var row = this.model.get_breakpoint_property_value('row', true);
				height = ( row ) ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0;

				var theme_style = this.model.get_breakpoint_property_value('theme_style', true);
				if (theme_style) {
					props.class += ' ' + theme_style.toLowerCase();
					this._theme_style = theme_style;
				}
				props.preset = props.preset || '';

				model = _.extend(this.model.toJSON(), {"properties": props, "buttons": buttons, "content": content, "height": height, "extra_buttons": extra_buttons});
				template = _.template(_Upfront_Templates["object"], model);

				Upfront.Events.trigger("entity:object:before_render", this, this.model);
				// Listen to module resize and drop event
				if ( this.parent_module_view ){
					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resize_start');
					this.listenTo(this.parent_module_view, 'entity:resize_start', this.on_element_resize_start);
					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resizing');
					this.listenTo(this.parent_module_view, 'entity:resizing', this.on_element_resizing);
					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resize_stop');
					this.listenTo(this.parent_module_view, 'entity:resize_stop', this.on_element_resize);

					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:drop');
					this.listenTo(this.parent_module_view, 'entity:drop', this.on_element_drop);
				}

				this.$el.html(template);

				// render subview if it exists
				if (typeof this.subview != 'undefined') {
					this.subview.setElement(this.$('.upfront-object-content')).render();
				}

				this.apply_paddings(this.$el.find('> .upfront-editable_entity:first'));

				//this.init_ckeditor_on_focus();

				Upfront.Events.trigger("entity:object:after_render", this, this.model);

				// Run checkUiOffset on after layout render instead (see initialize)
				//setTimeout(function() {
				//	me.checkUiOffset();
				//}, 300);

				if ( this.display_size_hint ) {
					this.create_size_hint(this.$el);
				}
				if ( this.on_render ) this.on_render();

				// Put this here because initialize gets overriden by child classes
				this.ensure_breakpoint_change_is_listened();
				this.ensureUiOffsetCalls();

				if ( this.parent_module_view ) {
					this.$control_el = this.parent_module_view.$('.upfront-module');
					this.updateControls();
					setTimeout(function() {
						if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
					}, 300);
				}
			},
			update: function (prop, options) {
				if (typeof prop === 'undefined') return this.render();

				// var prev_value = prop._previousAttributes.value,
				var value = prop.get('value'),
					$me = this.$el.find('.upfront-editable_entity:first'),
					grid = Upfront.Settings.LayoutEditor.Grid
				;
				if ( prop.id == 'row' ){
					// row change
					var height = value * grid.baseline;
					$me.css('min-height', height).attr('data-row', value);
				}
				else if ( prop.id == 'class' ){
					// column and margin changes
					var classes = $me.attr('class');
					_.each([grid.class, grid.left_margin_class, grid.top_margin_class, grid.bottom_margin_class, grid.right_margin_class], function(class_name){
						var rx = new RegExp('\\b' + class_name + '(\\d+)'),
							val = value.match(rx);
						if ( val && val[1] )
							Upfront.Behaviors.GridEditor.update_class($me, class_name, val[1]);
					});
				}
				else if ( prop.id == 'breakpoint' ){
					this.update_position();
				}
				else if ( prop.id.match(/(top|bottom|left|right)_padding_(use|num|slider)/) ) {
					this.apply_paddings($me);
					this.handle_visual_padding_hint(prop);
				}
				else if ( prop.id.match(/padding_slider/) ) {
					this.render();
					this.handle_visual_padding_hint(prop);
				}
				else {
					this.render();
				}
				Upfront.Events.trigger('entity:object:update', this, this.model);

			},
			handle_visual_padding_hint: function (prop) {
				if (typeof prop === 'undefined') return;

				var value = prop.get('value');

				if ( prop.id.match(/(top|bottom)_padding_(num|slider)/) ) {
					if ( prop.id.match(/top_padding_(num|slider)/) ) {
						this.show_top_padding_hint(value);
					}
					if ( prop.id.match(/bottom_padding_(num|slider)/) ) {
						this.show_bottom_padding_hint(value);
					}
				}
				else if ( prop.id.match(/padding_slider/) ) {
					this.show_top_padding_hint(value);
					this.show_bottom_padding_hint(value);
				}

			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				if ( !breakpoint ) return;
				var $object = this.$el.find('> .upfront-editable_entity:first'),
					$toggle = this.$el.find('> .upfront-object-hidden-toggle')
				;
				this.apply_paddings($object);
				this.apply_breakpoint_position($object, $toggle);
				if ( this.display_size_hint ) {
					this.update_size_hint();
				}
				Upfront.Events.trigger('entity:object:update_position', this, this.model);
			},
			ensure_breakpoint_change_is_listened: function() {
				if (this.breakpoint_change_is_setup) {
					return;
				}

				this.listenTo(Upfront.Events, 'upfront:layout_size:change_breakpoint', this.on_change_breakpoint);
				this.breakpoint_change_is_setup = true;
			},
			ensureUiOffsetCalls: function() {
				var me = this;
				if (this.parent_module_view && this.parent_module_view.$el && !this.offset_check_set_for_parent) {
					this.offset_check_set_for_parent = true;
					this.listenTo(this.parent_module_view, 'entity:drop', function(){
						me.checkUiOffset();
					});
				}
				if (this.window_resize_offset_check_set) {
					return;
				}
				// This is not so important visually so throttle to 1 second
				this.lazyCheckUiOffset = _.throttle(this.checkUiOffset, 1000);
				$(window).on('resize', $.proxy(this.lazyCheckUiOffset, me));
				this.window_resize_offset_check_set = true;
			},
			checkUiOffset: function() {
				if (!this.parent_module_view) return;
				var $parentRegionEl = this.parent_module_view.region_view && this.parent_module_view.region_view.$el;

				if (!$parentRegionEl) {
					return;
				}

				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					is_responsive = breakpoint && !breakpoint.default,
					$container = $parentRegionEl.closest('.upfront-region-container'),
					containerOffset = is_responsive ? $parentRegionEl.offset() : $container.offset(),
					offset = this.$el.offset(),
					topOffsetTooClose = containerOffset && offset.top - containerOffset.top < 50,
					// $.offset does not have right side so calculate it
					rightOffset = offset.left + this.$el.width(),
					containerRightOffset = (containerOffset || {left: 0}).left + ( is_responsive ? $parentRegionEl.width() : $container.width() ),
					rightOffsetTooClose = containerRightOffset - rightOffset < 30;

				if (topOffsetTooClose && rightOffsetTooClose) {
					this.parent_module_view.$el.addClass('offset-ui-from-right-top');
				} else {
					this.parent_module_view.$el.removeClass('offset-ui-from-right-top');
				}
			},
			on_element_edit_start: function (edit, post) {
				if ( ( edit == 'text' || edit == 'write' ) && this.parent_module_view ){
					this.parent_module_view.$el.find('>.upfront-module').addClass('upfront-module-editing')
					this.parent_module_view.disable_interaction(false);
				}
			},
			on_element_edit_stop: function (edit, post, saving_draft) {
				if (this.parent_module_view && this.parent_module_view.enable_interaction && saving_draft !== true){
					this.parent_module_view.$el.find('>.upfront-module').removeClass('upfront-module-editing')
					this.parent_module_view.enable_interaction(false);
				}
			},
			on_element_resize_start: function (attr) {

			},
			on_element_resizing: function (attr) {
				if ( this.display_size_hint ) {
					this.update_size_hint(attr.width, attr.height);
				}
			},
			on_element_resize: function (attr) {

			},
			on_element_drop: function (attr) {

			},
			on_after_layout_render: function () {

			},
			on_module_update: function (view) {
				if ( !this.parent_module_view || this.parent_module_view != view ) return;
				if ( this.display_size_hint ) {
					this.update_size_hint();
				}
			},
			on_change_breakpoint: function (breakpoint) {
				var theme_style = this.model.get_breakpoint_property_value('theme_style', true),
					$obj = this.$el.find('.upfront-object');
				if ( this._theme_style ) {
					$obj.removeClass(this._theme_style.toLowerCase());
				}
				if ( theme_style ) {
					$obj.addClass(theme_style.toLowerCase());
					this._theme_style = theme_style;
				}
				this.update_position();
				this.checkUiOffset();
			},

			activate: function () {
				// Deactivate previous ObjectView
				if(typeof(Upfront.data.prevEntity) !== 'undefined' && Upfront.data.prevEntity !== false) {
					Upfront.data.prevEntity.deactivate();
				}
				Upfront.data.prevEntity = this;
				_Upfront_EditableEntity.prototype.activate.call(this);
				if ( !this.parent_module_view ) return;
				this.parent_module_view.$el.find('>.upfront-module').addClass('upfront-module-active');
			},
			deactivate: function () {
				// We don't want to deactivate the element when Settings sidebar is open
				if($('#element-settings-sidebar').html() !== '' || $('#settings').html() !== '') return false;
				Upfront.data.prevEntity = false;
				_Upfront_EditableEntity.prototype.deactivate.call(this);
				if ( !this.parent_module_view ) return;
				this.parent_module_view.$el.find('>.upfront-module').removeClass('upfront-module-active');
			},

			toggle_region_class: function (classname, add, container) {
				var region_view = ( this.parent_module_view && this.parent_module_view.region_view ) ? this.parent_module_view.region_view : false,
					container_view = ( region_view ) ? region_view.parent_view.get_container_view(region_view.model) : false,
					container = ( true === container )
				;
				if ( !region_view ) return;
				if ( container ) {
					container_view.$el.toggleClass(classname, add);
				} else {
					region_view.$el.toggleClass(classname, add);
				}
			},

			add_region_class: function (classname, container) {
				this.toggle_region_class(classname, true, container);
			},

			remove_region_class: function (classname, container) {
				this.toggle_region_class(classname, false, container);
			},

			/* Getting dimension and resize element */
			get_element_size: function (real) {
				var ed = Upfront.Behaviors.GridEditor,
					real = typeof real == 'undefined' ? true : real;
				ed.start(this.parent_module_view, this.parent_module_view.model);
				var element = ed.get_position( this.parent_module_view.$el.find('.upfront-module') );
				return {
					col: element.col,
					row: real ? element.row : this.model.get_property_value_by_name('row')
				};
			},
			get_element_columns: function () {
				return this.get_element_size().col;
			},
			get_element_rows: function () {
				return this.get_element_size().row;
			},
			get_element_size_px: function (real) {
				var ed = Upfront.Behaviors.GridEditor,
					real = typeof real == 'undefined' ? true : real,
					size = this.get_element_size(real);
				return {
					col: size.col * ed.col_size,
					row: size.row * ed.baseline
				};
			},
			get_element_columns_px: function () {
				return this.get_element_size_px().col;
			},
			get_element_rows_px: function () {
				return this.get_element_size_px().row;
			},
			get_element_max_size: function ( axis ) {
				var ed = Upfront.Behaviors.GridEditor,
					$el = this.parent_module_view.$el.find('.upfront-module'),
					$region = this.$el.closest('.upfront-region'); //this.parent_module_view.region_view.$el; // @TODO parent_module_view.region_view didn't updated when changing region
				ed.start(this.parent_module_view, this.parent_module_view.model);
				return ed.get_max_size(ed.get_el($el), ed.els, ed.get_region($region), axis);
			},
			get_element_max_columns: function ( axis ) {
				return this.get_element_max_size(axis).col;
			},
			get_element_max_rows: function ( axis ) {
				return this.get_element_max_size(axis).row;
			},
			get_element_max_size_px: function ( axis ) {
				var ed = Upfront.Behaviors.GridEditor,
					max = this.get_element_max_size(axis);
				return {
					col: max.col * ed.col_size,
					row: max.row * ed.baseline
				};
			},
			get_element_max_columns_px: function ( axis ) {
				return this.get_element_max_size_px(axis).col;
			},
			get_element_max_rows_px: function ( axis ) {
				return this.get_element_max_size_px(axis).row;
			},
			set_element_size: function (col, row, axis, force) {
				return Upfront.Behaviors.GridEditor.resize(this.parent_module_view, this.parent_module_view.model, col, row, axis, force);
			},

			cleanup: function(){
				//Override this method to clean any subview on remove
			},

			remove: function(){
				this.cleanup();
				$(window).off('resize', this.lazyCheckUiOffset);
				this.parent_view = false;
				this.parent_module_view = false;
				Backbone.View.prototype.remove.call(this);
			},
			on_settings_click: function(event) {
				if ( typeof event !== "undefined" ) {
					event.preventDefault();
				}
				Upfront.Events.trigger("element:settings:activate", this);
			}
		}),

		Objects = _Upfront_EditableEntities.extend({
			"attributes": {
				"class": "upfront-editable_entities_container"
			},

			render: function () {
				var $el = this.$el,
					me = this
				;
				$el.html('');
				if ( typeof Upfront.data.object_views == 'undefined' ) {
					Upfront.data.object_views = {};
				}
				this.model.each(function (obj) {
					var view_class_prop = obj.get("properties").where({"name": "view_class"}),
						view_class = view_class_prop.length ? view_class_prop[0].get("value") : "ObjectView",
						local_view = Upfront.Views[view_class] ? Upfront.data.object_views[obj.cid] || new Upfront.Views[view_class]({model: obj}) : false
					;
					if (local_view) {
						local_view.parent_view = me;
						local_view._previous_parent_module_view = local_view.parent_module_view;
						local_view.parent_module_view = me.parent_view;
						local_view.render();
						$el.append(local_view.el);
						if ( ! Upfront.data.object_views[obj.cid] ) {
							me.listenTo(local_view, 'upfront:entity:activate', me.on_activate);
							me.listenTo(local_view.model, 'remove', me.deactivate);
							//local_view.bind("upfront:entity:activate", me.on_activate, me);
							//local_view.model.bind("remove", me.deactivate, me);
							//local_view.listenTo(local_view.model, "remove", me.deactivate);
							Upfront.data.object_views[obj.cid] = local_view;
						} else {
							local_view.delegateEvents();
						}
					}
				});
			},
			remove: function() {
				if (this.model) {
					this.model.each(function(model){
						var view = Upfront.data.object_views[model.cid];
						if(	view ){
							view.remove();
							delete Upfront.data.object_views[model.cid];
						}
					});
				}
				this.parent_view = false;
				Backbone.View.prototype.remove.call(this);
				if (this.model) {
					this.model.reset([], {silent:true});
					this.model = false;
				}
			}
		}),

		Module = _Upfront_EditableEntity.extend({
			interaction: true,
			lock_interaction: false,
			className: "upfront-module-view",
			events: {
				"click .upfront-module > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click .upfront-module > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-module > .upfront-entity_meta > a.upfront-entity-hide_trigger": "on_hide_click",
				"click .upfront-module-hidden-toggle > a.upfront-entity-hide_trigger": "on_hide_click",
				"click .upfront-module > .upfront-entity_meta": "on_meta_click",
				"click": "on_click"
			},
			initialize: function () {
				var callback = this.update || this.render;
				// this.model.get("properties").bind("change", callback, this);
				// this.model.get("properties").bind("add", callback, this);
				// this.model.get("properties").bind("remove", callback, this);
				this.listenTo(this.model.get("properties"), 'change', callback);
				this.listenTo(this.model.get("properties"), 'add', callback);
				this.listenTo(this.model.get("properties"), 'remove', callback);

				this.listenTo(Upfront.Events, 'command:region:edit_toggle', this.on_region_edit);
				this.listenTo(Upfront.Events, 'command:region:fixed_edit_toggle', this.on_region_edit);

				this.on('on_layout', this.render_object, this);
				//this.on('entity:resize_stop', this.on_resize, this);
				//this.on('entity:drop', this.on_drop, this);
				this.on('region:updated', this.on_region_update, this);

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "entity:wrapper:update_position", this.on_wrapper_update);

				this.listenTo(Upfront.Events, "layout:render", this.on_after_layout_render);
			},
			render: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					props = {},
					is_parent_group = ( typeof this.group_view != 'undefined' ),
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					default_hide = "default_hide" in props ? props.default_hide : 0,
					hide = "hide" in props ? props.hide : default_hide,
					model = _.extend(this.model.toJSON(), {"properties": props, "height": height, "hide": hide, "parent_group_class": is_parent_group ? 'upfront-module-parent-group' : ''}),
					template = _.template(_Upfront_Templates["module"], model)
				;
				Upfront.Events.trigger("entity:module:before_render", this, this.model);

				this.$el.html(template);
				if ( breakpoint && !breakpoint.default ) {
					this.update_position();
				}

				if ( this.model.get("shadow") ) {
					this.$el.find('.upfront-editable_entity:first').attr("data-shadow", this.model.get("shadow"));
				} else {
					this.render_object();
				}

				if (this.$el.is(".upfront-active_entity")) {
					this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
				}
				Upfront.Events.trigger("entity:module:after_render", this, this.model);
			},
			update: function (prop, options) {
				var prev_value = prop._previousAttributes.value,
					value = prop.get('value'),
					$me = this.$el.find('.upfront-editable_entity:first'),
					grid = Upfront.Settings.LayoutEditor.Grid
				;
				if ( prop.id == 'row' ) {
					// row change
					var height = value * grid.baseline;
					$me.css('min-height', height).attr('data-row', value);
				} else if ( prop.id == 'class' ) {
					// column and margin changes
					var classes = $me.attr('class');
					_.each([grid.class, grid.left_margin_class, grid.top_margin_class, grid.bottom_margin_class, grid.right_margin_class], function(class_name){
						var rx = new RegExp('\\b' + class_name + '(\\d+)'),
							val = value.match(rx);
						if ( val && val[1] )
							Upfront.Behaviors.GridEditor.update_class($me, class_name, val[1]);
					});
				} else if ( prop.id == 'breakpoint' ) {
					this.update_position();
				}
				Upfront.Events.trigger('entity:module:update', this, this.model);
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid;
				if ( ! breakpoint ) return;
				var $module = this.$el.find('> .upfront-module'),
					$toggle = this.$el.find('> .upfront-module-hidden-toggle')
				;
				this.apply_breakpoint_position($module, $toggle);
				Upfront.Events.trigger('entity:module:update_position', this, this.model);
			},
			render_object: function () {
				var objects_view = this._objects_view || new Objects({"model": this.model.get("objects")});
				objects_view.parent_view = this;
				objects_view.render();
				this.$(".upfront-objects_container").append(objects_view.el);
				if ( ! this._objects_view ) {
					this._objects_view = objects_view;
				} else {
					this._objects_view.delegateEvents();
				}
			},
			disable_interaction: function (prevent_edit, prevent_button, resize, drag, lock) {
				var $el = this.$el.find('.upfront-editable_entity:first');

				if ( prevent_edit && prevent_button ) $el.addClass('upfront-module-disabled-all');

				if ( prevent_edit ) $el.addClass('upfront-module-disabled-edit');

				if ( prevent_button ) $el.addClass('upfront-module-disabled-button');

				if ( !resize && $el.data('ui-resizable') ) $el.resizable('option', 'disabled', true);

				if ( !drag && $el.data('ui-draggable') ) $el.draggable('option', 'disabled', true);

				this.interaction = false;

				if ( lock ) this.lock_interaction = true;
			},
			enable_interaction: function (unlock) {
				if ( this.lock_interaction && !unlock ) return;

				var $el = this.$el.find('.upfront-editable_entity:first');
				$el.removeClass('upfront-module-disabled-all upfront-module-disabled-edit upfront-module-disabled-button');

				if ( $el.data('ui-resizable') ) $el.resizable('option', 'disabled', false);

				if ( $el.data('ui-draggable') ) $el.draggable('option', 'disabled', false);

				this.interaction = true;
				this.lock_interaction = false;
			},
			on_click: function (e) {
				if ( this.interaction ) {
					this.constructor.__super__.on_click.call(this, e);
				} else {
					e.stopPropagation();
				}
			},
			on_resize: function (attr) {
				// on resize
			},
			on_drop: function (attr) {
				// on drop
			},
			on_region_update: function(){
				if ( this._objects_view ) {
					this._objects_view.model.each(function(view){
						view.trigger('region:updated');
					});
				}
			},
			on_region_edit: function (edit) {
				if (Upfront.Application.PostContentEditor == Upfront.Application.current_subapplication) {
					return;
				}

				if ( edit ) {
					this.disable_interaction(true, true, false, false, true);
				} else {
					this.enable_interaction(true);
				}
			},
			on_wrapper_update: function (wrapper, wrapper_model) {
				if ( wrapper != this.wrapper_view ) return;
				this.update_position();
			},
			on_change_breakpoint: function (breakpoint) {
				var $delete = this.$el.find('.upfront-module > .upfront-entity_meta > a.upfront-entity-delete_trigger'),
					$hide = this.$el.find('.upfront-module > .upfront-entity_meta > a.upfront-entity-hide_trigger');
				if ( !breakpoint.default ) {
					this.disable_interaction(true, false, true, true, true);
					$delete.hide();
					$hide.show();
				} else {
					this.enable_interaction(true);
					$delete.show();
					$hide.hide();
				}
				//this.update_position();
			},
			on_after_layout_render: function () {
			},
			remove: function(){
				if(this._objects_view)
					this._objects_view.remove();
				Backbone.View.prototype.remove.call(this);
			}
		}),

		ModuleGroup = _Upfront_EditableEntity.extend({
			className: "upfront-editable_entity upfront-module-group",
			id: function(){ return this.model.get_property_value_by_name('element_id'); },
			cssSelectors: {
				'.upfront-module-group': {label: l10n.mg_label, info: l10n.mg_info},
				'.upfront-module-group-bg': {label: l10n.mgbg_label, info: l10n.mgbg_info},
				'.upfront-object, .upfront-output-object': {label: l10n.mgel_label, info: l10n.mgel_info}
			},
			events: {
				"click > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click > .upfront-module-group-toggle-container > .upfront-module-group-ungroup": "on_ungroup",
				"click > .upfront-module-group-toggle-container > .upfront-module-group-reorder": "on_reorder",
				"click > .upfront-module-group-toggle-container > .upfront-module-group-edit": "on_edit",
				"click > .upfront-entity_meta > a.upfront-entity-hide_trigger": "on_hide_click",
				"click > .upfront-module-hidden-toggle > a.upfront-entity-hide_trigger": "on_hide_click",
				//"click a.redactor_act": "onOpenPanelClick",
				//"click .upfront-save_settings": "onOpenPanelClick",
				"click .open-item-controls": "onOpenItemControlsClick",
				"click > .upfront-module-group-finish-edit": "on_finish",
				"click": "on_click",
				"dblclick": "on_dblclick"
			},
			initialize: function () {
				var callback = this.update || this.render;
				this.listenTo(this.model.get("properties"), 'change', callback);
				this.listenTo(this.model.get("properties"), 'change', this.handle_visual_padding_hint);
				this.listenTo(this.model.get("properties"), 'add', callback);
				this.listenTo(this.model.get("properties"), 'remove', callback);
				this._prev_class = this.model.get_property_value_by_name('class');

				this.listenTo(Upfront.Events, 'layout:after_render', this.refresh_background);
				this.listenTo(Upfront.Events, 'layout:after_render', this.update_size_hint);

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "command:module_group:finish_edit", this.on_finish);
				this.listenTo(Upfront.Events, "command:module_group:close_panel", this.closeControlPanel);

				this.editing = false;
				this.on('entity:resize_stop', this.on_resize, this);
			},
			handle_visual_padding_hint: function (prop) {
				if (typeof prop === 'undefined') return;

				var value = prop.get('value');

				if ( prop.id.match(/(top|bottom)_padding_(num|slider)/) ) {
					if ( prop.id.match(/top_padding_(num|slider)/) ) {
						this.show_top_padding_hint(value);
					}
					if ( prop.id.match(/bottom_padding_(num|slider)/) ) {
						this.show_bottom_padding_hint(value);
					}
				}

			},
			show_top_padding_hint: function (value) {
				var me               = this,
					top_padding_hint = this.$el.find('.upfront-entity-top-padding-hint')
				;
				if(!this.top_padding_hint_flag) {
					this.top_padding_hint_flag = true;
					return;
				}
				if(!top_padding_hint.length) {
					top_padding_hint = $('<div class="upfront-ui upfront-entity-padding-hint upfront-entity-top-padding-hint"></div>').appendTo(this.$el);
				}
				top_padding_hint.css({
					height: value + 'px',
					opacity: 1
				});
				clearTimeout(this.top_padding_hint_timer);
				this.top_padding_hint_timer = setTimeout(function() {
					me.hide_top_padding_hint();
				}, 1000);
			},
			hide_top_padding_hint: function () {
				if(!this.padding_hint_locked) {
					this.$el.find('.upfront-entity-top-padding-hint').css({
						opacity: 0
					});
				}
			},
			show_bottom_padding_hint: function (value) {
				var me                  = this,
					bottom_padding_hint = this.$el.find('.upfront-entity-bottom-padding-hint')
				;
				if(!this.bottom_padding_hint_flag) {
					this.bottom_padding_hint_flag = true;
					return;
				}
				if(!bottom_padding_hint.length) {
					bottom_padding_hint = $('<div class="upfront-ui upfront-entity-padding-hint upfront-entity-bottom-padding-hint"></div>').appendTo(this.$el);
				}
				bottom_padding_hint.css({
					height: value + 'px',
					opacity: 1
				});
				clearTimeout(this.bottom_padding_hint_timer);
				this.bottom_padding_hint_timer = setTimeout(function() {
					me.hide_bottom_padding_hint();
				}, 1000);
			},
			hide_bottom_padding_hint: function () {
				if(!this.padding_hint_locked) {
					this.$el.find('.upfront-entity-bottom-padding-hint').css({
						opacity: 0
					});
				}
			},
			onOpenPanelClick: function(event) {
				event.preventDefault();
				this.toggleLinkPanel();
			},

			onOpenItemControlsClick: function() {
				if (this.$el.hasClass('controls-visible')) {
					this.closeControlPanel();
				} else {
					this.openControlPanel();
				}
			},

			openControlPanel: function () {
				this.$el.addClass('controls-visible');
				this.controlsVisible = true;
				this.disable_interaction(false, false, false);
			},

			closeControlPanel: function(enable) {
				var enable = ( enable !== false );
				this.$el.removeClass('controls-visible');
				this.controlsVisible = false;
				if (enable) {
					this.enable_interaction();
				}
			},

			createInlineControlPanel: function() {
				var property_url = this.model.get_property_value_by_name('href');

				if(!property_url) {
					property_url = "";
				}

				var me = this,
					panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
					visitLinkControl = new Upfront.Views.Editor.InlinePanels.Controls.VisitLink({
						url: property_url,
						hideIfUnlink: true,
						linkLabel: {
							external: l10n.visit_link
						}
					}),
					linkPanelControl = new Upfront.Views.Editor.InlinePanels.Controls.GroupLinkPanel({
						linkUrl: property_url,
						linkType: Upfront.Util.guessLinkType(property_url),
						linkTarget: this.model.get_property_value_by_name("linkTarget"),
						button: false
					}),
					ungroupControl = new Upfront.Views.Editor.InlinePanels.Control({
						label: l10n.ungroup,
						className: 'upfront-inline-panel-item ungroup-control'
					}),
					editControl = new Upfront.Views.Editor.InlinePanels.Control({
						label: l10n.edit_elements,
						className: 'upfront-inline-panel-item edit-elements-control'
					})
				;

				this.listenTo(linkPanelControl, 'change change:target', function(data) {
					visitLinkControl.setLink(data.url);
					this.model.set_property('href', data.url);
					this.model.set_property('linkTarget', data.target);
				});
				this.listenTo(linkPanelControl, 'panel:open panel:close', function() {
					me.toggleLinkPanel();
				});
				this.listenTo(ungroupControl, 'click', function (e) {
					me.on_ungroup();
				});
				this.listenTo(editControl, 'click', function (e) {
					me.closeControlPanel(false);
					me.on_edit();
				});

				panel.items = _([
					linkPanelControl,
					visitLinkControl,
					editControl,
					ungroupControl
				]);

				var $imageControlsTpl = $('<div class="upfront-module-group-controls upfront-ui"></div>');
				this.$el.append($imageControlsTpl);
				panel.render();
				$imageControlsTpl.append(panel.el);
				panel.delegateEvents();

				this.panel = panel;
			},

			toggleLinkPanel: function() {
				this.$el.toggleClass('control-dialog-open');
			},

			render: function () {
				var me = this,
					props = {},
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					model = _.extend(this.model.toJSON(), {"properties": props, "height": height, "href": ""}),
					template = _.template(_Upfront_Templates["module_group"], model);

				Upfront.Events.trigger("entity:module_group:before_render", this, this.model);


				// Id the element by anchor, if anchor is defined
				var the_anchor = this.model.get_property_value_by_name("anchor");
				if (the_anchor && the_anchor.length)
					this.el.id = the_anchor;

				var theme_style = this.model.get_breakpoint_property_value('theme_style', true);
				if(theme_style){
					this.$el.addClass( theme_style.toLowerCase() );
					this._theme_style = theme_style;
				}

				this.$el.html(template + '<span class="open-item-controls"></span>');
				this.$bg = this.$el.find('.upfront-module-group-bg');
				this.update();
				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this.region_view;
				local_view.group_view = this;
				this.$el.find('> .upfront-modules_container').append(local_view.el);
				local_view.render();

				this.apply_paddings(this.$el.find('> .upfront-modules_container'));

				if ( ! this._modules_view ) {
					this._modules_view = local_view;
				}
				else {
					this._modules_view.delegateEvents();
				}

				this.createInlineControlPanel();

				this.create_size_hint(this.$el);
				this.$control_el = this.$el;
				this.updateControls();

				setTimeout(function() {
					if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
				}, 300);

				Upfront.Events.trigger("entity:module_group:after_render", this, this.model);
			},
			update: function (prop) {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					prop_class = this.model.get_property_value_by_name('class'),
					row = this.model.get_property_value_by_name('row'),
					use_padding = this.model.get_breakpoint_property_value('use_padding', true),
					theme_style = this.model.get_breakpoint_property_value('theme_style', true),
					grid = Upfront.Settings.LayoutEditor.Grid,
					ed = Upfront.Behaviors.GridEditor,
					prev_col, col
				;
				if ( Upfront.Application.layout_ready ) {
					prev_col = ( !breakpoint || breakpoint.default ) ? ed.get_class_num(this._prev_class, grid.class) : this.$el.data('breakpoint_col');
					col = ( !breakpoint || breakpoint.default ) ? ed.get_class_num(prop_class, grid.class) : this.model.get_breakpoint_property_value('col');
				}
				this.$el.removeClass(this._prev_class).addClass(prop_class);
				this._prev_class = prop_class;
				if(theme_style){
					this.$el.removeClass(this._theme_style).addClass( theme_style.toLowerCase() );
					this._theme_style = theme_style;
				}
				this.$el.css('min-height', (row*grid.baseline) + 'px').attr('data-row', row);

				this.$bg.toggleClass('upfront-module-group-bg-padding', use_padding ? true : false);

				this.update_position();
				this.update_background();
				// Check if width is changed, if it did, let's normalize child modules
				if ( Upfront.Application.layout_ready && prop && ( prop.id == 'class' || prop.id == 'breakpoint' ) && prev_col != col ) {
					this.normalize_child_modules(prev_col);
				}
				Upfront.Events.trigger('entity:module_group:update', this, this.model);
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid;

				this.apply_paddings(this.$el.find('> .upfront-modules_container'));

				if ( ! breakpoint ) return;

				var $toggle = this.$el.find('> .upfront-module-hidden-toggle');

				this.apply_breakpoint_position(this.$el, $toggle);

				var theme_style = this.model.get_breakpoint_property_value('theme_style', true);
				if ( this._theme_style ) {
					this.$el.removeClass(this._theme_style.toLowerCase());
				}
				if ( theme_style ) {
					this.$el.addClass(theme_style.toLowerCase());
					this._theme_style = theme_style;
				}
				this.update_size_hint();
				Upfront.Events.trigger('entity:module_group:update_position', this, this.model);
			},
			normalize_child_modules: function (prev_col) {
				var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					me = this,
					ed = Upfront.Behaviors.GridEditor,
					modules = this.model.get('modules'),
					wrappers = this.model.get('wrappers'),
					col = ( !breakpoint || breakpoint.default ) ? ed.get_class_num(this.$el, ed.grid.class) : this.$el.data('breakpoint_col'),
					use_col = _.isNumber(prev_col) ? prev_col : col,
					lines = ed.parse_modules_to_lines(modules, wrappers, ( breakpoint ? breakpoint.id : 'desktop' ), use_col)
				;
				_.each(lines, function (line) {
					var diff_col = col - line.col,
						total_diff = 0,
						outstanding_diff = 0,
						outstanding_col = 0,
						all_wrappers = [],
						spacer_wrappers = [],
						el_wrappers = []
					;
					if ( diff_col == 0 ) return;
					_.each(line.wrappers, function (w) {
						w.ratio = w.col/use_col;
						w.apply_diff = Math.round(w.ratio * diff_col);
						if ( w.col + w.apply_diff <= 0 ) w.apply_diff = 0;
						total_diff += w.apply_diff;
						all_wrappers.push(w);
						if ( w.spacer ) spacer_wrappers.push(w);
						else el_wrappers.push(w);
					});
					if ( all_wrappers.length == spacer_wrappers.length ) {
						// everything is spacer, remove it
						_.each(spacer_wrappers, function (w) {
							_.each(w.modules, function (m) {
								modules.remove(m.model);
							});
							wrappers.remove(w.model);
						});
						return;
					}
					outstanding_diff = total_diff - diff_col;
					if ( outstanding_diff != 0 ) {
						outstanding_col = outstanding_diff > 0 ? -1 : 1;
						while ( outstanding_diff != 0 ) {
							_.each(diff_col > 0 ? _.union(el_wrappers, spacer_wrappers) : _.union(spacer_wrappers, el_wrappers), function (w) {
								if ( outstanding_diff == 0 ) return;
								if ( w.col + w.apply_diff + outstanding_col <= 0 ) return;
								w.apply_diff += outstanding_col;
								outstanding_diff += outstanding_col;
							});
						}
					}
					_.each(all_wrappers, function (w) {
						var apply_col = w.col + w.apply_diff,
							w_breakpoint = w.model.get_property_value_by_name('breakpoint'),
							w_breakpoint_data = ( w_breakpoint && breakpoint.id in w_breakpoint ) ? w_breakpoint[breakpoint.id] : {}
						;
						if ( !breakpoint || breakpoint.default ) {
							w.model.replace_class(ed.grid.class + apply_col);
							_.each(w.modules, function (m) {
								m.model.replace_class(ed.grid.class + apply_col);
							});
						}
						else {
							w_breakpoint_data.col = apply_col;
							w.model.set_property('breakpoint', Upfront.Util.clone(w_breakpoint));
							_.each(w.modules, function (m) {
								var m_breakpoint = m.model.get_property_value_by_name('breakpoint'),
									m_breakpoint_data = ( m_breakpoint && breakpoint.id in m_breakpoint ) ? m_breakpoint[breakpoint.id] : {}
								;
								m_breakpoint_data.col = apply_col;
								m.model.set_property('breakpoint', Upfront.Util.clone(m_breakpoint));
							});
						}
					});
				});
			},
			on_settings_click: function (e) {
				if( typeof e !== "undefined" ){
					e.preventDefault();
				}
				var BgSettings = Upfront.Views.Editor.BgSettings.Settings.extend({
					bg_title: l10n.group_settings,
					enable_types: ['color', 'image'/*, 'slider', 'video', 'map'*/]
				});
				Upfront.Events.trigger("entity:settings:activate", this, BgSettings);
			},
			on_ungroup: function () {
				var me = this,
					ed = Upfront.Behaviors.GridEditor,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					col = ed.get_class_num(this.$el, ed.grid.class),
					top_padding_use = this.model.get_breakpoint_property_value('top_padding_use', true),
					top_padding_num = this.model.get_breakpoint_property_value('top_padding_num', true),
					top = top_padding_use && top_padding_num !== false ? top_padding_num : 0,
					$wrap = this.$el.closest('.upfront-wrapper'),
					$wraps = Upfront.Util.find_sorted($wrap.parent(), '> .upfront-wrapper:visible'),
					is_clr = $wrap.hasClass('clr'),
					group_wrapper_id = this.model.get_wrapper_id(),
					modules = this.model.get('modules'),
					wrappers = this.model.get('wrappers'),
					region = this.region,
					region_modules = this.region_view.model.get('modules'),
					region_wrappers = this.region_view.model.get('wrappers'),
					group_wrapper = region_wrappers.get_by_wrapper_id(group_wrapper_id),
					group_wrapper_view = Upfront.data.wrapper_views[group_wrapper.cid],
					index = region_modules.indexOf(this.model),
					region_lines = ed.parse_modules_to_lines(region_modules, region_wrappers, breakpoint.id, breakpoint.columns),
					group_lines = ed.parse_modules_to_lines(modules, wrappers, breakpoint.id, col),
					modules_arr = modules.map(function(module){ return module; }),
					line_spacers = [],
					line,
					my_wrapper, prev_wrapper, next_wrapper,
					module_index = 0,
					add_spacer_queue = [],
					is_combine_wrap = false,
					combine_left_spacers = [],
					combine_right_spacers = [],
					combine_left_spacer = 0,
					combine_right_spacer = 0
				;
				ed.start(this, this.model);
				// Find previous and next wrapper
				_.each(region_lines, function (l) {
					if ( line ) return;
					prev_wrapper = false;
					next_wrapper = false;
					_.each(l.wrappers, function (w) {
						if ( my_wrapper && !next_wrapper ) next_wrapper = w;
						_.each(w.modules, function (m) {
							if ( me.model == m.model ) {
								my_wrapper = w;
								line = l;
							}
						});
						if ( !my_wrapper ) prev_wrapper = w;
					});
				});
				if ( !line ) return;
				// Find how many spacer is in the line
				_.each(line.wrappers, function (w) {
					if ( w.spacer ) {
						line_spacers.push(w);
					}
				});
				// Let's check if we need to combine wrapper
				// Do that when group is trapped between elements or when there is other element in the same wrapper
				if ( my_wrapper.modules.length > 1 || ( line.wrappers.length - line_spacers.length > 1 ) ) {
					is_combine_wrap = true;
					if ( my_wrapper.modules.length == 1 && group_lines.length == 1 ) {
						is_combine_wrap = false;
					}
				}
				// Find left/right spacer if combined
				if ( is_combine_wrap && my_wrapper.modules.length == 1 ) {
					_.each(group_lines, function (l, li) {
						_.each(l.wrappers, function (w, wi) {
							if ( wi == 0 ) {
								if ( w.spacer ) combine_left_spacers.push(w.col);
								else combine_left_spacers.push(0);
							}
							if ( wi == l.wrappers.length-1 ) {
								if ( w.spacer ) combine_right_spacers.push(w.col);
								else combine_right_spacers.push(0);
							}
						});
					});
					combine_left_spacer = _.min(combine_left_spacers);
					combine_right_spacer = _.min(combine_right_spacers);
				}
				// Iterate through group
				_.each(group_lines, function (l, li) {
					_.each(l.wrappers, function (w, wi) {
						var wrapper_view = Upfront.data.wrapper_views[w.model.cid],
							remove_modules = [],
							move_modules = []
						;
						_.each(w.modules, function (m, mi) {
							var view = Upfront.data.module_views[m.model.cid],
								$view_el = view.$el.find('> .upfront-editable_entity'),
								is_visible = $view_el.is(':visible'),
								object = m.model.get('objects').first(),
								module_col = col,
								remove_module = false
							;
							// If not visible, let's remove it
							if ( !is_visible ) {
								remove_module = true;
							}
							else {
								// If combine wrap, remove all spacer and set the group wrapper_id
								if ( is_combine_wrap ) {
									if ( m.spacer ) {
										remove_module = true;
									}
									else {
										if ( combine_left_spacer > 0 && prev_wrapper && prev_wrapper.spacer ) {
											module_col -= combine_left_spacer;
										}
										if ( combine_right_spacer > 0 && next_wrapper && next_wrapper.spacer ) {
											module_col -= combine_right_spacer;
										}
										ed.update_model_margin_classes( $view_el, [ed.grid.class + module_col] );
										m.model.set_property('wrapper_id', group_wrapper_id);
									}
								}
								if ( li == 0 && mi == 0 && !m.spacer ) {
									me._update_padding('top', object, top);
								}
							}
							delete view.group_view;
							if ( remove_module ) {
								remove_modules.push({
									model: m.model
								});
							}
							else {
								move_modules.push({
									model: m.model,
									index: index+module_index
								});
								module_index++;
							}
						});

						// If combined, try to see spacer we can add
						// Otherwise, normalize spacers and add needed class
						if ( !is_combine_wrap ) {
							if ( wi == 0 ){
								// Add/remove clr class as this is the first in row
								if ( is_clr ) w.model.add_class('clr');
								else w.model.remove_class('clr');
								// Add previous spacer
								if ( prev_wrapper && prev_wrapper.spacer ) {
									if ( w.spacer ) {
										w.modules[0].model.replace_class(ed.grid.class + (w.col+prev_wrapper.col));
										w.model.replace_class(ed.grid.class + (w.col+prev_wrapper.col));
									}
									else {
										add_spacer_queue.push({
											view: wrapper_view,
											position: 'left',
											col: prev_wrapper.col,
											wrapper_col: w.col+prev_wrapper.col
										});
									}
								}
							}
							if ( wi == l.wrappers.length-1 ) {
								// Add next spacer
								if ( next_wrapper && next_wrapper.spacer ) {
									if ( w.spacer ) {
										w.modules[0].model.replace_class(ed.grid.class + (w.col+next_wrapper.col));
										w.model.replace_class(ed.grid.class + (w.col+next_wrapper.col));
									}
									else {
										add_spacer_queue.push({
											view: wrapper_view,
											position: 'right',
											col: next_wrapper.col,
											wrapper_col: w.col+next_wrapper.col
										});
									}
								}
							}
						}

						_.each(remove_modules, function (m) {
							modules.remove(m.model);
						});

						wrappers.remove(w.model, {silent: true});

						if ( move_modules.length > 0 ) {
							if ( !is_combine_wrap ) {
								region_wrappers.add(w.model, {silent: true});
							}
							_.each(move_modules, function(m){
								modules.remove(m.model, {silent: true});
								m.model.add_to(region_modules, m.index, {update: false});
							});
						}
					});
				});

				if ( is_combine_wrap ) {
					// Let's add the left and right spacer
					if ( combine_left_spacer > 0 ) {
						if ( prev_wrapper && prev_wrapper.spacer ) {
							prev_wrapper.modules[0].model.replace_class(ed.grid.class + (prev_wrapper.col+combine_left_spacer));
							prev_wrapper.model.replace_class(ed.grid.class + (prev_wrapper.col+combine_left_spacer));
						}
						else {
							group_wrapper_view.add_spacer('left', combine_left_spacer, col);
						}
					}
					if ( combine_right_spacer > 0 ) {
						if ( next_wrapper && next_wrapper.spacer ) {
							next_wrapper.modules[0].model.replace_class(ed.grid.class + (next_wrapper.col+combine_right_spacer));
							next_wrapper.model.replace_class(ed.grid.class + (next_wrapper.col+combine_right_spacer));
						}
						else {
							group_wrapper_view.add_spacer('right', combine_right_spacer, col-combine_left_spacer);
						}
					}
				}
				else {
					// Also remove prev/next spacer if exists
					if ( prev_wrapper && prev_wrapper.spacer ) {
						region_wrappers.remove(prev_wrapper.model);
						region_modules.remove(prev_wrapper.modules[0].model, {update: false});
					}
					if ( next_wrapper && next_wrapper.spacer ) {
						region_wrappers.remove(next_wrapper.model);
						region_modules.remove(next_wrapper.modules[0].model, {update: false});
					}
					// Add the queued spacers
					_.each(add_spacer_queue, function(add){
						add.view.add_spacer(add.position, add.col, add.wrapper_col);
					});
					// As this isn't combined, we remove the group wrapper
					region_wrappers.remove(group_wrapper);
				}
				region_modules.remove(this.model);
				//this.remove();
				ed.update_position_data($wrap.closest('.upfront-editable_entities_container'));
				ed.update_wrappers(region);
				Upfront.Events.trigger("entity:module_group:ungroup", modules_arr, region);
			},
			_update_padding: function (dir, object, add) {
				var padding_use = object.get_breakpoint_property_value(dir+'_padding_use', true),
					padding_num = object.get_breakpoint_property_value(dir+'_padding_num', true),
					column_padding = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().get('column_padding')
				;
				if ( add === 0 ) return;
				object.set_breakpoint_property(dir+'_padding_use', 'yes');
				if ( padding_num !== false) {
					object.set_breakpoint_property(dir+'_padding_num', parseInt(padding_num, 10) + parseInt(add, 10));
				}
				else {
					object.set_breakpoint_property(dir+'_padding_num', parseInt(column_padding, 10) + parseInt(add, 10));
				}
			},
			on_reorder: function () {
				Upfront.Events.trigger("command:module_group:finish_edit"); // close other reorder first
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.addClass('upfront-module-group-editing');
				this.$el.addClass('upfront-module-group-on-edit');
				this.editing = true;
				this.disable_interaction(false, false);
				this.toggle_modules_interaction(true, false);
				Upfront.Events.trigger('entity:module_group:edit', this, this.model);
			},
			on_edit: function () {
				Upfront.Events.trigger("command:module_group:finish_edit"); // close other reorder first
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.addClass('upfront-module-group-editing');
				this.$el.addClass('upfront-module-group-on-edit');
				this.trigger('deactivated');
				this.editing = true;
				this.disable_interaction(false, false, false);
				this.toggle_modules_interaction(true, true);
				Upfront.Events.trigger('entity:module_group:edit', this, this.model);
			},
			on_finish: function () {
				if ( !this.editing ){
					return;
				}
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.removeClass('upfront-module-group-editing');
				this.$el.removeClass('upfront-module-group-on-edit');
				this.editing = false;
				this.enable_interaction();
				this.toggle_modules_interaction(false);
			},
			on_resize: function (attr) {
				var wrappers = this.model.get('wrappers');
				wrappers.each(function(wrapper){
					var view = Upfront.data.wrapper_views[wrapper.cid];
					if ( !view )
						return;
					view.update_position();
				});
				this.update_size_hint();
			},
			on_dblclick: function (e) {
				// We don't want to activate the Group when Settings sidebar is open
				if($('#element-settings-sidebar').html() !== '' || $('#settings').html() !== '') return false;
				if ( this.$el.hasClass('upfront-module-group-on-edit') || this.$el.hasClass('upfront-module-group-disabled') ) return;
				this.closeControlPanel(false);
				this.on_edit();
			},
			disable_interaction: function (prevent_edit, resize, drag) {
				if ( prevent_edit ) {
					this.$el.addClass('upfront-module-group-disabled');
				}
				if ( !resize && this.$el.data('ui-resizable') ) {
					this.$el.resizable('option', 'disabled', true);
				}
				if ( !drag && this.$el.data('ui-draggable') ) {
					this.$el.draggable('option', 'disabled', true);
				}
			},
			enable_interaction: function () {
				if ( this.editing ) return; // Don't enable interaction if it's on editing
				this.$el.removeClass('upfront-module-group-disabled');
				if ( this.$el.data('ui-resizable') ) {
					this.$el.resizable('option', 'disabled', false);
				}
				if ( this.$el.data('ui-draggable') ) {
					this.$el.draggable('option', 'disabled', false);
				}
			},
			toggle_modules_interaction: function (enable, can_edit) {
				var can_edit = can_edit === true ? true : false;
				this.model.get('modules').each(function(module){
					var module_view = Upfront.data.module_views ? Upfront.data.module_views[module.cid] : false;
					if ( module_view ) {
						if ( enable ) {
							module_view.enable_interaction(true);
							module_view.disable_interaction(!can_edit, false, true, true, !can_edit);
						}
						else {
							module_view.disable_interaction(true, false, false, false, true);
						}
					}
				});
			},
			on_change_breakpoint: function (breakpoint) {
				if ( !breakpoint.default ){
					this.$el.addClass('upfront-module-group-reorder-mode');
				}
				else {
					this.$el.removeClass('upfront-module-group-reorder-mode');
				}
				this.on_finish(); // make sure to close editing
				this.update_position();
				this.update_background();
			},
			deactivate: function () {
				// We don't want to deactivate the Group when Settings sidebar is open
				if($('#element-settings-sidebar').html() !== '' || $('#settings').html() !== '') return false;
				Upfront.data.prevEntity = false;
				this.$el.removeClass("upfront-module-group-active");
				this.check_deactivated();
				this.trigger("upfront:entity:deactivate", this);
			},
			activate: function () {
				var me= this,
					currentEntity = Upfront.data.currentEntity
				;
				// Deactivate previous ObjectView
				if(typeof(Upfront.data.prevEntity) !== 'undefined' && Upfront.data.prevEntity !== false) {
					Upfront.data.prevEntity.deactivate();
				}
				Upfront.data.prevEntity = this;
				if (this.activate_condition && !this.activate_condition()) return false;
				if (currentEntity && currentEntity == this) return false;
				if (currentEntity && currentEntity != this) {
					currentEntity.trigger('deactivated');
				}

				Upfront.data.currentEntity = this;
				this.trigger("activated", this);
				this.trigger("upfront:entity:activate", this);
				this.listenToOnce(this, 'deactivated', this.deactivate);
				this.$el.addClass("upfront-module-group-active");
			},
			remove: function(){
				if (this._modules_view) {
					this._modules_view.remove();
				}
				var wrappers = this.model.get('wrappers');
				if (wrappers) {
					wrappers.each(function(wrapper){
						var wrapperView = Upfront.data.wrapper_views[wrapper.cid];
						if(wrapperView){
							wrapperView.remove();
							delete Upfront.data.wrapper_views[wrapper.cid];
						}
					});
				}
				if (this.panel) {
					this.panel.remove();
					this.panel = false;
				}
				this.region_view = false;
				this.region = false;
				Backbone.View.prototype.remove.call(this);
				this.model.get('wrappers').reset([], {silent:true});
				this.model = false;
			}
		}),

		Modules = _Upfront_EditableEntities.extend({
			className: "upfront-editable_entities_container",
			init: function () {
				// this.model.unbind('add', this.render, this);
				// this.model.bind('add', this.on_add, this);
				// this.model.unbind('remove', this.render, this);
				// this.model.bind('remove', this.on_remove, this);
				// this.model.bind('reset', this.on_reset, this);
				this.stopListening(this.model, 'add', this.render);
				this.listenTo(this.model, 'add', this.on_add);
				this.stopListening(this.model, 'remove', this.render);
				this.listenTo(this.model, 'remove', this.on_remove);
				this.listenTo(this.model, 'reset', this.on_reset);

				this.listenTo(Upfront.Events, "entity:drag_stop", this.on_drop);
				this.listenTo(Upfront.Events, "entity:resized", this.on_resize);
				this.listenTo(Upfront.Events, "entity:wrapper:resized", this.on_wrapper_resize);
				this.listenTo(Upfront.Events, "entity:wrappers:update", this.on_wrappers_update);
				this.listenTo(Upfront.Events, "entity:object:refresh", this.on_object_refresh);
				this.listenTo(Upfront.Events, "entity:module_group:group", this.on_group);
				this.listenTo(Upfront.Events, "entity:module_group:ungroup", this.on_ungroup);
				this.listenTo(Upfront.Events, "layout:after_render", this.on_after_layout_render);
				this.listenTo(Upfront.Events, "upfront:csseditor:ready", this.on_csseditor_ready);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
			},
			on_entity_remove: function(e, view) {
				Upfront.Events.trigger("entity:removed:before");
				var wrapper_id = view.model.get_wrapper_id(),
					me = this;
				if ( wrapper_id ){
					var wrappers = this.region_view.model.get('wrappers'),
						wrapper = wrappers.get_by_wrapper_id(wrapper_id),
						wrapper_module = 0;
					if ( wrapper ){
						// check if this wrapper has another module
						this.model.each(function(module){
							if ( module.get_wrapper_id() == wrapper_id )
								wrapper_module++;
						});
						if ( wrapper_module == 1 ){
							Upfront.Behaviors.GridEditor.normalize_module_remove(view, view.model, this.model, wrapper, wrappers);
							wrappers.remove(wrapper);
						}
					}
				}
				view.remove();
				this.model.remove(view.model);
				Upfront.Events.trigger("entity:removed:after");
			},
			render: function () {
				this.$el.html('');
				var $el = this.$el,
					me = this;
				this.current_wrapper_id = this.current_wrapper_el = null;
				Upfront.Events.trigger("entity:modules:before_render", this, this.model);
				if ( typeof Upfront.data.module_views == 'undefined' )
					Upfront.data.module_views = {};
				if ( typeof Upfront.data.wrapper_views == 'undefined' )
					Upfront.data.wrapper_views = {};
				this.model.each(function (module) {
					me.render_module(module);
				});
				this.apply_flexbox_clear();
				this.apply_wrapper_height();
				Upfront.Events.trigger("entity:modules:after_render", this, this.model);
			},
			render_module: function (module, options) {
				var $el = this.$el,
					index = options && typeof options.index != 'undefined' ? options.index-1 : -2,
					$el_index = index >= 0 ? $el.find('> .upfront-wrapper > .upfront-module-view, > .upfront-wrapper > .upfront-module-group').eq(index) : false,
					default_view_class = module.get('modules') ? "ModuleGroup" : "Module",
					view_class_prop = module.get("properties").where({"name": "view_class"}),
					view_class = view_class_prop.length ? view_class_prop[0].get("value") : default_view_class,
					//view_class = Upfront.Views[view_class] ? view_class : "Module",
					local_view = Upfront.Views[view_class] ? Upfront.data.module_views[module.cid] || new Upfront.Views[view_class]({model: module}): false,
					wrappers = (typeof this.group_view != 'undefined' ? this.group_view : this.region_view).model.get('wrappers'),
					wrapper_id = module.get_wrapper_id(),
					wrapper = wrappers && wrapper_id ? wrappers.get_by_wrapper_id(wrapper_id) : false,
					wrapper_view, wrapper_el
				;
				if(local_view){
					local_view.parent_view = this;
					local_view.region_view = this.region_view;
					local_view.region = this.region_view.model;
					if ( this.group_view ) {
						local_view.group_view = this.group_view;
					}
					if ( !wrapper ){
						local_view.render();
						if ( index === -2 ) {
							$el.append(local_view.el);
						}
						else if ( index === -1 ) {
							$el.prepend(local_view.el);
						}
						else {
							$el_index.parent().after(local_view.el);
						}
					}
					else {
						if ( this.current_wrapper_id == wrapper_id ){
							wrapper_el = this.current_wrapper_el;
						}
						else {
							wrapper_view = Upfront.data.wrapper_views[wrapper.cid];
							if ( !wrapper_view ) {
								wrapper_view = new Upfront.Views.Wrapper({model: wrapper})
								wrapper_view.parent_view = this;
								wrapper_view.render();
							}
							else {
								wrapper_view.parent_view = this;
							}
							wrapper_el = wrapper_view.el;
							local_view.wrapper_view = wrapper_view;
						}
						this.current_wrapper_id = wrapper_id;
						this.current_wrapper_el = wrapper_el;
						if ( wrapper_view ){
							if ( index === -2 ) {
								$el.append(wrapper_el);
							}
							else if ( index === -1 ) {
								$el.prepend(wrapper_el);
							}
							else {
								$el_index.closest('.upfront-wrapper').after(wrapper_el);
							}
							if ( ! Upfront.data.wrapper_views[wrapper.cid] ) {
								Upfront.data.wrapper_views[wrapper.cid] = wrapper_view;
							}
						}
						if ( $el_index !== false ){
							if ( $el_index.closest('.upfront-wrapper').get(0) == wrapper_el ) {
								$el_index.after(local_view.el);
							}
							else {
								$(wrapper_el).prepend(local_view.el);
							}
						}
						else if ( index === -1 ) {
							$(wrapper_el).prepend(local_view.el);
						}
						else {
							$(wrapper_el).append(local_view.el);
						}
						local_view.render();
					}
					if ( ! Upfront.data.module_views[module.cid] ){
						//local_view.bind("upfront:entity:activate", this.on_activate, this);
						//local_view.model.bind("remove", this.deactivate, this);
						//local_view.listenTo(local_view.model, 'remove', this.deactivate);

						this.listenTo(local_view, 'upfront:entity:activate', this.on_activate);
						this.listenTo(local_view.model, 'remove', this.deactivate);
						Upfront.data.module_views[module.cid] = local_view;
					}
					else {
						local_view.delegateEvents();
					}
				}
				Upfront.Events.trigger('entity:modules:render_module', local_view, local_view.model, this, this.model);
			},
			on_wrappers_update: function (parent_model) {
				if ( _.isObject(parent_model) && parent_model.get('modules') != this.model ) return;
				this.model.each(function(module){
					var local_view = Upfront.data.module_views[module.cid];
					if ( ! local_view ) return;
					local_view.update_position();
				});
				this.apply_flexbox_clear();
				this.apply_wrapper_height();
			},
			on_drop: function (view, model) {
				if ( view.parent_view && view.parent_view != this ) return;
				//this.apply_flexbox_clear();
				this.apply_wrapper_height();
				this.apply_adapt_to_breakpoints();
			},
			on_resize: function (view, model) {
				if ( view.parent_view && view.parent_view != this ) return;
				//this.apply_flexbox_clear();
				this.apply_wrapper_height();
				this.apply_adapt_to_breakpoints();
			},
			on_wrapper_resize: function (view, model) {
				if ( view.parent_view && view.parent_view != this ) return;
				//this.apply_flexbox_clear();
				this.apply_wrapper_height();
				this.apply_adapt_to_breakpoints();
			},
			on_object_refresh: function (view) {
				if ( !view.parent_module_view ) return;
				if ( view.parent_module_view.parent_view && view.parent_module_view.parent_view != this ) return;
				this.apply_wrapper_height();
			},
			on_add: function (model, collection, options) {
				var update = typeof options.update != 'undefined' ? options.update : true;
				this.current_wrapper_id = this.current_wrapper_el = null;
				this.render_module(model, options);
				if ( update ) {
					//this.apply_flexbox_clear();
					this.apply_wrapper_height();
					this.apply_adapt_to_breakpoints();
				}
				Upfront.Events.trigger("entity:added:after");
			},
			on_remove: function (model, collection, options) {
				var update = typeof options.update != 'undefined' ? options.update : true;
				this.remove_model(model);
				if ( update ) {
					this.apply_wrapper_height();
					this.apply_adapt_to_breakpoints();
				}
			},
			remove_model: function (model) {
				var view = Upfront.data.module_views[model.cid];
				if ( !view ) return;
				view.unbind();
				view.remove();
				delete Upfront.data.module_views[model.cid];
			},
			on_reset: function (collection, options) {
				var me = this;
				if ( options && options.call_render ){
					_.each(options.call_render, function(module){
						var index = collection.indexOf(module);
						me.render_module(module, {index: index});
					});
					this.apply_flexbox_clear();
					this.apply_wrapper_height();
					this.apply_adapt_to_breakpoints();
				}
			},
			on_after_layout_render: function () {
				this.apply_flexbox_clear();
				this.apply_adapt_to_breakpoints();
				var me = this;
				setTimeout(function(){
					me.apply_wrapper_height();
				}, 1000); // Wait for other positioning finished
			},
			on_csseditor_ready: function () {
				//this.apply_wrapper_height();
			},
			apply_flexbox_clear: function () {
				this.fix_flexbox_clear(this.$el);
			},
			apply_wrapper_height: function () {
				if ( !Upfront.Application.layout_ready ) return;
				if ( this.region_view.model.get('name') == 'shadow' ) return;
				var ed = Upfront.Behaviors.GridEditor,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					is_group = !_.isUndefined(this.group_view),
					wrappers = ( is_group ? this.group_view : this.region_view ).model.get('wrappers'),
					col = breakpoint.default
						? ed.get_class_num(( is_group ? this.group_view : this.region_view ).$el, ed.grid.class)
						: ( is_group ? this.group_view : this.region_view ).model.get_breakpoint_property_value('col')
				;
				this.model.each(function (module) {
					var local_view = Upfront.data.module_views[module.cid];
					if ( !local_view || !local_view._modules_view ) return;
					local_view._modules_view.apply_wrapper_height();
				});
				this.fix_wrapper_height(this.model, wrappers, col);
			},
			apply_adapt_to_breakpoints: function () {
				var current_breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				if ( current_breakpoint && !current_breakpoint.default )
					return;
				// Don't do anything on shadow region
				if ( this.region_view && this.region_view.model.get('name') == 'shadow' )
					return;
				var me = this,
					ed = Upfront.Behaviors.GridEditor,
					is_group = ( typeof this.group_view != 'undefined' ),
					wrappers = ( is_group ? this.group_view : this.region_view ).model.get('wrappers'),
					breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
				_.each(breakpoints, function(each){
					var breakpoint = each.toJSON();
					if ( breakpoint.default )
						return;
					if ( is_group ) {
						var group_col = ed.get_class_num(me.group_view.$el, ed.grid.class),
							breakpoint_data = me.group_view.model.get_property_value_by_name('breakpoint');
						if ( _.isObject(breakpoint_data) && _.isObject(breakpoint_data[breakpoint.id]) && !_.isUndefined(breakpoint_data[breakpoint.id].col) )
							group_col = breakpoint_data[breakpoint.id].col;
					}
					var col = is_group ? group_col : breakpoint.columns;
					ed.adapt_to_breakpoint(me.model, wrappers, breakpoint.id, col, true);
				});
			},
			on_group: function (group) {
				if ( typeof this.group_view == 'undefined' || group.cid != this.group_view.model.cid )
					return;
				this.reset_breakpoints(this.model.map(function(module){ return module; }));
			},
			on_ungroup: function (modules) {
				if ( modules && modules[0] && !this.model.find(function(module){ return module.cid == modules[0].cid }) )
					return;
				this.reset_breakpoints(modules);
			},
			reset_breakpoints: function (modules) {
				_.each(modules, function(module){
					var breakpoint = Upfront.Util.clone( module.get_property_value_by_name('breakpoint') || {} );
					_.each(breakpoint, function(data, id){
						breakpoint[id].edited = false;
					});
					module.set_property('breakpoint', breakpoint, true);
				});
				this.apply_adapt_to_breakpoints();
			},
			on_change_breakpoint: function (breakpoint) {
				var me = this;
				// Make sure clearing flexbox is applied, set a timeout to let other positioning finish
				setTimeout(function(){
					me.apply_flexbox_clear();
					me.apply_wrapper_height();
				}, 1000);
			},
			remove: function() {
				var me = this;
				this.model.each(function(model){
					me.remove_model(model);
				});
				this.region_view = false;
				this.group_view = false;
				Backbone.View.prototype.remove.call(this);
				this.model.reset([], {silent:true});
				this.model = false;
			}
		}),

		RegionContainer = _Upfront_SingularEditor.extend({
			cssSelectors: {
				'.upfront-region-container-bg': {label: l10n.region_container_label, info: l10n.region_container_info},
				'.upfront-region-center': {label: l10n.main_content_label, info: l10n.main_content_info},
				'.upfront-region-side-left': {label: l10n.lsr_label, info: l10n.lsr_info},
				'.upfront-region-side-right': {label: l10n.rsr_label, info: l10n.rsr_info}
			},
			events: {
				"click > .upfront-region-edit-trigger": "trigger_edit",
				"click > .upfront-region-edit-fixed-trigger": "trigger_edit_fixed",
				"click > .upfront-region-finish-edit": "finish_edit" ,
				"contextmenu": "on_context_menu",
				"mouseover": "on_mouse_over"
			},
			attributes: function(){
				var name = ( this.model.get("container") || this.model.get("name") ).toLowerCase().replace(/\s/g, "-"),
					classes = [];
				classes.push('upfront-region-container');
				classes.push('upfront-region-container-' + name);
				classes.push('upfront-region-container-' + this._get_region_type() );
				if ( _.isObject(this.model.collection) && this.model.collection.active_region == this.model ){
					classes.push('upfront-region-container-active');
				}
				return {
					"class": classes.join(' '),
					"id": 'region-container-' + name
				};
			},
			_get_region_type: function () {
				return this.model.get('type') || ( this.model.get('clip') ? 'clip' : 'wide' );
			},
			_get_previous_region_type: function () {
				return this.model.previous('type') || ( this.model.previous('clip') ? 'clip' : 'wide' );
			},
			/*_get_full_size_el: function ($el, ratio, inside) {
				var is_full_screen = ( this._get_region_type() == 'full' ),
					width = $el.width(),
					win_height = $(window).height(),
					height = is_full_screen ? win_height : $el.height();
				return this._get_full_size(width, height, ratio, inside);
			},*/
			on_mouse_over: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				if ( $main.hasClass('upfront-region-fixed-editing') )
					this.trigger('activate_region', this);
				//this.update_pos();
			},
			remove_context_menu: function(e) {
				if (!this.context_menu_view) return false;
				$(Upfront.Settings.LayoutEditor.Selectors.contextmenu).html('').hide();
				this.context_menu_view = false;

			},
			on_context_menu: function(e) {
				if($(e.target).closest('.upfront-inline-modal-content').length > 0) {
					e.stopPropagation();
					return;
				}
				if (Upfront.Settings.Application.no_context_menu) return;

				e.preventDefault();
				this.event = e;
				//Upfront.Events.trigger("entity:contextmenu:activate", this);
				if(this.context_menu_view) {
					return this.context_menu_view.render();
				}

				var context_menu_view = new this.ContextMenu({
					model: this.model,
					el: $(Upfront.Settings.LayoutEditor.Selectors.contextmenu)
				});

				context_menu_view.for_view = this;
				this.context_menu_view = context_menu_view;

				return this.context_menu_view.render();

			},
			init: function () {
				var me = this;
				var ContextMenuList = Upfront.Views.ContextMenuList.extend({
					initialize: function() {

						this.menuitems = _([
						  new Upfront.Views.ContextMenuItem({
							  get_label: function() {
								  var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				 				  if($main.hasClass('upfront-region-editing'))
								  	return l10n.finish_editing;
								  else
								  	return l10n.edit_background;
							  },
							  action: function() {
							  		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				 				  if($main.hasClass('upfront-region-editing'))
								  	me.close_edit();
								  else
								  	me.trigger_edit(me.event);

							  }
						  }),

						  new Upfront.Views.ContextMenuItem({
							  get_label: function() {
								  	return l10n.add_floating_region;
							  },
							  action: function(view, e) {
							  		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
							  			collection = me.model.collection,
							  			index = collection.indexOf(me.model),
							  			fixed = me.model.get_sub_region('fixed'),
							  			title = me.model.get('title') + " Floating " + (fixed.length+1),
							  			name = title.toLowerCase().replace(/\s/g, '-'),
								  		new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
											"name": name,
											"container": me.model.get('name'),
											"title": title,
											"type": 'fixed',
											"sub": 'fixed',
											"scope": me.model.get('scope')
										})),
							  			offset = me.$el.offset(),
							  			width = me.$el.width(),
							  			height = me.$el.height(),
							  			window_h = $(window).height(),
							  			new_region_w = 225,
							  			new_region_h = 225,
										end_t, pos_x, pos_y, prop_x, prop_y;
									new_region.set_property('width', new_region_w);
									new_region.set_property('height', new_region_h);
									if ( e.pageX > offset.left + (width/2) ){
										pos_x = offset.left + width - e.pageX - Math.floor(new_region_w/2);
										prop_x = 'right';
									}
									else {
										pos_x = e.pageX - offset.left - Math.floor(new_region_w/2);
										prop_x = 'left';
									}
									if ( height >= window_h && e.clientY > window_h/2 ){
										pos_y = window_h - e.clientY - Math.floor(new_region_h/2);
										prop_y = 'bottom';
									}
									else {
										pos_y = e.clientY - Math.floor(new_region_h/2);
										prop_y = 'top';
									}
									pos_x = pos_x > 0 ? pos_x : 0;
									pos_y = pos_y > 0 ? pos_y : 0;
									new_region.set_property(prop_x, pos_x);
									new_region.set_property(prop_y, pos_y);
									new_region.set_property('background_type', 'color');
									new_region.set_property('background_color', '#aeb8c2');
									Upfront.Events.once('entity:region:added', run_animation, this);
									new_region.add_to(collection, index+1, {sub: 'fixed'});
				 				 	if(!$main.hasClass('upfront-region-fixed-editing'))
								  		me.trigger_edit_fixed(me.event);
								  	function run_animation(view, model){
										var ani_event_end = 'animationend.fixed_region_ani webkitAnimationEnd.fixed_region_ani MSAnimationEnd.fixed_region_ani oAnimationEnd.fixed_region_ani';
								  		end_t = setTimeout(end, 2000);
								  		view.$el.addClass("upfront-add-region-ani upfront-add-region-ani-" + prop_y + '-' + prop_x);
										view.$el.one(ani_event_end, function () {
											end(view);
											clearTimeout(end_t);
											view.$el.off(ani_event_end); // Make sure to remove any remaining unfired event
										});
								  	}
									function end (view) {
										view.$el.removeClass("upfront-add-region-ani upfront-add-region-ani-" + prop_y + '-' + prop_x);
										Upfront.Events.trigger('command:region:fixed_edit_toggle', true);
									}
							  }
						  })
						]);
					}
				});

				this.ContextMenu = Upfront.Views.ContextMenu.extend({
					initialize: function() {
						this.menulists = _([
						  new ContextMenuList()
						]);
					}
				});


				var grid = Upfront.Settings.LayoutEditor.Grid,
					width = this.model.get_property_value_by_name('width');
				this.sub_model = [];
				this.max_col = width ? Upfront.Util.width_to_col(width) : grid.size;
				this.available_col = this.max_col;

				// this.model.get("properties").bind("change", this.update, this);
				// this.model.get("properties").bind("add", this.update, this);
				// this.model.get("properties").bind("remove", this.update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(Upfront.Events, "entity:region:activated", this.update_pos);
				this.listenTo(Upfront.Events, "entity:region:activated", this.update_overlay);
				this.listenTo(Upfront.Events, "entity:region:deactivated", this.close_edit);
				this.listenTo(Upfront.Events, "layout:after_render", this.fix_height);
				this.listenTo(Upfront.Events, "entity:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.update_overlay);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, "sidebar:toggle:done", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region:added", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region:removed", this.on_region_remove);
				this.listenTo(Upfront.Events, "entity:region:hide_toggle", this.on_region_hide);
				this.listenTo(Upfront.Events, "entity:module_group:group", this.fix_height);
				this.listenTo(Upfront.Events, "entity:module_group:ungroup", this.fix_height);
				this.listenTo(Upfront.Events, "upfront:layout:contained_region_width", this.on_contained_width_change);
				this.listenTo(Upfront.Events, 'layout:after_render', this.update_pos);
				this.listenTo(Upfront.Events, "sidebar:toggle:done", this.update_pos);
				this.listenTo(Upfront.Events, "application:mode:after_switch", this.update_pos);
				$(window).on('scroll.region_container_' + this.model.get('name'), this, this.on_scroll);
				$(window).on('resize.region_container_' + this.model.get('name'), this, this.on_window_resize);

				// breakpoint changes
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);

				this.listenTo(Upfront.Events, "entity:contextmenu:deactivate", this.remove_context_menu);

				this.lazyFixHeight = _.debounce(this.fix_height, 1000);
			},
			render: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					type = this._get_region_type(),
					data = _.extend(this.model.toJSON(), {size_class: grid.class, max_col: this.max_col, available_col: this.available_col}),
					template = _.template(_Upfront_Templates["region_container"], data),
					$edit = $('<div class="upfront-region-edit-trigger upfront-ui" title="' + l10n.change_background + '"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$finish = $('<div class="upfront-region-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> ' + l10n.finish_edit_bg + '</div>');
				Upfront.Events.trigger("entity:region_container:before_render", this, this.model);
				this.$el.html(template);
				this.$bg = this.$el.find('.upfront-region-container-bg');
				this.$layout = this.$el.find('.upfront-grid-layout');
				$edit.appendTo(this.$el);
				//$edit_fixed.appendTo(this.$el);
				$finish.appendTo(this.$el);
				//this.render_fixed_panel();
				this.update();
				//if ( type != 'clip' )
					this.$el.append('<div class="upfront-region-active-overlay" />');
				Upfront.Events.trigger("entity:region_container:after_render", this, this.model);
			},
			update: function () {
				var me = this,
					grid = Upfront.Settings.LayoutEditor.Grid,
					name = ( this.model.get("container") || this.model.get("name") ).toLowerCase().replace(/\s/g, "-"),
					previous_name = ( this.model.previous("container") || this.model.previous("name") ).toLowerCase().replace(/\s/g, "-"),
					expand_lock = this.model.get_property_value_by_name('expand_lock'),
					type = this._get_region_type(),
					previous_type = this._get_previous_region_type(),
					default_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default().toJSON(),
					contained_width = Upfront.Application.layout.get_property_value_by_name('contained_region_width') || (default_breakpoint.columns * grid.column_width);
				if ( type == 'clip' )
					this.$bg.css('max-width', contained_width + 'px');
				else
					this.$bg.css('max-width', '');
				this.update_background();
				if ( previous_type != type ){
					this.$el.removeClass('upfront-region-container-' + previous_type);
					this.$el.addClass('upfront-region-container-' + type);
					_.delay(function(){
						me.fix_height();
						me.update_overlay();
					}, 500)
				}
				if ( previous_name != name ){
					this.$el.removeClass('upfront-region-container-' + previous_name);
					this.$el.addClass('upfront-region-container-' + name);
					this.$el.attr('id', 'region-container-' + name);
				}
			},
			render_fixed_panel: function () {
				this.region_fixed_panels = new Upfront.Views.Editor.RegionFixedPanels({model: this.model});
				this.region_fixed_panels.render();
				this.$el.append(this.region_fixed_panels.el);
			},
			on_change_breakpoint: function (breakpoint) {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					me = this;
				this.$layout.removeClass(grid.class + this.max_col);
				this.max_col = breakpoint.columns;
				this.$layout.addClass(grid.class + this.max_col);
				this.update_background();
				setTimeout(function(){ me.fix_height(); }, 500);
			},
			on_contained_width_change: function (width) {
				var type = this._get_region_type();
				if ( type == 'clip' ) {
					this.$bg.css('max-width', width + 'px');
				}
				else {
					this.$bg.css('max-width', '');
				}
				this.refresh_background();
			},
			trigger_edit: function (e) {
				if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.CONTENT )
					return false;
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.addClass('upfront-region-editing');
				this.update_overlay();
				Upfront.Events.trigger("command:region:edit_toggle", true);
				this.trigger("activate_region", this);
				this.listenTo(Upfront.Events, "command:newpage:start", this.close_edit);
				this.listenTo(Upfront.Events, "command:newpost:start", this.close_edit);
				this.$el.find('.upfront-region-edit-fixed-trigger').show();
				if ( Upfront.Application.sidebar.visible )
					Upfront.Application.sidebar.toggleSidebar();
				e.stopPropagation();
			},
			finish_edit: function (e) {
				Upfront.Events.trigger("entity:region:deactivated");
			},
			close_edit: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				if ( !$main.hasClass('upfront-region-editing') && !$main.hasClass('upfront-region-fixed-editing') && !$main.hasClass('upfront-region-lightbox-editing') )
					return;
				$main.removeClass('upfront-region-editing');
				$main.removeClass('upfront-region-fixed-editing');
				$main.removeClass('upfront-region-lightbox-editing');
				this.remove_overlay();
				Upfront.Events.trigger("command:region:edit_toggle", false);
				Upfront.Events.trigger("command:region:fixed_edit_toggle", false);
				Upfront.Events.off("command:newpage:start", this.close_edit, this);
				Upfront.Events.off("command:newpost:start", this.close_edit, this);
				this.$el.find('.upfront-region-edit-fixed-trigger').hide();
				this.$el.find('.upfront-region-edit-lightbox-trigger').hide();
				if ( !Upfront.Application.sidebar.visible )
					Upfront.Application.sidebar.toggleSidebar();
				$('.upfront-region-container > .upfront-region-finish-edit').css({
					position: '',
					left: '',
					right: ''
				});
			},
			trigger_edit_lightbox: function(e) {
				if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.CONTENT )
					return false;
				var me = this,
					$main = $(Upfront.Settings.LayoutEditor.Selectors.main);

				if ( $main.hasClass('upfront-region-editing') )
					this.close_edit();

				$main.addClass('upfront-region-lightbox-editing');

				this.trigger('activate_region', this);
				Upfront.Events.trigger("command:region:fixed_edit_toggle", true);
				//if ( Upfront.Application.sidebar.visible )
					//Upfront.Application.sidebar.toggleSidebar();
				setTimeout(function(){
					$('.upfront-region-container > .upfront-region-finish-edit').each(function(){
						$(this).css({
							position: 'fixed',
							left: (me.$layout.offset().left + me.$layout.width()) - $(this).width(),
							right: 'auto'
						});
					});
				}, 350);

			},
			trigger_edit_fixed: function () {
				if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.CONTENT )
					return false;
				var me = this,
					$main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				if ( $main.hasClass('upfront-region-editing') )
					this.close_edit();
				$main.addClass('upfront-region-fixed-editing');
				this.trigger('activate_region', this);
				Upfront.Events.trigger("command:region:fixed_edit_toggle", true);
				if ( Upfront.Application.sidebar.visible )
					Upfront.Application.sidebar.toggleSidebar();
				setTimeout(function(){
					$('.upfront-region-container > .upfront-region-finish-edit').each(function(){
						$(this).css({
							position: 'fixed',
							left: (me.$layout.offset().left + me.$layout.width()) - $(this).width(),
							right: 'auto'
						});
					});
				}, 350);
			},
			update_overlay: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					pos = this.$el.position(),
					$before_overlay = $('<div class="upfront-region-editing-overlay" />'),
					$after_overlay = $('<div class="upfront-region-editing-overlay" />');
				if ( ! $main.hasClass('upfront-region-editing') )
					return;
				if ( this.parent_view.model.active_region != this.model )
					return;
				this.$el.siblings('.upfront-region-editing-overlay').remove();
				this.$el.before($before_overlay);
				$before_overlay.css({
					bottom: 'auto',
					height: pos.top
				});
				this.$el.after($after_overlay);
				$after_overlay.css({
					top: pos.top + this.$el.height()
				});
			},
			remove_overlay: function () {
				this.$el.siblings('.upfront-region-editing-overlay').remove();
			},
			add_sub_model: function (model) {
				this.sub_model.push(model);
			},
			on_scroll: function (e) {
				var me = e.data;
				me.update_pos();
			},
			on_region_render: function (region) {
			},
			on_region_update: function (region) {
				// Update flexible region column
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					col = this.max_col;
				_.each(this.sub_model, function (sub) {
					var sub_type = sub.get('sub');
					if ( !sub_type || sub_type == 'left' || sub_type == 'right' )
						col -= sub.get_property_value_by_name('col');
				});
				if ( !breakpoint || breakpoint.default ) {
					this.trigger("region_resize", col);
					this.available_col = col;
				}
				this.fix_height();
				this.update_overlay();
			},
			on_region_changed: function () {
				this.fix_height();
			},
			on_region_remove: function (view, model) {
				var sub = model.get('sub');
				this.fix_height();
				if ( !sub || !sub.match(/(top|bottom|left|right)/) )
					this.close_edit();
			},
			on_region_hide: function (hide, view) {
				var container = view.parent_view.get_container_view(view.model);
				if ( this != container )
					return;
				if ( hide && this.$el.find('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right').not('.upfront-region-hidden').length == 0 )
					this.close_edit();
			},
			on_window_resize: function (e) {
				if ( e.target != window || !e.data.model)
					return;
				var me = e.data;
				me.lazyFixHeight();
			},
			fix_height: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				// Don't need to adapt height if breakpoint isn't default or that flexbox is supported
				// Make sure to test with non-flexbox browser whenever possible
				if ( ( breakpoint && !breakpoint.default ) || this.$layout.css('display').indexOf('flex') != -1 ){
					this.set_full_screen();
					this.refresh_background();
					this.update_pos();
					return;
				}
				var $regions = this.$el.find('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right'),
					$sub = this.$el.find('.upfront-region-side-top, .upfront-region-side-bottom'),
					$container = $regions.find('> .upfront-region-wrapper > .upfront-modules_container'),
					height = 0;
				$regions.add($container).css({
					minHeight: "",
					height: "",
					maxHeight: ""
				});
				this.set_full_screen();
				$sub.each(function(){
					$(this).find('> .upfront-region-wrapper > .upfront-modules_container').css('min-height', $(this).outerHeight());
				});
				$regions.each(function(){
					var h = $(this).outerHeight();
					height = h > height ? h : height;
				});
				$regions.add($container).css('min-height', height);
				this.refresh_background();
				this.update_pos();
			},
			set_full_screen: function () {
				var $region = this.$layout.find('.upfront-region-center'),
					$sub = this.$bg.find('.upfront-region-side-top, .upfront-region-side-bottom'),
					row = this.model.get_breakpoint_property_value('row', true),
					min_height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					height = $(window).height();
				if ( this._get_region_type() == 'full' ) {
					this.$bg.children('.upfront-region-bg-overlay').css('height', height);
					$sub.each(function(){
						height -= $(this).outerHeight();
					});
					$region.css({
						minHeight: height
					});
					this.model.set_property('original_height', height, true);
				}
				else {
					this.$bg.children('.upfront-region-bg-overlay').css('height', '');
					$region.css({
						minHeight: ''
					});
					if ( min_height > 0 )
						$region.css('min-height', min_height);
					this.model.remove_property('original_height', true);
				}
			},
			update_pos: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					offset = this.$el.offset(),
					top = offset.top,
					height = this.$el.outerHeight(),
					bottom = top + height,
					scroll_top = $(document).scrollTop(),
					win_height = $(window).height(),
					scroll_bottom = scroll_top + win_height,
					main_off = $main.offset(),
					rel_top = main_off.top,
					$trig = this.$el.find('> .upfront-region-edit-trigger'),
					trig_offset = $trig.offset(),
					sticky = this.model.get('sticky'),
					sticky_top = this.$el.data('sticky-top');
				// Normalize scroll top value
				scroll_top = scroll_top < 0 ? 0 : scroll_top;
				// Sticky behavior
				// @TODO Need to have a proper behavior for responsive view, disable for now
				if ( breakpoint && !breakpoint.default )
					sticky = false;
				if ( sticky ) {
					if ( !_.isNumber(sticky_top) && scroll_top > top-rel_top ) {
						this.$el.css({
							position: 'fixed',
							top: rel_top,
							left: main_off.left,
							right: 0,
							bottom: 'auto'
						});
						this.$el.addClass('upfront-region-container-sticky');
						this.$el.data('sticky-top', top-rel_top);
						this.$el.nextAll('.upfront-region-container:first').css('margin-top', this.$el.height());
					}
				}
				if ( this.$el.css('position') == 'fixed' && ( !sticky || ( _.isNumber(sticky_top) && scroll_top <= sticky_top ) ) ) {
					this.$el.css({
						position: '',
						top: '',
						left: '',
						right: '',
						bottom: ''
					});
					this.$el.removeClass('upfront-region-container-sticky');
					this.$el.removeData('sticky-top');
					this.$el.nextAll('.upfront-region-container:first').css('margin-top', '');
				}

				// Keep background position on scroll for full screen region
				if ( this._get_region_type() == 'full' ) {
					var bg_type = this.model.get_breakpoint_property_value('background_type', true),
						full_screen_height = parseInt(this.$layout.find('.upfront-region-center').css('min-height'));
					if ( scroll_top >= top-rel_top && scroll_bottom <= bottom ) {
						this.$bg.children('.upfront-region-bg-overlay').css('top', ( scroll_top - rel_top ))
					}
					else {
						this.$bg.children('.upfront-region-bg-overlay').css('top', ( height - win_height ));
					}
				}


				if ( scroll_top > top-rel_top && scroll_top < bottom-rel_top ) {
					if ( $trig.css('position') != 'fixed' )
						$trig.css({
							position: 'fixed',
							top: rel_top,
							left: trig_offset.left,
							right: 'auto'
						});
				}
				else {
					$trig.css({
						position: '',
						top: '',
						left: '',
						right: ''
					});
				}
				if ( $main.hasClass('upfront-region-editing') && this.$el.hasClass('upfront-region-container-active') ){
					var $fin = this.$el.find('.upfront-region-finish-edit'),
						fin_offset = $fin.offset();
					if ( bottom+$fin.outerHeight() > scroll_bottom && top < scroll_bottom ){
						if ( $fin.css('position') != 'fixed' )
							$fin.css({
								position: 'fixed',
								bottom: 0,
								left: fin_offset.left,
								right: 'auto'
							});
					}
					else {
						$fin.css({
							position: '',
							bottom: '',
							left: '',
							right: ''
						});
					}
				}
			},
			remove: function(){
				$(window).off('scroll.region_container_' + this.model.get('name'));
				$(window).off('resize.region_container_' + this.model.get('name'));

				if(this.context_menu_view){
					this.context_menu_view.remove();
				}
				this.parent_view = false;
				this.event = false;
				Backbone.View.prototype.remove.call(this);
			}
		}),

		RegionSubContainer = _Upfront_SingularEditor.extend({
			attributes: function () {
				var name = this.model.get("container") || this.model.get("name"),
					sub = this.model.get('sub'),
					classes = [];
				classes.push('upfront-region-sub-container');
				classes.push('upfront-region-sub-container-' + name.toLowerCase().replace(/ /, "-"));
				classes.push('upfront-region-sub-container-' + sub);
				return {
					"class": classes.join(' ')
				};
			},
			init: function () {
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(Upfront.Events, 'layout:after_render', this.refresh_background);
				this.listenTo(Upfront.Events, "entity:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.update_pos);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, 'layout:after_render', this.update_pos);
				this.listenTo(Upfront.Events, "entity:region:added", this.update_pos);
				this.listenTo(Upfront.Events, "entity:region:removed", this.update_pos);
				this.listenTo(Upfront.Events, "sidebar:toggle:done", this.update_pos);
				this.listenTo(Upfront.Events, "application:mode:after_switch", this.update_pos);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				$(window).on('scroll.region_subcontainer_' + this.model.get('name'), this, this.on_scroll);
				$(window).on('resize.region_subcontainer_' + this.model.get('name'), this, this.on_window_resize);
			},
			_get_region_type: function () {
				return this.model.get('type') || ( this.model.get('clip') ? 'clip' : 'wide' );
			},
			render: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					container_view = this.parent_view.get_container_view(this.model),
					data = _.extend(this.model.toJSON(), {size_class: grid.class, max_col: container_view.max_col, available_col: container_view.available_col}),
					template = _.template(_Upfront_Templates["region_container"], data);
				Upfront.Events.trigger("entity:region_sub_container:before_render", this, this.model);
				this.$el.html(template);
				this.$layout = this.$el.find('.upfront-grid-layout');
				this.update();
				Upfront.Events.trigger("entity:region_sub_container:after_render", this, this.model);
			},
			update: function () {
				var container_view = this.parent_view.get_container_view(this.model);
				if ( container_view && container_view._get_region_type() == 'full' ){
					this.update_background();
					this.$el.show();
				}
				else{
					this.$el.hide();
				}
				this.update_pos();
			},
			on_scroll: function (e) {
				var me = e.data;
				me.update_pos();
			},
			on_window_resize: function (e) {
				var me = e.data;
				me.update_pos();
			},
			on_change_breakpoint:  function () {
				this.update_pos();
				//_.delay(this.update_pos.bind(this), 200);
			},
			update_pos: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					offset = this.$el.offset(),
					top = offset.top,
					scroll_top = $(document).scrollTop(),
					win_height = $(window).height(),
					scroll_bottom = scroll_top + win_height,
					main_off = $main.offset(),
					rel_top = main_off.top,
					container_view = this.parent_view.get_container_view(this.model),
					container_height = container_view.$el.outerHeight(),
					container_offset = container_view.$el.offset(),
					container_bottom = container_offset.top + container_height,
					height = this.$el.height(),
					sticky = this.model.get('sticky'),
					sticky_top = this.$el.data('sticky-top'),
					sub = this.model.get('sub'),
					is_sticky = false,
					css = {};
				if ( this.$el.css('display') == 'none' ) {
					this.$el.css({
						position: '',
						top: '',
						left: '',
						right: '',
						bottom: ''
					});
					this.$el.removeClass('upfront-region-container-sticky');
					this.$el.removeData('sticky-top');
					if ( sub == 'top' )
						this.$el.closest('.upfront-region-container-bg').css('padding-top', '');
					else
						this.$el.closest('.upfront-region-container-bg').css('padding-bottom', '');
					return;
				}
				// Normalize scroll top value
				scroll_top = scroll_top < 0 ? 0 : scroll_top;
				// @TODO Need to have a proper behavior for responsive view, disable for now
				if ( breakpoint && !breakpoint.default )
					sticky = false;
				// Sticky behavior
				if ( sticky ) {
					if ( !_.isNumber(sticky_top) && scroll_top >= top-rel_top ) {
						css.position = 'fixed';
						css.top = rel_top;
						css.left = main_off.left;
						css.right = 0;
						css.bottom = 'auto';
						is_sticky = true;
						this.$el.data('sticky-top', top-rel_top);
					}
				}



				// Sub-container behavior to stick when scroll
				if ( scroll_top+rel_top >= container_offset.top && scroll_bottom <= container_bottom ){
					css.position = 'fixed';
					if ( sub == 'top' ) {
						css.top = rel_top;
						css.bottom = 'auto';
					}
					else {
						css.top = 'auto';
						css.bottom = 0;
					}
					css.left = main_off.left;
					css.right = 0;
					is_sticky = false;

					var ref = $('.upfront-regions');//this.$el.closest('.upfront-region-container-bg');
					var targ = this.$el.children('.upfront-region-container-bg').children('.upfront-grid-layout');
					css.width = ref.width();
					if(ref.offset())
						css.left = ref.offset().left-$(document).scrollLeft();
					/*console.log(ref.offset());
					console.log($(document).scrollLeft());
					if(ref.offset()) {
						css.left-=(2*($(document).scrollLeft())-60);
						//ref.offset().left-targ.offset({top: targ.offset().top, left: ref.offset.left});
					}*/
				}
				if ( css.position && css.position == 'fixed' ) {
					if ( this.$el.css('position') != css.position || this.$el.css('left') != css.left || this.$el.css('top') != css.top ) {
						this.$el.css(css);
						if ( sub == 'top' )
							this.$el.closest('.upfront-region-container-bg').css('padding-top', height);
						else
							this.$el.closest('.upfront-region-container-bg').css('padding-bottom', height);
					}
					if ( is_sticky )
						this.$el.addClass('upfront-region-container-sticky');
					else
						this.$el.removeClass('upfront-region-container-sticky');
				}
				else if (
					this.$el.css('position') == 'fixed' &&
					(
						!sticky ||
						( _.isNumber(sticky_top) && scroll_top <= sticky_top ) ||
						( !_.isNumber(sticky_top) && ( scroll_top+rel_top < container_offset.top || scroll_bottom > container_bottom ) )
					)
				) {
					this.$el.css({
						position: '',
						top: '',
						left: '',
						right: '',
						bottom: ''
					});
					if ( sub == 'top' ) {
						this.$el.css('top', container_height - win_height + rel_top)
					}
					this.$el.removeClass('upfront-region-container-sticky');
					this.$el.removeData('sticky-top');
					if ( sub == 'top' )
						this.$el.closest('.upfront-region-container-bg').css('padding-top', '');
					else
						this.$el.closest('.upfront-region-container-bg').css('padding-bottom', '');
				}

			},
			remove: function () {
				var sub = this.model.get('sub');
				if ( sub == 'top' )
					this.$el.closest('.upfront-region-container-bg').css('padding-top', '');
				else
					this.$el.closest('.upfront-region-container-bg').css('padding-bottom', '');
				this.event = false;
				$(window).off('scroll.region_subcontainer_' + this.model.get('name'));
				$(window).off('resize.region_subcontainer_' + this.model.get('name'));
				Backbone.View.prototype.remove.call(this);
			}
		}),

		Region = _Upfront_SingularEditor.extend({
			cssSelectors: {
				'.upfront-region-wrapper': {label: l10n.rw_label, info: l10n.rw_info}
			},
			events: {
				"mouseup": "on_mouse_up", // Bound on mouseup because "click" prevents bubbling (for module/object activation)
				"mouseover": "on_mouse_over",
				"click": "on_click",
				"click > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click > .upfront-entity_meta > a.upfront-entity-hide_trigger": "on_hide_click",
				"click > .upfront-region-hidden-toggle > a.upfront-entity-hide_trigger": "on_hide_click",
				"click > .upfront-region-edit-trigger": "trigger_edit"
			},
			attributes: function(){
				var grid = Upfront.Settings.LayoutEditor.Grid,
					container = this.model.get("container"),
					name = this.model.get("name").toLowerCase().replace(/\s/, "-"),
					classes = [],
					col, width;
				if ( ! this.col ){
					col = this.model.get_property_value_by_name('col');
					width = this.model.get_property_value_by_name('width');
					this.col = col || ( width ? Upfront.Util.width_to_col(width) : grid.size );
					if ( this.col > grid.size ) this.col = grid.size;
				}
				classes.push('upfront-region');
				classes.push('upfront-region-' + name);
				classes.push(grid.class + this.col);
				if ( ! this.model.is_main() ){
					var index = this.model.collection.indexOf(this.model),
						sub = this.model.get('sub'),
						next = this.model.collection.at(index+1),
						is_left = ( next && ( next.get('name') == container || next.get('container') == container) );
					classes.push('upfront-region-side');
					classes.push('upfront-region-side-' + ( sub ? sub : (is_left ? 'left' : 'right') ));
				}
				else {
					classes.push('upfront-region-center');
				}
				if ( this.model.collection && this.model.collection.active_region == this.model ){
					classes.push('upfront-region-active');
				}
				return {
					"class": classes.join(' '),
					"id": 'region-' + name
				};
			},
			init: function () {
				var container = this.model.get("container"),
					name = this.model.get("name");
				this.listenTo(this.dispatcher, 'plural:propagate_activation', this.on_mouse_up);
				//this.dispatcher.on("plural:propagate_activation", this.on_mouse_up, this);
				// this.model.get("properties").bind("change", this.update, this);
				// this.model.get("properties").bind("add", this.update, this);
				// this.model.get("properties").bind("remove", this.update, this);
				// this.model.get("modules").bind("change", this.on_module_update, this);
				// this.model.get("modules").bind("add", this.on_module_update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(this.model.get("modules"), 'change', this.on_module_update);
				this.listenTo(this.model.get("modules"), 'add', this.on_module_update);
				this.listenTo(this.model.get("modules"), 'remove', this.on_module_update);
				this.listenTo(this.model.get("modules"), 'reset', this.on_module_update);
				this.listenTo(Upfront.Events, 'entity:added:after', this.display_region_hint);
				this.listenTo(Upfront.Events, 'layout:after_render', this.on_layout_render);
				this.listenTo(Upfront.Events, "entity:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "entity:region:hide_toggle", this.update_hide_toggle);
				this.listenTo(Upfront.Events, "command:region:edit_toggle", this.update_buttons);
				this.listenTo(Upfront.Events, "entity:region:removed", this.update_buttons);
				$(window).on('resize.region_' + this.model.get('name'), this, this.on_window_resize);
			},
			on_click: function (e) {

			},
			on_mouse_up: function () {
				this.trigger("activate_region", this);
			},
			on_mouse_over: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					container = this.parent_view.get_container_view(this.model),
					$main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				if ( ! $main.hasClass('upfront-region-editing') )
					return;
				if ( container && container.$el.hasClass('upfront-region-container-active') && !container.$el.hasClass('upfront-region-bg-setting-open') )
					this.trigger("activate_region", this);
			},
			_is_clipped: function () {
				var type = this.model.get('type'),
					sub = this.model.get('sub');
				return ( !this.model.is_main() && ( !sub || (sub != 'top' && sub != 'bottom') ) );
			},
			render: function () {
				var container = this.model.get("container"),
					name = this.model.get("name"),
					template = _.template(_Upfront_Templates["region"], this.model.toJSON()),
					$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small upfront-ui" title="Edit region"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$size = $('<div class="upfront-region-size-hint upfront-ui"></div>')
				;
				Upfront.Events.trigger("entity:region:before_render", this, this.model);
				this.$el.html(template);
				this.$el.append('<div class="upfront-debug-info"/>');
				$edit.appendTo(this.$el);
				$size.appendTo(this.$el);

				this.update();

				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this;
				this.$el.find('> .upfront-region-wrapper > .upfront-modules_container').append(local_view.el);
				local_view.render();
				this.render_panels();
				this.render_bg_setting();
				//if ( this._is_clipped() )
				//	this.$el.append('<div class="upfront-region-active-overlay" />');
				this.display_region_hint();
				Upfront.Events.trigger("entity:region:after_render", this, this.model);
				this.trigger("region_render", this);
				if ( ! this._modules_view )
					this._modules_view = local_view;
				else
					this._modules_view.delegateEvents();
			},
			render_panels: function () {
				this.region_panels = new Upfront.Views.Editor.RegionPanels({model: this.model});
				this.region_panels.render();
				this.$el.append(this.region_panels.el);
			},
			render_bg_setting: function () {
				var container_view = this.parent_view.get_container_view(this.model),
					opts = {
						model: this.model,
						to: this.$el,
						width: 420,
						top: 52,
						right:43,
						keep_position: false
					};
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting(opts);
				this.bg_setting.for_view = this;
				this.bg_setting.render();
				this.$el.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
			},
			update: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					container = this.model.get("container"),
					name = this.model.get("name").toLowerCase().replace(/\s/g, "-"),
					previous_name = this.model.previous("name"),
					col = this.model.get_property_value_by_name('col'),
					row = this.model.get_property_value_by_name('row'),
					height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					expand_lock = this.model.get_property_value_by_name('expand_lock');
				this.$el.data('name', name);
				this.$el.attr('data-title', this.model.get("title"));
				this.$el.data('type', this.model.get("type"));
				this.$el.find('.upfront-region-title').html(this.model.get("title"));
				if ( !breakpoint || breakpoint.default ){
					if ( col && col != this.col ) {
						this.region_resize(col);
					}
				}
				if ( height > 0 ) {
					this.$el.css('min-height', height + 'px');
				}
				if ( expand_lock ) {
					this.$el.addClass('upfront-region-expand-lock');
				}
				else {
					this.$el.removeClass('upfront-region-expand-lock');
				}
				if ( previous_name != name ){
					this.$el.removeClass('upfront-region-' + previous_name.toLowerCase().replace(/\s/g, "-"));
					this.$el.addClass('upfront-region-' + name);
					this.$el.attr('id', 'region-' + name);
				}
				if ( this._is_clipped() ){
					// This region is inside another region container
					this.update_background(); // Allow background applied
				}
				else {
					this.remove_background();
				}
				this.update_position();
				this.update_buttons();
				this.update_size_hint(this.col * grid.column_width, this.$el.height());
				this.trigger("region_update", this);
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid,
					$edit = this.$el.find('> .upfront-region-edit-trigger');
				if ( ! breakpoint )
					return;
				var data = this.model.get_property_value_by_name('breakpoint'),
					row = this.model.get_property_value_by_name('row'),
					breakpoint_data = data[breakpoint.id],
					container_view = this.parent_view.get_container_view(this.model),
					$container = this.$el.find('> .upfront-region-wrapper > .upfront-modules_container'),
					$toggle = this.$el.find('.upfront-region-hidden-toggle'),
					$regions = container_view.$el.find('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right'),
					$hide_trigger = this.$el.find('> .upfront-entity_meta > a.upfront-entity-hide_trigger'),
					height = 0,
					width = 0;
				if ( ! breakpoint_data || ! breakpoint_data.hide ){
					$container.show();
					$toggle.hide();
					this.$el.removeClass('upfront-region-hidden');
					if ( !breakpoint.default )
						$hide_trigger.show();
				}
				else if ( breakpoint_data.hide ){
					$container.hide();
					$toggle.show();
					this.$el.addClass('upfront-region-hidden');
					$hide_trigger.hide();
					this.update_hide_toggle();
				}
				if ( $regions.length > 0 && $regions.length == container_view.$el.find('.upfront-region-hidden').length )
					container_view.$el.addClass('upfront-region-container-hidden');
				else
					container_view.$el.removeClass('upfront-region-container-hidden');
				if ( breakpoint_data && typeof breakpoint_data.col == 'number' ){
					width = (breakpoint_data.col/(breakpoint.columns)*100);
					this.$el.css('width', ( width > 100 ? 100 : width ) + '%');
					this.$el.data('breakpoint_col', breakpoint_data.col);
				}
				else {
					this.$el.css('width', '');
					this.$el.removeData('breakpoint_col');
				}
				if ( !breakpoint.default ) {
					if ( this.model.is_main() )
						$edit.css('right', (breakpoint.width - (breakpoint.columns*grid.column_width)) / 2 * -1);
					else
						$edit.css('right', '');
					$toggle.css('left', (breakpoint.width - (breakpoint.columns*grid.column_width)) / 2);
				}
				else {
					$edit.css('right', '');
					$toggle.css('left', '');
				}
				if ( breakpoint_data && typeof breakpoint_data.row == 'number' ) {
					height = (breakpoint_data.row*grid.baseline);
					this.$el.data('breakpoint_row', breakpoint_data.row);
				}
				else {
					height = (row*grid.baseline);
					this.$el.removeData('breakpoint_row');
				}
				if ( height > 0 ){
					this.$el.css('min-height', height + 'px');
					$container.css('min-height', height + 'px');
				}
				else {
					this.$el.css('min-height', '');
					$container.css('min-height', '');
				}
				this.trigger("region_changed", this);
			},
			update_buttons: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$delete_trigger = this.$el.find('> .upfront-entity_meta > a.upfront-entity-delete_trigger');
				if ( !breakpoint || breakpoint.default ){
					if (
						( this.model.is_main() && this.model.has_side_region() ) ||
						( this.model.get('sub') == 'top' || this.model.get('sub') == 'bottom' )
					)
						$delete_trigger.hide();
					else
						$delete_trigger.css('display', 'block');
				}
				else {
					$delete_trigger.hide();
				}
			},
			update_size_hint: function (width, height, $helper) {
				var hint = '<b>w:</b>' + width + 'px <b>h:</b>' + height + 'px';
				( $helper ? $helper : this.$el ).find('.upfront-region-size-hint').html(hint);
			},
			region_resize: function (col) {
				var grid = Upfront.Settings.LayoutEditor.Grid;
				this.$el.removeClass(grid.class + this.col);
				this.col = col;
				this.$el.addClass(grid.class + this.col);
			},
			on_module_update: function () {
				this.trigger("region_changed", this);
				this.display_region_hint();
			},
			display_region_hint: function() {

				if(Upfront.Application.get_current() != "theme" || this.$el.hasClass('upfront-region-floating') || this.$el.hasClass('upfront-region-lightbox') || this.$el.attr('id')=='region-shadow')
					return

				if(this.$el.find('> .upfront-region-wrapper > .upfront-modules_container .upfront-wrapper').size() < 1) {
					this.$el.addClass('empty_in_theme_mode');
				}
				else {
					this.$el.removeClass('empty_in_theme_mode');
				}
			},
			on_layout_render: function () {
				this.update_size_hint(this.$el.width(), this.$el.height());
				this.refresh_background();
			},
			remove: function() {
				if(this._modules_view)
					this._modules_view.remove();
				$(window).off('resize.region_' + this.model.get('name'));
				var wrappers = this.model.get('wrappers');
				if(wrappers)
					wrappers.each(function(wrapper){
						var wrapperView = Upfront.data.wrapper_views[wrapper.cid];
						if(wrapperView){
							wrapperView.remove();
							delete Upfront.data.wrapper_views[wrapper.cid];
						}
					});
				this.parent_view = false;
				Backbone.View.prototype.remove.call(this);
				this.model.get('wrappers').reset([], {silent:true});
				this.model = false;
			},
			on_delete_click: function (e) {
				var main, main_view;

				if(typeof(e) != 'undefined')
					e.preventDefault();


				if ( confirm(l10n.section_delete_nag) ){
					var parent_view = this.parent_view; // reserve parent_view before removal as we use it later
					// if ( this.model.get('container') ){
						// main = this.model.collection.get_by_name(this.model.get('container'));
						// main_view = Upfront.data.region_views[main.cid];
					// }
					if(this.model.get('type') == 'lightbox')
						this.hide();

					var thecollection = this.model.collection;

					// Make sure sub-regions is also removed if it's main region
					if ( this.model.is_main() ) {
						var sub_regions = this.model.get_sub_regions();
						_.each(sub_regions, function(sub_model, sub){
							if ( _.isArray(sub_model) )
								_.each(sub_model, function(sub_model2){ thecollection.remove(sub_model2) });
							else if ( _.isObject(sub_model) )
								thecollection.remove(sub_model);
						});
					}
					this.model.collection.remove(this.model);

					var total_container = thecollection.total_container(['shadow', 'lightbox']); // don't include shadow and lightbox region
					if ( total_container == 0 ) {
						if ( parent_view.$el.find('#no_region_add_one').length < 1 ) {
							parent_view.$el.append($('<a>').attr('id', 'no_region_add_one').text(l10n.no_region_add).one('click', function() {
								var new_title = false,
									name = 'main',
									title = l10n.main_area;
								if ( thecollection.get_by_name(name) ) {
									new_title = thecollection.get_new_title("Main ", 2);
									title = new_title.title;
									name = new_title.name;
								}
								var new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
									"name": name,
									"container": name,
									"title": title
								}));

								var options = {};
								new_region.set_property('row', Upfront.Util.height_to_row($(window).height())); // default to screen height worth of row
								new_region.add_to(thecollection, 0, options);

								$(this).remove();
							}));

						}

					}

					// if ( main_view ){
						// Upfront.Events.trigger('command:region:edit_toggle', true);
						// main_view.trigger('activate_region', main_view);
					// }
				}
			},
			on_settings_click: function (e) {

				if(typeof(e) != 'undefined') {
					e.preventDefault();
					e.stopPropagation();
				}

				var me = this,
					container_view = this.parent_view.get_container_view(this.model);
				this.listenToOnce(Upfront.Events, "entity:region:deactivated", function(deac){
					if(e && !this.$el.is($(e.target).closest('div.upfront-region'))) {
						me.bg_setting.close(false);
					}
				});

				// Make sure all other instance is closed
				_.each(_.flatten([container_view.model, container_view.sub_model]), function(each){
					var each_view = Upfront.data.region_views[each.cid];
					if ( each == me.model ) {
						each_view.$el.find('.upfront-inline-modal-wrap').draggable({
							delay: 300,
							addClasses: false,
							cancel: '.upfront-field-select, input,textarea,button,select,option'
						});
						return;
					}
					if ( each_view && each_view.bg_setting )
						each_view.bg_setting.close(false);
				});

				var $settings_trigger = this.$el.find('> .upfront-entity_meta > a.upfront-entity-settings_trigger'),
					setting_offset = $settings_trigger.offset(),
					offset = this.$el.offset(),
					width = this.$el.width();



				if(this.model.get('type') == 'lightbox') {
					this.bg_setting.right =  80;
					this.bg_setting.top = setting_offset.top;

					var container_view = this.parent_view.get_container_view(this.model);
					container_view.trigger_edit_lightbox(e);
				}
				else {
					if ( this.bg_setting.width < setting_offset.left - 10 ) {
						this.bg_setting.right = ( offset.left + width - setting_offset.left ) + 10;
						this.bg_setting.left = -1;
					}
					else {
						this.bg_setting.right = -1;
						this.bg_setting.left = width;
					}
					this.bg_setting.top = setting_offset.top - offset.top;
				}

				container_view.$el.addClass('upfront-region-bg-setting-open');
				this.bg_setting.open().always(function(){
					container_view.$el.removeClass('upfront-region-bg-setting-open');
				});
			},
			on_hide_click: function (e) {
				e.preventDefault();
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					data = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(data[breakpoint.id]) )
					data[breakpoint.id] = {};
				if ( data[breakpoint.id].hide == 1 )
					data[breakpoint.id].hide = 0;
				else
					data[breakpoint.id].hide = 1;
				this.model.set_property('breakpoint', data);
				Upfront.Events.trigger('entity:region:hide_toggle', data[breakpoint.id].hide, this);
			},
			update_hide_toggle: function () {
				if ( ! this.$el.hasClass('upfront-region-hidden') )
					return;
				var $toggle = this.$el.find('.upfront-region-hidden-toggle'),
					$regions = $('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right'),
					$hidden = Upfront.Util.find_from_elements($regions, this.$el, '.upfront-region', true, ':not(.upfront-region-hidden)');
				$toggle.css('margin-top', ( $hidden.length * 20 ) + 'px');
			},
			trigger_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.trigger_edit(e);
				e.stopPropagation();
			},
			close_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.close_edit();
				e.stopPropagation();
			},
			on_modal_open: function () {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.$el.find('.upfront-region-finish-edit').css('display', 'none'); // hide finish edit button
			},
			on_modal_close: function () {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.$el.find('.upfront-region-finish-edit').css('display', ''); // reset hide finish edit button
			},
			on_change_breakpoint: function (breakpoint) {
				var $delete = this.$el.find('> .upfront-entity_meta > a.upfront-entity-delete_trigger'),
					$settings = this.$el.find('> .upfront-entity_meta > a.upfront-entity-settings_trigger'),
					$hide = this.$el.find('> .upfront-entity_meta > a.upfront-entity-hide_trigger');
				if ( !breakpoint.default ){
					$delete.hide();
					//$settings.hide();
					$hide.show();
				}
				else {
					$delete.show();
					//$settings.show();
					$hide.hide();
				}
				this.update_position();
				this.update_size_hint(this.$el.width(), this.$el.height());
				if ( this._is_clipped() )
					this.update_background();
			}
		}),

		RegionFixed = Region.extend({
			events: {
				//"mouseup": "on_mouse_up", // Bound on mouseup because "click" prevents bubbling (for module/object activation)
				"mouseover": "on_mouse_over",
				"click": "on_click",
				"click > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click > .upfront-region-edit-trigger": "trigger_edit",
				"click > .upfront-region-finish-edit-fixed": "close_edit",
			},
			init: function () {
				this.constructor.__super__.init.call(this);
				this.listenTo(Upfront.Events, 'sidebar:toggle:done', this.update_region_position);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.update_region_position);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.check_modules);
				this.listenTo(Upfront.Events, "layout:after_render", this.check_modules);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(this.model, "restrict_to_container", this.update_position_on_restrict);
				$(window).on('scroll.region_' + this.model.get('name'), this, this.on_scroll);
			},
			render: function () {
				this.constructor.__super__.render.call(this);
				var	$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small upfront-ui" title="' + l10n.change_background + '"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$edit_full = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-full upfront-ui"><div class="upfront-region-edit-text">' + l10n.click_to_edit_floating_region + '</div></div>'),
					$ok = $('<div class="upfront-region-finish-edit-fixed upfront-ui">' + l10n.ok + '</div>'),
					$size = $('<div class="upfront-region-size-hint upfront-ui"></div>'),
					$position = $('<div class="upfront-region-position-hint upfront-ui"></div>');
				$size.appendTo(this.$el);
				$position.appendTo(this.$el);
				$edit.appendTo(this.$el);
				$edit_full.appendTo(this.$el);
				$ok.appendTo(this.$el);
				//this.render_edit_position();
			},
			render_bg_setting: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: $main, width: 420});
				this.bg_setting.render();
				$main.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
			},
			update: function() {
				this.constructor.__super__.update.call(this);
				this.check_modules();
				this.update_region_position();
			},
			update_region_position: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					grid = Upfront.Settings.LayoutEditor.Grid,
					restrict = this.model.get('restrict_to_container'),
					width = this.model.get_property_value_by_name('width'),
					col = this.model.get_property_value_by_name('col'),
					height = this.model.get_property_value_by_name('height'),
					top = this.model.get_property_value_by_name('top'),
					is_top = ( typeof top == 'number' ),
					left = this.model.get_property_value_by_name('left'),
					is_left = ( typeof left == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' ),
					right = this.model.get_property_value_by_name('right'),
					is_right = ( typeof right == 'number' ),
					css = {
						width: width || 225,
						minHeight: height || 225
					};
				if ( !width ) {
					this.model.set_property('width', 225, true);
				}
				if ( !col ) {
					col = Upfront.Util.width_to_col(css.width);
					col = ( col <= grid.size ) ? col : grid.size;
					this.model.set_property('col', col, true)
				}
				else {
					col = ( col <= grid.size ) ? col : grid.size;
				}
				if ( !height ) {
					this.model.set_property('height', 225, true);
				}
				if ( is_top || !is_bottom ){
					css.top = is_top ? top : 30;
					css.bottom = '';
					if ( !is_top ) {
						this.model.set_property('top', 30, true);
					}
				}
				else {
					css.bottom = bottom;
					css.top = '';
				}
				if ( is_left || !is_right ){
					css.left = ( is_left ? left : 30 ) + ( restrict ? 0 : $main.offset().left );
					css.right = '';
					if ( !is_left ) {
						this.model.set_property('left', 30, true);
					}
				}
				else {
					css.right = right;
					css.left = '';
				}
				this.$el.find('> .upfront-region-wrapper > .upfront-modules_container').css( {
					width: ( col * grid.column_width ),
					minHeight: css.minHeight
				});
				this.$el.css(css);
				if ( this.edit_position ) {
					this.edit_position.update_fields();
				}
				this.update_size_hint(css.width, css.minHeight);
				this.update_position_hint(css);
				this.update_position_scroll();
			},
			update_position_hint: function (pos, $helper) {
				var hint = '';
				if ( typeof pos.top == 'number' )
					hint += '<b>top:</b>' + pos.top;
				else if ( typeof pos.bottom == 'number' )
					hint += '<b>bottom:</b>' + pos.bottom;
				if ( typeof pos.left == 'number' )
					hint += ' <b>left:</b>' + pos.left;
				else if ( typeof pos.right == 'number' )
					hint += ' <b>right:</b>' + pos.right;
				( $helper ? $helper : this.$el ).find('.upfront-region-position-hint').html(hint);
			},
			update_position_on_restrict: function (value) {
				var scroll_top = $(window).scrollTop(),
					win_height = $(window).height(),
					scroll_bottom = scroll_top + win_height,
					container_view = this.parent_view.get_container_view(this.model),
					container_height = container_view.$el.height(),
					container_offset = container_view.$el.offset(),
					container_bottom = container_offset.top + container_height,
					height = this.model.get_property_value_by_name('height'),
					top = this.model.get_property_value_by_name('top'),
					is_top = ( typeof top == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' );
				if ( value ){
					if ( ( is_top || !is_bottom ) && scroll_top <= container_offset.top ){
						top = top - ( container_offset.top - scroll_top );
						if ( top + height > container_height )
							top = container_height - height;
						else if ( top < 0 )
							top = 0;
					}
					else if ( is_bottom && ( scroll_bottom >= container_bottom ) ){
						bottom = bottom - ( scroll_bottom - container_bottom );
						if ( bottom + height > container_height )
							bottom = container_height - height;
						else if ( bottom < 0 )
							bottom = 0;
					}
				}
				else {
					if ( is_top || !is_bottom ){
						top = ( container_offset.top >= scroll_top ) ? container_offset.top - scroll_top + top : top;
					}
					else {
						bottom = ( scroll_bottom >= container_bottom ) ? scroll_bottom - container_bottom + bottom : bottom;
					}
				}
				if ( is_top || !is_bottom ) {
					this.model.set_property('top', top, true);
					// let's automatically scroll to avoid confusion with the correct absolute positioning
					if ( container_height > win_height && scroll_bottom > container_bottom )
						$('html,body').animate({scrollTop: container_bottom - win_height}, 600);
				}
				else {
					this.model.set_property('bottom', bottom, true);
					// let's automatically scroll to avoid confusion with the correct absolute positioning
					if ( container_height > win_height && scroll_top < container_offset.top )
						$('html,body').animate({scrollTop: container_offset.top}, 600);
				}
			},
			update_position_scroll: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					scroll_top = $(window).scrollTop(),
					win_height = $(window).height(),
					scroll_bottom = scroll_top + win_height,
					container_view = this.parent_view.get_container_view(this.model),
					container_height = container_view.$el.height(),
					container_offset = container_view.$el.offset(),
					container_bottom = container_offset.top + container_height,
					restrict = this.model.get('restrict_to_container'),
					height = this.model.get_property_value_by_name('height'),
					top = this.model.get_property_value_by_name('top'),
					is_top = ( typeof top == 'number' ),
					left = this.model.get_property_value_by_name('left'),
					right = this.model.get_property_value_by_name('right'),
					is_left = ( typeof left == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' ),
					css = {};

				if((scroll_bottom < container_view.$el.offset().top || scroll_top > container_view.$el.offset().top + container_view.$el.outerHeight()) !== true) {
					if(right == 0) {
						this.$el.find('.upfront-region-edit-trigger').css({
							right: 30
						})
					}
				} else {
					this.$el.find('.upfront-region-edit-trigger').css({
						right: 0
					})
				}

				if ( restrict ){
					if ( scroll_top >= container_offset.top && scroll_bottom <= container_bottom ){
						css.position = 'fixed';
						if ( is_top )
							css.top = top;
						else
							css.bottom = bottom;
					}
					else {
						css.position = 'absolute';
						if ( is_top ) {
							if ( container_height > win_height && scroll_top >= ( container_offset.top + container_height - win_height ) )
								css.top = container_height - win_height + top;
							else
								css.top = top;
						}
						else {
							if ( container_height > win_height && scroll_bottom <= ( container_offset.top + win_height ) )
								css.bottom =  container_height - win_height + bottom;
							else
								css.bottom = bottom;
						}
					}
				}
				else {
					css.position = 'fixed';
					if ( is_top )
						css.top = top;
					else
						css.bottom = bottom;
				}
				if ( is_left )
					css.left = left + ( css.position == 'fixed' ? $main.offset().left : 0 );
				this.$el.css(css);

				if ( ( css.position == 'fixed' && css.bottom < 35 ) || ( css.position == 'absolute' && this.$el.offset().top+this.$el.height() > scroll_bottom-35 ) )
					this.$el.find('.upfront-region-finish-edit-fixed').css('bottom', 0);
				else
					this.$el.find('.upfront-region-finish-edit-fixed').css('bottom', '');
			},
			on_scroll: function (e) {
				var me = e.data;
				me.update_position_scroll();
			},
			render_panels: function () {
			},
			render_edit_position: function () {
				this.edit_position = new Upfront.Views.Editor.RegionFixedEditPosition({model: this.model});
				this.edit_position.render();
				this.$el.append(this.edit_position.el);
			},
			trigger_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.trigger_edit_fixed();
				e.stopPropagation();
			},
			close_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.close_edit();
				e.stopPropagation();
			},
			check_modules: function () {
				var total = this.$el.find('> .upfront-region-wrapper > .upfront-modules_container > .upfront-editable_entities_container').find('.upfront-module').size();
				if ( total == 0 ){
					this.$el.removeClass('upfront-region-has-modules');
					this.$el.addClass('upfront-region-empty');
				}
				else {
					this.$el.removeClass('upfront-region-empty');
					this.$el.addClass('upfront-region-has-modules');
				}
			},
			remove: function() {
				$(window).off('scroll.region_' + this.model.get('name'));
				this.constructor.__super__.remove.call(this);
			},
			on_change_breakpoint: function (breakpoint) {
				if ( !breakpoint.default )
					this.$el.hide();
				else
					this.$el.show();
			}
		}),

/*  Lightbox is extended from Region */
		RegionLightbox = Region.extend({
			cssSelectors: {
				'.upfront-region-side-lightbox': {label: l10n.ltbox_area_label, info: l10n.ltbox_area_info},
				'.close_lightbox > .upfront-icon-popup-close': {label: l10n.ltbox_close_icon_label, info: l10n.ltbox_close_icon_info}
			},
			$bg: $('<div class="upfront-lightbox-bg"></div>'),
			$close: $('<div class="upfront-ui close_lightbox"></div>'),
			$close_icon: $('<div class="upfront-icon-popup-close"></div>'),
			events: {
				//"mouseup": "on_mouse_up", // Bound on mouseup because "click" prevents bubbling (for module/object activation)
				"mouseover": "on_mouse_over",
				"click": "on_click",
				"click > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click > .upfront-region-edit-trigger": "trigger_edit",
				"click > .upfront-region-finish-edit-lightbox": "close_edit",
				"click > .close_lightbox": "hide",
			},
			init: function () {
				this.constructor.__super__.init.call(this);

				this.listenTo(Upfront.Events, 'sidebar:toggle:done', this.update_region_position);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.update_region_position);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.check_modules);
				this.listenTo(Upfront.Events, "layout:after_render", this.check_modules);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
			},
			render: function () {
				this.constructor.__super__.render.call(this);
				this.hide();

					//var	$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small upfront-ui" title="' + l10n.edit_ltbox + '"><i class="upfront-icon upfront-icon-region-edit"></i></div>');
					//$ok = $('<div class="upfront-region-finish-edit-lightbox upfront-ui">Finish Editing</div>');


				//this.$el.prepend(this.$bg);
				this.$close.appendTo(this.$el);

				//$edit.appendTo(this.$el);
				//$ok.appendTo(this.$el);
			},
			render_bg_setting: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: $main, width: 420});
				this.bg_setting.for_view = this;
				this.bg_setting.render();
				$main.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.close_edit);
			},
			show:function () {
				Upfront.Events.trigger('upfront:element:edit:stop');
				var me = this;
				this.$bg.insertBefore(this.$el);
				if(this.model.get_property_value_by_name('click_out_close') == 'yes') {
					this.$bg.unbind('click');
					this.$bg.bind('click', function() {
						me.hide();
					});
				}

				this.$el.show();

				/** Because it is a lightbox, the following rendering specific function
					should be applied on the modules once the contents of the lightbox show up
				**/
				this._modules_view.apply_flexbox_clear();
				this._modules_view.apply_wrapper_height();

				Upfront.Events.trigger('upfront:lightbox:show');

			},
			hide:function () {
				this.$el.hide();
				this.$bg.remove();
			},
			refresh_background: function () {
				this.constructor.__super__.refresh_background.call(this);

			},
			update: function() {
				this.constructor.__super__.update.call(this);
				this.check_modules();
				this.update_region_position();

				if(this.model.get_property_value_by_name('show_close') == 'yes' || this.model.get_property_value_by_name('add_close_text') == 'yes') {

					this.$el.find('.close_lightbox').css('display', 'block');


					if(this.model.get_property_value_by_name('add_close_text') == 'yes') {

						this.$close.html('<h3>'+this.model.get_property_value_by_name('close_text')+'</h3>');
						if(this.model.get_property_value_by_name('show_close') == 'yes')
							this.$close.children('h3').css('margin-right', '40px');
					}
					else {
						this.$close.html('');
					}

					if(this.model.get_property_value_by_name('show_close') == 'yes') {
						this.$close.append(this.$close_icon);
					}
				}
				else
					this.$el.find('.close_lightbox').css('display', 'none');

				var me = this;

				if(this.model.get_property_value_by_name('click_out_close') == 'yes') {
					this.$bg.unbind('click');
					this.$bg.bind('click', function() {
						me.hide();
					});
				} else {
					this.$bg.unbind('click');
				}

				this.$bg.css('background-color', this.model.get_property_value_by_name('overlay_color') );
				this.$el.css('background-color', this.model.get_property_value_by_name('lightbox_color') );

				/*if(this.$el.hasClass('init_state')) {
					this.$el.find('.upfront-region-edit-trigger-small').trigger('click');
				}*/
				this.$el.removeClass('init_state');

				if(this.model.get_property_value_by_name('delete')) {
					this.model.set_property('delete', false);
					this.on_delete_click();
				}


			},
			update_region_position: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					grid = Upfront.Settings.LayoutEditor.Grid,
					col = this.model.get_property_value_by_name('col'),
					height = this.model.get_property_value_by_name('height');



				if ( !col )
					this.model.set_property('col', 10, true);
				if ( !height )
					this.model.set_property('height', 225, true);

				width =  col*grid.column_width

				var css = {
						width: width || 225,
						minHeight: parseInt(height) || 225
					};

				css['margin-left'] = parseInt(-(width/2)+$('#sidebar-ui').width()/2);
				css['margin-top'] = parseInt(-(height/2));

				this.$el.find('> .upfront-region-wrapper > .upfront-modules_container').css( {
					width: Math.floor(css.width/grid.column_width) * grid.column_width,
					'minHeight': css.minHeight
				});
				this.$el.css(css);

			},
			/*update_position_hint: function (pos, $helper) {
				var hint = '';
				if ( typeof pos.top == 'number' )
					hint += '<b>top:</b>' + pos.top;
				else if ( typeof pos.bottom == 'number' )
					hint += '<b>bottom:</b>' + pos.bottom;
				if ( typeof pos.left == 'number' )
					hint += ' <b>left:</b>' + pos.left;
				else if ( typeof pos.right == 'number' )
					hint += ' <b>right:</b>' + pos.right;
				( $helper ? $helper : this.$el ).find('.upfront-region-position-hint').html(hint);
			},*/
			render_edit_position: function () {
				this.edit_position = new Upfront.Views.Editor.RegionFixedEditPosition({model: this.model});
				this.edit_position.render();
				this.$el.append(this.edit_position.el);
			},
			trigger_edit: function (e) {
				this.on_settings_click();
				e.stopPropagation();

			},
			close_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.close_edit();
				if(typeof(e) !== 'undefined')
					e.stopPropagation();
			},
			check_modules: function () {
				var total = this.$el.find('> .upfront-region-wrapper > .upfront-modules_container > .upfront-editable_entities_container').find('.upfront-module').size();
				if ( total == 0 ){
					this.$el.removeClass('upfront-region-has-modules');
					this.$el.addClass('upfront-region-empty');
				}
				else {
					this.$el.removeClass('upfront-region-empty');
					this.$el.addClass('upfront-region-has-modules');
				}
			},
			on_change_breakpoint: function (breakpoint) {
					this.hide();
			}
		}),


		Regions = _Upfront_PluralEditor.extend({
			className: "upfront-regions",
			allow_edit: true,
			init: function () {
				this.stopListening(this.model, 'add', this.render);
				this.listenTo(this.model, 'add', this.on_add);
				this.stopListening(this.model, 'remove', this.render);
				this.listenTo(this.model, 'remove', this.on_remove);
				this.listenTo(this.model, 'reset', this.on_reset);
				//this.listenTo(Upfront.Events, 'command:region:edit_toggle', this.on_edit_toggle);
				//this.listenTo(Upfront.Events, 'command:region:fixed_edit_toggle', this.on_edit_toggle);
				this.listenTo(Upfront.Events, 'entity:region:resize_start', this.pause_edit);
				this.listenTo(Upfront.Events, 'entity:region:resize_stop', this.resume_edit);
				this.listenTo(Upfront.Events, "entity:region:deactivated", this.deactivate_region);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
			},
			render: function () {
				this.$el.html('');
				var me = this;
				if ( typeof this.container_views != 'object' )
					this.container_views = {};
				if ( typeof this.sub_container_views != 'object' )
					this.sub_container_views = {};
				if ( typeof Upfront.data.region_views != 'object' )
					Upfront.data.region_views = {};
				this.model.each(function (region) {
					me.render_container(region);
				});
				this.model.each(function (region, index) {
					me.render_region(region);
				});
				this.apply_adapt_region_to_breakpoints();
			},
			render_container: function (region, index) {
				var container = region.get("container"),
					name = region.get("name");
				if ( region.is_main() || (container == 'lightbox' && !this.container_views[region.cid])) {
					var container_view = this.container_views[region.cid] || this.create_container_instance(region);
					container_view.parent_view = this;
					this.listenTo(container_view, "activate_region", this.activate_region_container);
					if ( index >= 0 ){
						this.$el.find('.upfront-region').eq(index).closest('.upfront-region-container').before(container_view.el);
					}
					else {
						this.$el.append(container_view.el);
					}
					container_view.render();
					if ( !this.container_views[region.cid] ){
						this.container_views[region.cid] = container_view;
					}
					else {
						container_view.delegateEvents();
					}
					Upfront.Events.trigger("entity:regions:render_container", container_view, container_view.model);
					return container_view;
				}
			},
			render_region: function (region, sub) {
				var local_view = Upfront.data.region_views[region.cid] || this.create_region_instance(region),
					container_view = this.get_container_view(region),
					sub = sub ? sub : region.get('sub'),
					sub_container_view
				;
				if ( !container_view ) return;

				if ( sub == 'top' || sub == 'bottom' ){
					sub_container_view = this.sub_container_views[region.cid] || new RegionSubContainer({"model": region});
					if ( sub == 'top' ) {
						container_view.$layout.before(sub_container_view.el);
					}
					else {
						container_view.$layout.after(sub_container_view.el);
					}
					sub_container_view.parent_view = this;
					sub_container_view.listenTo(container_view.model.get('properties'), 'change', sub_container_view.update);
					sub_container_view.render();
					local_view.sub_container_view = sub_container_view;
					sub_container_view.$layout.append(local_view.el);
					if ( !this.sub_container_views[region.cid] ){
						this.sub_container_views[region.cid] = sub_container_view;
					}
					else {
						sub_container_view.delegateEvents();
					}
				}
				else if ( sub == 'left' ) {
					container_view.$layout.prepend(local_view.el);
				}
				else if ( sub == 'fixed' ) {
					container_view.$el.append(local_view.el);
				}
				else {
					container_view.$layout.append(local_view.el);
				}

				if ( !Upfront.data.region_views[region.cid] ){
					local_view.parent_view = this;
					container_view.listenTo(local_view, "region_render", container_view.on_region_render);
					container_view.listenTo(local_view, "region_update", container_view.on_region_update);
					container_view.listenTo(local_view, "region_changed", container_view.on_region_changed);
/*
					local_view.bind("region_render", container_view.on_region_render, container_view);
					local_view.bind("region_update", container_view.on_region_update, container_view);
					local_view.bind("region_changed", container_view.on_region_changed, container_view);
					*/
					if ( region.is_main() )
						//container_view.bind("region_resize", local_view.region_resize, local_view);
						local_view.listenTo(container_view, 'region_resize', local_view.region_resize);
					else
						container_view.add_sub_model(region);
					local_view.render();
					//local_view.bind("activate_region", this.activate_region, this);
					this.listenTo(local_view, 'activate_region', this.activate_region);
					Upfront.data.region_views[region.cid] = local_view;
				}
				else {
					local_view.render();
					local_view.delegateEvents();
				}
				if ( region.get("default") ) {
					local_view.trigger("activate_region", local_view);
				}
				Upfront.Events.trigger("entity:regions:render_region", local_view, local_view.model);
				return local_view;
			},
			create_container_instance: function (model) {
				return new RegionContainer({"model": model});
			},
			create_region_instance: function (model) {
				var type = model.get('type');
				if ( type == 'fixed' )
					return new RegionFixed({"model": model});
				else if ( type == 'lightbox')
					return new RegionLightbox({"model": model});
				else
					return new Region({"model": model});
			},
			get_container_view: function (region) {
				return _.find(this.container_views, function (container) {
					var name = container.model.get("container") || container.model.get("name");
					if ( region.get("container") == name || region.get("name") == name )
						return true;
				});
			},
			activate_region: function (region) {
				if ( ! this.allow_edit )
					return;
				var region = region.model ? region : Upfront.data.region_views[region.cid],
					new_active_region = region.model;
				if ( this.model.active_region == new_active_region )
					return;
				this.model.active_region = new_active_region;
				if ( region.$el ){
					$('.upfront-region-active').removeClass('upfront-region-active');
					region.$el.addClass('upfront-region-active');
					var container = this.get_container_view(region.model);
					if ( container ){
						$('.upfront-region-container-active').removeClass('upfront-region-container-active');
						container.$el.addClass('upfront-region-container-active');
					}
					$('.upfront-region-sub-container-active').removeClass('upfront-region-sub-container-active');
					if ( region.sub_container_view ){
						region.sub_container_view.$el.addClass('upfront-region-sub-container-active');
					}
					Upfront.Events.trigger("entity:region:activated", region);
				}
			},
			deactivate_region: function () {
				if ( ! this.allow_edit || ! this.model.active_region )
					return;
				$('.upfront-region-active').removeClass('upfront-region-active');
				$('.upfront-region-container-active').removeClass('upfront-region-container-active');
				this.model.active_region = null;
			},
			activate_region_container: function (container) {
				var region_view = Upfront.data.region_views[container.model.cid];
				if ( region_view )
					region_view.trigger("activate_region", region_view);
			},
			pause_edit: function () {
				this.allow_edit = false;
			},
			resume_edit: function () {
				this.allow_edit = true;
			},
			on_edit_toggle: function (edit) {
				this.allow_edit = edit;
			},
			on_add: function (model, collection, options) {
				var container_view = this.get_container_view(model),
					index = typeof options.index != 'undefined' ? options.index : -1,
					sub = options.sub ? options.sub : false,
					region_view;
				if ( ! container_view ){
					this.render_container(model, index);
					region_view  = this.render_region(model);
				}
				else {
					region_view = this.render_region(model, sub);
				}
				this.apply_adapt_region_to_breakpoints();

				Upfront.Events.trigger("entity:region:added", region_view, region_view.model);
			},
			on_remove: function (model) {
				var view = Upfront.data.region_views[model.cid];
				if ( !view )
					return;
				var container_view = this.get_container_view(model),
					sub_container_view = this.sub_container_views[model.cid];
				delete Upfront.data.region_views[model.cid];
				if ( view.region_panels ){
					view.region_panels.unbind();
					view.region_panels.remove();
				}
				if ( view.bg_setting ){
					view.bg_setting.unbind();
					view.bg_setting.remove();
				}
				if ( view.edit_position ){
					view.edit_position.unbind();
					view.edit_position.remove();
				}
				view.unbind();
				view.remove();
				if ( container_view){
					if ( container_view.sub_model.length == 0 ){
						delete this.container_views[container_view.model.cid];
						if ( container_view.region_fixed_panels ){
							container_view.region_fixed_panels.unbind();
							container_view.region_fixed_panels.remove();
						}
						container_view.unbind();
						container_view.remove();
					}
					else {
						var main_view = Upfront.data.region_views[container_view.model.cid];
						_.each(container_view.sub_model, function(sub, i){
							if ( sub == model ){
								container_view.sub_model.splice(i, 1);
							}
							else {
								var sub_view = Upfront.data.region_views[sub.cid];
								if ( sub_view ) sub_view.update();
							}
						});
						if ( main_view ) main_view.update();
					}
				}
				if ( sub_container_view ){
					delete this.sub_container_views[model.cid];
					sub_container_view.unbind();
					sub_container_view.remove();
				}
				Upfront.Events.trigger("entity:region:removed", view, model);
			},
			on_reset: function (collection, options) {
				var me = this;
				// Properly remove old views
				if (options.previousModels) {
					_.each(options.previousModels, function(model){
						me.on_remove(model);
					});
				}
			},
			apply_adapt_region_to_breakpoints: function () {
				var current_breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				if ( current_breakpoint && !current_breakpoint.default )
					return;
				var me = this,
					ed = Upfront.Behaviors.GridEditor,
					breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
				_.each(breakpoints, function(each){
					var breakpoint = each.toJSON();
					if ( breakpoint.default )
						return;
					ed.adapt_region_to_breakpoint(me.model, breakpoint.id, breakpoint.columns, true);
				});
			},
			on_change_breakpoint: function (breakpoint) {

			},
			remove: function(){
				var me = this;
				this.model.each(function(model){
					me.on_remove(model);
				});
				Backbone.View.prototype.remove.call(this);
				// Remove container views
				_.each(this.container_views, function(view, index){
					view.remove();
					delete me.container_views[index];
				});
				this.container_views = null;
				// Remove sub container views
				_.each(this.sub_container_views, function(view, index){
					view.remove();
					delete me.sub_container_views[index];
				});
				this.sub_container_views = null;
				this.model.reset([], {silent:true});
				this.model = false;
				this.options = false;
			}
		}),

		Wrapper = _Upfront_SingularEditor.extend({
			events: {
				"mouseup": "on_mouse_up",
				"click > .upfront-wrapper-meta > .upfront-add-spacer": "on_add_spacer"
			},
			attributes: function(){
				var cls = "upfront-wrapper",
					model_cls = this.model.get_property_value_by_name('class');
				return {
					"class": cls + " " + model_cls,
					"id": this.model.get_wrapper_id()
				}
			},
			init: function () {
				// this.model.get("properties").bind("change", this.update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				// this.model.bind("remove", this.on_remove, this);
				this.listenTo(this.model, 'remove', this.on_remove);

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, 'entity:module:update_position', this.on_module_update);
				this.listenTo(Upfront.Events, 'entity:modules:render_module', this.on_module_update);
				this.listenTo(Upfront.Events, 'layout:after_render', this.on_layout_after_render);

				// this one to do fix the wrapper visibility for elements inside a lightbox
				this.listenTo(Upfront.Events, 'upfront:lightbox:show', this.on_lightbox_show);
			},
			render: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					template = _.template(_Upfront_Templates["wrapper"])
				;
				Upfront.Events.trigger('entity:wrapper:before_render', this, this.model);
				this.$el.html(template);
				if ( breakpoint && !breakpoint.default ) {
					this.update_position();
				}
				Upfront.Events.trigger('entity:wrapper:after_render', this, this.model);
			},
			update: function (prop, options) {
				if ( prop.id == 'class' ){
					this.$el.attr('class', this.attributes().class);
				}
				else if ( prop.id == 'breakpoint' ){
					this.update_position();
				}
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				if ( ! breakpoint )
					return;
				var grid = Upfront.Settings.LayoutEditor.Grid,
					data = this.model.get_property_value_by_name('breakpoint'),
					breakpoint_data = data[breakpoint.id],
					parent_width = this.$el.parent().width(),
					parent_col = Math.round(parent_width/grid.column_width)
				;
				this.$el.css({
					minHeight: '',
					marginRight: 0
				});
				if ( breakpoint_data && typeof breakpoint_data.col == 'number' ){
					this.$el.css('width', (breakpoint_data.col/parent_col*100) + '%');
					this.$el.data('breakpoint_col', breakpoint_data.col);
				}
				else {
					this.$el.css('width', '');
					this.$el.removeData('breakpoint_col');
				}
				if ( breakpoint_data && typeof breakpoint_data.order == 'number' ){
					this.$el.css('order', breakpoint_data.order);
					this.$el.data('breakpoint_order', breakpoint_data.order);
				}
				else {
					this.$el.css('order', '');
					this.$el.removeData('breakpoint_order');
				}
				if ( breakpoint_data && breakpoint_data.clear ) {
					this.$el.data('breakpoint_clear', breakpoint_data.clear);
				}
				else {
					this.$el.removeData('breakpoint_clear');
				}
				Upfront.Events.trigger('entity:wrapper:update_position', this, this.model);
			},
			on_add_spacer: function (e) {
				var $target = $(e.target),
					position = $target.attr('data-position');
				e.preventDefault();
				this.add_spacer(position);
			},
			add_spacer: function (position, spacer_col, current_col) {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					ed = Upfront.Behaviors.GridEditor,
					col_class = Upfront.Settings.LayoutEditor.Grid.class,
					spacer_col = spacer_col > 0 ? spacer_col : 1,
					current_col = _.isNumber(current_col) && current_col > spacer_col
						? current_col
						: Upfront.Util.width_to_col(this.$el.width()),
					new_col = current_col-spacer_col,
					$rsz_wrapper = ( new_col > 0 ? this.$el : ( this._find_closest_wrapper(position == 'left', spacer_col) ) )
				;
				if ( !$rsz_wrapper.length ) return;
				if ( new_col < 1 ) {
					current_col = Upfront.Util.width_to_col($rsz_wrapper.width());
					new_col = current_col-spacer_col;
				}
				var rsz_model = this.model.collection.get_by_wrapper_id($rsz_wrapper.attr('id')),
					model_cls = this.model.get_property_value_by_name('class'),
					is_clr = ( breakpoint && !breakpoint.default ? this.model.get_breakpoint_property_value('clear') : model_cls.match(/clr/) ),
					object = new Upfront.Models.UspacerModel({
						"name": "",
						"properties": []
					}),
					wrapper_id = Upfront.Util.get_unique_id("wrapper"),
					module = new Upfront.Models.Module({
						"name": "",
						"properties": [
							{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
							{"name": "wrapper_id", "value": wrapper_id},
							{"name": "class", "value": col_class+spacer_col + " upfront-module-spacer"},
							{"name": "has_settings", "value": 0},
							{"name": "default_hide", "value": 1},
							{"name": "toggle_hide", "value": 0},
							{"name": "hide", "value": ( breakpoint && !breakpoint.default ? 1 : 0 )}
						],
						"objects": [
							object
						]
					}),
					wrapper = new Upfront.Models.Wrapper({
						"name": "",
						"properties": [
							{"name": "wrapper_id", "value": wrapper_id},
							{"name": "class", "value": col_class+spacer_col + ( is_clr && position == 'left' ? ' clr' : '' )}
						]
					}),
					$child = this.$el.find("> .upfront-module-view > .upfront-module, > .upfront-module-group"),
					$target_child = ( position == 'right' ? $child.last() : $child.first() ),
					target_model = ed.get_el_model($target_child),
					index = target_model.collection.indexOf(target_model)
				;

				if ( !rsz_model ) return;

				// Change the columns of current/closest wrapper and the containing models
				$rsz_wrapper.find("> .upfront-module-view > .upfront-module, > .upfront-module-group").each(function () {
					var child = ed.get_el_model($(this));
					if ( breakpoint && !breakpoint.default ) {
						child.set_breakpoint_property('edited', true, true);
						child.set_breakpoint_property('col', new_col);
					}
					else {
						child.replace_class(col_class+new_col);
					}
				});
				if ( is_clr && position == 'left' ) {
					if ( breakpoint && !breakpoint.default ) {
						this.model.set_breakpoint_property('clear', false);
					}
					else {
						this.model.remove_class('clr');
					}
				}
				if ( breakpoint && !breakpoint.default ) {
					rsz_model.set_breakpoint_property('edited', true, true);
					rsz_model.set_breakpoint_property('col', new_col);
				}
				else {
					rsz_model.replace_class(col_class+new_col);
				}

				// Add the spacer element
				if ( breakpoint && !breakpoint.default ) {
					wrapper.set_breakpoint_property('edited', true, true);
					wrapper.set_breakpoint_property('clear', ( is_clr && position == 'left' ), true);
					wrapper.set_breakpoint_property('order', this.model.get_breakpoint_property_value('order'));
					module.set_breakpoint_property('edited', true, true);
					module.set_breakpoint_property('hide', 0, true);
					module.set_breakpoint_property('left', 0, true);
					module.set_breakpoint_property('col', spacer_col);
				}
				this.model.collection.add(wrapper);
				module.add_to(target_model.collection, ( position == 'right' ? index+1 : index ));
			},
			_find_closest_wrapper: function (reverse, min_col) {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$wrappers = this.$el.parent()
						.children('.upfront-wrapper')
						.each(Upfront.Util.normalize_sort_elements_cb)
						.sort(Upfront.Util.sort_elements_cb),
					index = $wrappers.index(this.$el),
					is_clr = function ($each) {
						return ( !breakpoint || breakpoint.default ? $each.hasClass('clr') : $each.data('breakpoint_clear') )
					},
					find_cb = function ($each) {
						return ( Upfront.Util.width_to_col($each.width()) > min_col )
					},
					$start = is_clr(this.$el) ? this.$el : Upfront.Util.find_from_elements($wrappers, this.$el, is_clr, true),
					$nexts = Upfront.Util.find_from_elements($wrappers, $start, '.upfront-wrapper', false, is_clr),
					$all = $( _.union( [$start.get(0)], $nexts.map(function(){ return this; }).get() ) ),
					find_1 = Upfront.Util.find_from_elements($all, this.$el, find_cb, reverse),
					find_2 = ( !find_1.length ? Upfront.Util.find_from_elements($all, this.$el, find_cb, !reverse) : find_1 )
				;
				return find_2.first();
			},
			toggle_wrapper_visibility: function () {
				var visible = ( parseInt(this.$el.css('height'), 10) > 0 );
				if ( !visible && this.$el.css('display') != 'none' ) {
					this.$el.css('display', 'none');
				}
				else if ( visible ) {
					this.$el.css('display', '');
				}
			},
			on_change_breakpoint: function () {
				this.$el.css({
					display: ''
				});
				this.update_position();
			},
			on_module_update: function (from_view) {
				if ( !from_view.wrapper_view || from_view.wrapper_view != this ) return;
				if ( from_view instanceof Upfront.Views.ModuleGroup ) return;
				this.toggle_wrapper_visibility();
			},
			on_layout_after_render: function () {
				if ( this.$el.find('> .upfront-module-group').length > 0 ) return; // Don't update for group
				this.toggle_wrapper_visibility();
			},
			on_lightbox_show: function () {
				if ( this.$el.find('> .upfront-module-group').length > 0 ) return; // Don't update for group
				this.toggle_wrapper_visibility();
			},
			on_mouse_up: function (e) {
				$('.upfront-wrapper-active').not(this.$el).removeClass('upfront-wrapper-active');
				if ( !this.$el.hasClass('upfront-wrapper-active') )
					this.$el.addClass('upfront-wrapper-active');
			},
			on_remove: function () {
				this.unbind();
				this.remove();
			}
		}),

		Layout = _Upfront_SingularEditor.extend({
			tpl: _.template(_Upfront_Templates.layout),
			events: {
				"click": "on_click"
			},
			initialize: function (opts) {
				this._has_ruler = false;
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(Upfront.Events, "command:layout:edit_background", this.open_edit_background);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "application:mode:after_switch", this.on_mode_switch);
				$(window).on('resize.upfront_layout', this, this.on_window_resize);
				$(window).on('scroll.upfront_layout', this, this.on_window_scroll);
				$(window).on('keydown.upfront_layout', this, this.on_keydown);
				this.render();
			},
			update: function () {
				this.update_background();
			},
			render: function () {
				this.$el.addClass('upfront-layout-view');
				this.$el.html(this.tpl(this.model.toJSON()));
				this.$layout = this.$(".upfront-layout");
				this.remove_selections();

				if (!this.local_view) {
					this.local_view = new Regions({"model": this.model.get("regions")});
					this.$layout.append(this.local_view.el);
					this.local_view.render();
				}
				else {
					this.local_view.render();
					this.local_view.delegateEvents();
				}

				this.update();

				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: this.$el, width: 420});
				this.bg_setting.render();
				this.$el.append(this.bg_setting.el);

				this.fix_height();

				// Use flexbox when we can
				if ( Upfront.Util.css_support('flex') )
					$('html').addClass('flexbox-support');

				Upfront.Events.trigger("layout:after_render");
			},
			on_click: function (e) {
				//Check we are not selecting text
				//var selection = document.getSelection ? document.getSelection() : document.selection;
				//if(selection && selection.type == 'Range')
				//	return;
				var currentEntity = Upfront.data.currentEntity;
				// Deactivate settings on clicking anywhere in layout, but the settings button
				if(!$(e.target).closest('.upfront-entity_meta').length && !$(e.target).closest('#upfront-csseditor').length){
					Upfront.Events.trigger("entity:settings:deactivate");
				}
				Upfront.Events.trigger("entity:contextmenu:deactivate");
				if(currentEntity){
					//If the click has been made outside the currentEntity, deactivate it
					if(!$(e.target).closest(currentEntity.el).length){
						currentEntity.trigger('deactivated', e);
						currentEntity.$el.removeClass("upfront-active_entity");
						Upfront.Events.trigger("entity:deactivated", e);
						Upfront.data.currentEntity = false;
					}
				}
				// Deactivate if clicked on blank area of region
				if($(e.target).hasClass('upfront-editable_entities_container')){
					Upfront.Events.trigger("entity:deactivated");
				}

				// Close region editing on click anywhere out the region
				if ( $(e.target).hasClass('upfront-region-editing-overlay') && !$('.upfront-region-bg-setting-open').length ){
					Upfront.Events.trigger("entity:region:deactivated");
				}
				this.remove_selections();
				// Deactiving group reorder on clicking anywhere
				if ( !$(e.target).closest('.upfront-module-group-on-edit').length ){
					Upfront.Events.trigger("command:module_group:finish_edit");
				}
				// Close group inline panel on clicking anywhere
				if ( !$(e.target).closest('.upfront-module-group.controls-visible').length ){
					Upfront.Events.trigger("command:module_group:close_panel");
				}
			},
			on_keydown: function (e) {
				var currentEntity = Upfront.data.currentEntity;

				if (
					typeof currentEntity === 'undefined' ||
					!currentEntity ||
					!currentEntity instanceof ObjectView ||
					currentEntity.$el.find( '.redactor-box' ).length > 0 ||
					!currentEntity.paddingControl
				) {
					return;
				}

				if (e.keyCode === 38 || e.keyCode === 40) {
					e.preventDefault();
					e.stopPropagation();

					switch (e.keyCode) {
						case 38:
							currentEntity.paddingControl.on_up_arrow_click();
							break;
						case 40:
							currentEntity.paddingControl.on_down_arrow_click();
							break;
					}
				}
			},
			on_mode_switch: function () {
				if ( Upfront.Application.get_current() !== Upfront.Settings.Application.MODE.RESPONSIVE )
					this.remove_ruler();
				else
					this.render_ruler(true);
			},
			on_change_breakpoint: function (breakpoint) {
				var grid = Upfront.Settings.LayoutEditor.Grid;
				Upfront.Settings.LayoutEditor.CurrentBreakpoint = breakpoint;
				grid.size = breakpoint.columns;
				if ( breakpoint.default ){
					this.$layout.css('width', '');
					this.render_ruler(true);
					this.remove_gutter();
					Upfront.Behaviors.LayoutEditor.enable_mergeable();
				}
				else {
					this.$layout.width(breakpoint.width);
					this.render_ruler(false, breakpoint.width);
					this.render_gutter(breakpoint.width);
					Upfront.Behaviors.LayoutEditor.disable_mergeable();
				}
				this.update_grid_css();
			},
			render_gutter: function (width) {
				var $gutter = this.$el.find('.upfront-layout-gutter');
				if ( ! $gutter.length ){
					$gutter = $('<div class="upfront-layout-gutter"><div class="upfront-layout-gutter-left"></div><div class="upfront-layout-gutter-right"></div></div>');
					this.$el.prepend($gutter);
				}
				$gutter.find('.upfront-layout-gutter-left').css('margin-right', Math.ceil(width/2));
				$gutter.find('.upfront-layout-gutter-right').css('margin-left', Math.ceil(width/2));
			},
			remove_gutter: function () {
				this.$el.find('.upfront-layout-gutter').remove();
			},
			render_ruler: function (follow_grid, width) {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					width = follow_grid ? grid.size*grid.column_width : width,
					$ruler_container = this.$el.find('.upfront-ruler-container'),
					$ruler = $ruler_container.find('.upfront-ruler'),
					create_mark = function (at, size, show_num) {
						return '<div class="upfront-ruler-mark" style="width:' + size + 'px;">' +
									( show_num ? '<div class="upfront-ruler-mark-num">' +  at + '</div>' : '' ) +
								'</div>';
					},
					mark;
				if ( !$ruler_container.length ) {
					$ruler_container = $('<div class="upfront-ruler-container"></div>');
					$ruler = $('<div class="upfront-ruler upfront-ui"></div>');
					this.$el.prepend($ruler_container);
					$ruler_container.prepend($ruler);
				}
				$ruler.empty();
				$ruler.css('width', width);
				for ( mark = 0; mark < width; mark+=100 ){
					$ruler.append( create_mark(mark, 100, (mark+40 > width ? false : true)) );
				}
				if ( width > (mark-100) )
					$ruler.append( create_mark(width, width-(mark-100), true) );
				this._has_ruler = true;
			},
			remove_ruler: function () {
				this.$el.find('.upfront-ruler-container').remove();
				this._has_ruler = false;
			},
			update_ruler: function () {
				if ( !this._has_ruler )
					return;
				var scroll_top = $(window).scrollTop(),
					$ruler_container = this.$el.find('.upfront-ruler-container'),
					ruler_position = $ruler_container.css('position');
				if ( scroll_top > 0 && ruler_position != 'fixed' ){
					var offset = this.$el.offset(),
						ruler_container_off = $ruler_container.offset();
					$ruler_container.css({
						position: 'fixed',
						top: offset.top,
						left: ruler_container_off.left,
						right: 0,
						width: 'auto'
					});
				}
				else if ( scroll_top <= 0 && ruler_position == 'fixed' ) {
					$ruler_container.css({
						position: '',
						top: '',
						left: '',
						right: '',
						width: ''
					});
				}
			},
			on_window_scroll: function (e) {
				var me = e.data;
				me.update_ruler();
			},
			update_grid_css: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					styles = [],
					selector = '#page.upfront-layout-view';
				styles.push(selector + ' .upfront-grid-layout { width: ' + grid.column_width*grid.size + 'px; }');
				styles.push(selector + ' .upfront-object { padding: ' + grid.column_padding + 'px; }');
				styles.push(selector + ' .upfront-overlay-grid {background-size: 100% ' + grid.baseline + 'px; }');
				styles.push(selector + ' .plaintxt_padding {padding: ' + grid.type_padding + 'px; }');
				styles.push(selector + ' .upfront-inserted_image-wrapper .wp-caption-text, ' + selector + ' .uinsert-image-wrapper { padding: ' + grid.column_padding + 'px; }');
				styles.push(selector + ' .upfront-module-group-bg-padding { margin: ' + grid.column_padding + 'px; }');

				if ( $('#upfront-grid-style-inline').length )
					$('#upfront-grid-style-inline').html( styles.join("\n") );
				else
					$('body').append('<style id="upfront-grid-style-inline">' + styles.join("\n") + '</style>');
			},
			remove: function(){
				if(this.local_view)
					this.local_view.remove();
				this.local_view = null;
				$(window).off('resize.upfront_layout');
				$(window).off('scroll.upfront_layout');
				if (this.bg_setting)
					this.bg_setting.remove();
				this.bg_setting = null;

				Backbone.View.prototype.remove.call(this);
				this.model = false;
				this.options = false;
			},
			open_edit_background: function () {
				this.bg_setting.open().always(function(){

				});
			},
			fix_height: function () {
				this.$('.upfront-layout').css('min-height', $(window).height());
			},
			remove_selections: function () {
				// Unselect selection
				if ( !Upfront.Behaviors.LayoutEditor.selecting ){
					Upfront.Events.trigger("command:selection:remove");
				}
			}
		})
	;

	return {
		"Views": {
			"ObjectView": ObjectView,
			"Module": Module,
			"ModuleGroup": ModuleGroup,
			"Wrapper": Wrapper,
			"Layout": Layout,
			"ContextMenu": ContextMenu,
			"ContextMenuList": ContextMenuList,
			"ContextMenuItem": ContextMenuItem,
			"RegionView": Region,
			"RegionLightboxView": RegionLightbox,
			"RegionContainerView": RegionContainer,
			"RegionsView": Regions
		},
		"Mixins": {
			"FixedObject": FixedObject_Mixin,
			"FixedObjectInAnonymousModule": FixedObjectInAnonymousModule_Mixin,
			Anchorable: Anchorable_Mixin,
		}
	};
});

})(jQuery);
//@ sourceURL=upfront-views.js
