(function ($) {

var _template_files = [
	"text!upfront/templates/object.html",
	"text!upfront/templates/module.html",
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

	/* ----- Core views ----- */

		_Upfront_SingularEditor = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
			initialize: function () {
				this.model.bind("change", this.render, this);
				if (this.init) this.init();
			},
			update_background: function () {
				var color = this.model.get_property_value_by_name('background_color'),
					image = this.model.get_property_value_by_name('background_image'),
					repeat = this.model.get_property_value_by_name('background_repeat'),
					position = this.model.get_property_value_by_name('background_position'),
					fill = this.model.get_property_value_by_name('background_fill');
				if ( color )
					this.$el.css('background-color', color);
				else
					this.$el.css('background-color', '');
				if ( image ){
					this.$el.css('background-image', "url(" + image + ")");
					if ( fill == 'fill' ){
						this.$el.css({
							backgroundSize: "100% 100%",
							backgroundRepeat: "no-repeat",
							backgroundPosition: "0 0"
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
						backgroundImage: "",
						backgroundSize: "",
						backgroundRepeat: "",
						backgroundPosition: ""
					});
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
				this.trigger("upfront:entity:deactivate", this);
			},
			activate: function () {
				if (this.activate_condition && !this.activate_condition()) return false;
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				this.$el.addClass("upfront-active_entity");
				this.trigger("upfront:entity:activate", this);
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
				}
				return false;
			}

		}),

		_Upfront_PluralEditor = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
			initialize: function () {
				this.model.bind("change", this.render, this);
				this.model.bind("add", this.render, this);
				this.model.bind("remove", this.render, this);

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
				var wrapper_id = view.model.get_wrapper_id();
				if ( wrapper_id ){
					var wrappers = Upfront.Application ? Upfront.Application.LayoutEditor.layout.get('wrappers') : false,
						wrapper = wrappers.get_by_wrapper_id(wrapper_id);
					if ( wrapper )
						wrappers.remove(wrapper);
				}
				view.remove();
				this.model.remove(view.model);
			}
		}),

		ObjectView = _Upfront_EditableContentEntity.extend({
			events: {
				"click .upfront-entity_meta a.upfront-entity-settings_trigger": "on_settings_click",
				"click .upfront-entity_meta a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
				"dblclick": "on_edit"
			},
			initialize: function () {
				this.model.get("properties").bind("change", this.render, this);
				this.model.get("properties").bind("add", this.render, this);
				this.model.get("properties").bind("remove", this.render, this);
			},
			render: function () {
				var props = {},
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					height = ( props.row ) ? props.row * Upfront.Settings.LayoutEditor.Grid.baseline : 0,
					content = (this.get_content_markup ? this.get_content_markup() : ''),
					model = _.extend(this.model.toJSON(), {"properties": props, "content": content, "height": height}),
					template = _.template(_Upfront_Templates["object"], model)
				;
				Upfront.Events.trigger("entity:object:before_render", this, this.model);
				this.$el.html(template);
				
				// render subview if it exists
				if(typeof this.subview != 'undefined'){
					this.subview.setElement(this.$('.upfront-object-content')).render();
				}

				this.init_ckeditor_on_focus();

				Upfront.Events.trigger("entity:object:after_render", this, this.model);
				//if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
				if ( this.on_render ) this.on_render();
			},

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
				this.model.each(function (obj) {
					var view_class_prop = obj.get("properties").where({"name": "view_class"}),
						view_class = view_class_prop.length ? view_class_prop[0].get("value") : "ObjectView",
						local_view = new Upfront.Views[view_class]({model: obj})
					;
					local_view.parent_view = me;
					local_view.parent_module_view = me.parent_view;
					local_view.render();
					$el.append(local_view.el);
					local_view.bind("upfront:entity:activate", me.on_activate, me);
					local_view.model.bind("remove", me.deactivate, me);
				});
			},
			on_activate: function (view) {
				this.model.active_entity = view.model;
				Upfront.Events.trigger("entity:activated", view, view.model);
			},
			deactivate: function (removed) {
				if (removed == this.model.active_entity) this.model.active_entity = false;
				Upfront.Events.trigger("entity:deactivated", removed);
			}
		}),

		Module = _Upfront_EditableEntity.extend({
			events: {
				"click .upfront-entity_meta a.upfront-entity-settings_trigger": "on_settings_click",
				"click .upfront-entity_meta a.upfront-entity-delete_trigger": "on_delete_click",
				"click .upfront-entity_meta": "on_meta_click",
				"click": "on_click",
			},
			initialize: function () {
				var callback = this.update || this.render;
				this.model.get("properties").bind("change", callback, this);
				this.model.get("properties").bind("add", callback, this);
				this.model.get("properties").bind("remove", callback, this);

				if (this.on_resize) {
					this.on("upfront:entity:resize", this.on_resize, this);
				}
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
					
				this.$el.html(template);
				
				if ( this.model.get("shadow") )
					this.$el.find('.upfront-editable_entity:first').attr("data-shadow", this.model.get("shadow"));
				
				var objects_view = new Objects({"model": this.model.get("objects")});
				objects_view.parent_view = this;
				objects_view.render();
				this.$(".upfront-objects_container").append(objects_view.el);

				if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
				Upfront.Events.trigger("entity:module:after_render", this, this.model);
			}
		}),

		Modules = _Upfront_EditableEntities.extend({
			"attributes": {
				"class": "upfront-editable_entities_container"
			},
			render: function () {
				this.$el.html('');
				var $el = this.$el,
					me = this,
					regions = Upfront.Application ? Upfront.Application.LayoutEditor.layout.get('regions') : false,
					wrappers, current_wrapper_id, current_wrapper_el
				;
				regions.each(function(region){
					if ( region.get('modules') == me.model )
						wrappers = region.get('wrappers');
				});
				//console.log(wrappers);
				this.model.each(function (module) {
					var view_class_prop = module.get("properties").where({"name": "view_class"}),
						view_class = view_class_prop.length ? view_class_prop[0].get("value") : "Module",
						//view_class = Upfront.Views[view_class] ? view_class : "Module",
						local_view = new Upfront.Views[view_class]({model: module}),
						wrapper_id = module.get_wrapper_id(),
						wrapper = wrapper_id ? wrappers.get_by_wrapper_id(wrapper_id) : false,
						wrapper_view, wrapper_el
					;
					if ( !wrapper ){
						local_view.render();
						$el.append(local_view.el);
					}
					else {
						if ( current_wrapper_id == wrapper_id ){
							wrapper_el = current_wrapper_el;
						}
						else {
							wrapper_view = new Upfront.Views.Wrapper({model: wrapper});
							wrapper_view.render();
							wrapper_el = wrapper_view.el;
						}
						current_wrapper_id = wrapper_id;
						current_wrapper_el = wrapper_el;
						local_view.render();
						$(wrapper_el).append(local_view.el);
						if ( wrapper_view )
							$el.append(wrapper_el);
					}
					local_view.bind("upfront:entity:activate", me.on_activate, me);
					local_view.model.bind("remove", me.deactivate, me);
				});
			},
			on_activate: function (view) {
				this.model.active_entity = view.model;
				Upfront.Events.trigger("entity:activated", view, view.model);
			},
			deactivate: function (removed) {
				if (removed == this.model.active_entity) this.model.active_entity = false;
				Upfront.Events.trigger("entity:deactivated", removed);
			}
		}),
		
		RegionContainer = _Upfront_SingularEditor.extend({
			attributes: function(){
				var name = this.model.get("container") || this.model.get("name");
				return {
					"class": 'upfront-region-container' + ( ' upfront-region-container-' + name.toLowerCase().replace(/ /, "-") )
				}
			},
			init: function () {
				var grid = Upfront.Settings.LayoutEditor.Grid;
				this.model.get("properties").bind("change", this.update, this);
				this.model.get("properties").bind("add", this.update, this);
				this.model.get("properties").bind("remove", this.update, this);
				this.sub_model = [];
				this.available_col = grid.size;
				Upfront.Events.on("layout:render", this.fix_height, this);
				Upfront.Events.on("entity:resize_stop", this.fix_height, this);
				Upfront.Events.on("entity:drag_stop", this.fix_height, this);
			},
			render: function () {
				this.$layout = $('<div class="upfront-grid-layout" />');
				this.$layout.appendTo(this.$el);
				this.update();
			},
			update: function () {
				this.update_background();
			},
			add_sub_model: function (model) {
				this.sub_model.push(model);
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
			},
			on_region_changed: function () {
				this.fix_height();
			},
			fix_height: function () {
				var $regions = this.$el.find('.upfront-region'),
					height = 0;
				$regions.each(function(){
					$(this).css('min-height', '');
					var h = $(this).outerHeight();
					height = h > height ? h : height;
				});
				$regions.css('min-height', height);
			}
		}),

		Region = _Upfront_SingularEditor.extend({
			events: {
				"mouseup": "on_click" // Bound on mouseup because "click" prevents bubbling (for module/object activation)
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
				return {
					"class": classes.join(' ')
				}
			},
			init: function () {
				this.dispatcher.on("plural:propagate_activation", this.on_click, this);
				this.model.get("properties").bind("change", this.update, this);
				this.model.get("properties").bind("add", this.update, this);
				this.model.get("properties").bind("remove", this.update, this);
				this.model.get("modules").bind("change", this.on_module_update, this);
			},
			on_click: function () {
				this.trigger("activate_region", this)
			},
			render: function () {
				Upfront.Events.trigger("entity:region:before_render", this, this.model);
				this.$el.html('<div class="upfront-debug-info"/>');
				this.$el.data('name', this.model.get("name"));
				this.$el.attr('data-title', this.model.get("title"));
				this.update();
				var local_view = new Modules({"model": this.model.get("modules")})
				local_view.render();
				this.$el.append(local_view.el);
				Upfront.Events.trigger("entity:region:after_render", this, this.model);
				this.trigger("region_render", this);
			},
			update: function () {
				var container = this.model.get("container"),
					name = this.model.get("name"),
					col = this.model.get_property_value_by_name('col'),
					is_locked = this.model.get_property_value_by_name('is_locked');
				if ( container && container != name ){
					// This region is inside another region container
					this.update_background(); // Allow background applied
				}
				if ( col != this.col )
					this.region_resize(col);
				if ( is_locked )
					this.$el.addClass('upfront-region-locked');
				else
					this.$el.removeClass('upfront-region-locked')
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
			render: function () {
				this.$el.html('');
				var me = this,
					$el = this.$el,
					container_views = []
				;
				this.model.each(function (region) {
					var container = region.get("container"),
						name = region.get("name");
					if ( !container || container == name ) {
						var container_view = new RegionContainer({"model": region});
						container_view.render();
						$el.append(container_view.el);
						container_views.push(container_view);
					}
				});
				this.model.each(function (region, index) {
					var local_view = new Region({"model": region}),
						container_view = _.find(container_views, function (container) {
							var name = container.model.get("container") || container.model.get("name");
							if ( region.get("container") == name || region.get("name") == name )
								return true;
						});
					local_view.bind("region_render", container_view.on_region_render, container_view);
					local_view.bind("region_update", container_view.on_region_update, container_view);
					local_view.bind("region_changed", container_view.on_region_changed, container_view);
					if ( !region.get("container") || region.get("container") == region.get("name") )
						container_view.bind("region_resize", local_view.region_resize, local_view);
					else
						container_view.add_sub_model(region);
					local_view.render();
					local_view.bind("activate_region", me.activate_region, me);
					container_view.$layout.append(local_view.el);
					if ( region.get("default") )
						local_view.trigger("activate_region", local_view);
				});
			},
			activate_region: function (region) {
				this.model.active_region = region.model || region;
				if ( region.$el ){
					$('.upfront-region-active').removeClass('upfront-region-active');
					region.$el.addClass('upfront-region-active');
					Upfront.Events.trigger("region:activated", region);
				}
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
				this.model.get("properties").bind("change", this.update, this);
			},
			update: function () {
				this.$el.attr('class', this.attributes().class);
			},
			render: function () {
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
			"FixedObjectInAnonymousModule": FixedObjectInAnonymousModule_Mixin
		}
	};
});

})(jQuery);