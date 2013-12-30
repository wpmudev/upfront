(function ($) {

var _template_files = [
	"text!upfront/templates/object.html",
	"text!upfront/templates/module.html",
	"text!upfront/templates/region_container.html",
	"text!upfront/templates/layout.html",
];

define(_template_files, function () {
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
			update_background: function () {
				var type = this.model.get_property_value_by_name('background_type'),
					color = this.model.get_property_value_by_name('background_color'),
					image = this.model.get_property_value_by_name('background_image'),
					ratio = this.model.get_property_value_by_name('background_image_ratio'),
					repeat = this.model.get_property_value_by_name('background_repeat'),
					position = this.model.get_property_value_by_name('background_position'),
					style = this.model.get_property_value_by_name('background_style'),
					width = this.$el.outerWidth(),
					height = this.$el.outerHeight(),
					$overlay = this.$el.find('.upfront-region-bg-overlay');
				if ( !type || type == 'color' || type == 'image' ){
					if ( color )
						this.$el.css('background-color', color);
					else
						this.$el.css('background-color', '');
					if ( type != 'color' && image ){
						this.$el.css('background-image', "url('" + image + "')");
						if ( style == 'full' ){
							if ( Math.round(height/width*100)/100 > ratio ){
								this.$el.css({
									backgroundSize: "auto 100%",
									backgroundRepeat: "no-repeat",
									backgroundPosition: "50% 50%"
								});
							}
							else {
								this.$el.css({
									backgroundSize: "100% auto",
									backgroundRepeat: "no-repeat",
									backgroundPosition: "50% 50%"
								});
							}
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
					var $type = this.$el.find('.upfront-region-bg-'+type);
					if ( ! $overlay.length ){
						$overlay = $('<div class="upfront-region-bg-overlay" />');
						this.$el.append($overlay);
					}
					else {
						$overlay.show();
					}
					if ( ! $type.length ) {
						$type = $('<div class="upfront-region-bg upfront-region-bg-' + type + '" />');
						$overlay.append($type);
					}
					else {
						$type.show();
					}
					$overlay.find('.upfront-region-bg').not($type).hide();
					if ( type == 'map' ){
						this.update_background_map($type, $overlay);
					}
					else if ( type == 'slider' ){
						this.update_background_slider($type, $overlay);
					}
					this.$el.css({
						backgroundColor: "",
						backgroundImage: "none",
						backgroundSize: "",
						backgroundRepeat: "",
						backgroundPosition: ""
					});
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
						scrollwheel: false
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
				else if ( ( !type || type == 'image' ) && image ) {
					var style = this.model.get_property_value_by_name('background_style'),
						ratio = this.model.get_property_value_by_name('background_image_ratio'),
						width = this.$el.outerWidth(),
						height = this.$el.outerHeight();	
					if ( style == 'full' ){
						if ( Math.round(height/width*100)/100 > ratio ){
							this.$el.css({
								backgroundSize: "auto 100%",
								backgroundRepeat: "no-repeat",
								backgroundPosition: "50% 50%"
							});
						}
						else {
							this.$el.css({
								backgroundSize: "100% auto",
								backgroundRepeat: "no-repeat",
								backgroundPosition: "50% 50%"
							});
						}
					}
				}
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
				return false;
			},
			deactivate: function () {
				this.$el.removeClass("upfront-active_entity");
				this.check_deactivated();
				this.trigger("upfront:entity:deactivate", this);
			},
			activate: function () {
				var currentEntity = Upfront.data.currentEntity;
				if (this.activate_condition && !this.activate_condition()) return false;
				if(currentEntity && currentEntity != this){
					Upfront.data.currentEntity.trigger('deactivated');
				}
				else {
					if(this instanceof ObjectView)
					    Upfront.data.currentEntity = this;
					this.trigger("activated", this);
				}
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				this.$el.addClass("upfront-active_entity");
				//return false;
			},
			// Stub handlers
			on_meta_click: function () {},
			on_delete_click: function () {
				this.$el.trigger("upfront:entity:remove", [this]);
				return false; // Stop propagation in order not to cause error with missing sortables etc
			},
			on_settings_click: function () {
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

		ObjectView = _Upfront_EditableContentEntity.extend({
			events: {
				"click .upfront-object > .upfront-entity_meta > a.upfront-entity-settings_trigger": "on_settings_click",
				"click .upfront-object > .upfront-entity_meta > a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-object > .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
				"dblclick": "on_edit",
			},
			initialize: function () {
				// this.model.get("properties").bind("change", this.render, this);
				// this.model.get("properties").bind("add", this.render, this);
				// this.model.get("properties").bind("remove", this.render, this);
				this.listenTo(this.model.get("properties"), 'change', this.render);
				this.listenTo(this.model.get("properties"), 'add', this.render);
				this.listenTo(this.model.get("properties"), 'remove', this.render);
				Upfront.Events.on('entity:resize_start', this.close_settings, this);
				Upfront.Events.on('entity:drag_start', this.close_settings, this);
				if (this.init) this.init();
			},
			close_settings: function () {
				Upfront.Events.trigger("entity:settings:deactivate");
			},
			render: function () {
				var props = {},
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					buttons = (this.get_buttons ? this.get_buttons() : ''),
					content = (this.get_content_markup ? this.get_content_markup() : ''),
					model = _.extend(this.model.toJSON(), {"properties": props, "buttons": buttons, "content": content, "height": height}),
					template = _.template(_Upfront_Templates["object"], model)
				;
				Upfront.Events.trigger("entity:object:before_render", this, this.model);
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
/*
			// Create a ckeditor instance when any contenteditable element receives focus for the first time.
			// Creating the ckeditor instance on focus prevents having to recreate ckeditor instances on each
			// render, which can happen 10-15 in a row when the user drags and drops modules.
			init_ckeditor_on_focus: function(){
				this.preload_ckeditor();
				this.remove_unused_editors();

				var self = this,
					contenteditables = this.$el.find('[contenteditable]');
				
				contenteditables.one('focus', function(){
					var $self = $(this); 
						editor = CKEDITOR.inline(this);
					
					editor.model_cid = self.model.cid;

					editor.on('change', function(){
						$self.trigger('editor-change');

						// Dynamically change the height of the module container when the user 
						// inserts height-changing content.
						$self.trigger('descendant_change.height');
					});

					editor.on('change', function(){
						$self.trigger('editor-change');
					});

					editor.on('selectionChange', function(event){
						// TODO: Hover editor over selected text node.
					});
					
					// TODO: when the upfront module is removed by the user: "editor.destroy();editor=null;"
				});

				// Disable drag and drop behaviour whilst user is editing text to allow text selection.
				contenteditables.on('mousedown', function(event){
					event.stopPropagation(); 
				});
			},

			// The first inline editor on page takes 2 seconds to load, 
			// any editors initialised afterwards are instant.
			preload_ckeditor: function(){
				if(typeof window.preload_ckeditor == 'undefined'){
					var focusEl = document.activeElement;
					
					var $el = $('<div contenteditable="true"></div>');

					var editor = CKEDITOR.inline($el[0]);
					$el.focus();

					$(focusEl).focus();
					window.preload_ckeditor = true;
				}
			},

			// When a view is re-rendered the contenteditable elements are recreated.
			// Destroy the ckeditor instances for the old views.
			remove_unused_editors: function(){
				var self = this;

				$.each(CKEDITOR.instances, function(k, editor){
					if(	editor.model_cid == self.model.cid &&
						!$.contains(self.$el.find('.upfront-object-content')[0], editor.element) ){

						editor.destroy();
						editor = null;
					}
				});
			}
*/
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
						local_view.parent_module_view = me.parent_view;
						local_view.render();
						$el.append(local_view.el);
						if ( ! Upfront.data.object_views[obj.cid] ){
							local_view.bind("upfront:entity:activate", me.on_activate, me);
							//local_view.model.bind("remove", me.deactivate, me);
							local_view.listenTo(local_view.model, "remove", me.deactivate);
							Upfront.data.object_views[obj.cid] = local_view;
						}
						else {
							local_view.delegateEvents();
						}
					}
				});
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

				if (this.on_resize) {
					this.on("upfront:entity:resize", this.on_resize, this);
				}
				
				this.on('on_layout', this.render_object, this);
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
			on_region_update: function(){
				if ( this._objects_view ){
					this._objects_view.model.each(function(view){
						view.trigger('region:updated');
					});
				}
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
				this.listenTo(this.model, 'remove', this.on_remove)
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
			render_module: function (module) {
				var $el = this.$el,
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
					local_view.region = this.region_view.model;
					if ( !wrapper ){
						local_view.render();
						$el.append(local_view.el);
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
							$el.append(wrapper_el);
							if ( ! Upfront.data.wrapper_views[wrapper.cid] )
								Upfront.data.wrapper_views[wrapper.cid] = wrapper_view;
						}
					}
					if ( ! Upfront.data.module_views[module.cid] ){
						local_view.bind("upfront:entity:activate", this.on_activate, this);
						//local_view.model.bind("remove", this.deactivate, this);
						local_view.listenTo(local_view.model, 'remove', this.deactivate);
						Upfront.data.module_views[module.cid] = local_view;
					}
					else {
						local_view.delegateEvents();
					}
				}
			},
			on_add: function (model) {
				this.current_wrapper_id = this.current_wrapper_el = null;
				this.render_module(model);
			},
			on_remove: function (model) {
				var view = Upfront.data.module_views[model.cid];
				if ( !view )
					return;
				delete Upfront.data.module_views[model.cid];
				view.unbind();
				view.remove();
			},
			on_reset: function () {
				
			}
		}),
		
		RegionContainer = _Upfront_SingularEditor.extend({
			events: {
				"click .upfront-region-edit-trigger": "trigger_edit",
				"click .upfront-region-finish-edit": "close_edit" ,
				"mouseover": "update_pos"
			},
			attributes: function(){
				var name = this.model.get("container") || this.model.get("name"),
					classes = [];
				classes.push('upfront-region-container');
				classes.push('upfront-region-container-' + name.toLowerCase().replace(/ /, "-"));
				classes.push('upfront-region-container-' + ( this.model.get('clip') ? 'clip' : 'full' ) );
				if ( this.model.collection.active_region == this.model ){
					classes.push('upfront-region-container-active');
				}
				return {
					"class": classes.join(' ')
				};
			},
			init: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid;
				// this.model.get("properties").bind("change", this.update, this);
				// this.model.get("properties").bind("add", this.update, this);
				// this.model.get("properties").bind("remove", this.update, this);
				this.listenTo(this.model.get("properties"), 'change', this.update);
				this.listenTo(this.model.get("properties"), 'add', this.update);
				this.listenTo(this.model.get("properties"), 'remove', this.update);
				this.sub_model = [];
				this.available_col = grid.size;
				Upfront.Events.on("entity:region:activated", this.update_pos, this);
				Upfront.Events.on("entity:region:activated", this.update_overlay, this);
				Upfront.Events.on("entity:region:deactivated", this.close_edit, this);
				$(window).on('scroll', this, this.on_scroll);
				Upfront.Events.on("layout:render", this.fix_height, this);
				Upfront.Events.on("entity:resize_stop", this.fix_height, this);
				Upfront.Events.on("entity:region:resize_stop", this.fix_height, this);
				Upfront.Events.on("entity:region_container:resize_stop", this.fix_height, this);
				Upfront.Events.on("entity:region_container:resize_stop", this.update_overlay, this);
				Upfront.Events.on("entity:drag_stop", this.fix_height, this);
				Upfront.Events.on("entity:drag:drop_change", this.refresh_background, this);
				Upfront.Events.on("entity:region:added", this.fix_height, this);
				Upfront.Events.on("entity:region:removed", this.fix_height, this);
				Upfront.Events.on("entity:region:removed", this.close_edit, this);
			},
			render: function () {
				var template = _.template(_Upfront_Templates["region_container"], this.model.toJSON()),
					$edit = $('<div class="upfront-region-edit-trigger tooltip tooltip-left upfront-ui" data-tooltip="Change Background"><i class="upfront-icon upfront-icon-region-edit"></i></div>'),
					$finish = $('<div class="upfront-region-finish-edit upfront-ui"><i class="upfront-field-icon upfront-field-icon-tick"></i> Finish editing background</div>');
				Upfront.Events.trigger("entity:region_container:before_render", this, this.model);
				this.$el.html(template);
				this.$layout = this.$el.find('.upfront-grid-layout');
				$edit.appendTo( this.model.get('clip') ? this.$layout : this.$el );
				$finish.appendTo( this.model.get('clip') ? this.$layout : this.$el ); 
				this.update();
				if ( !this.model.get('clip') )
					this.$el.append('<div class="upfront-region-active-overlay" />');
				Upfront.Events.trigger("entity:region_container:after_render", this, this.model);
			},
			update: function () {
				var expand_lock = this.model.get_property_value_by_name('expand_lock');
				if ( ! this.model.get('clip') )
					this.update_background();
			},
			trigger_edit: function (e) {
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
				$main.addClass('upfront-region-editing');
				this.update_overlay();
				Upfront.Events.trigger("command:region:edit_toggle", true);
				this.trigger("activate_region", this);
				Upfront.Events.on("command:newpage:start", this.close_edit, this);
				Upfront.Events.on("command:newpost:start", this.close_edit, this);
				e.stopPropagation();
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
				if ( this.available_col != col ) {
					this.trigger("region_resize", col);
					this.available_col = col;
				}
				this.fix_height();
			},
			on_region_changed: function () {
				this.fix_height();
			},
			fix_height: function () {
				var $regions = this.$el.find('.upfront-region'),
					row = this.model.get_property_value_by_name('row'),
					min_height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					height = 0;
				$regions.each(function(){
					$(this).css('min-height', min_height);
					var h = $(this).outerHeight();
					height = h > height ? h : height;
				});
				height = height > min_height ? height : min_height;
				$regions.css('min-height', height);
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
			}
		}),

		Region = _Upfront_SingularEditor.extend({
			events: {
				//"mouseup": "on_mouse_up", // Bound on mouseup because "click" prevents bubbling (for module/object activation)
				"mouseover": "on_mouse_over",
				"click": "on_click"
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
				if ( this.model.get('clip') )
					classes.push('upfront-region-clip');
				if ( this.model.collection.active_region == this.model ){
					classes.push('upfront-region-active');
				}
				return {
					"class": classes.join(' ')
				};
			},
			init: function () {
				var container = this.model.get("container"),
					name = this.model.get("name");
				this.dispatcher.on("plural:propagate_activation", this.on_mouse_up, this);
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
				if ( this.model.get('clip') || ! this.model.is_main() ){
					Upfront.Events.on("entity:resize_stop", this.refresh_background, this);
					Upfront.Events.on("entity:region:resize_stop", this.refresh_background, this);
					Upfront.Events.on("entity:region_container:resize_stop", this.refresh_background, this);
					Upfront.Events.on("entity:drag_stop", this.refresh_background, this);
					Upfront.Events.on("entity:drag:drop_change", this.refresh_background, this);
				}
			},
			on_click: function (e) {
				if ( this.$el.hasClass('upfront-region-active') )
					e.stopPropagation();
			},
			on_mouse_up: function () {
				this.trigger("activate_region", this);
			},
			on_mouse_over: function () {
				var container = this.parent_view.get_container_view(this.model);
				if ( container && container.$el.hasClass('upfront-region-container-active') )
					this.trigger("activate_region", this);
			},
			render: function () {
				var container = this.model.get("container"),
					name = this.model.get("name");
				Upfront.Events.trigger("entity:region:before_render", this, this.model);
				this.$el.html('<div class="upfront-debug-info"/>');
				this.$el.data('name', name);
				this.$el.attr('data-title', this.model.get("title"));
				this.$el.append('<div class="upfront-region-title">' + this.model.get("title") + '</div>');
				this.update();
				if ( ! this.model.is_main() ){
					var index = this.model.collection.indexOf(this.model),
						next = this.model.collection.at(index+1),
						is_left = next && ( next.get('name') == container || next.get('container') == container);
					this.$el.addClass('upfront-region-side ' + ( is_left ? 'upfront-region-side-left' : 'upfront-region-side-right' ));
				}
				var local_view = this._modules_view || new Modules({"model": this.model.get("modules")});
				local_view.region_view = this;
				local_view.render();
				this.$el.append(local_view.el);
				this.region_panels = new Upfront.Views.Editor.RegionPanels({model: this.model});
				this.region_panels.render();
				this.$el.append(this.region_panels.el);
				if ( this.model.get('clip') || ! this.model.is_main() )
					this.$el.append('<div class="upfront-region-active-overlay" />');
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
				if ( this.model.get('clip') || ! this.model.is_main() ){
					// This region is inside another region container
					this.update_background(); // Allow background applied
				}
				if ( col && col != this.col )
					this.region_resize(col);
				if ( height )
					this.$el.css('min-height', height + 'px');
				if ( expand_lock )
					this.$el.addClass('upfront-region-expand-lock');
				else
					this.$el.removeClass('upfront-region-expand-lock')
				this.trigger("region_update", this);
			},
			region_resize: function (col) {
				this.col = col;
				this.$el.attr('class', this.attributes().class);
			},
			on_module_update: function () {
				this.trigger("region_changed", this);
			}
		}),

		Regions = _Upfront_PluralEditor.extend({
			allow_edit: false,
			init: function () {
				this.stopListening(this.model, 'add', this.render);
				this.listenTo(this.model, 'add', this.on_add);
				this.stopListening(this.model, 'remove', this.render);
				this.listenTo(this.model, 'remove', this.on_remove)
				this.listenTo(this.model, 'reset', this.on_reset);
				Upfront.Events.on('command:region:edit_toggle', this.on_edit_toggle, this);
				Upfront.Events.on('entity:region:resize_start', this.pause_edit, this);
				Upfront.Events.on('entity:region:resize_stop', this.resume_edit, this);
				Upfront.Events.on("entity:region:deactivated", this.deactivate_region, this);
			},
			render: function () {
				this.$el.html('');
				var me = this;
				if ( typeof this.container_views == 'undefined' )
					this.container_views = {};
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
					container_view.bind("activate_region", this.activate_region_container, this);
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
				}
			},
			render_region: function (region, before) {
				var local_view = Upfront.data.region_views[region.cid] || new Region({"model": region}),
					container_view = this.get_container_view(region);
				if ( !Upfront.data.region_views[region.cid] ){
					local_view.parent_view = this;
					local_view.bind("region_render", container_view.on_region_render, container_view);
					local_view.bind("region_update", container_view.on_region_update, container_view);
					local_view.bind("region_changed", container_view.on_region_changed, container_view);
					if ( !region.get("container") || region.get("container") == region.get("name") )
						container_view.bind("region_resize", local_view.region_resize, local_view);
					else
						container_view.add_sub_model(region);
					local_view.render();
					local_view.bind("activate_region", this.activate_region, this);
					Upfront.data.region_views[region.cid] = local_view;
				}
				else {
					local_view.render();
					local_view.delegateEvents();
				}
				if ( before )
					container_view.$layout.prepend(local_view.el);
				else
					container_view.$layout.append(local_view.el);
				if ( region.get("default") )
					local_view.trigger("activate_region", local_view);
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
					index = typeof options.at != 'undefined' ? options.at : -1,
					is_before = options.is_before ? options.is_before : false;
				if ( ! container_view ){
					this.render_container(model, index);
					this.render_region(model);
				}
				else {
					this.render_region(model, is_before);
				}
				Upfront.Events.trigger("entity:region:added", this, this.model);
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

		Layout = _Upfront_PluralEditor.extend({
			events: {
				"click": "on_click"
			},
			initialize: function () {
				this.render();
			},
			render: function () {
				var template = _.template(_Upfront_Templates.layout, this.model.toJSON());
				this.$el.html(template);
				var local_view = new Regions({"model": this.model.get("regions")});
				local_view.render();
				this.$("section").append(local_view.el);
			},
			on_click: function () {
				// Deactivate settings on clicking anywhere in layout
				Upfront.Events.trigger("entity:settings:deactivate");
				// Deactivate element
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				if(Upfront.data.currentEntity){
					Upfront.data.currentEntity.trigger('deactivated');
					Upfront.data.currentEntity = false;
				}
				Upfront.Events.trigger("entity:deactivated");
				// Close region editing on click anywhere
				Upfront.Events.trigger("entity:region:deactivated");
			}
		})
	;

	return {
		"Views": {
			"ObjectView": ObjectView,
			"Module": Module,
			"Wrapper": Wrapper,
			"Layout": Layout
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