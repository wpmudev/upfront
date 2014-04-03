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
			initialize: function () {
				// this.model.bind("change", this.render, this);
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
				if ( !type || type == 'color' || type == 'image' ){
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
			}
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
				this.$el.find(".upfront-editable_entity").each(function () {
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
			}
		}),

		ContextMenuItem = Backbone.View.extend({
			tagName: 'li',
			initialize: function(){
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
			initialize: function () {
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
			initialize: function() {
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

		});

		ObjectView = _Upfront_EditableContentEntity.extend({
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
					props.class += ' ' + props.theme_style;

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
				if ( edit == 'write' && this.parent_module_view )
					this.parent_module_view.disable();
			},
			on_element_edit_stop: function (edit, post) {
				if (this.parent_module_view && this.parent_module_view.enable)
					this.parent_module_view.enable();
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
			events: {
				"click .upfront-module > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click .upfront-module > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
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

				this.on('on_layout', this.render_object, this);
				//this.on('entity:resize', this.on_resize, this);
				//this.on('entity:drop', this.on_drop, this);
				this.on('region:updated', this.on_region_update, this);
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
			disable: function () {
				this.$el.find('.upfront-editable_entity:first').addClass('upfront-module-disabled');
			},
			enable: function () {
				this.$el.find('.upfront-editable_entity:first').removeClass('upfront-module-disabled');
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
			remove: function(){
				if(this._objects_view)
					this._objects_view.remove();
				Backbone.View.prototype.remove.call(this);
			}
		}),

		Modules = _Upfront_EditableEntities.extend({
			"attributes": {
				"class": "upfront-editable_entities_container"
			},
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
				if ( typeof Upfront.data.module_views == 'undefined' )
					Upfront.data.module_views = {};
				if ( typeof Upfront.data.wrapper_views == 'undefined' )
					Upfront.data.wrapper_views = {};
				this.model.each(function (module) {
					me.render_module(module);
				});
			},
			render_module: function (module, options) {
				var $el = this.$el,
					index = options && typeof options.index != 'undefined' ? options.index-1 : -2,
					view_class_prop = module.get("properties").where({"name": "view_class"}),
					view_class = view_class_prop.length ? view_class_prop[0].get("value") : "Module",
					//view_class = Upfront.Views[view_class] ? view_class : "Module",
					local_view = Upfront.Views[view_class] ? Upfront.data.module_views[module.cid] || new Upfront.Views[view_class]({model: module}): false,
					wrappers = this.region_view.model.get('wrappers'),
					wrapper_id = module.get_wrapper_id(),
					wrapper = wrappers && wrapper_id ? wrappers.get_by_wrapper_id(wrapper_id) : false,
					wrapper_view, wrapper_el
				;
				if(local_view){
					local_view.region_view = this.region_view;
					local_view.region = this.region_view.model;
					if ( !wrapper ){
						local_view.render();
						if ( index === -2 )
							$el.append(local_view.el);
						else if ( index === -1 )
							$el.prepend(local_view.el);
						else
							$el.find('.upfront-module').eq(index).parent().after(local_view.el);
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
								$el.find('.upfront-module').eq(index).closest('.upfront-wrapper').after(wrapper_el);
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
				}
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
				"click .upfront-region-edit-trigger": "trigger_edit",
				"click .upfront-region-finish-edit": "close_edit" ,
				"contextmenu": "on_context_menu",
				"mouseover": "update_pos"
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


				var grid = Upfront.Settings.LayoutEditor.Grid;
				// this.model.get("properties").bind("change", this.update, this);
				// this.model.get("properties").bind("add", this.update, this);
				// this.model.get("properties").bind("remove", this.update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.sub_model = [];
				this.available_col = grid.size;
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

				this.listenTo(Upfront.Events, "entity:contextmenu:deactivate", this.remove_context_menu);
			},
			render: function () {
				var type = this._get_region_type(),
					template = _.template(_Upfront_Templates["region_container"], this.model.toJSON()),
					$edit = $('<div class="upfront-region-edit-trigger tooltip tooltip-left upfront-ui" data-tooltip="Change Background"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$finish = $('<div class="upfront-region-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> Finish editing background</div>');
				Upfront.Events.trigger("entity:region_container:before_render", this, this.model);
				this.$el.html(template);
				this.$layout = this.$el.find('.upfront-grid-layout');
				$edit.appendTo( /*type == 'clip' ? this.$layout :*/ this.$el);
				$finish.appendTo( /*type == 'clip' ? this.$layout :*/ this.$el );
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
				//e.stopPropagation();
			},
			close_edit: function () {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.removeClass('upfront-region-editing');
				this.$el.siblings('.upfront-region-editing-overlay').remove();
				Upfront.Events.trigger("command:region:edit_toggle", false);
				Upfront.Events.off("command:newpage:start", this.close_edit, this);
				Upfront.Events.off("command:newpost:start", this.close_edit, this);
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
				var grid = Upfront.Settings.LayoutEditor.Grid,
					col = grid.size;
				_.each(this.sub_model, function (sub) {
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
				var $regions = this.$el.find('.upfront-region'),
					row = this.model.get_property_value_by_name('row'),
					is_full_screen = ( this._get_region_type() == 'full' ),
					min_height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					height = 0,
					exclude = [];
				$regions.css({
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
						if ( _.indexOf(exclude, this) === -1 )
							$(this).css({
								minHeight: height,
								height: height,
								maxHeight: height
							});
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
					$regions.css('min-height', height);
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
					$trig = this.$el.find('.upfront-region-edit-trigger'),
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
			},
			_get_region_type: function () {
				return this.model.get('type') || ( this.model.get('clip') ? 'clip' : 'wide' );
			},
			render: function () {
				var template = _.template(_Upfront_Templates["region_container"], this.model.toJSON());
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
				Backbone.View.prototype.remove.call(this);
			}
		});
		
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
					name = this.model.get("name"),
					classes = [];
				if ( ! this.col )
					this.col = this.model.get_property_value_by_name('col') || grid.size;
				classes.push('upfront-region');
				classes.push('upfront-region-' + name.toLowerCase().replace(/ /, "-"));
				classes.push(grid.class + this.col);
				if ( this.model.get('type') == 'clip' )
					classes.push('upfront-region-clip');
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
				this.update();
				if ( ! this.model.is_main() ){
					var index = this.model.collection.indexOf(this.model),
						sub = this.model.get('sub'),
						next = this.model.collection.at(index+1),
						is_left = ( next && ( next.get('name') == container || next.get('container') == container) );
					this.$el.addClass('upfront-region-side ' + ( 'upfront-region-side-' + ( sub ? sub : (is_left ? 'left' : 'right') ) ));
				}

				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this;
				local_view.render();
				this.$el.find('.upfront-modules_container').append(local_view.el);
				this.region_panels = new Upfront.Views.Editor.RegionPanels({model: this.model});
				this.region_panels.render();
				this.$el.append(this.region_panels.el);
				var container_view = this.parent_view.get_container_view(this.model);
				this.bg_setting = new Upfront.Views.Editor.ModalBgSetting({model: this.model, to: container_view.$el, width: 384});
				this.bg_setting.render();
				container_view.$el.append(this.bg_setting.el);
				this.listenTo(this.bg_setting, "modal:open", this.on_modal_open);
				this.listenTo(this.bg_setting, "modal:close", this.on_modal_close);
				//if ( this._is_clipped() )
				//	this.$el.append('<div class="upfront-region-active-overlay" />');
				Upfront.Events.trigger("entity:region:after_render", this, this.model);
				this.trigger("region_render", this);
				if ( ! this._modules_view )
					this._modules_view = local_view;
				else
					this._modules_view.delegateEvents();
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
				this.col = col;
				this.$el.attr('class', this.attributes().class);
			},
			on_module_update: function () {
				this.trigger("region_changed", this);
			},
			remove: function() {
				if(this._modules_view)
					this._modules_view.remove();
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
				e.preventDefault();
				var me = this,
					container_view = this.parent_view.get_container_view(this.model);
				this.listenToOnce(Upfront.Events, "entity:region:deactivated", function(){
					 me.bg_setting.close(false);
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
			}
		}),

		Regions = _Upfront_PluralEditor.extend({
			allow_edit: false,
			init: function () {
				this.stopListening(this.model, 'add', this.render);
				this.listenTo(this.model, 'add', this.on_add);
				this.stopListening(this.model, 'remove', this.render);
				this.listenTo(this.model, 'remove', this.on_remove);
				this.listenTo(this.model, 'reset', this.on_reset);
				this.listenTo(Upfront.Events, 'command:region:edit_toggle', this.on_edit_toggle);
				this.listenTo(Upfront.Events, 'entity:region:resize_start', this.pause_edit);
				this.listenTo(Upfront.Events, 'entity:region:resize_stop', this.resume_edit);
				this.listenTo(Upfront.Events, "entity:region:deactivated", this.deactivate_region);
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
					var container_view = this.container_views[region.cid] || new RegionContainer({"model": region});
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
				var local_view = Upfront.data.region_views[region.cid] || new Region({"model": region}),
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
				var new_active_region = region.model || region,
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
				view.region_panels.unbind();
				view.region_panels.remove();
				view.unbind();
				view.remove();
				if ( container_view){
					if ( container_view.sub_model.length == 0 ){
						delete this.container_views[container_view.model.cid];
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
			},
			update: function () {
				this.$el.attr('class', this.attributes().class);
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
			initialize: function () {
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.render();
			},
			update: function () {
				this.update_background();
			},
			render: function () {
				this.$el.html(this.tpl(this.model.toJSON()));
				//if(!this.local_view)
					this.local_view = new Regions({"model": this.model.get("regions")});

				this.local_view.render();

				this.$("section").append(this.local_view.el);
				this.update();
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
				if(!$(e.target).closest('.upfront-region-container-active').length || !$(e.target).closest('.upfront-inline-panels'))
					Upfront.Events.trigger("entity:region:deactivated");
			},
			remove: function(){
				if(this.local_view)
					this.local_view.remove();
				this.local_view = null;

				Backbone.View.prototype.remove.call(this);
				this.model = false;
				this.options = false;
			}
		})
	;

	return {
		"Views": {
			"ObjectView": ObjectView,
			"Module": Module,
			"Wrapper": Wrapper,
			"Layout": Layout,
			"ContextMenu": ContextMenu,
			"ContextMenuList": ContextMenuList,
			"ContextMenuItem": ContextMenuItem,
		},
		"Mixins": {
			"FixedObject": FixedObject_Mixin,
			"FixedObjectInAnonymousModule": FixedObjectInAnonymousModule_Mixin,
			Anchorable: Anchorable_Mixin,
		}
	};
});

})(jQuery);

