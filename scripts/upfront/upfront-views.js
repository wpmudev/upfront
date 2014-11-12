(function ($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	"text!upfront/templates/object.html",
	"text!upfront/templates/module.html",
	"text!upfront/templates/region_container.html",
	"text!upfront/templates/region.html",
	"text!upfront/templates/layout.html",
], function () {
  var _template_files = [
    "text!upfront/templates/object.html",
    "text!upfront/templates/module.html",
    "text!upfront/templates/region_container.html",
    "text!upfront/templates/region.html",
    "text!upfront/templates/layout.html",
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
				if ( !inside ){
					if ( Math.round(height/width*100)/100 > ratio ){
						var w = (height/ratio);
						return [ w, height, (width-w)/2, 0 ];
					}
					else {
						var h = (width*ratio);
						return [ width, h, 0, (height-h)/2 ];
					}
				}
				else {
					if ( Math.round(height/width*100)/100 < ratio ){
						var w = (height/ratio);
						return [ w, height, (width-w)/2, 0 ];
					}
					else {
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
					color = this.model.get_breakpoint_property_value('background_color', true),
					image = this.model.get_breakpoint_property_value('background_image', true),
					ratio = parseFloat(this.model.get_breakpoint_property_value('background_image_ratio', true)),
					repeat = this.model.get_breakpoint_property_value('background_repeat', true),
					position = this.model.get_breakpoint_property_value('background_position', true),
					style = this.model.get_breakpoint_property_value('background_style', true),
					width = $bg.outerWidth(),
					height = $bg.outerHeight(),
					$overlay = $bg.children('.upfront-region-bg-overlay');

				if ( type == 'featured'){
					if ( color )
						$bg.css('background-color', color);
					else
						$bg.css('background-color', '');


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
							if(typeof(response.data.featured_image) != 'undefined'){


								if(response.data.featured_image != '')
									me.$el.children('.feature_image_selector').addClass('change_feature_image');
								else
									me.$el.children('.feature_image_selector').removeClass('change_feature_image');



								image = response.data.featured_image;
								var temp_image = $('<img>').attr('src', response.data.featured_image);
								temp_image.load(function(){
									ratio = parseFloat(Math.round(temp_image.width()/temp_image.height()*100)/100);
									$bg.css('background-image', "url('" + image + "')");

									if ( style == 'full' ){
										var size = me._get_full_size_el($bg, ratio, false);
										$bg.data('bg-position-y', size[3]);
										$bg.data('bg-position-x', size[2]);
										$bg.css({
											backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
											backgroundRepeat: "no-repeat",
											backgroundPosition:  size[2] + "px " + size[3] + "px"
										});
									}
									else {
										$bg.css({
											backgroundSize: "auto auto",
											backgroundRepeat: repeat,
											backgroundPosition: position
										});
									}

								});

							}
							else {
								$bg.css({
									backgroundImage: "none",
									backgroundSize: "",
									backgroundRepeat: "",
									backgroundPosition: ""
								});
							}




						})
					;

				}

				else if ( !type || type == 'color' || type == 'image'){
					if(me.$el.children('.feature_image_selector').length > 0)
						me.$el.children('.feature_image_selector').remove();
					if ( color )
						$bg.css('background-color', color);
					else
						$bg.css('background-color', '');
					if ( type != 'color' && image ){
						$bg.css('background-image', "url('" + image + "')");
						if ( style == 'full' ){
							var size = this._get_full_size_el( ( is_layout ? $(window) : $bg ), ratio, false );
							$bg.data('bg-position-y', size[3]);
							$bg.data('bg-position-x', size[2]);
							$bg.css({
								backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
								backgroundRepeat: "no-repeat",
								backgroundPosition: size[2] + "px " + size[3] + "px"
							});
						}
						else {
							$bg.css({
								backgroundSize: "auto auto",
								backgroundRepeat: repeat,
								backgroundPosition: position
							});
						}
						if ( is_layout )
							$bg.css('background-attachment', 'fixed');
					}
					else {
						$bg.css({
							backgroundImage: "none",
							backgroundSize: "",
							backgroundRepeat: "",
							backgroundPosition: "",
							backgroundAttachment: ""
						});
					}
					if ( $overlay.length )
						$overlay.hide();
				}
				else {
					if(me.$el.children('.feature_image_selector').length > 0)
						me.$el.children('.feature_image_selector').remove();

					if ( ! $overlay.length ){
						$overlay = $('<div class="upfront-region-bg-overlay" />');
						$bg.append($overlay);
					}
					else {
						$overlay.show();
					}
					var $type = $overlay.find('.upfront-region-bg-'+type);
					if ( ! $type.length ) {
						$type = $('<div class="upfront-region-bg upfront-region-bg-' + type + '" />');
						$overlay.append($type);
					}
					else {
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
					if ( type == 'map' ){
						this.update_background_map($type, $overlay);
					}
					else if ( type == 'slider' ){
						this.update_background_slider($type, $overlay);
					}
					else if ( type == 'video' ){
						this.update_background_video($type, $overlay);
					}
				}
				Upfront.Events.trigger("entity:background:update", this, this.model);
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
					styles = this.model.get_breakpoint_property_value('background_map_styles', true),
					controls = this.model.get_breakpoint_property_value('background_map_controls', true),
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
					};
				if ( !this.bg_map ){
					this.bg_map = new google.maps.Map($type.get(0), options);
				}
				else {
					$type.show();
					this.bg_map.setOptions(options);
					setTimeout(function(){
						me.bg_map.setCenter(options.center);
					}, 500);
				}
			},
			update_background_slider: function ($type, $overlay) {
				var me = this,
					slide_images = this.model.get_breakpoint_property_value('background_slider_images', true),
					rotate = this.model.get_breakpoint_property_value('background_slider_rotate', true),
					rotate_time = this.model.get_breakpoint_property_value('background_slider_rotate_time', true),
					control = this.model.get_breakpoint_property_value('background_slider_control', true),
					transition = this.model.get_breakpoint_property_value('background_slider_transition', true);
				if ( slide_images ){
					if ( rotate ){
						$type.attr('data-slider-auto', 1);
						$type.attr('data-slider-interval', rotate_time*1000);
					}
					else {
						$type.attr('data-slider-auto', 0);
					}
					$type.attr('data-slider-show-control', control);
					$type.attr('data-slider-effect', transition);
					if ( this.slide_images != slide_images ){
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
					}
					else {
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
				if ( style == 'inside' && color )
					$bg.css('background-color', color);
				else
					$bg.css('background-color', '');
				if ( is_layout )
					$overlay.css('position', 'fixed');
				if ( video && embed && ( this._prev_video && this._prev_video != video || !this._prev_video ) ){
					ratio = height/width;
					$embed = $(embed);
					$embed.css('position', 'absolute').appendTo($type);
					if ( style == 'crop' || style == 'inside' ){
						var size = this._get_full_size_el( ( is_layout ? $(window) : $type ), ratio, (style == 'inside') );
						$embed.css({
							width: size[0],
							height: size[1],
							left: size[2],
							top: size[3]
						});
					}
					else if ( style == 'full' ){
						$embed.css({
							width: is_layout ? $(window).width() : $type.width(),
							height: is_layout ? $(window).height() : $type.height(),
							left: 0,
							top: 0
						});
					}
					this._prev_video = video;
				}
				else if ( !video || !embed ) {
					this.remove_background();
				}
				else {
					this.refresh_background();
				}
			},
			refresh_background: function () {
				var is_layout = ( this instanceof Layout ),
					$bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					type = this.model.get_breakpoint_property_value('background_type', true),
					color = this.model.get_breakpoint_property_value('background_color', true),
					image = this.model.get_breakpoint_property_value('background_image', true);
				if ( type == 'map' && this.bg_map ){
					google.maps.event.trigger(this.bg_map, 'resize');
				}
				else if ( type == 'slider' ) {
					$bg.find('.upfront-region-bg-' + type).trigger('refresh');
				}
				else if ( type == 'video' ) {
					var video = this.model.get_breakpoint_property_value('background_video', true),
						embed = this.model.get_breakpoint_property_value('background_video_embed', true),
						width = this.model.get_breakpoint_property_value('background_video_width', true),
						height = this.model.get_breakpoint_property_value('background_video_height', true),
						style = this.model.get_breakpoint_property_value('background_video_style', true) || 'crop',
						ratio,
						$type = $bg.find('.upfront-region-bg-' + type),
						$embed = $type.children('iframe');
					if ( video && embed ){
						ratio = height/width;
						if ( style == 'crop' || style == 'inside' ){
							var size = this._get_full_size_el($type, ratio, (style == 'inside'));
							$embed.css({
								width: size[0],
								height: size[1],
								left: size[2],
								top: size[3]
							});
						}
						else if ( style == 'full' ){
							$embed.css({
								width: $type.width(),
								height: $type.height(),
								left: 0,
								top: 0
							});
						}
					}

				}
				else if ( ( !type || type == 'image' ) && image ) {
					var style = this.model.get_breakpoint_property_value('background_style', true),
						ratio = this.model.get_breakpoint_property_value('background_image_ratio', true),
						width = $bg.outerWidth(),
						height = $bg.outerHeight();
					if ( style == 'full' ){
						var size = this._get_full_size_el( ( is_layout ? $(window) : $bg ), ratio, false );
						$bg.data('bg-position-y', size[3]);
						$bg.data('bg-position-x', size[2]);
						$bg.css({
							backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
							backgroundRepeat: "no-repeat",
							backgroundPosition: size[2] + "px " + size[3] + "px"
						});
					}
				}
			},
			remove_background: function () {
				var $bg = typeof this.$bg != 'undefined' ? this.$bg : this.$el,
					$overlay = this.$el.find('.upfront-region-bg-overlay');
				if ( $overlay.length )
					$overlay.hide();
				$bg.css({
					backgroundColor: "",
					backgroundImage: "none",
					backgroundSize: "",
					backgroundRepeat: "",
					backgroundPosition: ""
				});
			},
			on_window_resize: function (e) {
				if ( e.target != window || !e.data.model)
					return;
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
				if(currentEntity && currentEntity != this){
					//If the current entity is my child we are ok
					if(Upfront.data.currentEntity.$el.closest(me.$el).length)
						return;
					Upfront.data.currentEntity.trigger('deactivated');
					Upfront.data.currentEntity.$el.removeClass('upfront-active_entity');
				}

				if(this instanceof ObjectView)
					Upfront.data.currentEntity = this;
				this.trigger("activated", this);

				//$(".upfront-active_entity").removeClass("upfront-active_entity");
				this.$el.addClass("upfront-active_entity");
				//return false;
			},
			// Stub handlers
			on_meta_click: function () {},
			on_delete_click: function () {
				this.$el.trigger("upfront:entity:remove", [this]);
				return false; // Stop propagation in order not to cause error with missing sortables etc
			},
			on_context_menu: function(e) {
				e.stopPropagation();
				// disable context menu if the element is in text edit mode, in order to enable spell check
				if($(e.target).closest('.redactor_box').length > 0)
					return;
				e.preventDefault();

				this.event = e;
				Upfront.Events.trigger("entity:contextmenu:activate", this);
			},
			on_settings_click: function (e) {
				if( typeof e !== "undefined" ){
					e.preventDefault();
				}
				Upfront.Events.trigger("entity:settings:activate", this);
			},
			check_deactivated: function (){
				if(Upfront.data.currentEntity == this)
					Upfront.data.currentEntity = false;
			}
		}),

		_Upfront_EditableContentEntity = _Upfront_EditableEntity.extend({
			events: {
				"click": "on_click",
				"dblclick": "on_edit"
			},
			on_edit: function () {
				var contentEditable = this.$el.find('[contenteditable]');
				if(contentEditable.length > 0){
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
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
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
					if ( $prev && ( ( ( !breakpoint || breakpoint.default ) && $(this).hasClass('clr') ) || ( breakpoint && !breakpoint.default && clear) ) ){
						prev_off = $prev.offset();
						margin = Math.floor( (off.left+width) - (prev_off.left+$prev.width()) );
						$prev.css('margin-right', (margin/width*100-1) + '%' ); // Add -1 to prevent rounding error
					}
					$prev = $(this);
				});
			},
		}),

		ContextMenuItem = Backbone.View.extend({
			tagName: 'li',
			initialize: function(opts){
				this.options = opts;
				this.label = this.options.get_label;
				this.action = this.options.action;
				if ( typeof this.options.in_context == 'function' )
					this.in_context = this.options.in_context;
			},
			render: function () {
				var me = this;
				this.$el.empty();
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
						if ( ! menuitem.menulist )
							menuitem.menulist = me;
						menuitem.for_view = me.for_view;
						if ( !menuitem.in_context() ) // Don't render if the item is not in context
							return;
						menuitem.render();
						menuitem.parent_view = me;
						me.$el.append(menuitem.el);
				});
			},
			remove: function(){
				if(this.menuitems)
					this.menuitems.each(function(itemView){
						itemView.remove();
					});
				this.for_view = false;
				this.parent_view = false;
				this.options = false;
				Backbone.View.prototype.remove.call(this);
			}

		}),
		DefaultMenuList = ContextMenuList.extend({
			initialize: function() {
				var menuitems = [];

				if(Upfront.Application.get_current() != "theme") {
				menuitems.push(new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return l10n.save;
						},
						action: function() {
							var savelayout = new Upfront.Views.Editor.Command_SaveLayout();
							savelayout.on_click();
						}
					}));
				menuitems.push(new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return l10n.undo;
						},
						action: function(for_view) {
							//console.log(Upfront.Application.layout);
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
							return 'Clone';
						},
						in_context: function() {
							// Only show this menu on ObjectView instance
							return this.for_view instanceof Upfront.Views.ObjectView;
						},
						action: function(for_view, e) {
							var module_view = this.for_view.parent_module_view,
								module = module_view.model,
								modules = module_view.region.get('modules'),
								wrappers = module_view.region.get('wrappers'),
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
							new_model.add_to(modules, index+1);
							// Normalize layout
							var ed = Upfront.Behaviors.GridEditor,
								new_module_view =  Upfront.data.module_views[new_model.cid],
								$new_module_view = new_module_view.$el,
								h = $new_module_view.outerHeight(),
								w = $new_module_view.outerWidth();
							ed.start(new_module_view, new_model);
							ed.normalize(ed.els, ed.wraps);

							// properly possition the new module and show it under the cursor
							$new_module_view.css({
								position: "fixed",
								top: e.clientY - (h /2 ) ,
								left: e.clientX - ( w / 2 ) ,
							});

							// Simulate and mousedown and actually trigger drag
						    $new_module_view.find(".upfront-module").simulate("mousedown", {
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
					"z-index": 10000000
				})
				.offset({
					"top":me.for_view.event.pageY,
					"left": me.for_view.event.pageX-(($(document).width()-me.for_view.event.pageX <= this.$el.width() )?this.$el.width():0)
				})
				.addClass('uf-context-menu')
				;

			},

			remove: function(){
				if(this.menulists)
					this.menulists.each(function(list){
						list.remove();
					});
				Backbone.View.prototype.remove.call(this);
				if(!$('#contextmenu').length)
					$('body').append('<div id="contextmenu">');
			}

		}),

		ObjectView = _Upfront_EditableContentEntity.extend({
			className: "upfront-object-view",
			events: {
				"click .upfront-object > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
                "click .upfront-object > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-object > .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
				"dblclick": "on_edit",
				"contextmenu": "on_context_menu"
			},
			initialize: function () {
				// this.model.get("properties").bind("change", this.render, this);
				// this.model.get("properties").bind("add", this.render, this);
				// this.model.get("properties").bind("remove", this.render, this);
				this.listenTo(this.model.get("properties"), 'change', this.render);
				this.listenTo(this.model.get("properties"), 'add', this.render);
				this.listenTo(this.model.get("properties"), 'remove', this.render);

				this.listenTo(Upfront.Events, 'entity:resize_start', this.close_settings);
				this.listenTo(Upfront.Events, 'entity:drag_start', this.close_settings);
				this.listenTo(Upfront.Events, 'upfront:element:edit:start', this.on_element_edit_start);
				this.listenTo(Upfront.Events, 'upfront:element:edit:stop', this.on_element_edit_stop);
				this.listenTo(Upfront.Events, 'layout:after_render', this.on_after_layout_render);

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
					content = (this.get_content_markup ? this.get_content_markup() : ''),
					height, model, template
				;
				// Id the element by anchor, if anchor is defined
				var the_anchor = this.model.get_property_value_by_name("anchor");
				if (the_anchor && the_anchor.length)
					this.el.id = the_anchor;

				this.model.get("properties").each(function (prop) {
					props[prop.get("name")] = prop.get("value");
				});

				var row = this.model.get_breakpoint_property_value('row', true);
				height = ( row ) ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0;

				var theme_style = this.model.get_breakpoint_property_value('theme_style', true);
				if(theme_style){
					props.class += ' ' + theme_style.toLowerCase();
					this._theme_style = theme_style;
				}

				model = _.extend(this.model.toJSON(), {"properties": props, "buttons": buttons, "content": content, "height": height});
				template = _.template(_Upfront_Templates["object"], model);

				Upfront.Events.trigger("entity:object:before_render", this, this.model);
				// Listen to module resize and drop event
				if ( this.parent_module_view ){
					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resize');
					this.listenTo(this.parent_module_view, 'entity:resize', this.on_element_resize);
					this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:drop');
					this.listenTo(this.parent_module_view, 'entity:drop', this.on_element_drop);
				}

				//console.log('---- Object render - ' + this.cid + ' - ' + props.view_class);
				this.$el.html(template);

				// render subview if it exists
				if(typeof this.subview != 'undefined'){
					this.subview.setElement(this.$('.upfront-object-content')).render();
				}

				//this.init_ckeditor_on_focus();

				Upfront.Events.trigger("entity:object:after_render", this, this.model);
				//if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
				if ( this.on_render ) this.on_render();

				setTimeout(function() {
					me.checkUiOffset();
				}, 300);

				// Put this here because initialize gets overriden by child classes
				this.ensure_breakpoint_change_is_listened();
			},
			ensure_breakpoint_change_is_listened: function() {
				if (this.breakpoint_change_is_setup) {
					return;
				}
				this.listenTo(Upfront.Events, 'upfront:layout_size:change_breakpoint', this.on_change_breakpoint);
				this.breakpoint_change_is_setup = true;
			},
			checkUiOffset: function() {
				var $parentRegionEl = this.parent_module_view.region_view && this.parent_module_view.region_view.$el;
				if (!$parentRegionEl) {
					return;
				}
				var topOffsetTooClose = $parentRegionEl.offset().top - this.$el.offset().top < 50,
					// $.offset does not have right side so calculate it
					rightOffset = this.$el.offset().left + this.$el.width(),
					containerRightOffset = $parentRegionEl.closest('.upfront-region-container').offset().left + $parentRegionEl.closest('.upfront-region-container').width(),
					rightOffsetTooClose = containerRightOffset - rightOffset < 30;

				if (topOffsetTooClose && rightOffsetTooClose) {
					this.parent_module_view.$el.addClass('offset-ui-from-right-top');
				} else {
					this.parent_module_view.$el.removeClass('offset-ui-from-right-top');
				}
			},
			on_element_edit_start: function (edit, post) {
				if ( ( edit == 'text' || edit == 'write' ) && this.parent_module_view ){
					this.parent_module_view.$el.find('.upfront-module').addClass('upfront-module-editing')
					this.parent_module_view.disable_interaction(false);
				}
			},
			on_element_edit_stop: function (edit, post) {
				if (this.parent_module_view && this.parent_module_view.enable_interaction){
					this.parent_module_view.$el.find('.upfront-module').removeClass('upfront-module-editing')
					this.parent_module_view.enable_interaction(false);
				}
			},
			on_element_resize: function (attr) {

			},
			on_element_drop: function (attr) {

			},
			on_after_layout_render: function () {

			},
			on_change_breakpoint: function (breakpoint) {
				var theme_style = this.model.get_breakpoint_property_value('theme_style', true),
					$obj = this.$el.find('.upfront-object');
				if ( this._theme_style )
					$obj.removeClass(this._theme_style.toLowerCase());
				if ( theme_style ) {
					$obj.addClass(theme_style.toLowerCase());
					this._theme_style = theme_style;
				}
				this.checkUiOffset();
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
				this.parent_view = false;
				this.parent_module_view = false;
				Backbone.View.prototype.remove.call(this);
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
				if ( typeof Upfront.data.object_views == 'undefined' )
					Upfront.data.object_views = {};
				this.model.each(function (obj) {
					var view_class_prop = obj.get("properties").where({"name": "view_class"}),
						view_class = view_class_prop.length ? view_class_prop[0].get("value") : "ObjectView",
						local_view = Upfront.Views[view_class] ? Upfront.data.object_views[obj.cid] || new Upfront.Views[view_class]({model: obj}) : false
					;
					if(local_view) {
						local_view.parent_view = me;
						local_view._previous_parent_module_view = local_view.parent_module_view;
						local_view.parent_module_view = me.parent_view;
						local_view.render();
						$el.append(local_view.el);
						if ( ! Upfront.data.object_views[obj.cid] ){
							me.listenTo(local_view, 'upfront:entity:activate', me.on_activate);
							me.listenTo(local_view.model, 'remove', me.deactivate);
							//local_view.bind("upfront:entity:activate", me.on_activate, me);
							//local_view.model.bind("remove", me.deactivate, me);
							//local_view.listenTo(local_view.model, "remove", me.deactivate);
							Upfront.data.object_views[obj.cid] = local_view;
						}
						else {
							local_view.delegateEvents();
						}
					}
				});
			},
			remove: function() {
				if(this.model)
					this.model.each(function(model){
						var view = Upfront.data.object_views[model.cid];
						if(	view ){
							view.remove();
							delete Upfront.data.object_views[model.cid];
						}
					});
				this.parent_view = false;
				Backbone.View.prototype.remove.call(this);
				if(this.model){
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
				//this.on('entity:resize', this.on_resize, this);
				//this.on('entity:drop', this.on_drop, this);
				this.on('region:updated', this.on_region_update, this);

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
			},
			render: function () {
				var props = {},
					is_parent_group = ( typeof this.group_view != 'undefined' ),
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					model = _.extend(this.model.toJSON(), {"properties": props, "height": height, "parent_group_class": is_parent_group ? 'upfront-module-parent-group' : ''}),
					template = _.template(_Upfront_Templates["module"], model)
				;
				Upfront.Events.trigger("entity:module:before_render", this, this.model);

				//console.log('-- Module render ' + this.cid);
				this.$el.html(template);

				if ( this.model.get("shadow") ){
					this.$el.find('.upfront-editable_entity:first').attr("data-shadow", this.model.get("shadow"));
				}
				else {
					this.render_object();
				}

				if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
				Upfront.Events.trigger("entity:module:after_render", this, this.model);
			},
			update: function (prop, options) {
				var prev_value = prop._previousAttributes.value,
					value = prop.get('value'),
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
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid;
				if ( ! breakpoint )
					return;
				var data = this.model.get_property_value_by_name('breakpoint'),
					row = this.model.get_property_value_by_name('row'),
					breakpoint_data = data[breakpoint.id],
					$module = this.$el.find('.upfront-module'),
					$toggle = this.$el.find('.upfront-module-hidden-toggle');
				if ( ! breakpoint_data || ! breakpoint_data.hide ){
					$module.show()
					$toggle.hide();
				}
				else if ( breakpoint_data.hide ){
					$module.hide()
					$toggle.show();
				}
				if ( breakpoint_data && typeof breakpoint_data.col == 'number' ){
					$module.css('width', (breakpoint_data.col/(breakpoint_data.left+breakpoint_data.col)*100) + '%');
					$module.data('breakpoint_col', breakpoint_data.col);
				}
				else {
					$module.css('width', '');
					$module.removeData('breakpoint_col');
				}
				if ( breakpoint_data && typeof breakpoint_data.left == 'number' ){
					$module.css('margin-left', (breakpoint_data.left/(breakpoint_data.left+breakpoint_data.col)*100) + '%');
					$module.data('breakpoint_left', breakpoint_data.left);
				}
				else {
					$module.css('margin-left', '');
					$module.removeData('breakpoint_left');
				}
				if ( breakpoint_data && typeof breakpoint_data.top == 'number' ){
					$module.css('margin-top', (breakpoint_data.top*grid.baseline) + 'px');
					$module.data('breakpoint_top', breakpoint_data.top);
				}
				else {
					$module.css('margin-top', '');
					$module.removeData('breakpoint_top');
				}
				if ( breakpoint_data && typeof breakpoint_data.row == 'number' ){
					$module.css('min-height', (breakpoint_data.row*grid.baseline) + 'px');
					$module.data('breakpoint_row', breakpoint_data.row);
				}
				else {
					$module.css('min-height', (row*grid.baseline) + 'px');
					$module.removeData('breakpoint_row');
				}
				// order is applied to the view.$el
				if ( breakpoint_data && typeof breakpoint_data.order == 'number' ){
					this.$el.css('order', breakpoint_data.order);
					$module.data('breakpoint_order', breakpoint_data.order);
				}
				else {
					this.$el.css('order', '');
					$module.removeData('breakpoint_order');
				}
			},
			render_object: function () {
				var objects_view = this._objects_view || new Objects({"model": this.model.get("objects")});
				objects_view.parent_view = this;
				objects_view.render();
				this.$(".upfront-objects_container").append(objects_view.el);
				if ( ! this._objects_view )
					this._objects_view = objects_view;
				else
					this._objects_view.delegateEvents();
			},
			disable_interaction: function (prevent_edit, prevent_button, resize, drag, lock) {
				var $el = this.$el.find('.upfront-editable_entity:first');
				if ( prevent_edit && prevent_button )
					$el.addClass('upfront-module-disabled-all');
				if ( prevent_edit )
					$el.addClass('upfront-module-disabled-edit');
				if ( prevent_button )
					$el.addClass('upfront-module-disabled-button');
				if ( !resize && $el.data('ui-resizable') )
					$el.resizable('option', 'disabled', true);
				if ( !drag && $el.data('ui-draggable') )
					$el.draggable('option', 'disabled', true);
				this.interaction = false;
				if ( lock )
					this.lock_interaction = true;
			},
			enable_interaction: function (unlock) {
				if ( this.lock_interaction && !unlock )
					return;
				var $el = this.$el.find('.upfront-editable_entity:first');
				$el.removeClass('upfront-module-disabled-all upfront-module-disabled-edit upfront-module-disabled-button');
				if ( $el.data('ui-resizable') )
					$el.resizable('option', 'disabled', false);
				if ( $el.data('ui-draggable') )
					$el.draggable('option', 'disabled', false);
				this.interaction = true;
				this.lock_interaction = false;
			},
			on_click: function (e) {
				if ( this.interaction )
					this.constructor.__super__.on_click.call(this, e);
				else
					e.stopPropagation();
			},
			on_resize: function (attr) {
				// on resize
			},
			on_drop: function (attr) {
				// on drop
			},
			on_region_update: function(){
				if ( this._objects_view ){
					this._objects_view.model.each(function(view){
						view.trigger('region:updated');
					});
				}
			},
			on_region_edit: function (edit) {
				if(Upfront.Application.PostContentEditor == Upfront.Application.current_subapplication)
					return;
				if ( edit )
					this.disable_interaction(true, true, false, false, true);
				else
					this.enable_interaction(true);
			},
			on_change_breakpoint: function (breakpoint) {
				var $delete = this.$el.find('.upfront-module > .upfront-entity_meta > a.upfront-entity-delete_trigger'),
					$hide = this.$el.find('.upfront-module > .upfront-entity_meta > a.upfront-entity-hide_trigger');
				if ( !breakpoint.default ){
					this.disable_interaction(true, false, true, true, true);
					$delete.hide();
					$hide.show();
				}
				else {
					this.enable_interaction(true);
					$delete.show();
					$hide.hide();
				}
				this.update_position();
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
			remove: function(){
				if(this._objects_view)
					this._objects_view.remove();
				Backbone.View.prototype.remove.call(this);
			}
		}),

		ModuleGroup = _Upfront_EditableEntity.extend({
			className: "upfront-module-group",
			id: function(){ return this.model.get_property_value_by_name('element_id'); },
			events: {
				"click > .upfront-module-group-toggle-container > .upfront-module-group-ungroup": "on_ungroup",
				"click > .upfront-module-group-toggle-container > .upfront-module-group-reorder": "on_reorder",
				"click > .upfront-module-group-finish-edit": "on_finish"
			},
			initialize: function () {
				var callback = this.update || this.render;
				this.listenTo(this.model.get("properties"), 'change', callback);
				this.listenTo(this.model.get("properties"), 'add', callback);
				this.listenTo(this.model.get("properties"), 'remove', callback);
				this._prev_class = this.model.get_property_value_by_name('class');

				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "command:module_group:finish_edit", this.on_finish);
			},
			render: function () {
				var $ungroup = $('<div class="upfront-module-group-toggle-container upfront-module-group-toggle-ungroup-container"><div class="upfront-module-group-toggle upfront-module-group-ungroup">' + l10n.ungroup + '</div></div>'),
					$reorder = $('<div class="upfront-module-group-toggle-container upfront-module-group-toggle-reorder-container"><div class="upfront-module-group-toggle upfront-module-group-reorder">' + l10n.reorder + '</div></div>'),
					$finish = $('<div class="upfront-module-group-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> ' + l10n.done + '</div>'),
					$border = $('<div class="upfront-selected-border"></div>');

				Upfront.Events.trigger("entity:module_group:before_render", this, this.model);

				this.$el.append($border);
				this.$el.append($ungroup);
				this.$el.append($reorder);
				this.$el.append($finish);
				this.update();
				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this.region_view;
				local_view.group_view = this;
				local_view.render();
				this.$el.append(local_view.el);

				Upfront.Events.trigger("entity:module_group:after_render", this, this.model);

				if ( ! this._modules_view )
					this._modules_view = local_view;
				else
					this._modules_view.delegateEvents();
			},
			update: function () {
				var prop_class = this.model.get_property_value_by_name('class');
				this.$el.removeClass(this._prev_class).addClass(prop_class);
				this._prev_class = prop_class;
				this.update_position();
			},
			update_position: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					grid = Upfront.Settings.LayoutEditor.Grid;
				if ( ! breakpoint )
					return;
				var data = this.model.get_property_value_by_name('breakpoint'),
					row = this.model.get_property_value_by_name('row'),
					breakpoint_data = data[breakpoint.id],
					$toggle = this.$el.find('.upfront-module-hidden-toggle');
				if ( ! breakpoint_data || ! breakpoint_data.hide ){
					this.$el.show()
					$toggle.hide();
				}
				else if ( breakpoint_data.hide ){
					this.$el.hide()
					$toggle.show();
				}
				if ( breakpoint_data && typeof breakpoint_data.col == 'number' ){
					this.$el.css('width', (breakpoint_data.col/(breakpoint_data.left+breakpoint_data.col)*100) + '%');
					this.$el.data('breakpoint_col', breakpoint_data.col);
				}
				else {
					this.$el.css('width', '');
					this.$el.removeData('breakpoint_col');
				}
				if ( breakpoint_data && typeof breakpoint_data.left == 'number' ) {
					this.$el.css('margin-left', (breakpoint_data.left/(breakpoint_data.left+breakpoint_data.col)*100) + '%');
					this.$el.data('breakpoint_left', breakpoint_data.left);
				}
				else {
					this.$el.css('margin-left', '');
					this.$el.removeData('breakpoint_left');
				}
				if ( breakpoint_data && typeof breakpoint_data.top == 'number' ) {
					this.$el.css('margin-top', (breakpoint_data.top*grid.baseline) + 'px');
					this.$el.data('breakpoint_top', breakpoint_data.top);
				}
				else {
					this.$el.css('margin-top', '');
					this.$el.removeData('breakpoint_top');
				}
				if ( breakpoint_data && typeof breakpoint_data.row == 'number' ) {
					this.$el.css('min-height', (breakpoint_data.row*grid.baseline) + 'px');
					this.$el.data('breakpoint_row', breakpoint_data.row);
				}
				else {
					this.$el.css('min-height', (row*grid.baseline) + 'px');
					this.$el.removeData('breakpoint_row');
				}
			},
			on_ungroup: function () {
				var ed = Upfront.Behaviors.GridEditor,
					col = ed.get_class_num(this.$el, ed.grid.class),
					top = ed.get_class_num(this.$el, ed.grid.top_margin_class),
					left = ed.get_class_num(this.$el, ed.grid.left_margin_class),
					$wrap = this.$el.closest('.upfront-wrapper'),
					is_clr = $wrap.hasClass('clr'),
					wrapper_id = this.model.get_wrapper_id(),
					modules = this.model.get('modules'),
					wrappers = this.model.get('wrappers'),
					region = this.region,
					region_modules = this.region_view.model.get('modules'),
					region_wrappers = this.region_view.model.get('wrappers'),
					index = region_modules.indexOf(this.model),
					$next_wrap = this.$el.closest('.upfront-wrapper').next('.upfront-wrapper'),
					modules_arr = modules.map(function(module){ return module; }),
					wrappers_arr = wrappers.map(function(wrapper){ return wrapper; }),
					is_combine_wrap = false,
					line_col = 0;
				ed.start(this, this.model);
				if ( $wrap.find('>.upfront-module-view, >.upfront-module-group').length > 1 || $next_wrap.length > 0 && !$next_wrap.hasClass('clr') ) {
					is_combine_wrap = true;
					_.each(modules_arr, function(module, i){
						var wrapper_id = module.get_wrapper_id(),
							wrapper = wrappers.get_by_wrapper_id(wrapper_id),
							wrapper_class = wrapper ? wrapper.get_property_value_by_name('class') : false,
							wrapper_col = ed.get_class_num(wrapper_class, ed.grid.class);
						if ( line_col+wrapper_col <= col ){
							if ( line_col > 0 )
								is_combine_wrap = false;
							line_col += wrapper_col;
						}
						else {
							line_col = 0;
						}
					});
				}
				if ( is_combine_wrap ){
					_.each(modules_arr, function(module, i){
						var view = Upfront.data.module_views[module.cid],
							module_class = module.get_property_value_by_name('class'),
							module_top = ed.get_class_num(module_class, ed.grid.top_margin_class),
							module_left = ed.get_class_num(module_class, ed.grid.left_margin_class);
						if ( i == 0 )
							module.replace_class(ed.grid.top_margin_class + (module_top+top));
						module.replace_class(ed.grid.left_margin_class + (module_left+left));
						module.set_property('wrapper_id', wrapper_id);
						delete view.group_view;
						modules.remove(module, {silent: true});
						module.add_to(region_modules, index+i);
					});
				}
				else {
					var line = 0,
						wrapper_index = 0,
						current_wrapper_id;
					wrappers.remove(wrappers_arr, {silent: true});
					region_wrappers.add(wrappers_arr, {silent: true});
					_.each(modules_arr, function(module, i){
						var view = Upfront.data.module_views[module.cid],
							wrapper_id = module.get_wrapper_id(),
							wrapper = region_wrappers.get_by_wrapper_id(wrapper_id),
							wrapper_class = wrapper ? wrapper.get_property_value_by_name('class') : false,
							wrapper_col = ed.get_class_num(wrapper_class, ed.grid.class),
							module_class = module.get_property_value_by_name('class'),
							module_top = ed.get_class_num(module_class, ed.grid.top_margin_class),
							module_left = ed.get_class_num(module_class, ed.grid.left_margin_class),
							is_wrapper_clr = false;
						if ( current_wrapper_id != wrapper_id ){
							wrapper_index++;
							is_wrapper_clr = ( line_col+wrapper_col > col || wrapper_class.match(/clr/) );
							if ( i == 0 || is_wrapper_clr ) { // this module appear in a new line
								line++;
								line_col = wrapper_col;
							}
							else {
								line_col += wrapper_col;
							}
						}
						else {
							is_wrapper_clr = ( line_col+left == wrapper_col || wrapper_class.match(/clr/) );
						}
						if ( wrapper_index == 1 || is_wrapper_clr ){
							if ( is_clr && wrapper_index == 1 )
								wrapper.add_class('clr');
							if ( current_wrapper_id != wrapper_id )
								wrapper.replace_class(ed.grid.class + (wrapper_col+left));
							module.replace_class(ed.grid.left_margin_class + (module_left+left));
						}
						if ( line == 1 && current_wrapper_id != wrapper_id )
							module.replace_class(ed.grid.top_margin_class + (module_top+top));
						current_wrapper_id = wrapper_id;
						delete view.group_view;
						modules.remove(module, {silent: true});
						module.add_to(region_modules, index+i);
					});
				}
				this.remove();
				ed.update_position_data();
				ed.update_wrappers(region);
				Upfront.Events.trigger("entity:module_group:ungroup", modules_arr, region);
			},
			on_reorder: function () {
				Upfront.Events.trigger("command:module_group:finish_edit"); // close other reorder first
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.addClass('upfront-module-group-editing');
				this.$el.addClass('upfront-module-group-on-edit');
				this.disable_interaction(false, false);
				this.toggle_modules_interaction(true);
				Upfront.Events.trigger('entity:module_group:edit', this, this.model);
			},
			on_finish: function () {
				if ( !this.$el.hasClass('upfront-module-group-on-edit') )
					return;
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.removeClass('upfront-module-group-editing');
				this.$el.removeClass('upfront-module-group-on-edit');
				this.enable_interaction();
				this.toggle_modules_interaction(false);
			},
			disable_interaction: function (prevent_edit, drag) {
				if ( prevent_edit )
					this.$el.addClass('upfront-module-group-disabled');
				if ( !drag && this.$el.data('ui-draggable') )
					this.$el.draggable('option', 'disabled', true);
			},
			enable_interaction: function () {
				this.$el.removeClass('upfront-module-group-disabled');
				if ( this.$el.data('ui-draggable') )
					this.$el.draggable('option', 'disabled', false);
			},
			toggle_modules_interaction: function (enable) {
				this.model.get('modules').each(function(module){
					var module_view = Upfront.data.module_views ? Upfront.data.module_views[module.cid] : false;
					if ( module_view ) {
						if ( enable ) {
							module_view.enable_interaction(true);
							module_view.disable_interaction(true, false, true, true, true);
						}
						else {
							module_view.disable_interaction(true, false, false, false, true);
						}
					}
				});
			},
			on_change_breakpoint: function (breakpoint) {
				if ( !breakpoint.default ){
					this.$el.addClass('upfront-module-group-edit-mode');
				}
				else {
					this.$el.removeClass('upfront-module-group-edit-mode');
				}
				this.update_position();
			},
			remove: function(){
				if(this._modules_view)
					this._modules_view.remove();
				this.region.get('modules').remove(this.model, {silent: true});
				this.region_view = false;
				this.region = false;
				this.group_view = false;
				Backbone.View.prototype.remove.call(this);
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
				this.listenTo(Upfront.Events, "entity:drag_stop", this.apply_flexbox_clear);
				this.listenTo(Upfront.Events, "entity:resized", this.apply_flexbox_clear);
				this.listenTo(Upfront.Events, "entity:wrappers:update", this.apply_flexbox_clear);
				this.listenTo(Upfront.Events, "layout:render", this.on_after_layout_render);
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
				//console.log('Modules render - ' + this.cid + ' - ' + this.region_view.model.get('name'));
				Upfront.Events.trigger("entity:modules:before_render", this, this.model);
				if ( typeof Upfront.data.module_views == 'undefined' )
					Upfront.data.module_views = {};
				if ( typeof Upfront.data.wrapper_views == 'undefined' )
					Upfront.data.wrapper_views = {};
				this.model.each(function (module) {
					me.render_module(module);
				});
				this.apply_flexbox_clear();
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
					local_view.region_view = this.region_view;
					local_view.region = this.region_view.model;
					if ( this.group_view )
						local_view.group_view = this.group_view;
					if ( !wrapper ){
						local_view.render();
						if ( index === -2 )
							$el.append(local_view.el);
						else if ( index === -1 )
							$el.prepend(local_view.el);
						else
							$el_index.parent().after(local_view.el);
					}
					else {
						if ( this.current_wrapper_id == wrapper_id ){
							wrapper_el = this.current_wrapper_el;
						}
						else {
							wrapper_view = Upfront.data.wrapper_views[wrapper.cid] || new Upfront.Views.Wrapper({model: wrapper});
							wrapper_view.render();
							wrapper_el = wrapper_view.el;
						}
						this.current_wrapper_id = wrapper_id;
						this.current_wrapper_el = wrapper_el;
						local_view.render();
						if ( $el_index !== false ){
							if ( $el_index.closest('.upfront-wrapper').get(0) == wrapper_el )
								$el_index.after(local_view.el)
							else
								$(wrapper_el).prepend(local_view.el);
						}
						else if ( index === -1 ) {
							$(wrapper_el).prepend(local_view.el);
						}
						else {
							$(wrapper_el).append(local_view.el);
						}
						if ( wrapper_view ){
							if ( index === -2 )
								$el.append(wrapper_el);
							else if ( index === -1 )
								$el.prepend(wrapper_el);
							else
								$el_index.closest('.upfront-wrapper').after(wrapper_el);
							if ( ! Upfront.data.wrapper_views[wrapper.cid] )
								Upfront.data.wrapper_views[wrapper.cid] = wrapper_view;
						}
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
			on_add: function (model, collection, options) {
				this.current_wrapper_id = this.current_wrapper_el = null;
				this.render_module(model, options);
				this.apply_flexbox_clear();
				Upfront.Events.trigger("entity:added:after");
			},
			on_remove: function (model) {
				var view = Upfront.data.module_views[model.cid];
				if ( !view )
					return;
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
					this.fix_flexbox_clear(this.$el);
				}
			},
			on_after_layout_render: function () {
				this.apply_flexbox_clear();
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.apply_flexbox_clear);
			},
			apply_flexbox_clear: function () {
				this.fix_flexbox_clear(this.$el);
			},
			on_change_breakpoint: function (breakpoint) {
				var me = this;
				if ( !breakpoint.default ){
					var ed = Upfront.Behaviors.GridEditor,
						is_group = ( typeof this.group_view != 'undefined' ),
						wrappers = ( is_group ? this.group_view : this.region_view ).model.get('wrappers'),
						col = Math.round( ( is_group ? this.group_view.$el : this.region_view.$el ).width() / ed.grid.column_width );
					ed.adapt_to_breakpoint(this.model, wrappers, breakpoint.id, col);
				}
				// Make sure clearing flexbox is applied, set a timeout to let other positioning finish
				setTimeout(function(){ me.apply_flexbox_clear(); }, 1000);
			},
			remove: function() {
				var me = this;
				this.model.each(function(model){
					me.on_remove(model);
				});
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
			_get_full_size_el: function ($el, ratio, inside) {
				var is_full_screen = ( this._get_region_type() == 'full' ),
					width = $el.width(),
					win_height = $(window).height(),
					height = is_full_screen ? win_height : $el.height();
				return this._get_full_size(width, height, ratio, inside);
			},
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
				e.preventDefault();
				this.event = e;
				//Upfront.Events.trigger("entity:contextmenu:activate", this);
				if(this.context_menu_view)
					return this.context_menu_view.render();

				var context_menu_view = new this.ContextMenu({
						model: this.model,
						el: $(Upfront.Settings.LayoutEditor.Selectors.contextmenu)
					})
				;

				context_menu_view.for_view = this;
				this.context_menu_view = context_menu_view;
				context_menu_view.render();
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
								  		end_t = setTimeout(end, 2000);
								  		view.$el.addClass("upfront-add-region-ani upfront-add-region-ani-" + prop_y + '-' + prop_x);
										view.$el.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function () {
											end(view);
											clearTimeout(end_t);
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
				this.listenTo(Upfront.Events, "layout:render", this.fix_height);
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
				$(window).on('scroll.region_container_' + this.model.get('name'), this, this.on_scroll);
				$(window).on('resize.region_container_' + this.model.get('name'), this, this.on_window_resize);

				// breakpoint changes
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);

				this.listenTo(Upfront.Events, "entity:contextmenu:deactivate", this.remove_context_menu);
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
				var grid = Upfront.Settings.LayoutEditor.Grid,
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
					this.fix_height();
					this.update_overlay();
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
			trigger_edit_lightbox: function() {
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
				me.fix_height();
			},
			fix_height: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				// Don't need to adapt height if breakpoint isn't default or that flexbox is supported
				// Make sure to test with non-flexbox browser whenever possible
				if ( ( breakpoint && !breakpoint.default ) || Upfront.Util.css_support('flex') ){
					this.set_full_screen();
					this.refresh_background();
					return;
				}
				var $regions = this.$el.find('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right'),
					$sub = this.$el.find('.upfront-region-side-top, .upfront-region-side-bottom'),
					$container = $regions.find('.upfront-modules_container'),
					height = 0;
				$regions.add($container).css({
					minHeight: "",
					height: "",
					maxHeight: ""
				});
				this.set_full_screen();
				$sub.each(function(){
					$(this).find('.upfront-modules_container').css('min-height', $(this).outerHeight());
				});
				$regions.each(function(){
					var h = $(this).outerHeight();
					height = h > height ? h : height;
				});
				$regions.add($container).css('min-height', height);
				this.refresh_background();
			},
			set_full_screen: function () {
				var $region = this.$layout.find('.upfront-region-center'),
					$sub = this.$layout.find('.upfront-region-side-top, .upfront-region-side-bottom'),
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
						bg_image = this.model.get_breakpoint_property_value('background_image', true),
						bg_style = this.model.get_breakpoint_property_value('background_style', true),
						bg_position_y = this.model.get_breakpoint_property_value('background_position_y', true),
						bg_position_x = this.model.get_breakpoint_property_value('background_position_x', true),
						is_bg_image = ( ( !bg_type || bg_type == 'image' || bg_type == 'featured' ) && bg_image ),
						is_bg_overlay = ( bg_type && bg_type != 'color' && !is_bg_image ),
						full_screen_height = parseInt(this.$layout.find('.upfront-region-center').css('min-height'));
					if ( is_bg_image ) {
						if ( bg_style != 'full' ){
							var img = new Image;
							img.src = bg_image;
							bg_position_y = parseInt(bg_position_y)/100 * (height-img.height);
							bg_position_x = bg_position_x + '%';
						}
						else {
							bg_position_y = parseInt(this.$bg.data('bg-position-y'));
							bg_position_x = parseInt(this.$bg.data('bg-position-x')) + 'px';
						}
					}
					if ( scroll_top >= top-rel_top && scroll_bottom <= bottom ) {
						if ( is_bg_image ) {
							this.$bg.css('background-position', bg_position_x + ' ' + ( bg_position_y + scroll_top - rel_top ) + 'px');
						}
						else if ( is_bg_overlay ) {
							this.$bg.children('.upfront-region-bg-overlay').css('top', ( scroll_top - rel_top ))
						}
					}
					else {
						if ( is_bg_image ) {
							this.$bg.css('background-position', bg_position_x + ' ' + ( bg_position_y + ( height - win_height ) ) + 'px');
						}
						else if ( is_bg_overlay ) {
							this.$bg.children('.upfront-region-bg-overlay').css('top', ( height - win_height ));
						}
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
					classes = [];
				classes.push('upfront-region-sub-container');
				classes.push('upfront-region-sub-container-' + name.toLowerCase().replace(/ /, "-"));
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
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, 'layout:after_render', this.update_pos);
				this.listenTo(Upfront.Events, "entity:region:added", this.update_pos);
				this.listenTo(Upfront.Events, "entity:region:removed", this.update_pos);
				this.listenTo(Upfront.Events, "sidebar:toggle:done", this.update_pos);
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
				this.$el.html(template);
				this.$layout = this.$el.find('.upfront-grid-layout');
				this.update();
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
			},
			on_scroll: function (e) {
				var me = e.data;
				me.update_pos();
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
				if ( scroll_top >= container_offset.top && scroll_bottom <= container_bottom ){
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
						( !_.isNumber(sticky_top) && ( scroll_top < container_offset.top || scroll_bottom > container_bottom ) ) 
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
						this.$el.css('top', container_height - win_height)
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
					$size = $('<div class="upfront-region-size-hint upfront-ui"></div>');
				Upfront.Events.trigger("entity:region:before_render", this, this.model);
				this.$el.html(template);
				this.$el.append('<div class="upfront-debug-info"/>');
				$edit.appendTo(this.$el);
				$size.appendTo(this.$el);

				this.update();

				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this;
				local_view.render();
				this.$el.find('.upfront-modules_container').append(local_view.el);
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
				var container_view = this.parent_view.get_container_view(this.model);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: this.$el, width: 420, top: 52, right:43, keep_position: false});
				this.bg_setting.for_view = this;
				this.bg_setting.render();
				this.$el.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
			},
			update: function () {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
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
					if ( col && col != this.col )
						this.region_resize(col);
				}
				if ( height > 0 )
					this.$el.css('min-height', height + 'px');
				if ( expand_lock )
					this.$el.addClass('upfront-region-expand-lock');
				else
					this.$el.removeClass('upfront-region-expand-lock');
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
					$container = this.$el.find('.upfront-modules_container'),
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
				this.update_size_hint(this.col * grid.column_width, this.$el.height());
			},
			on_module_update: function () {
				this.trigger("region_changed", this);
				this.display_region_hint();
			},
			display_region_hint: function() {

				if(Upfront.Application.get_current() != "theme" || this.$el.hasClass('upfront-region-floating') || this.$el.hasClass('upfront-region-lightbox') || this.$el.attr('id')=='region-shadow')
					return

				if(this.$el.find('.upfront-modules_container .upfront-wrapper').size() < 1) {
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

					var wide_regions = thecollection.where({ type : 'wide'});


					if(wide_regions.length < 1) {
						//var add_region = new Upfront.Views.Editor.RegionPanelsAddRegion({model: this.model, to: 'top'});
						//$('div.upfront-regions').append(add_region.$el);
						if($('div.upfront-regions a#no_region_add_one').length < 1) {
							$('div.upfront-regions').append($('<a>').attr('id', 'no_region_add_one').html('Click here to add a region').bind('click', function() {

								var new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
									"name": 'main',
									"container": 'main',
									"title": l10n.main_area
								}));


								var options = {};



								new_region.set_property('row', Upfront.Util.height_to_row(300)); // default to 300px worth of rows




								new_region.add_to(thecollection, 0, options);

								var wide_regions = thecollection.where({ type : 'wide'});
								if(wide_regions.length > 0) {
									$('div.upfront-regions a#no_region_add_one').unbind('click');
									$('div.upfront-regions a#no_region_add_one').remove();

								}
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
				var $settings_trigger = this.$el.find('> .upfront-entity_meta > a.upfront-entity-settings_trigger');

				this.bg_setting.top = $settings_trigger.offset().top - this.$el.offset().top;
				this.bg_setting.right = ( this.$el.offset().left + this.$el.width() - $settings_trigger.offset().left ) + 10;

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
				if ( !width )
					this.model.set_property('width', 225, true);
				if ( !col )
					this.model.set_property('col', Upfront.Util.width_to_col(css.width), true)
				if ( !height )
					this.model.set_property('height', 225, true);
				if ( is_top || !is_bottom ){
					css.top = is_top ? top : 30;
					css.bottom = '';
					if ( !is_top )
						this.model.set_property('top', 30, true);
				}
				else {
					css.bottom = bottom;
					css.top = '';
				}
				if ( is_left || !is_right ){
					css.left = ( is_left ? left : 30 ) + ( restrict ? 0 : $main.offset().left );
					css.right = '';
					if ( !is_left )
						this.model.set_property('left', 30, true);
				}
				else {
					css.right = right;
					css.left = '';
				}
				this.$el.find('.upfront-modules_container').css( {
					width: Math.floor(css.width/grid.column_width) * grid.column_width,
					minHeight: css.minHeight
				});
				this.$el.css(css);
				if ( this.edit_position )
					this.edit_position.update_fields();
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
					is_left = ( typeof left == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' ),
					css = {};
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
				var total = this.$el.find('.upfront-modules_container > .upfront-editable_entities_container').find('.upfront-module').size();
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
			$close_icon: $('<div class="upfront-icon upfront-icon-popup-close"></div>'),
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

					var	$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small upfront-ui" title="' + l10n.edit_ltbox + '"><i class="upfront-icon upfront-icon-region-edit"></i></div>');
					//$ok = $('<div class="upfront-region-finish-edit-lightbox upfront-ui">Finish Editing</div>');


				this.$el.prepend(this.$bg);
				this.$close.appendTo(this.$el);

				$edit.appendTo(this.$el);
				//$ok.appendTo(this.$el);
			},
			render_bg_setting: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: $main, width: 420});
				this.bg_setting.render();
				$main.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
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

				this.$el.find('.upfront-modules_container').css( {
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
			render_panels: function () {
			},
			render_edit_position: function () {
				this.edit_position = new Upfront.Views.Editor.RegionFixedEditPosition({model: this.model});
				this.edit_position.render();
				this.$el.append(this.edit_position.el);
			},
			trigger_edit: function (e) {
				this.on_settings_click();
				/*
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.trigger_edit_lightbox();
				e.stopPropagation();
				*/
			},
			close_edit: function (e) {
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.close_edit();
				e.stopPropagation();
			},
			check_modules: function () {
				var total = this.$el.find('.upfront-modules_container > .upfront-editable_entities_container').find('.upfront-module').size();
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
			},
			render_container: function (region, index) {
				var container = region.get("container"),
					name = region.get("name");
				if ( region.is_main() || (container == 'lightbox' && !this.container_views[region.cid])) {
					var container_view = this.container_views[region.cid] || this.create_container_instance(region);
					container_view.parent_view = this;
					container_view.render();
					//container_view.bind("activate_region", this.activate_region_container, this);
					this.listenTo(container_view, "activate_region", this.activate_region_container);
					if ( index >= 0 )
						this.$el.find('.upfront-region').eq(index).closest('.upfront-region-container').before(container_view.el);
					else
						this.$el.append(container_view.el);
					if ( !this.container_views[region.cid] ){
						this.container_views[region.cid] = container_view;
					}
					else {
						container_view.delegateEvents();
					}
					return container_view;
				}
			},
			render_region: function (region, sub) {
				var local_view = Upfront.data.region_views[region.cid] || this.create_region_instance(region),
					container_view = this.get_container_view(region),
					sub = sub ? sub : region.get('sub'),
					sub_container_view;
				if ( !container_view )
					return;
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
				if ( sub == 'top' || sub == 'bottom' ){
					sub_container_view = this.sub_container_views[region.cid] || new RegionSubContainer({"model": region});
					sub_container_view.parent_view = this;
					sub_container_view.listenTo(container_view.model.get('properties'), 'change', sub_container_view.update);
					sub_container_view.render();
					local_view.sub_container_view = sub_container_view;
					sub_container_view.$layout.append(local_view.el);
					if ( sub == 'top' )
						container_view.$layout.before(sub_container_view.el);
					else
						container_view.$layout.after(sub_container_view.el);
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
				if ( region.get("default") )
					local_view.trigger("activate_region", local_view);
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
					new_active_region = region.model,
					container = this.get_container_view(new_active_region);
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
			on_change_breakpoint: function (breakpoint) {
				var ed = Upfront.Behaviors.GridEditor;
				if ( !breakpoint.default )
					ed.adapt_region_to_breakpoint(this.model, breakpoint.id, breakpoint.columns);
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
				"mouseup": "on_mouse_up"
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
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.update_position);
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
					parent_col = Math.round(parent_width/grid.column_width);
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
				if ( breakpoint_data && breakpoint_data.clear )
					this.$el.data('breakpoint_clear', breakpoint_data.clear);
				else
					this.$el.removeData('breakpoint_clear');

			},
			render: function () {
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
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(Upfront.Events, "command:layout:edit_background", this.open_edit_background);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				this.listenTo(Upfront.Events, "application:mode:after_switch", this.on_mode_switch);
				$(window).on('resize.upfront_layout', this, this.on_window_resize);
				this.render();
			},
			update: function () {
				this.update_background();
			},
			render: function () {
				this.$el.addClass('upfront-layout-view');
				this.$el.html(this.tpl(this.model.toJSON()));
				this.$layout = this.$(".upfront-layout");
				//if(!this.local_view)
					this.local_view = new Regions({"model": this.model.get("regions")});

				this.local_view.render();

				this.$layout.append(this.local_view.el);
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
				if(!$(e.target).closest('.upfront-entity_meta').length && !$(e.target).closest('#upfront-csseditor').length)
					Upfront.Events.trigger("entity:settings:deactivate");
				Upfront.Events.trigger("entity:contextmenu:deactivate");
				if(currentEntity){
					//If the click has been made outside the currentEntity, deactivate it
					if(!$(e.target).closest(currentEntity.el).length){
						currentEntity.trigger('deactivated');
						currentEntity.$el.removeClass("upfront-active_entity");
						Upfront.Events.trigger("entity:deactivated", e);
						Upfront.data.currentEntity = false;
					}
				}
				// Deactivate if clicked on blank area of region
				if($(e.target).hasClass('upfront-editable_entities_container'))
					Upfront.Events.trigger("entity:deactivated");

				// Close region editing on click anywhere out the region
				if ( $(e.target).hasClass('upfront-region-editing-overlay') && !$('.upfront-region-bg-setting-open').length )
					Upfront.Events.trigger("entity:region:deactivated");
				// Unselect selection
				if ( !Upfront.Behaviors.LayoutEditor.selecting )
					Upfront.Events.trigger("command:selection:remove");
				// Deactiving group reorder on clicking anywhere
				if ( !$(e.target).closest('.upfront-module-group-on-edit').length )
					Upfront.Events.trigger("command:module_group:finish_edit");
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
					this.render_ruler(false);
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
			render_ruler: function (follow_grid) {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					width = follow_grid ? grid.size*grid.column_width : this.$layout.width(),
					$ruler_container = this.$el.find('.upfront-ruler-container'),
					$ruler = this.$layout.find('.upfront-ruler'),
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
					this.$layout.prepend($ruler);
				}
				$ruler.empty();
				if ( follow_grid )
					$ruler.css('width', width);
				else
					$ruler.css('width', '');
				for ( mark = 0; mark < width; mark+=100 ){
					$ruler.append( create_mark(mark, 100, (mark+40 > width ? false : true)) );
				}
				if ( width > (mark-100)+10 )
					$ruler.append( create_mark(width, width-(mark-100), true) );
			},
			remove_ruler: function () {
				this.$el.find('.upfront-ruler-container').remove();
				this.$layout.find('.upfront-ruler').remove();
			},
			update_grid_css: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					styles = [],
					selector = '#page.upfront-layout-view';
				styles.push(selector + ' .upfront-grid-layout { width: ' + grid.column_width*grid.size + 'px; }');
				styles.push(selector + ' .upfront-object { padding: ' + grid.column_padding + 'px; }');
				styles.push(selector + ' .upfront-overlay-grid {background-size: 100% ' + grid.baseline + 'px; }');
				styles.push(selector + ' .plaintxt_padding {padding: ' + grid.type_padding + 'px; }');

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

