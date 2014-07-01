(function ($) {

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
			_get_full_size: function ($wrap, ratio, inside) {
				var width = $wrap.width(),
					height = $wrap.height();
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
				var me = this;
				var type = this.model.get_property_value_by_name('background_type'),
					color = this.model.get_property_value_by_name('background_color'),
					image = this.model.get_property_value_by_name('background_image'),
					ratio = parseFloat(this.model.get_property_value_by_name('background_image_ratio')),
					repeat = this.model.get_property_value_by_name('background_repeat'),
					position = this.model.get_property_value_by_name('background_position'),
					style = this.model.get_property_value_by_name('background_style'),
					width = this.$el.outerWidth(),
					height = this.$el.outerHeight(),
					$overlay = this.$el.children('.upfront-region-bg-overlay');


				if ( type == 'featured'){
					if ( color )
						this.$el.css('background-color', color);
					else
						this.$el.css('background-color', '');


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
									me.$el.css('background-image', "url('" + image + "')");

									if ( style == 'full' ){
										var size = me._get_full_size(me.$el, ratio, false);
										me.$el.css({
											backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
											backgroundRepeat: "no-repeat",
											backgroundPosition: "50% 50%"
										});
									}
									else {
										me.$el.css({
											backgroundSize: "auto auto",
											backgroundRepeat: repeat,
											backgroundPosition: position
										});
									}

								});

							}
							else {
								me.$el.css({
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
						this.$el.css('background-color', color);
					else
						this.$el.css('background-color', '');
					if ( type != 'color' && image ){
						this.$el.css('background-image', "url('" + image + "')");
						if ( style == 'full' ){
							var size = this._get_full_size(this.$el, ratio, false);
							this.$el.css({
								backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
								backgroundRepeat: "no-repeat",
								backgroundPosition: "50% 50%"
							});
						}
						else {
							this.$el.css({
								backgroundSize: "auto auto",
								backgroundRepeat: repeat,
								backgroundPosition: position
							});
						}
					}
					else {
						this.$el.css({
							backgroundImage: "none",
							backgroundSize: "",
							backgroundRepeat: "",
							backgroundPosition: ""
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
						this.$el.append($overlay);
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
					this.$el.css({
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
				var center = this.model.get_property_value_by_name('background_map_center'),
					zoom = this.model.get_property_value_by_name('background_map_zoom'),
					style = this.model.get_property_value_by_name('background_map_style'),
					styles = this.model.get_property_value_by_name('background_map_styles'),
					controls = this.model.get_property_value_by_name('background_map_controls'),
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
				}
			},
			update_background_slider: function ($type, $overlay) {
				var me = this,
					slide_images = this.model.get_property_value_by_name('background_slider_images'),
					rotate = this.model.get_property_value_by_name('background_slider_rotate'),
					rotate_time = this.model.get_property_value_by_name('background_slider_rotate_time'),
					control = this.model.get_property_value_by_name('background_slider_control'),
					transition = this.model.get_property_value_by_name('background_slider_transition');
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
								$image.append('<img src="' + image.full[0] + '" />')
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
					color = this.model.get_property_value_by_name('background_color'),
					video = this.model.get_property_value_by_name('background_video'),
					embed = this.model.get_property_value_by_name('background_video_embed'),
					width = this.model.get_property_value_by_name('background_video_width'),
					height = this.model.get_property_value_by_name('background_video_height'),
					style = this.model.get_property_value_by_name('background_video_style') || 'crop',
					ratio, $embed;
				if ( style == 'inside' && color )
					this.$el.css('background-color', color);
				else
					this.$el.css('background-color', '');
				if ( video && embed && ( this._prev_video && this._prev_video != video || !this._prev_video ) ){
					ratio = height/width;
					$embed = $(embed);
					$embed.css('position', 'absolute').appendTo($type);
					if ( style == 'crop' || style == 'inside' ){
						var size = this._get_full_size($type, ratio, (style == 'inside'));
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
				var type = this.model.get_property_value_by_name('background_type'),
					color = this.model.get_property_value_by_name('background_color'),
					image = this.model.get_property_value_by_name('background_image');
				if ( type == 'map' && this.bg_map ){
					google.maps.event.trigger(this.bg_map, 'resize');
				}
				else if ( type == 'slider' ) {
					this.$el.find('.upfront-region-bg-' + type).trigger('refresh');
				}
				else if ( type == 'video' ) {
					var video = this.model.get_property_value_by_name('background_video'),
						embed = this.model.get_property_value_by_name('background_video_embed'),
						width = this.model.get_property_value_by_name('background_video_width'),
						height = this.model.get_property_value_by_name('background_video_height'),
						style = this.model.get_property_value_by_name('background_video_style') || 'crop',
						ratio,
						$type = this.$el.find('.upfront-region-bg-' + type),
						$embed = $type.children('iframe');
					if ( video && embed ){
						ratio = height/width;
						if ( style == 'crop' || style == 'inside' ){
							var size = this._get_full_size($type, ratio, (style == 'inside'));
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
					var style = this.model.get_property_value_by_name('background_style'),
						ratio = this.model.get_property_value_by_name('background_image_ratio'),
						width = this.$el.outerWidth(),
						height = this.$el.outerHeight();
					if ( style == 'full' ){
						var size = this._get_full_size(this.$el, ratio, false);
						this.$el.css({
							backgroundSize: size[0] + "px " + size[1] + "px", // "auto 100%",
							backgroundRepeat: "no-repeat",
							backgroundPosition: "50% 50%"
						});
					}
				}
			},
			remove_background: function () {
				var $overlay = this.$el.find('.upfront-region-bg-overlay');
				if ( $overlay.length )
					$overlay.hide();
				this.$el.css({
					backgroundColor: "",
					backgroundImage: "none",
					backgroundSize: "",
					backgroundRepeat: "",
					backgroundPosition: ""
				});
			},
			on_window_resize: function (e) {
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
				e.preventDefault();
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
					$prev;
				$el.children().sort(Upfront.Util.sort_elements_cb).filter(function(){
					return $(this).children().size() > 0;
				}).each(function(){
					var order = $(this).data('breakpoint_order') || 0,
						clear = $(this).data('breakpoint_clear'),
						prev_off;
					$(this).css('margin-right', 0);
					if ( $prev && ( ( ( !breakpoint || breakpoint.default ) && $(this).hasClass('clr') ) || ( breakpoint && !breakpoint.default && clear) ) ){
						prev_off = $prev.offset();
						$prev.css('margin-right', Math.floor( (off.left+$el.width()) - (prev_off.left+$prev.width()) ));
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

				this.$el.bind('click', function() {
					me.action(this.for_view);
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
					this.menuitems = _([
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return 'Save';
						},
						action: function() {
							var savelayout = new Upfront.Views.Editor.Command_SaveLayout();
							savelayout.on_click();
						}
					}),
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return 'Undo';
						},
						action: function(for_view) {
							//console.log(Upfront.Application.layout);
							var undo = new Upfront.Views.Editor.Command_Undo({"model": Upfront.Application.layout});
							undo.on_click();
						}
					}),
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return Upfront.Application.get_gridstate() ? 'Hide Grid': 'Show Grid';
						},
						action: function() {
							var togglegrid = new Upfront.Views.Editor.Command_ToggleGrid();
							togglegrid.on_click();
						}
					}),
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return 'Clone';
						},
						in_context: function() {
							// Only show this menu on ObjectView instance
							return this.for_view instanceof Upfront.Views.ObjectView;
						},
						action: function() {
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
							var ed = Upfront.Behaviors.GridEditor;
							ed.start(Upfront.data.module_views[new_model.cid], new_model);
							ed.normalize(ed.els, ed.wraps);
						}
					})
				]);
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
					"left": me.for_view.event.pageX
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

				if (this.init) this.init();
			},
			close_settings: function () {
				Upfront.Events.trigger("entity:settings:deactivate");
			},
			render: function () {
				var props = {},
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					buttons = (this.get_buttons ? this.get_buttons() : ''),
					content = (this.get_content_markup ? this.get_content_markup() : ''),
					model, template
				;
				// Id the element by anchor, if anchor is defined
				var the_anchor = this.model.get_property_value_by_name("anchor");
				if (the_anchor && the_anchor.length)
					this.el.id = the_anchor;

				this.model.get("properties").each(function (prop) {
					props[prop.get("name")] = prop.get("value");
				});

				if(props.theme_style)
					props.class += ' ' + props.theme_style.toLowerCase();

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
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					model = _.extend(this.model.toJSON(), {"properties": props, "height": height}),
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
					data = this.model.get_property_value_by_name('breakpoint') || {};
				if ( typeof data[breakpoint.id] == 'undefined' )
					data[breakpoint.id] = {};
				if ( data[breakpoint.id].hide == 1 )
					data[breakpoint.id].hide = 0;
				else
					data[breakpoint.id].hide = 1;
				this.model.set_property('breakpoint', data, true);
				this.update_position();
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
				var $ungroup = $('<div class="upfront-module-group-toggle-container upfront-module-group-toggle-ungroup-container"><div class="upfront-module-group-toggle upfront-module-group-ungroup">Ungroup</div></div>'),
					$reorder = $('<div class="upfront-module-group-toggle-container upfront-module-group-toggle-reorder-container"><div class="upfront-module-group-toggle upfront-module-group-reorder">Reorder</div></div>'),
					$finish = $('<div class="upfront-module-group-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> Done</div>'),
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
					is_clr = this.$el.closest('.upfront-wrapper').hasClass('clr'),
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
				if ( $next_wrap.length > 0 && !$next_wrap.hasClass('clr') ) {
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
					var new_wrapper = new Upfront.Models.Wrapper({}),
						new_wrapper_id = Upfront.Util.get_unique_id("wrapper");
					new_wrapper.set_property('wrapper_id', new_wrapper_id);
					new_wrapper.replace_class(ed.grid.class + (col+left));
					if ( is_clr )
						new_wrapper.add_class('clr');
					region_wrappers.add(new_wrapper, {silent: true});
					_.each(modules_arr, function(module, i){
						var view = Upfront.data.module_views[module.cid],
							module_class = module.get_property_value_by_name('class'),
							module_top = ed.get_class_num(module_class, ed.grid.top_margin_class),
							module_left = ed.get_class_num(module_class, ed.grid.left_margin_class);
						if ( i == 0 )
							module.replace_class(ed.grid.top_margin_class + (module_top+top));
						module.replace_class(ed.grid.left_margin_class + (module_left+left));
						module.set_property('wrapper_id', new_wrapper_id);
						delete view.group_view;
						modules.remove(module, {silent: true});
						module.add_to(region_modules, index+i);
					});
				}
				else {
					var line = wrapper_index = 0,
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
							module_left = ed.get_class_num(module_class, ed.grid.left_margin_class);
						if ( current_wrapper_id != wrapper_id )
							wrapper_index++;
						if ( i == 0 || wrapper_class.match(/clr/) ) // this module appear in a new line
							line++;
						if ( wrapper_index == 1 || wrapper_class.match(/clr/) ){
							if ( is_clr && wrapper_index == 1 )
								wrapper.add_class('clr');
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
				ed.start(this, this.model);
				this.remove();
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
						if ( enable )
							module_view.enable_interaction(true);
						else
							module_view.disable_interaction(true, false, true, true, true);
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
				this.listenTo(Upfront.Events, "entity:drag_stop", this.on_drop);
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
				this.fix_flexbox_clear(this.$el);
				Upfront.Events.trigger("entity:modules:after_render", this, this.model);
			},
			render_module: function (module, options) {
				var $el = this.$el,
					index = options && typeof options.index != 'undefined' ? options.index-1 : -2,
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
							$el.find('> .upfront-wrapper > .upfront-module-view, > .upfront-wrapper > .upfront-module-group').eq(index).parent().after(local_view.el);
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
						$(wrapper_el).append(local_view.el);
						if ( wrapper_view ){
							if ( index === -2 )
								$el.append(wrapper_el);
							else if ( index === -1 )
								$el.prepend(wrapper_el);
							else
								$el.find('> .upfront-wrapper > .upfront-module-view, > .upfront-wrapper > .upfront-module-group').eq(index).closest('.upfront-wrapper').after(wrapper_el);
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
			},
			on_add: function (model, collection, options) {
				this.current_wrapper_id = this.current_wrapper_el = null;
				this.render_module(model, options);
				this.fix_flexbox_clear(this.$el);
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
			on_drop: function () {
				this.fix_flexbox_clear(this.$el);
			},
			on_change_breakpoint: function (breakpoint) {
				this.fix_flexbox_clear(this.$el);
				if ( breakpoint.default )
					return;
				var ed = Upfront.Behaviors.GridEditor,
					is_group = ( typeof this.group_view != 'undefined' ),
					wrappers = ( is_group ? this.group_view : this.region_view ).model.get('wrappers'),
					col = Math.round( ( is_group ? this.group_view.$el : this.region_view.$el ).width() / ed.grid.column_width );
				ed.adapt_to_breakpoint(this.model, wrappers, breakpoint.id, col);
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
			events: {
				"click > .upfront-region-edit-trigger": "trigger_edit",
				"click > .upfront-region-edit-fixed-trigger": "trigger_edit_fixed",
				"click > .upfront-region-finish-edit": "finish_edit" ,
				"contextmenu": "on_context_menu",
				"mouseover": "on_mouse_over"
			},
			attributes: function(){
				var name = this.model.get("container") || this.model.get("name"),
					classes = [];
				classes.push('upfront-region-container');
				classes.push('upfront-region-container-' + name.toLowerCase().replace(/ /, "-"));
				classes.push('upfront-region-container-' + this._get_region_type() );
				if ( this.model.collection.active_region == this.model ){
					classes.push('upfront-region-container-active');
				}
				return {
					"class": classes.join(' ')
				};
			},
			_get_region_type: function () {
				return this.model.get('type') || ( this.model.get('clip') ? 'clip' : 'wide' );
			},
			_get_previous_region_type: function () {
				return this.model.previous('type') || ( this.model.previous('clip') ? 'clip' : 'wide' );
			},
			on_mouse_over: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				if ( $main.hasClass('upfront-region-fixed-editing') )
					this.trigger('activate_region', this);
				this.update_pos();
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
								  	return 'Finish Editing';
								  else
								  	return 'Edit Background';
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
								  	return 'Add Floating Region';
							  },
							  action: function() {
							  		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
							  			collection = me.model.collection,
							  			index = collection.indexOf(me.model),
							  			fixed = me.model.get_sub_region('fixed'),
							  			title = me.model.get('title') + " Floating " + (fixed.length+1),
							  			name = title.toLowerCase().replace(/\s/, '-'),
								  		new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
											"name": name,
											"container": me.model.get('name'),
											"title": title,
											"type": 'fixed',
											"sub": 'fixed',
											"scope": me.model.get('scope')
										})),
										end_t;
									new_region.set_property('width', 225);
									new_region.set_property('height', 225);
									new_region.set_property('top', 30);
									new_region.set_property('left', 30);
									new_region.set_property('background_type', 'color');
									new_region.set_property('background_color', '#aeb8c2');
									Upfront.Events.once('entity:region:added', run_animation, this);
									new_region.add_to(collection, index+1, {sub: 'fixed'});
				 				 	if(!$main.hasClass('upfront-region-fixed-editing'))
								  		me.trigger_edit_fixed(me.event);
								  	function run_animation(view, model){
								  		end_t = setTimeout(end, 2000);
								  		view.$el.addClass("upfront-add-region-ani upfront-add-region-ani-top-left");
										view.$el.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function () {
											end(view);
											clearTimeout(end_t);
										});
								  	}
									function end (view) {
										view.$el.removeClass("upfront-add-region-ani upfront-add-region-ani-top-left");
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
					width = this.model.get_property_value_by_name('width'),
					index = this.model.collection.index_container(this.model);
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
				$(window).on('scroll', this, this.on_scroll);
				this.listenTo(Upfront.Events, "layout:render", this.fix_height);
				this.listenTo(Upfront.Events, "entity:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.update_overlay);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.fix_height);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region:added", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region:removed", this.fix_height);
				this.listenTo(Upfront.Events, "entity:region:removed", this.close_edit);
				this.listenTo(Upfront.Events, "entity:module_group:ungroup", this.fix_height);
				$(window).on('resize', this, this.on_window_resize);

				// breakpoint changes
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);

				this.listenTo(Upfront.Events, "entity:contextmenu:deactivate", this.remove_context_menu);
			},
			render: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid,
					type = this._get_region_type(),
					data = _.extend(this.model.toJSON(), {size_class: grid.class, max_col: this.max_col, available_col: this.available_col}),
					template = _.template(_Upfront_Templates["region_container"], data),
					$edit = $('<div class="upfront-region-edit-trigger tooltip tooltip-left upfront-ui" data-tooltip="Change Background"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					//$edit_fixed = $('<div class="upfront-region-edit-fixed-trigger upfront-ui" style="display:none;"><div class="upfront-region-edit-text">Click to edit or add<br /> Floating Region</div></div>'),
					$finish = $('<div class="upfront-region-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> Finish editing background</div>');
				Upfront.Events.trigger("entity:region_container:before_render", this, this.model);
				this.$el.html(template);
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
				var expand_lock = this.model.get_property_value_by_name('expand_lock'),
					type = this._get_region_type(),
					previous_type = this._get_previous_region_type();
				if ( type != 'clip' )
					this.update_background();
				else
					this.remove_background();
				this.$el.removeClass('upfront-region-container-' + previous_type);
				this.$el.addClass('upfront-region-container-' + type);
				if ( previous_type != type ){
					this.fix_height();
					this.update_overlay();
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
				this.refresh_background();
				setTimeout(function(){ me.fix_height(); }, 500);
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
				var col = this.max_col;
				_.each(this.sub_model, function (sub) {
					var sub_type = sub.get('sub');
					if ( !sub_type || sub_type == 'left' || sub_type == 'right' )
						col -= sub.get_property_value_by_name('col');
				});
				//if ( this.available_col != col ) {
					this.trigger("region_resize", col);
					this.available_col = col;
				//}
				this.fix_height();
				this.update_overlay();
			},
			on_region_changed: function () {
				this.fix_height();
			},
			fix_height: function () {
				var $regions = this.$el.find('.upfront-region').not('.upfront-region-side-fixed, .upfront-region-side-lightbox'),
					$container = $regions.find('.upfront-modules_container'),
					row = this.model.get_property_value_by_name('row'),
					is_full_screen = ( this._get_region_type() == 'full' ),
					min_height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					height = 0,
					exclude = [];
				$regions.add($container).css({
					minHeight: "",
					height: "",
					maxHeight: ""
				});
				if ( is_full_screen ){
					height = $(window).height();
					$regions.each(function(){
						if ( $(this).closest('.upfront-region-sub-container').length ){
							if ( min_height > 0 )
								$(this).css('min-height', min_height);
							height -= $(this).outerHeight();
							exclude.push(this);
						}
					});
					$regions.each(function(){
						if ( _.indexOf(exclude, this) === -1 ){
							$(this).add('.upfront-modules_container', this).css({
								minHeight: height,
								height: height,
								maxHeight: height
							});
						}
					});
				}
				else{
					$regions.each(function(){
						if ( min_height > 0 )
							$(this).css('min-height', min_height);
						var h = $(this).outerHeight();
						height = h > height ? h : height;
					});
					height = height > min_height ? height : min_height;
					$regions.add($container).css('min-height', height);
				}
				this.refresh_background();
			},
			update_pos: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					offset = this.$el.offset(),
					top = offset.top,
					bottom = top + this.$el.outerHeight(),
					scroll_top = $(document).scrollTop(),
					scroll_bottom = scroll_top + $(window).height(),
					rel_top = $main.offset().top,
					$trig = this.$el.find('> .upfront-region-edit-trigger'),
					trig_offset = $trig.offset();
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
				$(window).off('scroll', this, this.on_scroll);
				$(window).off('resize', this, this.on_window_resize);

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
				$(window).on('resize', this, this.on_window_resize);
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
			remove: function () {
				this.event = false;
				$(window).off('resize', this, this.on_window_resize);
				Backbone.View.prototype.remove.call(this);
			}
		}),

		Region = _Upfront_SingularEditor.extend({
			events: {
				//"mouseup": "on_mouse_up", // Bound on mouseup because "click" prevents bubbling (for module/object activation)
				"mouseover": "on_mouse_over",
				"click": "on_click",
				"click > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click"
			},
			attributes: function(){
				var grid = Upfront.Settings.LayoutEditor.Grid,
					container = this.model.get("container"),
					name = this.model.get("name"),
					classes = [],
					col, width;
				if ( ! this.col ){
					col = this.model.get_property_value_by_name('col');
					width = this.model.get_property_value_by_name('width');
					this.col = col || ( width ? Upfront.Util.width_to_col(width) : grid.size );
				}
				classes.push('upfront-region');
				classes.push('upfront-region-' + name.toLowerCase().replace(/ /, "-"));
				classes.push(grid.class + this.col);
				if ( this.model.get('type') == 'clip' )
					classes.push('upfront-region-clip');
				if ( ! this.model.is_main() ){
					var index = this.model.collection.indexOf(this.model),
						sub = this.model.get('sub'),
						next = this.model.collection.at(index+1),
						is_left = ( next && ( next.get('name') == container || next.get('container') == container) );
					classes.push('upfront-region-side');
					classes.push('upfront-region-side-' + ( sub ? sub : (is_left ? 'left' : 'right') ));
				}
				if ( this.model.collection && this.model.collection.active_region == this.model ){
					classes.push('upfront-region-active');
				}
				return {
					"class": classes.join(' ')
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
				// this.model.get("modules").bind("remove", this.on_module_update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.listenTo(this.model.get("modules"), 'change', this.on_module_update);
				this.listenTo(this.model.get("modules"), 'add', this.on_module_update);
				this.listenTo(this.model.get("modules"), 'remove', this.on_module_update);
				this.listenTo(Upfront.Events, 'layout:after_render', this.refresh_background);
				this.listenTo(Upfront.Events, "entity:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:region_container:resize_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag_stop", this.refresh_background);
				this.listenTo(Upfront.Events, "entity:drag:drop_change", this.refresh_background);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
				$(window).on('resize', this, this.on_window_resize);
			},
			on_click: function (e) {

			},
			on_mouse_up: function () {
				this.trigger("activate_region", this);
			},
			on_mouse_over: function () {
				var container = this.parent_view.get_container_view(this.model),
					$delete_trigger = this.$el.find('> .upfront-entity_meta > a.upfront-entity-delete_trigger');
				if ( container && container.$el.hasClass('upfront-region-container-active') )
					this.trigger("activate_region", this);
				if ( this.model.is_main() && this.model.has_side_region() )
					$delete_trigger.hide();
				else
					$delete_trigger.show();
			},
			_is_clipped: function () {
				var type = this.model.get('type'),
					sub = this.model.get('sub');
				return ( type == 'clip' || !type && this.model.get('clip') ) || ( !this.model.is_main() && ( !sub || (sub != 'top' && sub != 'bottom') ) );
			},
			render: function () {
				var container = this.model.get("container"),
					name = this.model.get("name"),
					template = _.template(_Upfront_Templates["region"], this.model.toJSON());
				Upfront.Events.trigger("entity:region:before_render", this, this.model);
				this.$el.html(template);
				this.$el.append('<div class="upfront-debug-info"/>');
				this.$el.data('name', name);
				this.$el.attr('data-title', this.model.get("title"));
				this.$el.data('type', this.model.get("type"));
				this.update();

				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this;
				local_view.render();
				this.$el.find('.upfront-modules_container').append(local_view.el);
				this.render_panels();
				this.render_bg_setting();
				//if ( this._is_clipped() )
				//	this.$el.append('<div class="upfront-region-active-overlay" />');
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
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: container_view.$el, width: 384});
				this.bg_setting.render();
				container_view.$el.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
			},
			update: function () {
				var container = this.model.get("container"),
					name = this.model.get("name"),
					col = this.model.get_property_value_by_name('col'),
					row = this.model.get_property_value_by_name('row'),
					height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					expand_lock = this.model.get_property_value_by_name('expand_lock');
				if ( col && col != this.col )
					this.region_resize(col);
				if ( height > 0 )
					this.$el.css('min-height', height + 'px');
				else
					this.$el.css('min-height', '');
				if ( expand_lock )
					this.$el.addClass('upfront-region-expand-lock');
				else
					this.$el.removeClass('upfront-region-expand-lock');
				if ( this._is_clipped() ){
					// This region is inside another region container
					this.update_background(); // Allow background applied
				}
				else {
					this.remove_background();
				}
				this.trigger("region_update", this);
			},
			region_resize: function (col) {
				var grid = Upfront.Settings.LayoutEditor.Grid;
				this.$el.removeClass(grid.class + this.col);
				this.col = col;
				this.$el.addClass(grid.class + this.col);
			},
			on_module_update: function () {
				this.trigger("region_changed", this);
			},
			remove: function() {
				if(this._modules_view)
					this._modules_view.remove();
				$(window).off('resize', this, this.on_window_resize);
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
				e.preventDefault();
				if ( confirm("Are you sure you want to delete this section?") ){
					// if ( this.model.get('container') ){
						// main = this.model.collection.get_by_name(this.model.get('container'));
						// main_view = Upfront.data.region_views[main.cid];
					// }
					this.model.collection.remove(this.model);
					// if ( main_view ){
						// Upfront.Events.trigger('command:region:edit_toggle', true);
						// main_view.trigger('activate_region', main_view);
					// }
				}
			},
			on_settings_click: function (e) {
				console.log('yes this was clicked');
				if(e)
					e.preventDefault();
				var me = this,
					container_view = this.parent_view.get_container_view(this.model);
				this.listenToOnce(Upfront.Events, "entity:region:deactivated", function(deac){
					if(e && !this.$el.is($(e.target).closest('div.upfront-region'))) {
						me.bg_setting.close(false);
					}
				});
				container_view.$el.addClass('upfront-region-bg-setting-open');
				this.bg_setting.open().always(function(){
					container_view.$el.removeClass('upfront-region-bg-setting-open');
				});
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
			},
			render: function () {
				this.constructor.__super__.render.call(this);
				var	$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small tooltip tooltip-left upfront-ui" data-tooltip="Change Background"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$edit_full = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-full upfront-ui"><div class="upfront-region-edit-text">Click to edit this<br /> Floating Region</div></div>'),
					$ok = $('<div class="upfront-region-finish-edit-fixed upfront-ui">Ok</div>'),
					$size = $('<div class="upfront-region-size-hint"></div>'),
					$position = $('<div class="upfront-region-position-hint"></div>');
				$size.appendTo(this.$el);
				$position.appendTo(this.$el);
				$edit.appendTo(this.$el);
				$edit_full.appendTo(this.$el);
				$ok.appendTo(this.$el);
				//this.render_edit_position();
			},
			render_bg_setting: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: $main, width: 384});
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
					width = this.model.get_property_value_by_name('width'),
					height = this.model.get_property_value_by_name('height'),
					top = this.model.get_property_value_by_name('top'),
					is_top = ( typeof top == 'number' ),
					left = this.model.get_property_value_by_name('left'),
					is_left = ( typeof left == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' ),
					right = this.model.get_property_value_by_name('right'),
					is_right = ( typeof right == 'number' )
					css = {
						width: width || 225,
						minHeight: height || 225
					};
				if ( !width )
					this.model.set_property('width', 225, true);
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
					css.left = ( is_left ? left : 30 ) + $main.offset().left;
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
				if ( this.$el.offset().top + this.$el.height() > $(window).height() - 35 )
					this.$el.find('.upfront-region-finish-edit-fixed').css('bottom', 0);
				else
					this.$el.find('.upfront-region-finish-edit-fixed').css('bottom', '');
				this.update_size_hint(css.width, css.minHeight);
				this.update_position_hint(css);
			},
			update_size_hint: function (width, height, $helper) {
				var hint = '<b>w:</b>' + width + 'px <b>h:</b>' + height + 'px';
				( $helper ? $helper : this.$el ).find('.upfront-region-size-hint').html(hint);
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
			on_change_breakpoint: function (breakpoint) {
				if ( !breakpoint.default )
					this.$el.hide();
				else
					this.$el.show();
			}
		}),

/*  Lightbox is extended from Region */
		RegionLightbox = Region.extend({
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

					var	$edit = $('<div class="upfront-region-edit-trigger upfront-region-edit-trigger-small tooltip tooltip-left upfront-ui" data-tooltip="Change Background"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$ok = $('<div class="upfront-region-finish-edit-lightbox upfront-ui">Finish Editing</div>');


				this.$el.prepend(this.$bg);
				this.$close.appendTo(this.$el);

				$edit.appendTo(this.$el);
				$ok.appendTo(this.$el);
			},
			render_bg_setting: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: $main, width: 384});
				this.bg_setting.render();
				$main.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
			},
			show:function () {
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
				var container_view = this.parent_view.get_container_view(this.model);
				container_view.trigger_edit_lightbox();
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
			on_change_breakpoint: function (breakpoint) {
					this.hide();
			}
		}),


		Regions = _Upfront_PluralEditor.extend({
			className: "upfront-regions",
			allow_edit: false,
			init: function () {
				this.stopListening(this.model, 'add', this.render);
				this.listenTo(this.model, 'add', this.on_add);
				this.stopListening(this.model, 'remove', this.render);
				this.listenTo(this.model, 'remove', this.on_remove);
				this.listenTo(this.model, 'reset', this.on_reset);
				this.listenTo(Upfront.Events, 'command:region:edit_toggle', this.on_edit_toggle);
				this.listenTo(Upfront.Events, 'command:region:fixed_edit_toggle', this.on_edit_toggle);
				this.listenTo(Upfront.Events, 'entity:region:resize_start', this.pause_edit);
				this.listenTo(Upfront.Events, 'entity:region:resize_stop', this.resume_edit);
				this.listenTo(Upfront.Events, "entity:region:deactivated", this.deactivate_region);
				this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.on_change_breakpoint);
			},
			render: function () {
				this.$el.html('');
				var me = this;
				if ( typeof this.container_views == 'undefined' )
					this.container_views = {};
				if ( typeof this.sub_container_views == 'undefined' )
					this.sub_container_views = {};
				if ( typeof Upfront.data.region_views == 'undefined' )
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
				if ( region.is_main() ) {
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
				var container_view = this.get_container_view(model);
				delete Upfront.data.region_views[model.cid];
				if ( view.region_panels ){
					view.region_panels.unbind();
					view.region_panels.remove();
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
				Upfront.Events.trigger("entity:region:removed", this, this.model);
			},
			on_change_breakpoint: function (breakpoint) {
				var ed = Upfront.Behaviors.GridEditor;
				ed.adapt_region_to_breakpoint(this.model, breakpoint.id, breakpoint.columns);
			},
			remove: function(){
				var me = this;
				this.model.each(function(model){
					me.on_remove(model);
				});
				Backbone.View.prototype.remove.call(this);
				this.container_views = false;
				this.model.reset([], {silent:true});
				this.model = false;
				this.options = false;
			}
		}),

		Wrapper = _Upfront_SingularEditor.extend({
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
			update: function () {
				this.$el.attr('class', this.attributes().class);
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
				$(window).on('resize', this, this.on_window_resize);
				this.render();
			},
			update: function () {
				this.update_background();
			},
			render: function () {
				this.$el.html(this.tpl(this.model.toJSON()));
				this.$layout = this.$(".upfront-layout");
				//if(!this.local_view)
					this.local_view = new Regions({"model": this.model.get("regions")});

				this.local_view.render();

				this.$layout.append(this.local_view.el);
				this.update();

				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: this.$el, width: 384});
				this.bg_setting.render();
				this.$el.append(this.bg_setting.el);

				this.fix_height();

				Upfront.Events.trigger("layout:after_render");
			},
			on_click: function (e) {
				//Check we are not selecting text
				var selection = document.getSelection ? document.getSelection() : document.selection;
				if(selection && selection.type == 'Range')
					return;

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
						Upfront.Events.trigger("entity:deactivated");
						Upfront.data.currentEntity = false;
					}
				}
				// Close region editing on click anywhere out the region
				if(!$(e.target).closest('.upfront-region-container-active').length || !$(e.target).closest('.upfront-inline-panels').length)
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
				}
				else {
					this.$layout.width(breakpoint.width);
					this.render_ruler(false);
					this.render_gutter(breakpoint.width);
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
					selector = '#page';
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
				$(window).off('resize', this, this.on_window_resize);

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

