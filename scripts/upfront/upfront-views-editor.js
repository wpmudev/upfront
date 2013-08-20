(function ($) {

var _template_files = [
	"text!upfront/templates/property.html",
	"text!upfront/templates/properties.html",
	"text!upfront/templates/property_edit.html",
	"text!upfront/templates/overlay_grid.html",
	"text!upfront/templates/sidebar_settings_edit_area.html",
	"text!upfront/templates/sidebar_settings_lock_area.html",
	"text!upfront/templates/sidebar_settings_background.html",
	"text!upfront/templates/popup.html"
];

define(_template_files, function () {
	// Auto-assign the template contents to internal variable
	var _template_args = arguments,
		_Upfront_Templates = {}
	;
	_(_template_files).each(function (file, idx) {
		if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
	});


			console.log('refresh');
		
	var Upfront_Scroll_Mixin = {
		stop_scroll_propagation: function ($el) {
			$el.on('DOMMouseScroll mousewheel', function(ev) {
			var $this = $(this),
				scrollTop = this.scrollTop,
				scrollHeight = this.scrollHeight,
				height = $this.height(),
				delta = ev.originalEvent.wheelDelta,
				up = delta > 0;
		
			var prevent = function() {
				ev.stopPropagation();
				ev.preventDefault();
				ev.returnValue = false;
				return false;
			}
			
			if (!up && -delta > scrollHeight - height - scrollTop) {
				// Scrolling down, but this will take us past the bottom.
				$this.scrollTop(scrollHeight);
				return prevent();
			} else if (up && delta > scrollTop) {
				// Scrolling up, but this will take us past the top.
				$this.scrollTop(0);
		 		return prevent();
			}
		});
		}
	};

	// Stubbing interface control

	var Property = Backbone.View.extend({
		events: {
			"click .upfront-property-change": "show_edit_property_partial",
			"click .upfront-property-save": "save_property",
			"click .upfront-property-remove": "remove_property",
		},
		render: function () {
			var template = _.template(_Upfront_Templates.property, this.model.toJSON());
			this.$el.html(template);
		},

		remove_property: function () {
			this.model.destroy();
		},
		save_property: function () {
			var name = this.$("#upfront-new_property-name").val(),
				value = this.$("#upfront-new_property-value").val()
			;
			this.model.set({
				"name": name,
				"value": value
			});
			this.render();
		},
		show_edit_property_partial: function () {
			var template = _.template(_Upfront_Templates.property_edit, this.model.toJSON());
			this.$el.html(template);
		}
	});

	var Properties = Backbone.View.extend({
		events: {
			"click #add-property": "show_new_property_partial",
			"click #done-adding-property": "add_new_property",
		},
		initialize: function () {
			this.model.get("properties").bind("change", this.render, this);
			this.model.get("properties").bind("add", this.render, this);
			this.model.get("properties").bind("remove", this.render, this);
		},
		render: function () {
			var template = _.template(_Upfront_Templates.properties, this.model.toJSON()),
				properties = this
			;
			this.$el.html(template);
			this.model.get("properties").each(function (obj) {
				var local_view = new Property({"model": obj});
				local_view.render();
				properties.$el.find("dl").append(local_view.el)
			});
		},

		show_new_property_partial: function () {
			this.$("#add-property").hide();
			this.$("#upfront-new_property").slideDown();
		},
		add_new_property: function () {
			var name = this.$("#upfront-new_property-name").val(),
				value = this.$("#upfront-new_property-value").val()
			;
			this.model.get("properties").add(new Upfront.Models.Property({
				"name": name,
				"value": value
			}));
			this.$("#upfront-new_property")
				.slideUp()
				.find("input").val('').end()
			;	
			this.$("#add-property").show();
		}
	});

	var Command = Backbone.View.extend({
		"tagName": "li",
		"events": {
			"click": "on_click"
		},
		on_click: function () { this.render(); },
		add_module: function (module) {
			var region = this.model.get("regions").active_region;
			if (!region) return Upfront.Util.log("select a region");
			Upfront.Events.trigger("entity:module:before_added", module, region);
			var wrappers = this.model.get('wrappers'),
				wrapper_id = Upfront.Util.get_unique_id("wrapper"),
				wrapper = new Upfront.Models.Wrapper({
					"name": "",
					"properties": [
						{"name": "wrapper_id", "value": wrapper_id},
						{"name": "class", "value": "c22 clr"}
					]
				});
			module.set_property('wrapper_id', wrapper_id);
			wrappers.add(wrapper);
			region.get("modules").add(module);
			Upfront.Events.trigger("entity:module:added", module, region);
		}
	});

	
	var Command_NewPost = Command.extend({
		"className": "command-new-post",
		postView: false,
		postType: 'post',
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-post');
			this.$el.html("New post");
		},
		on_click: function () {
			//window.location = Upfront.Settings.Content.create.post;
			var me = this;

			if(Upfront.Settings.LayoutEditor.newpostType == this.postType)
				return Upfront.Views.Editor.notify('You are already creating a new ' + this.postType + '.', 'warning');

			//Set a new post as current
			_upfront_post_data.post_id = 0;
			Upfront.Settings.LayoutEditor.newpostType = this.postType;

			//Destroy any previous ckeditor instances
			if (CKEDITOR.instances['upfront-body']) CKEDITOR.instances['upfront-body'].destroy();

			$(".upfront-layout").append('<div id="upfront-loading">Loading...</div>');
			this.postView = false;



			Upfront.Application.LayoutEditor.load_layout({item: 'single-' + this.postType, type: 'single', specificity: 'single-' + this.postType + '-1000000'})
				.done(function(response){
					var bodyClasses = 'logged-in admin-bar upfront customize-support flex-support';
					if(me.postType == 'page')
						bodyClasses += ' page page-id-1000000 page-template-default';
					else
						bodyClasses += ' single single-' + me.postType + ' postid-1000000';

					$('body')
						.removeClass()
						.addClass(bodyClasses)
					;

					Upfront.Events.on("elements:this_post:loaded", me.on_post_loaded, me);
				})
			;
			/*
			//Try to get the element from the layout
			.done(function(response){
				var layout = new Upfront.Models.Layout(response),
					region = layout.get('regions').get_by_name('main'),
					modules = region.get('modules')
				;

				modules.each(function(module){
					module.get('objects').each(function(element){
						if(element.get_property_value_by_name('type') == 'ThisPostModel'){
							var id = element.id
						}
					});
				});

			});*/
		},
		on_post_loaded: function(view) {
			if(!this.postView){
				this.postView = view;
				view.editPost(view.post);

				Upfront.data.currentEntity = view;

				Upfront.Events.off("elements:this_post:loaded", this.on_post_loaded, this);

				Upfront.Events.on("upfront:application:contenteditor:render", this.select_title, this);
			}
		},
		select_title: function(){
			var input = this.postView.$('.post_title input').focus();

			input.val(input.val()); //Deselect the text
			$('#upfront-loading').remove();

			Upfront.Events.off("upfront:application:contenteditor:render", this.select_title, this);
		}
	});
	var Command_NewPage = Command_NewPost.extend({
		"className": "command-new-page",
		postType: 'page',
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-page');
			this.$el.html("New page");
		}
	});

	var Command_SaveLayout = Command.extend({
		"className": "command-save",
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-save');
			this.$el.html("Save");
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:save");
		}

	});
	var Command_SaveLayoutAs = Command.extend({
		render: function () {
			this.$el.html("Save As...");
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:save_as");
		}

	});

	var Command_LoadLayout = Command.extend({
		render: function () {
			this.$el.html("Alternate layout");
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:load", 2)
		}

	});

	var Command_Undo = Command.extend({
		"className": "command-undo",
		initialize: function () {
			Upfront.Events.on("entity:activated", this.activate, this);
			Upfront.Events.on("entity:deactivated", this.deactivate, this);
			Upfront.Events.on("command:redo", this.render, this);
			this.deactivate();
		},
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-undo');
			this.$el.html("Undo");
			if (this.model.has_undo_states()) this.activate();
			else this.deactivate();
		},
		activate: function () {
			this.$el.css("text-decoration", "none");
		},
		deactivate: function () {
			this.$el.css("text-decoration", "line-through");
		},
		on_click: function () {
			this.model.restore_undo_state();
			Upfront.Events.trigger("command:undo")
			this.render();
		}
	});

	var Command_Redo = Command.extend({
		"className": "command-redo",
		initialize: function () {
			Upfront.Events.on("entity:activated", this.activate, this);
			Upfront.Events.on("entity:deactivated", this.deactivate, this);
			Upfront.Events.on("command:undo", this.render, this);
			this.deactivate();
		},
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-redo');
			this.$el.html("Redo");
			if (this.model.has_redo_states()) this.activate();
			else this.deactivate();
		},
		activate: function () {
			this.$el.css("text-decoration", "none");
		},
		deactivate: function () {
			this.$el.css("text-decoration", "line-through");
		},
		on_click: function () {
			this.model.restore_redo_state();
			Upfront.Events.trigger("command:redo")
			this.render();
		}
	});

	var Command_ExportHistory = Command.extend({
		render: function () {
			this.$el.html("Export history");
		},
		on_click: function () {
			alert("Check console output");
			console.log({
				"undo": Upfront.Util.Transient.get_all("undo"),
				"redo": Upfront.Util.Transient.get_all("redo")
			});
		}
	});

	var Command_Merge = Command.extend({
		render: function () {
			if (!this.model.merge.length) return false;
			this.$el.html("Merge selected");
		},
		on_click: function () {
			var merge_models = this.model.merge,
				region = this.model.get("regions").active_region,
				collection = region.get("modules"),
				objects = []
			;
			_(merge_models).each(function (module) {
				module.get("objects").each(function (obj) {
					objects.push(obj);
				});
				collection.remove(module);
			});
			var module_id = Upfront.Util.get_unique_id("module"),
				module = new Upfront.Models.Module({
				"name": "Merged module",
				"properties": [
					{"name": "element_id", "value": module_id},
					{"name": "class", "value": "c22"}
				],
				"objects": objects
			});
			this.add_module(module);
			$("#" + module_id).trigger("click"); // Reset selectable and activate the module
			this.remove();
			this.trigger("upfront:command:remove", this);
			Upfront.Events.trigger("command:merge");
		}
	});

	var Command_Delete = Command.extend({
		initialize: function () {
			Upfront.Events.on("entity:activated", this.activate, this);
			Upfront.Events.on("entity:deactivated", this.deactivate, this);
			this.deactivate();
		},
		render: function () {
			this.$el.html("Delete");
		},

		on_click: function () {
			var region = this.model.get("regions").active_region,
				modules = region.get("modules"),
				active_module = modules.active_entity
			;
			if (active_module) return this.delete_module(region, active_module);

			modules.each(function (module) {
				var objects = module.get("objects"),
					active_object = objects.active_entity
				;
				if (active_object) objects.remove(active_object);
			});
		},

		activate: function () {
			this.$el.css("text-decoration", "none");
		},
		deactivate: function () {
			this.$el.css("text-decoration", "line-through");
		},

		delete_module: function (region, module) {
			var modules = region.get("modules");
			modules.remove(module);
		}
	});

	var Command_Select = Command.extend({
		initialize: function () {
			Upfront.Events.on("command:merge", this.on_click, this);
		},
		render: function () {
			this.$el.html("Select mode " + (this._selecting ? 'on' : 'off'));
		},
		on_click: function () {
			if (!this._selecting) Upfront.Events.trigger("command:select");
			else Upfront.Events.trigger("command:deselect");
			this._selecting = !this._selecting;
			this.render();
		}
	})

	var Command_ToggleGrid = Command.extend({
		defaults: {
			_active: false
		},
		initialize: function () {
			this._active = false;
		},
		render: function () {
			this.$el.html('Toggle grid');
		},
		on_click: function () {
			$('.upfront-overlay-grid').size() || this.create_grid();
			this.toggle_grid();
		},
		create_grid: function () {
			this.update_grid();
			this.attach_event();
		},
		toggle_grid: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			if (!this._active){
				$main.addClass('show-debug');
				$('.upfront-overlay-grid').show();
				this._active = true;
			}
			else {
				$main.removeClass('show-debug');
				$('.upfront-overlay-grid').hide();
				this._active = false;
			}
		},
		update_grid: function (size) {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				columns = Upfront.Settings.LayoutEditor.Grid.size,
				size_class = Upfront.Settings.LayoutEditor.Grid.class,
				template = _.template(_Upfront_Templates.overlay_grid, {columns: columns, size_class: size_class});
			$('.upfront-overlay-grid').remove();
			$('.upfront-grid-layout').prepend(template);
			!this._active || $('.upfront-overlay-grid').show();
		},
		attach_event: function () {
			var me = this;
			Upfront.Application.LayoutEditor.layout_sizes.sizes.each(function (layout_size) {
				layout_size.bind("upfront:layout_size:change_size", me.update_grid, me);
			});
		}
	});

	var Command_ResetEverything = Command.extend({
		render: function () {
			this.$el.html("<span title='destroy the layout and clear everything up'>Reset everything</span>");
		},
		on_click: function () {
			var data = Upfront.Util.model_to_json(this.model);
			Upfront.Util.post({"action": "upfront_reset_layout", "data": data})
				.success(function () {
					Upfront.Util.log("layout reset");
					window.location.reload();
				})
				.error(function () {
					Upfront.Util.log("error resetting layout");
				})
			;
		}
	});

	var Commands = Backbone.View.extend({
		"tagName": "ul",

		initialize: function () {
			this.commands = _([
				new Command_NewPage({"model": this.model}),
				new Command_NewPost({"model": this.model}),
				new Command_SaveLayout({"model": this.model}),
				new Command_SaveLayoutAs({"model": this.model}),
				//new Command_LoadLayout({"model": this.model}),
				new Command_Undo({"model": this.model}),
				new Command_Redo({"model": this.model}),
				new Command_Delete({"model": this.model}),
				new Command_Select({"model": this.model}),
				new Command_ToggleGrid({"model": this.model}),
				new Command_ResetEverything({"model": this.model}),
			]);
			if (Upfront.Settings.Debug.transients) this.commands.push(new Command_ExportHistory({model: this.model}));
		},
		render: function () {
			this.$el.find("li").remove();
			this.commands.each(this.add_command, this);
		},

		add_command: function (command) {
			command.remove();
			command.render();
			this.$el.append(command.el);
			command.bind("upfront:command:remove", this.remove_command, this);
			command.delegateEvents();
		},

		remove_command: function (to_remove) {
			var coms = this.commands.reject(function (com) {
					com.remove();
					return com.cid == to_remove.cid;
				})
			;
			this.commands = _(coms);
			this.render();
		}
	});
	
	var SidebarPanel = Backbone.View.extend(_.extend({}, Upfront_Scroll_Mixin, {
		"tagName": "li",
		"className": "sidebar-panel",
		events: {
			"click .sidebar-panel-title": "on_click"
		},
		get_title: function () {},
		render: function () {
			this.$el.html('<h3 class="sidebar-panel-title">' + this.get_title() + '</h3>');
			this.$el.append('<div class="sidebar-panel-content" />');
			this.stop_scroll_propagation(this.$el.find('.sidebar-panel-content'));
			if ( this.on_render ) this.on_render();
		},
		on_click: function () {
			$('.sidebar-panel').not(this.$el).removeClass('expanded');
			this.$el.addClass('expanded');
		}
	}));
	
	var SidebarPanel_Posts = SidebarPanel.extend({
		className: "sidebar-panel upfront-panel-post_panel",
		initialize: function () {

		},
		get_title: function () {
			return "Pages / Posts";
		},
		on_render: function () {
			var me = this;
			this.$el.find('.sidebar-panel-title').addClass('upfront-icon upfront-icon-panel-post');
			if (this.commands) this.commands.each(function (command) {
				command.render();
				me.$el.find('.sidebar-panel-content').append(command.$el);
			});
		},
		show: function() {
			this.$el.show();
		},
		hide: function() {
			this.$el.hide();
		}
	});
	
	var DraggableElement = Backbone.View.extend({
		"tagName": "span",
		"className": "draggable-element",
		"shadow_id": '',
		"draggable": true,
		"priority": 10000,
		
		add_module: function (module) {
			// Add module to shadow region so it's available to add by dragging
			var region = this.model.get("regions").get_by_name('shadow');
			this.shadow_id = Upfront.Util.get_unique_id("shadow");
			module.set("shadow", this.shadow_id);
			region.get("modules").add(module);
		}
	});
	
	var SidebarPanel_DraggableElements = SidebarPanel.extend({		
		"className": "sidebar-panel sidebar-panel-elements",
		initialize: function () {
			this.elements = _([]);
			Upfront.Events.on("command:layout:save", this.on_save, this);
			Upfront.Events.on("command:layout:save_success", this.reset_modules, this);
			Upfront.Events.on("command:layout:save_error", this.reset_modules, this);
			Upfront.Events.on("entity:drag_stop", this.reset_modules, this);
			Upfront.Events.on("layout:render", this.apply_state_binding, this);
		},
		get_title: function () {
			return "Draggable Elements";
		},
		on_save: function () {
			var regions = this.model.get('regions');
			regions.remove(regions.get_by_name('shadow'), {silent: true});
		},
		apply_state_binding: function () {
			Upfront.Events.on("command:undo", this.reset_modules, this);
			Upfront.Events.on("command:redo", this.reset_modules, this);
		},
		on_render: function () {
			this.$el.addClass('expanded');
			this.$el.find('.sidebar-panel-title').addClass('upfront-icon upfront-icon-panel-elements');
			this.elements.each(this.render_element, this);
			this.reset_modules();
		},
		reset_modules: function () {
			var region = this.model.get("regions").get_by_name('shadow');
			if ( ! region ){
				region = new Upfront.Models.Region({
					"name": "shadow",
					"container": "shadow",
					"title": "Shadow Region"
				});
				this.model.get('regions').add( region );
			}
			if ( region.get("modules").length != this.elements.size() ) {
				var modules = region.get("modules");
				this.elements.each(function (element) {
					var found = false;
					modules.forEach(function(module){
						if ( module.get('shadow') == element.shadow_id )
							found = true;
					});
					if ( ! found ){
						element.add_element();
					}
				}, this);
			}
		},
		render_element: function (element) {
			if(! element.draggable)
				return;

			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				me = this;
			element.remove();
			element.render();
			this.$el.find('.sidebar-panel-content').append(element.el);
			element.$el.on('mousedown', function (e) {
				// Trigger shadow element drag
				var $shadow = $('[data-shadow='+element.shadow_id+']'),
					pos = $shadow.position(),
					off = $shadow.offset(),
					target_off = element.$el.offset(),
					h = $shadow.outerHeight(),
					w = $shadow.outerWidth(),
					$clone = element.$el.clone(),
					clone_h = element.$el.outerHeight(),
					clone_w = element.$el.outerWidth();
				$shadow.css({
					position: "absolute",
					top: e.pageY-(off.top-pos.top)-(clone_h/2),
					left: e.pageX-(off.left-pos.left)-(clone_w/2),
					visibility: "hidden",
					zIndex: -1
				})
				.trigger(e)
				.on('dragstart', function (e, ui) {
					element.$el.addClass('element-drag-active');
					$clone.appendTo('body');
					$clone.addClass('element-dragging');
					$clone.css({
						position: "absolute",
						top: e.pageY-(clone_h/2),
						left: e.pageX-(clone_w/2),
						zIndex: 999
					});
				})
				.on('drag', function (e, ui) {
					$clone.css({
						top: e.pageY-(clone_h/2),
						left: e.pageX-(clone_w/2)
					});
				})
				.on('dragstop', function (e, ui) {
					element.$el.removeClass('element-drag-active');
					$clone.remove();
				});
			});
		}
	});
	
	var SidebarPanel_Settings_Item = Backbone.View.extend({
		"tagName": "div",
		"className": "panel-setting",
		render: function () {
			if ( this.on_render ) this.on_render();
		}
	});
	
	var SidebarPanel_Settings_Item_EditArea = SidebarPanel_Settings_Item.extend({
		events: {
			"click .switch": "on_switch"
		},
		initialize: function () {
			Upfront.Events.on("region:activated", this.on_region_activate, this);
		},
		on_render: function () {
			var template = _.template(_Upfront_Templates.sidebar_settings_edit_area, {})
			this.$el.html(template);
		},
		on_region_activate: function (region) {
			var name = region.model.get('title');
			this.$el.find('.panel-setting-dialog').text(name);
		},
		on_switch: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			if ( this.$el.find('.switch-on').hasClass('active') ){ // Switch off
				this.$el.find('.switch-off').addClass('active');
				this.$el.find('.switch-on').removeClass('active');
				$main.removeClass('upfront-region-editing');
				Upfront.Events.trigger("command:region:edit_toggle", false);
			}
			else { // Switch on
				this.$el.find('.switch-off').removeClass('active');
				this.$el.find('.switch-on').addClass('active');
				$main.addClass('upfront-region-editing');
				Upfront.Events.trigger("command:region:edit_toggle", true);
			}
		}
	});
	
	var SidebarPanel_Settings_Item_Background = SidebarPanel_Settings_Item.extend({
		events: {
			'click .background-image-delete': 'delete_image',
			'click .position-select': 'update_position',
			'click .tile-select': 'update_tile'
		},
		initialize: function () {
			Upfront.Events.on("region:activated", this.on_region_activate, this);
			Upfront.Events.on("uploader:image:selected", this.on_image_selected, this);
		},
		on_render: function () {
			var template = _.template(_Upfront_Templates.sidebar_settings_background, {}),
				post_id = _upfront_post_data.post_id || '',
				me = this
			;
			this.$el.html(template);
			this.$("#region-bg-color").spectrum({
				showAlpha: true,
				clickoutFiresChange: true,
				chooseText: 'Ok',
				change: function(color) {
					me.on_update_color(color);
				},
				move: function(color) { 
					me.on_update_color(color);
				},
				hide: function(color) {
					me.on_update_color(color);					
				}
			});
			this.$el.find("#region-bg-image-upload").attr('href', Upfront.Settings.admin_url+'media-upload.php?post_id='+post_id+'&type=image&TB_iframe=1')
		},
		on_region_activate: function (region) {
			var name = region.model.get('title'),
				color = region.model.get_property_value_by_name('background_color')
			;
			if(!color)
				color = 'transparent';
			this.$("#region-bg-color")
				.attr('value', color)
				.spectrum('set', color)
			;
			this.toggle_image(region.model);
		},
		on_image_selected: function (id, url) {
			var app = Upfront.Application.LayoutEditor.layout,
				region = app.get('regions').active_region;
			region.set_property('background_image', url);
			region.set_property('background_image_id', id);
			region.set_property('background_repeat', 'repeat-x');
			region.set_property('background_position', 'center');
			region.set_property('background_fill', '');
			this.toggle_image(region);
		},
		toggle_image: function (model) {
			var	image = model.get_property_value_by_name('background_image'),
				image_file = image ? image.split('/').reverse()[0] : '',
				repeat = model.get_property_value_by_name('background_repeat'),
				position = model.get_property_value_by_name('background_position'),
				fill = model.get_property_value_by_name('background_fill');
			if ( image ) {
				this.$el.find('.panel-setting-background-more').addClass('expanded');
				this.$el.find('.background-image-wrap').html(
					'<div class="panel-setting-dialog panel-setting-dialog-image">' + 
						'<img src="' + image + '" />' + image_file + 
						'<a href="#" class="background-image-delete upfront-icon upfront-icon-delete"><span class="tooltip" data-tooltip="delete image"></span></a>' + 
					'</div>'
				);
				this.$el.find('.position-select, .tile-select').prop('checked', false);
				this.$el.find('.position-select[value="' + position + '"]').prop('checked', true);
				if ( repeat == 'repeat' || repeat == 'repeat-x' )
					this.$el.find('.tile-select[value=repeat-x]').prop('checked', true);
				if ( repeat == 'repeat' || repeat == 'repeat-y' )
					this.$el.find('.tile-select[value=repeat-y]').prop('checked', true);
				if ( fill == 'fill' )
					this.$el.find('.tile-select[value=fill]').prop('checked', true);
				this.$el.find('#region-bg-image-upload').hide();
				this.$el.find('#region-bg-image-edit').show();
			}
			else {
				this.$el.find('.panel-setting-background-more').removeClass('expanded');
				this.$el.find('#region-bg-image-edit').hide();
				this.$el.find('#region-bg-image-upload').show();
			}
		},
		delete_image: function () {
			var app = Upfront.Application.LayoutEditor.layout,
				region = app.get('regions').active_region;
			region.set_property('background_image', '');
			region.set_property('background_image_id', '');
			region.set_property('background_repeat', '');
			region.set_property('background_position', '');
			region.set_property('background_fill', '');
			this.toggle_image(region);
		},
		update_position: function () {
			var app = Upfront.Application.LayoutEditor.layout,
				region = app.get('regions').active_region,
				position = region.get_property_value_by_name('background_position'),
				new_position = this.$el.find('.position-select:checked').val();
			if ( position != new_position )
				region.set_property('background_position', new_position);
		},
		update_tile: function () {
			var app = Upfront.Application.LayoutEditor.layout,
				region = app.get('regions').active_region,
				repeat = region.get_property_value_by_name('background_repeat'),
				fill = region.get_property_value_by_name('background_fill'),
				is_repeat_x = this.$el.find('.tile-select[value=repeat-x]').is(':checked'),
				is_repeat_y = this.$el.find('.tile-select[value=repeat-y]').is(':checked'),
				is_fill = this.$el.find('.tile-select[value=fill]').is(':checked');
			if ( is_repeat_x && is_repeat_y )
				region.set_property('background_repeat', 'repeat');
			else if ( is_repeat_x )
				region.set_property('background_repeat', 'repeat-x');
			else if ( is_repeat_y )
				region.set_property('background_repeat', 'repeat-y');
			else
				region.set_property('background_repeat', 'no-repeat');
			if ( is_fill )
				region.set_property('background_fill', 'fill');
			else
				region.set_property('background_fill', '');
		},
		on_update_color: function (color) {
			var app = Upfront.Application.LayoutEditor.layout,
				region = app.get('regions').active_region
			;
			if ( color )
				region.set_property('background_color', color.toRgbString());
			else
				region.set_property('background_color', '');
		}
	});
	
	var SidebarPanel_Settings_Item_LockArea = SidebarPanel_Settings_Item.extend({
		events: {
			"click .region-lock-switch": "on_switch"
		},
		initialize: function () {
		},
		on_render: function () {
			var app = Upfront.Application.LayoutEditor.layout,
				regions = app.get('regions'),
				header = regions.get_by_name('header'),
				footer = regions.get_by_name('footer'),
				is_locked = false,//header.get_property_value_by_name('is_locked') || footer.get_property_value_by_name('is_locked'),
				template = _.template(_Upfront_Templates.sidebar_settings_lock_area, { lock_class: (is_locked ? 'locked' : '') })
			this.$el.html(template);
		},
		on_switch: function () {
			var app = Upfront.Application.LayoutEditor.layout,
				regions = app.get('regions'),
				header = regions.get_by_name('header'),
				footer = regions.get_by_name('footer');
			if ( this.$el.find('.region-lock-switch').hasClass('locked') ) {
				// Unlock header/footer region
				header.set_property('is_locked', 0);
				footer.set_property('is_locked', 0);
				this.$el.find('.region-lock-switch').removeClass('locked');
			}
			else {
				// Lock header/footer region
				header.set_property('is_locked', 1);
				footer.set_property('is_locked', 1);
				this.$el.find('.region-lock-switch').addClass('locked');
			}
			
		}
	});
	
	var SidebarPanel_Settings_Section = Backbone.View.extend({
		"tagName": "div",
		"className": "panel-section",
		initialize: function () {
			this.settings = _([]);
		},
		get_title: function () {},
		render: function () {
			var me = this;
			this.$el.html('<h4 class="panel-section-title">' + this.get_title() + '</h4>');
			this.$el.append('<div class="panel-section-content" />');
			this.settings.each(function (setting) {
				setting.render();
				me.$el.find('.panel-section-content').append(setting.el);
			});
			if ( this.on_render ) this.on_render();
		}
	});
	
	var SidebarPanel_Settings_Section_Structure = SidebarPanel_Settings_Section.extend({
		initialize: function () {
			this.settings = _([
				new SidebarPanel_Settings_Item_EditArea({"model": this.model}),
				new SidebarPanel_Settings_Item_Background({"model": this.model}),
			]);
		},
		get_title: function () {
			return "Structure";
		},
		on_render: function () {
		}
	});
	
	var SidebarPanel_Settings_Section_Behavior = SidebarPanel_Settings_Section.extend({
		initialize: function () {
			this.settings = _([
				new SidebarPanel_Settings_Item_LockArea({"model": this.model}),
			]);
		},
		get_title: function () {
			return "Behavior";
		},
		on_render: function () {
		}
	});
	
	var SidebarPanel_Settings = SidebarPanel.extend({
		initialize: function () {
			this.sections = _([
				new SidebarPanel_Settings_Section_Structure({"model": this.model}),
				new SidebarPanel_Settings_Section_Behavior({"model": this.model})
			]);
		},
		get_title: function () {
			return "Settings";
		},
		on_render: function () {
			var me = this;
			this.$el.find('.sidebar-panel-title').addClass('upfront-icon upfront-icon-panel-settings');
			this.sections.each(function (section) {
				section.render();
				me.$el.find('.sidebar-panel-content').append(section.el);
			});
		}
	});
	
	var SidebarPanels = Backbone.View.extend({
		"tagName": "ul",
		"className": "sidebar-panels",
		initialize: function () {
			this.panels = {
				posts: new SidebarPanel_Posts({"model": this.model}),
				elements: new SidebarPanel_DraggableElements({"model": this.model}),
				settings: new SidebarPanel_Settings({"model": this.model})
			};
		},
		render: function () {
			var me = this;
			_.each(this.panels, function(panel, key){
				panel.render();
				me.$el.append(panel.el);
			});
		}
	});
	
	var SidebarCommands_PrimaryPostType = Commands.extend({
		"className": "sidebar-commands sidebar-commands-primary",
		initialize: function () {
			this.commands = _([
				new Command_NewPage({"model": this.model}),
				new Command_NewPost({"model": this.model}),
				new Command_PopupList({"model": this.model}),
			]);
		}
	});
	
	var SidebarCommands_AdditionalPostType = Commands.extend({
		"className": "sidebar-commands sidebar-commands-additional",
		initialize: function () {
			this.commands = _([]);
		},
		render: function () {
			
		}
		
	});
	
	var SidebarCommands_Control = Commands.extend({
		"className": "sidebar-commands sidebar-commands-control",
		initialize: function () {
			this.commands = _([
				new Command_Undo({"model": this.model}),
				new Command_Redo({"model": this.model}),
				new Command_SaveLayout({"model": this.model}),
				new Command_SaveLayoutAs({"model": this.model}),
				//new Command_LoadLayout({"model": this.model}),
				new Command_ToggleGrid({"model": this.model}),
				new Command_ResetEverything({"model": this.model}),
			]);
		}
	});
	
	/*var SidebarEditorMode = Backbone.View.extend({
		"className": "sidebar-editor-mode",
		events: {
			"click .switch-mode-simple": "switch_simple",
			"click .switch-mode-advanced": "switch_advanced"
		},
		render: function () {
			this.$el.html(
				'<div class="sidebar-editor-mode-label">Editor mode:</div>' + 
				'<div class="switch-mode-ui">' +
					'<span class="switch-mode switch-mode-simple">simple <i class="upfront-icon upfront-icon-simple"></i></span>' +
					'<span class="switch-slider"><span class="knob"></span></span>' +
					'<span class="switch-mode switch-mode-advanced">advanced <i class="upfront-icon upfront-icon-advanced"></i></span>' +
				'</div>'
			);
			this.switch_simple();
		},
		switch_simple: function () {
			this.$el.find('.switch-mode-simple').addClass('active');
			this.$el.find('.switch-mode-advanced').removeClass('active');
			this.$el.find('.switch-slider').removeClass('switch-slider-full');
		},
		switch_advanced: function () {
			this.$el.find('.switch-mode-advanced').addClass('active');
			this.$el.find('.switch-mode-simple').removeClass('active');
			this.$el.find('.switch-slider').addClass('switch-slider-full');
		}
	});*/
	
	var Sidebar = Backbone.View.extend({
		"tagName": "div",
		visible: 1,
		events: {
			'click #sidebar-ui-toggler-handle': 'toggleSidebar'
		},
		initialize: function () {
			//this.editor_mode = new SidebarEditorMode({"model": this.model});
			this.sidebar_commands = {
				primary: new SidebarCommands_PrimaryPostType({"model": this.model}),
				additional: new SidebarCommands_AdditionalPostType({"model": this.model}),
				control: new SidebarCommands_Control({"model": this.model})
			};
			this.sidebar_panels = new SidebarPanels({"model": this.model});

			this.fetch_current_user();

			Upfront.Events.on("upfront:posts:post:post_updated", this.handle_post_change, this);
		},
		render: function () {
			var output = $('<div id="sidebar-ui-wrapper" class="upfront-ui"></div>');;
			output.append('<div class="upfront-logo" />');
			// Editor Mode
			//this.editor_mode.render();
			//this.$el.append(this.editor_mode.el);

			// Primary post types
			this.sidebar_commands.primary.render();
			output.append(this.sidebar_commands.primary.el);
			// Additional post types
			this.sidebar_commands.additional.render();
			output.append(this.sidebar_commands.additional.el);
			// Sidebar panels
			this.sidebar_panels.render();
			output.append(this.sidebar_panels.el);
			// Control
			this.sidebar_commands.control.render();
			output.append(this.sidebar_commands.control.el);

			this.$el.html(output);

			//Collapsible
			this.addCollapsibleEvents();
		},
		get_panel: function ( panel ) {
			if ( ! this.sidebar_panels.panels[panel] )
				return false;
			return this.sidebar_panels.panels[panel];
		},
		get_commands: function ( commands ) {
			if ( ! this.sidebar_commands[commands] )
				return false;
			return this.sidebar_commands[commands];
		},
		to_content_editor: function () {
			var panel = this.sidebar_panels.panels.posts,
				post_model = Upfront.data.currentPost
			;
			if(!panel.commands){
				panel.commands = _([
					new Command_PopupStatus({"model": post_model}),
					new Command_PopupVisibility({"model": post_model}),
					new Command_PopupSchedule({model: post_model}),

					new Command_PopupTax({"model": this.model}),
					new Command_PopupSlug({"model": this.model}),
					//new Command_PopupMeta({"model": this.model}),
					new Command_SaveDraft({"model": this.model}),
					new Command_SavePublish({"model": this.model}),
					new Command_Trash({"model": this.model})
				]);
				panel.render();
			}
			else
				panel.show();

			panel.$el.find(".sidebar-panel-title").trigger("click");
		},
		from_content_editor: function () {
			var panel = this.sidebar_panels.panels.posts;
			//panel.commands = _([]);
			panel.hide();//render();
			$(".sidebar-panel-title.upfront-icon.upfront-icon-panel-elements").trigger("click");
		},
		handle_post_change: function (post) {
			this.to_content_editor();
		},
		fetch_current_user: function() {
			var user = Upfront.data.currentUser;

			if(!user){
				user = new Upfront.Models.User();
				Upfront.data.loading.currentUser = user.fetch().done(function(){
					Upfront.data.currentUser = user;
				});
			}
		},
		addCollapsibleEvents: function(){
			var me = this;
			this.$el.append('<div id="sidebar-ui-toggler"><div id="sidebar-ui-toggler-handle" class="sidebar-ui-hide"></div></div>');
			$('body').on('mousemove', function(e){
				if(me.visible * 300 + 100 > e.pageX){
					if(!me.collapsibleHint){
						$('#sidebar-ui-toggler').fadeIn();
						me.collapsibleHint = true;
					}
				}
				else {
					if(me.collapsibleHint){
						$('#sidebar-ui-toggler').fadeOut();
						me.collapsibleHint = false;
					}
				}
			});

			this.resizeCollapseHandle();
			$(window).on('resize', function(){
				me.resizeCollapseHandle();
			});
		},

		resizeCollapseHandle: function(){
			var height = $(window).height();
			this.$('#sidebar-ui-toggler').height(height);
		},

		toggleSidebar: function(){
			if(!this.visible){
				$('#sidebar-ui').removeClass('collapsed').stop().animate({width: '300px'}, 300);
				$('#page').animate({'margin-left': '300px'}, 300);
				this.$('#sidebar-ui-toggler-handle').removeClass().addClass('sidebar-ui-hide');
				this.visible = 1;
			}
			else {
				$('#sidebar-ui').stop().animate({width: '0px'}, 300, function(){
					$('#sidebar-ui').addClass('collapsed');
				});
				$('#page').animate({'margin-left': '0px'}, 300);
				this.$('#sidebar-ui-toggler-handle').removeClass().addClass('sidebar-ui-show');
				this.visible = 0;
			}
		}

	});

	var ContentEditor_SidebarCommand = Command.extend({
		tagName: "div",
		className: "upfront-sidebar-content_editor-sidebar_command",
		post: false,
		initialize: function(){
			this.setPost();
			Upfront.Events.on("data:current_post:change", this.setPost, this);
		},
		setPost: function(){
			var currentPost = Upfront.data.currentPost;

			if(!currentPost)
				this.post = new Upfront.Models.Post({post_type: 'post', id: '0'});
			else if(!this.post || this.post.id !=  currentPost.id){
				this.post = Upfront.data.currentPost;
			    if(this.onPostChange)
			    	this.onPostChange();
			}

			return this;
		}
	});

	var Command_SaveDraft = ContentEditor_SidebarCommand.extend({
		save_state: "draft",
		render: function () {
			this.$el.addClass("upfront-save_state upfront-draft").html("<a class='button' href='#'>Save Draft</a>");
		},
		on_click: function () {
			var postView = Upfront.data.currentEntity,
			    newPost = false,
			    me = this
			;

			if(postView && postView.updatePost)
				postView.updatePost();

			//newPost = this.post.clone();
			newPost = (postView && postView.post ? postView.post : this.post).clone();

			newPost.set('post_status', 'draft').save().done(function(response){
				/*
 				me.post.set({
 					post_status: newPost.get('post_status')
 				});
				*/
				newPost.set(response.data);
				me.post.set(newPost.toJSON());
				Upfront.Events.trigger("upfront:posts:post:post_updated", Upfront.data.currentPost);
				Upfront.Views.Editor.notify('Post saved as draft.');
			});
		}
	});

	var Command_SavePublish = ContentEditor_SidebarCommand.extend({
		save_state: "publish",
		render: function () {
			this.$el.addClass("upfront-save_state upfront-publish").html("<a class='button' href='#'><i class='icon-ok'></i> Publish</a>");
		},
		on_click: function () {
			var me = this,
				postView = Upfront.data.currentEntity,
				newPost = false
			;

			if(postView && postView.updatePost)
				postView.updatePost();

			newPost = (postView && postView.post ? postView.post : this.post).clone();

			newPost.set({
					post_status: 'publish'
				})
				.save().done(function(response){
					/*
 					me.post.set({
 						post_status: newPost.get('post_status')
 					});
					*/
					newPost.set(response.data);
					me.post.set(newPost.toJSON());
					Upfront.Events.trigger("upfront:posts:post:post_updated", Upfront.data.currentPost);
					Upfront.Views.Editor.notify("Post published");
				})
			;
		}
	});

	var Command_PopupMeta = ContentEditor_SidebarCommand.extend({
		render: function () {
			this.$el.addClass("upfront-meta").html("<span title='Meta'>Meta</span>");
		},
		on_click: function () {
			var post_id = $("#upfront-post_id").val(),
				admin_array = Upfront.Settings.ajax_url.split('/'),
				admin_base = admin_array.slice(0, admin_array.length-1).join('/'),
				admin_url = admin_base + '/post.php?post=' + post_id + '&action=edit&upfront-meta_frame=1',
				tmp = $('body').append('<iframe src="' + admin_url + '" id="upfront-meta_frame" frameborder="no" style="display:none"></iframe>'),
				$meta_frame = $("#upfront-meta_frame"),
				popup_data = {},
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					popup_data = data;
					$me.empty()
						.append('<p class="upfront-popup-placeholder">Please hold on to your hats. Nothing special is going on, please disperse in individual directions. Something else.</p>')
						.append($meta_frame)
					;
				})
			;
			
			popup.done(function ($popup) {
				console.log('updating potentially changed meta data');
			});
			$meta_frame.on("load", function () {
				$(".upfront-popup-placeholder").remove();
				$meta_frame.css({
					'width': '100%',
					'height': popup_data.height
				}).show();
				return false;
			});
			return false;
		}
	});

	var Command_PopupTax = ContentEditor_SidebarCommand.extend({
		$popup: {},
		views: {category: false, post_tag: false},
		currentView: 'category',
		post: false,
		terms: {},
		className: 'upfront-command_inline upfront-command_taxonomies',
		render: function () {
			this.$el.html('<i class="icon-tag"></i> <a href="#">Edit Categories / Tags</a>');
		},
		on_click: function () {
			var tmp = $('body').append('<div id="upfront-post_taxonomies" style="display:none" />'),
				$tax = $("#upfront-post_taxonomies"),
				me = this,
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder"><q>I enjoy eating cheese.</q></p>')
						.append($tax)
					;
					me.$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				})
			;
			
			$(".upfront-popup-placeholder").remove();
			me.$popup.top.html(
				'<ul class="upfront-tabs">' +
					'<li data-type="category">Categories</li>' +
					'<li data-type="post_tag">Tags</li>' +
				'</ul>' +
				me.$popup.top.html()
			);
			me.$popup.top.find('.upfront-tabs li').on("click", function () { me.dispatch_taxonomy_call(this);} );
			$tax.show();
			me.dispatch_taxonomy_call(me.$popup.top.find('.upfront-tabs li:first'));
			Upfront.Events.on("upfront:post:taxonomy_changed", function () {
				me.dispatch_taxonomy_call(me.$popup.top.find('.upfront-tabs li.active'));
			});
			popup.done(function () {
				//Upfront.Events.off("upfront:post:taxonomy_changed");
			});
		},
		dispatch_taxonomy_call: function (el) {
			var me = this,
				$el = $(el),
				tax = $el.attr("data-type"),
				type = $el.attr('rel'),
				terms = this.terms[tax] ? this.terms[tax] : false
			;
			me.$popup.top.find('.upfront-tabs li').removeClass('active');
			$el.addClass('active');

			this.currentView = tax;

			if(this.views[tax])
				return me.render_panel(this.views[tax]);

			if(!terms){
				terms = new Upfront.Collections.TermList([], {postId: this.post.id, taxonomy: tax});
				this.terms[tax] = terms;
			}

			me.$popup.content.html('<p class="upfront-popup-placeholder"><q>Them frogs chirp really loud today.</q></p>');

			terms.fetch({allTerms: true}).done(function(response){
				var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
					tax_view = new tax_view_constructor({collection: terms})
				;

				tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);

				me.views[tax] = tax_view;
				me.render_panel();

				//terms.on('reset change add remove', me.render_panel, me);
			});

			return false;
		},
		render_panel: function(view){
			var v = this.views[this.currentView];
			v.render();
			this.$popup.content.html(v.$el);
			v.setElement(v.$el);
		}
	});

	var Command_PopupList = ContentEditor_SidebarCommand.extend({
		$popup: {},
		views: {},
		currentPanel: false,
		render: function () {
			this.$el.addClass("upfront-entity_list").html('<i class="icon-reorder"></i><a href="#">Browse Posts / Pages / Comments</a>');
		},
		on_click: function () {
			var me = this,
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder">No such thing as <q>too many drinks</q>.</p>')
					;
					me.$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				})
			;
			me.$popup.top.html(
				'<ul class="upfront-tabs">' +
					'<li data-type="posts" class="active">Posts</li>' +
					'<li data-type="pages">Pages</li>' +
					'<li data-type="comments">Comments</li>' +
				'</ul>' +
				me.$popup.top.html()
			).find('.upfront-tabs li').on("click", function () { 
				me.dispatch_panel_creation(this);
			} );

			me.dispatch_panel_creation();

			popup.done(function () {
				Upfront.Events.off("upfront:posts:sort");
				Upfront.Events.off("upfront:posts:post:expand");
				Upfront.Events.off("upfront:pages:sort");
				Upfront.Events.off("upfront:comments:sort");
			});
		},
		dispatch_panel_creation: function (data) {
			var me = this,
				$el = data ? $(data) : me.$popup.top.find('.upfront-tabs li.active'),
				panel = $el.attr("data-type"),
				class_suffix = panel.charAt(0).toUpperCase() + panel.slice(1).toLowerCase(),
				send_data = data || {},
				collection = false,
				postId = this.post.id,
				fetchOptions = {}
			;

			me.$popup.top.find('.upfront-tabs li').removeClass('active');
			$el.addClass('active');

			this.currentPanel = panel;

			//Already loaded?
			if(me.views[panel]){
				if(panel != 'comments' || me.views[panel].view.collection.postId == Upfront.data.currentPost.id)
			 		return this.render_panel(me.views[panel]);
			}

			if(panel == 'posts'){
				collection = new Upfront.Collections.PostList([], {postType: 'post'});
				collection.orderby = 'post_date';
				fetchOptions = {filterContent: true, withAuthor: true}
			}
			else if(panel == 'pages'){
				collection = new Upfront.Collections.PostList([], {postType: 'page'});
				fetchOptions = {limit: -1}
			}
			else{
				collection = new Upfront.Collections.CommentList([], {postId: Upfront.data.currentPost.id});
				collection.orderby = 'comment_date';
			}

			collection.fetch(fetchOptions).done(function(response){
				switch(panel){
					case "posts":
						collection.on('reset sort', me.render_panel, me);
						views = {
							view: new ContentEditorPosts({collection: collection, $popup: me.$popup}),
							search: new ContentEditorSearch({collection: collection}),
							pagination: new ContentEditorPagination({collection: collection})
						}
						me.views.posts = views;
						break;
					case "pages":
						collection.on('reset sort', me.render_panel, me);
						views = {
							view: new ContentEditorPages({collection: collection, $popup: me.$popup}),
							search: new ContentEditorSearch({collection: collection})					
						}
						me.views.pages = views;
						break;
					case "comments":
						collection.on('reset sort', me.render_panel, me);
						views = {
							view: new ContentEditorComments({collection: collection, $popup: me.$popup}),
							search: new ContentEditorSearch({collection: collection}),
							pagination: new ContentEditorPagination({collection: collection})
						}
						me.views.comments = views;
						break;
				}
				me.render_panel();	
			});

			return false;
		},

		render_panel: function(){
			var me = this,
				views = this.views[this.currentPanel];

			views.view.render();
			me.$popup.content.html(views.view.$el);
			views.view.setElement(views.view.$el);

			me.$popup.bottom.empty();

			if (views.pagination) {
				views.pagination.render();
				me.$popup.bottom.html(views.pagination.$el);
				views.pagination.setElement(views.pagination.$el);
			}

			views.search.render();
			me.$popup.bottom.append(views.search.$el);
			views.search.setElement(views.search.$el);
		}
	});

	var Command_PopupStatus = ContentEditor_SidebarCommand.extend({
		className: "upfront-post-state upfront-post-status",
		events: {
			"click a": "handle_status_change"
		},
		render: function () {
			var status = this.post.get("post_status");
			if(status)
				status = status.charAt(0).toUpperCase() + status.slice(1);
			else
				status = 'New';

			this.$el.addClass("upfront-entity_list").html(
				_.template("Status: <b>{{status}}</b> <a href='#'>Edit <i class='icon-pencil'></i></a>", {status: status})
			);
			this.post.off('change', this.onPostChange, this);
			this.post.on('change', this.onPostChange, this);
		},
		handle_status_change: function () {
			Upfront.Util.post({
				"action": "upfront-post-update_status",
				"post_id": this.model.get("ID"),
				"status": ("publish" == this.model.get("post_status") ? "draft" : "publish")
			}).success(function (resp) {
				Upfront.Events.trigger("upfront:posts:post:post_updated", resp.data);
			});
		},
		onPostChange: function(){
			this.render();
		}
	});

	var Command_PopupVisibility = ContentEditor_SidebarCommand.extend({
		className: "upfront-post-state upfront-post-visibility",
		events: {
			"click a": "handle_popup_open"
		},
		$popup: {},
		render: function () {
			var is_public = !!this.post.get("post_password"),
				status = is_public ? "Password protected" : "Public"
			;
			this.$el.addClass("upfront-entity_list").html(
				_.template("Visibility: <b>{{status}}</b> <a href='#'>Edit <i class='icon-pencil'></i></a>", {status: status})
			);
			this.post.off('change', this.onPostChange, this);
			this.post.on('change', this.onPostChange, this);
		},
		handle_popup_open: function () {
			var me = this,
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					me.setPost();
					$me.empty()
						.append(
							'<div class="upfront-post_password-wrapper">' +
								'Enter your new post password: ' +
								'<input type="text" id="upfront-post_password" value="" />' +
								'<button type="button" id="upfront-post_password-send">OK</button>' +
							'</div>'
						)
					;
					me.$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
					$me.find("#upfront-post_password-send").click(function () {
						me.update_post_status($("#upfront-post_password").val());
					});
				})
			;
		},
		update_post_status: function (password) {
			Upfront.Util.post({
				"action": "upfront-post-update_password",
				"post_id": this.model.get("ID"),
				"password": password
			}).success(function (resp) {
				Upfront.Popup.close();
				Upfront.Events.trigger("upfront:posts:post:post_updated", resp.data);
			});
		},
		onPostChange: function(){
			this.render();
		}
	});

	var Command_PopupSchedule = ContentEditor_SidebarCommand.extend({
		className: "upfront-post-state upfront-post-schedule upfront-entity_list",

		render: function(){
			
			var status = this.post.get('post_status') == 'future' ? Upfront.Util.format_date(this.post.get('post_date'), true) : 'Immediately';
			this.$el.addClass('upfront-entity_list')
				.html('Publish: <b>' + status + '</b> <a href="#">Edit <i class="icon-pencil"></i></a>')
			;
			this.post.off('change', this.onPostChange, this);
			this.post.on('change', this.onPostChange, this);
		},
		onPostChange: function(){
			this.render();
		}
	});

	var Command_Trash = ContentEditor_SidebarCommand.extend({
		className: "upfront-post-state upfront-post-trash upfront-entity_list",

		render: function(){
			this.$el.html('<i class="icon-remove"></i> <a href="#">Move to trash</a>');
		}
	});

	var Command_PopupSlug = ContentEditor_SidebarCommand.extend({
		$popup: {},
		post : false,
		className: "upfront-command_inline",

		slugTpl:  _.template($(_Upfront_Templates.popup).find('#upfront-slug-tpl').html()),

		render: function () {
			this.$el.addClass("upfront-entity_list").html('<i class="icon-link"></i> <a href="#">Edit URL</a>');
		},
		on_click: function () {
			var me = this,
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder">No such thing as <q>too many drinks</q>.</p>')
					;
					me.$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				})
			;

			

			me.$popup.content.html(me.slugTpl({
				rootURL: window.location.origin + '/',
				slug: me.post.get('post_name')
			}));

			me.$popup.content.off('click', '#upfront-post_slug-send')
				.on('click', '#upfront-post_slug-send', function(){
					me.update_post_slug($('#upfront-post_slug').val());
				})
				.off('keydown', '#upfront-post_slug')
				.on('keydown', '#upfront-post_slug', function(e){
					if(e.which == 13){
						e.preventDefault();
						me.update_post_slug($('#upfront-post_slug').attr('disabled', true).val());
					}
				});
			;

			popup.done(function () {
				console.log('slug cleanup');
			});
			me.on("upfront:posts:post:slug_updated", function () {
				Upfront.Popup.close();
			});
		},

		update_post_slug: function (slug) {
			var me = this;
			me.post.set('post_name', slug).save()
				.done(function(response){
					me.trigger("upfront:posts:post:slug_updated");
					//if(confirm('Do you want to reload the page with the new URL?')) window.location.href = window.location.origin + '/' + me.post.get('post_name') + '/';
				})
			;
		}
	});

	var ContentEditorSidebarCommands_Control = Commands.extend({
		"className": "sidebar-commands sidebar-commands-control",
		initialize: function () {
			this.commands = _([
				new Command_SaveDraft({"model": this.model}),
				new Command_SavePublish({"model": this.model}),
				new Command_PopupMeta({"model": this.model}),
				new Command_PopupTax({"model": this.model}),
				new Command_PopupSlug({"model": this.model})
			]);
		}
	});

	var ContentEditorSidebar = Backbone.View.extend({
		"tagName": "div",
		initialize: function () {
			this.sidebar_commands = {
				primary: new SidebarCommands_PrimaryPostType({"model": this.model}),
				additional: new SidebarCommands_AdditionalPostType({"model": this.model}),
				control: new ContentEditorSidebarCommands_Control({"model": this.model})
			};
			this.sidebar_panels = new SidebarPanels({"model": this.model});
		},
		render: function () {
			// Primary post types
			this.sidebar_commands.primary.render();
			this.$el.append(this.sidebar_commands.primary.el);
			// Additional post types
			this.sidebar_commands.additional.render();
			this.$el.append(this.sidebar_commands.additional.el);
			// Sidebar panels
			//this.sidebar_panels.render();
			//this.$el.append(this.sidebar_panels.el);
			// Control
			this.sidebar_commands.control.render();
			this.$el.append(this.sidebar_commands.control.el);
		},

		get_panel: function ( panel ) {
			if ( ! this.sidebar_panels.panels[panel] )
				return false;
			return this.sidebar_panels.panels[panel];
		},
		get_commands: function ( commands ) {
			if ( ! this.sidebar_commands[commands] )
				return false;
			return this.sidebar_commands[commands];
		}
	});

	var ContentEditorSearch = Backbone.View.extend({
		id: "upfront-entity_list-search",
		searchTpl: _.template($(_Upfront_Templates.popup).find('#upfront-search-tpl').html()),
		events: {
			"click #upfront-search_action": "dispatch_search_click",
			"keydown #upfront-list-search_input": "dispatch_search_enter"
		},
		render: function () {
			var query = this.collection.lastFetchOptions ? this.collection.lastFetchOptions.search : false;
			this.$el.html(this.searchTpl({query: query}));
		},
		dispatch_search_click: function (e) {
			if ($("#upfront-search_container").is(":visible")) 
				return this.handle_search_request(e);
			else return this.handle_search_reveal(e);
		},
		dispatch_search_enter: function (e) {
			if(e.which == 13)
				return this.handle_search_request(e);
		},
		handle_search_request: function (e) {
			e.preventDefault();
			var text = $("#upfront-search_container input").val();
			this.collection.fetch({search: text});
		},
		handle_search_reveal: function () {
			$("#upfront-search_container").show();
		}
	});

	var ContentEditorPagination = Backbone.View.extend({
		paginationTpl: _.template($(_Upfront_Templates.popup).find('#upfront-pagination-tpl').html()),
		events: {
			"click .upfront-pagination_page-item": "handle_pagination_request",
			"click .upfront-pagination_item-next": "handle_next",
			"click .upfront-pagination_item-prev": "handle_prev"
		},
		render: function () {
			this.$el.html(this.paginationTpl(this.collection.pagination));
		},
		handle_pagination_request: function (e, page) {
			var me = this,
				pagination = this.collection.pagination,
				page = page ? page : parseInt($(e.target).attr("data-page_idx"), 10) || 0
			;
			this.collection.fetchPage(page).
				done(function(response){
					me.collection.trigger('reset');
				});
		},
		handle_next: function(e) {
			var pagination = this.collection.pagination,
				nextPage = pagination.currentPage == pagination.pages - 1 ? false : pagination.currentPage + 1;

			if(nextPage)
				this.handle_pagination_request(e, nextPage);
		},
		handle_prev: function(e) {
			var pagination = this.collection.pagination,
				prevPage = pagination.currentPage == 0 ? false : pagination.currentPage - 1;

			if(prevPage !== false)
				this.handle_pagination_request(e, prevPage);
		}
	});

	var ContentEditorTaxonomy_Hierarchical = Backbone.View.extend({
		className: "upfront-taxonomy-hierarchical",
		events: {
			"click #upfront-add_term": "handle_new_term",
			"keydown #upfront-add_term": "handle_enter_new_term",
			"change .upfront-taxonomy_item": "handle_terms_update",
			'keydown #upfront-new_term': 'handle_enter_new_term'
		},
		termListTpl: _.template($(_Upfront_Templates.popup).find('#upfront-term-list-tpl').html()),
		termSingleTpl: _.template($(_Upfront_Templates.popup).find('#upfront-term-single-tpl').html()),
		updateTimer: false,
		allTerms: false,
		initialize: function(options){
			//this.collection.on('add remove', this.render, this);
		},

		render: function() {
			this.$el.html(
				this.termListTpl({ 
					allTerms: this.allTerms,
					postTerms: this.collection,
					termTemplate: this.termSingleTpl, 
					labels: this.collection.taxonomyObject.labels,
				})
			);
		},

		handle_new_term: function() {
			var me = this,
				termId = this.$el.find("#upfront-new_term").val(),
				parentId, term
			;

			if(!termId)
				return false;

			if ($("#upfront-taxonomy-parents").length) 
				parentId = $("#upfront-taxonomy-parents").val();

			term = new Upfront.Models.Term({
				taxonomy: this.collection.taxonomy,
				name: termId,
				parent: parentId
			});

			term.save().done(function(response){
				me.allTerms.add(term);
				me.collection.add(term).save();
				me.render();
			});
		},

		handle_terms_update: function(e){
			var me = this,
				$target = $(e.target),
				termId = $target.val()
			;

			if(!$target.is(':checked')){
				this.collection.remove(this.allTerms.get(termId));
			}
			else
				this.collection.add(this.allTerms.get(termId));

			//Delay the current update to let the user add/remove more terms
			clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(function(){
				me.collection.save();
			}, 2000);
		},

		handle_enter_new_term: function (e) {
			if(e.which == 13){
				this.handle_new_term(e);
			}
		}
	});

	var ContentEditorTaxonomy_Flat = Backbone.View.extend({
		"className": "upfront-taxonomy-flat",
		termListTpl: _.template($(_Upfront_Templates.popup).find('#upfront-flat-term-list-tpl').html()),
		termSingleTpl: _.template($(_Upfront_Templates.popup).find('#upfront-term-flat-single-tpl').html()),
		changed: false,
		updateTimer: false,
		events: {
			"click #upfront-add_term": "handle_new_term",
			'click .upfront-taxonomy_item-flat': 'handle_term_click',
			'keydown #upfront-add_term': 'handle_enter_new_term',
			'keydown #upfront-new_term': 'handle_enter_new_term'
		},
		initialize: function(options){
			this.collection.on('add remove', this.render, this);
		},
		render: function () {
			var	me = this,
				currentTerms = [],
				otherTerms = []
			;
			this.allTerms.each(function (term, idx) {
				term.children = [];
				if(me.collection.get(term.get('term_id')))
					currentTerms.push(term);
				else
					otherTerms.push(term);
			});

			this.$el.html(this.termListTpl({
				currentTerms: currentTerms,
				otherTerms: otherTerms,
				termTemplate: this.termSingleTpl,
				labels: this.collection.taxonomyObject.labels
			}));
		},

		handle_term_click: function(e){
			var me = this,
				$target = $(e.currentTarget),
				termId = $target.attr('data-term_id');

			if($target.parent().attr('id') == 'upfront-taxonomy-list-current')
				this.collection.remove(termId);
			else
				this.collection.add(this.allTerms.get(termId));

			//Delay the current update to let the user add/remove more terms
			clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(function(){
				me.collection.save();
			}, 2000);
		},

		handle_new_term: function (e) {
			var me = this,
				termId = this.$el.find("#upfront-new_term").val(),
				term
			;

			e.preventDefault();

			if(! termId)
				return false;

			term = new Upfront.Models.Term({
				taxonomy: this.collection.taxonomy,
				name: termId
			});

			term.save().done(function(response){
				me.allTerms.add(term);
				me.collection.add(term).save();
			});
		},

		handle_enter_new_term: function (e) {
			if(e.which == 13){
				this.handle_new_term(e);
			}
		}
	});

	var ContentEditorPosts = Backbone.View.extend({
		className: "upfront-entity_list-posts bordered-bottom",
		postListTpl: _.template($(_Upfront_Templates.popup).find('#upfront-post-list-tpl').html()),
		postSingleTpl: _.template($(_Upfront_Templates.popup).find('#upfront-post-single-tpl').html()),
		paginationTpl: _.template($(_Upfront_Templates.popup).find('#upfront-pagination-tpl').html()),
		events: {
			"click #upfront-list-meta .upfront-list_item-component": "handle_sort_request",
			"click .upfront-list_item-post": "handle_post_reveal",
			"click #upfront-list-page-path a.upfront-path-back": "handle_return_to_posts"
		},
		initialize: function(options){
			this.collection.on('change reset', this.render, this);
		},
		render: function () {
			this.$el.empty().append(
				this.postListTpl({
					posts: this.collection.getPage(this.collection.pagination.currentPage), 
					orderby: this.collection.orderby, 
					order: this.collection.order 
				})
			);
			//this.mark_sort_order();
		},

		handle_sort_request: function (e) {
			var $option = $(e.target),
				sortby = $option.attr('data-sortby'),
				order = this.collection.order;
			if(sortby){
				if(sortby == this.collection.orderby)
					order = order == 'desc' ? 'asc' : 'desc';
				this.collection.reSort(sortby, order);
			}
		},

		handle_post_reveal: function (e) {
			var me = this,
				postId = $(e.currentTarget).attr('data-post_id');

			e.preventDefault();

			me.$('#upfront-list').after(me.postSingleTpl({post: me.collection.get(postId)}));
			me.expand_post(me.collection.get(postId));
		},

		expand_post: function(post){
			var me = this;
			if(!post.featuredImage){
				this.collection.post({action: 'get_post_extra', postId: post.id, thumbnail: true, thumbnailSize: 'medium'})
					.done(function(response){
						if(response.data.thumbnail && response.data.postId == post.id){
							me.$('#upfront-page_preview-featured_image img').attr('src', response.data.thumbnail[0]).show();
							me.$('.upfront-thumbnailinfo').hide();
							post.featuredImage = response.data.thumbnail[0];
						}
						else{
							me.$('.upfront-thumbnailinfo').text('No Image');
							me.$('.upfront-page_preview-edit_feature a').html('<i class="icon-plus"></i> Add');
						}

					})
				;
			}
			$("#upfront-list-page").show('slide', { direction: "right"}, 'fast');
			this.$el.find("#upfront-list").hide();
			$("#upfront-page_preview-edit button").one("click", function () {
				window.location = Upfront.Settings.Content.edit.post + post.id;
			});

			this.bottomContent = $('#upfront-popup-bottom').html();

			$('#upfront-popup-bottom').html(
				$('<a href="#" id="upfront-back_to_posts">&laquo; Back to posts</a>').on('click', function(e){
					me.handle_return_to_posts();
				})
			);
		},

		handle_return_to_posts: function () {
			var me = this;
			this.$el.find("#upfront-list").show('slide', { direction: "left"}, function(){
				me.collection.trigger('reset');
			});
			$("#upfront-list-page").hide();
		}
	});


	var ContentEditorPages = Backbone.View.extend({
		events: {
			"click .upfront-list-page_item": "handle_page_activate",
			"click .upfront-page-path-item": "handle_page_activate",
			"change #upfront-page_template-select": "template_change"
		},
		currentPage: false,
		pageListTpl: _.template($(_Upfront_Templates.popup).find('#upfront-page-list-tpl').html()),
		pageListItemTpl: _.template($(_Upfront_Templates.popup).find('#upfront-page-list-item-tpl').html()),
		pagePreviewTpl: _.template($(_Upfront_Templates.popup).find('#upfront-page-preview-tpl').html()),
		allTemplates: [],
		render: function () {
			// Render
			this.$el.html(
				this.pageListTpl({
					pages: this.collection.where({'post_parent': 0}), 
					pageItemTemplate: this.pageListItemTpl
				})
			);
		},

		renderPreview: function (page) {
			var $root = this.$el.find("#upfront-list-page-preview");

			$root.html(this.pagePreviewTpl({
				page: page,
				template: page.template ? page.template : 'Default',
				allTemplates: this.allTemplates ? this.allTemplates : []
			}));
		},

		handle_page_activate: function (e) {
			var page = this.collection.get($(e.target).attr("data-post_id"));
			e.preventDefault();
			e.stopPropagation();

			this.$(".upfront-list-page_item").removeClass("active");
			this.$("#upfront-list-page_item-" + page.id).addClass("active").toggleClass('closed');

			this.update_path(page);
			this.update_page_preview(page);

			this.currentPage = page;
		},

		update_path: function (page) {
			var current = page,
				fragments = [{id: page.get('ID'), title: page.get('post_title')}],
				$root = this.$el.find("#upfront-list-page-path"),
				output = ''
			;

			while(current.get('post_parent')){
				current = this.collection.get(current.get('post_parent'));
				fragments.unshift({id: current.get('ID'), title: current.get('post_title')});
			}

			_.each(fragments, function(p){
				if(output)
					output += '&nbsp;»&nbsp;'
				if(p.id == page.id)
					output += '<span class="upfront-page-path-current last">' + p.title + '</span>';
				else
					output += '<a href="#" class="upfront-page-path-item" data-post_id="' + p.id + '">' + p.title + '</a>';
			})
			$root.html(output);
		},

		update_page_preview: function (page) {
			var me = this,
				getExtra = !page.thumbnail || !me.allTemplates || !page.template,
				extra = getExtra ? 
					{
						thumbnail: !page.thumbnail,
						thumbnailSize: 'medium',
						allTemplates: !me.allTemplates,
						template: !page.template,
						action: 'get_post_extra', 
						postId: page.get('ID')
					} : {}
			;

			if(getExtra){
				this.collection.post(extra)
					.done(function(response){
						if(response.data.thumbnail && response.data.postId == page.get('ID')){
							me.$('#upfront-page_preview-featured_image img').attr('src', response.data.thumbnail[0]).show();
							me.$('.upfront-thumbnailinfo').hide();
							page.thumbnail = response.data.thumbnail[0];
						}
						else{
							me.$('.upfront-thumbnailinfo').text('No Image');
							me.$('.upfront-page_preview-edit_feature a').html('<i class="icon-plus"></i> Add');
						}

						if(response.data.allTemplates)
							me.allTemplates = response.data.allTemplates;
						if(response.data.template){
							page.template = response.data.template;
							me.renderPreview(page);
						}
					})
				;
			}

			this.renderPreview(page);
		},

		template_change: function(e){
			var me = this,
				$target = $(e.target),
				value = $target.val()
			;

			this.currentPage.post({
				action: 'update_page_template',
				postId: this.currentPage.get('ID'),
				template: value
			}).done(function(response){
				if(me.currentPage.get('ID') == response.data.postId)
					me.currentPage.template = response.data.template;
			});
		}
	});


	var ContentEditorComments = Backbone.View.extend({
		events: {
			"click #upfront-list-meta .upfront-list_item-component": "handle_sort_request",
			"mouseenter .upfront-list_item-comment": "start_reveal_counter",
			"mouseleave .upfront-list_item-comment": "stop_reveal_counter",
			"click .upfront-list_item-comment": "toggle_full_post",
			"click .upfront-comments-approve": "handle_approval_request",
			"click .upfront-comment_actions-wrapper a": "handle_action_bar_request",
			"click .comment-edit-ok": "edit_comment",
			"click .comment-reply-ok": "reply_to_comment",
			"click .comment-reply-cancel": "cancel_edit",
			"click .comment-reply-cancel": "cancel_edit",
			"click .comment-edit-box": "stop_propagation"
		},
		excerptLength: 60,
		commentsTpl: _.template($(_Upfront_Templates.popup).find('#upfront-comments-tpl').html()),
		commentTpl: _.template($(_Upfront_Templates.popup).find('#upfront-comment-single-tpl').html()),
		initialize: function(options){
			this.collection.on('change', this.renderComment, this);
			this.collection.on('add', this.addComment, this);
		},
		
		render: function () {
			//Parse comment meta data
			var comments = this.collection.postId == 0 ? [] : this.collection.getPage(this.collection.pagination.currentPage);
			this.$el.html(
				this.commentsTpl({
					comments: comments, 
					excerptLength: 45, 
					commentTpl: this.commentTpl, 
					orderby: this.collection.orderby, 
					order: this.collection.order
				})
			);
		},

		renderComment: function(comment) {
			this.$('#upfront-list_item-comment-' + comment.get('comment_ID')).html(
				this.commentTpl({comment: comment, excerptLength: 60})
			);
		},

		addComment: function(comment){
			var parentId = comment.get('comment_parent'),
				tempId = comment.get('comment_ID'),
				commentTpl = $('<div class="upfront-list_item-comment upfront-list_item clearfix expanded" id="upfront-list_item-comment-' + tempId + '" data-comment_id="' + tempId + '">' +
					this.commentTpl({comment: comment, excerptLength: this.excerptLength}) + 
					'</div>').hide()
			;
			this.$('div.upfront-list_item-comment').removeClass('expanded');
			this._currently_working = false;

			if(parentId)
				this.$('#upfront-list_item-comment-' + parentId).after(commentTpl);
			else
				this.$('div.upfront-list-comment-items').append(commentTpl);
			commentTpl.slideDown();
		},

		handle_sort_request: function (e) {
			var $option = $(e.target),
				sortby = $option.attr('data-sortby'),
				order = this.collection.order;
			if(sortby){
				if(sortby == this.collection.orderby)
					order = order == 'desc' ? 'asc' : 'desc';
				this.collection.reSort(sortby, order);
			}
		},

		start_reveal_counter: function (e) {
			var me = this;
			if ($(e.target).is(".upfront-comment-approved") || $(e.target).parents(".upfront-comment-approved").length) return false; // Not expanding on quick reveal
			if (this._currently_working) return false;

			clearTimeout(me._reveal_counter);

			me._reveal_counter = setTimeout(function () {
				me.reveal_comment(e);
			}, 500);
		},

		reveal_comment: function (e) {
			this.$(".upfront-list-comments .upfront-list_item").removeClass("expanded");
			$(e.currentTarget).addClass("expanded");
			clearTimeout(this._reveal_counter);
		},

		revert_comment: function (e) {
			$(e.currentTarget).removeClass("expanded");
			clearTimeout(this._reveal_counter);
		},

		toggle_full_post: function (e) {
			$(e.currentTarget).toggleClass("expanded");
		},

		stop_reveal_counter: function (e) {
			if (this._currently_working) return false;
			this.revert_comment(e);
		},

		handle_approval_request: function (e, comment) {
			var comment = comment ? comment : this.collection.get($(e.target).attr("data-comment_id"));
			this.$('#upfront-list_item-comment-' + comment.id + ' i.upfront-comments-approve')
				.animate({'font-size': '1px', opacity:0}, 400, 'swing', function(){
					comment.approve(true).save();			
				})
		},

		handle_action_bar_request: function (e) {			
			var me = this,
				$el = $(e.currentTarget),
				comment = this.collection.get($el.parents(".upfront-list_item-comment").attr("data-comment_id"))
			;
			if ($el.is(".edit"))
				this._edit_comment(comment);
			else if ($el.is(".reply"))
				this._reply_to_comment(comment);
			else if ($el.is(".approve"))
				this.handle_approval_request(false, comment);
			else if ($el.is(".unapprove"))
				comment.approve(false).save();
			else if ($el.is(".thrash"))
				comment.trash(true).save();
			else if ($el.is(".unthrash"))
				comment.trash(false).save();
			else if ($el.is(".spam"))
				comment.spam(true).save();
			else if ($el.is(".unspam"))
				comment.spam(false).save();

			return false;
		},

		edit_comment: function(e){
			var $container = $(e.target).parent(),
				comment = this.collection.get($container.attr('data-comment_id'))
			;

			comment.set('comment_content', $container.find('textarea').attr('disabled', true).val()).save();
		},
		reply_to_comment: function(e){
			var me = this,
				$container = $(e.target).parent(),
				comment = this.collection.get($container.attr('data-comment_id')),
				$comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID')),
				text = $container.find('textarea').val(),
				currentUser = Upfront.data.currentUser
			;


			if(text){
				var reply = new Upfront.Models.Comment({
						comment_author: currentUser.get('data').display_name,
						comment_post_ID	: this.collection.postId,
						comment_parent: comment.get('comment_ID'),
						comment_content: text,
						comment_approved: '1',
						user_id: currentUser.get('ID')
					}),
					tempId = (new Date()).getTime()
				;

				$comment.find("textarea").attr('disabled', true);

				reply.save().done(function(response){
					me.renderComment(comment);
					reply.set('comment_ID', response.data.comment_ID);
					me.collection.add(reply);
					me.$('#upfront-list_item-comment-' + response.data.comment_ID).hide().slideDown();
				});
			}
		},

		cancel_edit: function(e) {
			var $container = $(e.target).parent(),
				comment = this.collection.get($container.attr('data-comment_id'))
			;
			this.renderComment(comment);
		},

		stop_propagation: function(e) {
			e.stopPropagation();
		},

		_edit_comment: function (comment) {
			var $comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID'));

			$comment.find('.upfront-comment_togglable').hide();
			$comment.find('.upfront-comment_edit').show();

			this._currently_working = true;
		},

		_reply_to_comment: function (comment) {
			var $comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID'));

			$comment.find('.upfront-comment_togglable').show();
			$comment.find('.upfront-comment_edit').hide();

			this._currently_working = true;
		},
	});


// ----- Done bringing things back

	var LayoutSize = Backbone.View.extend({
		"tagName": "li",
		"events": {
			"click": "on_click"
		},
		on_click: function () { 
			this.trigger("upfront:layout_size:change_size", this.get_size_class());
			this.$el.parent().find(".active").removeClass("active");
			this.$el.addClass("active");
			//this.render(); 
		},
		//get_size_class: function () { return 'FUN!'; }
	});

	var LayoutSize_Desktop = LayoutSize.extend({
		render: function () {
			this.$el.html("<i class='icon-desktop'></i> Desktop");
		},
		get_size_class: function () {
			return "desktop";
		}
	});

	var LayoutSize_Tablet = LayoutSize.extend({
		render: function () {
			this.$el.html("<i class='icon-tablet'></i> Tablet");
		},
		get_size_class: function () {
			return "tablet";
		}
	});

	var LayoutSize_Mobile = LayoutSize.extend({
		render: function () {
			this.$el.html("<i class='icon-mobile-phone'></i> Mobile");
		},
		get_size_class: function () {
			return "mobile";
		}
	});


	var LayoutSizes = Backbone.View.extend({
		tagName: "ul",

		initialize: function () {
			this.sizes = _([
				new LayoutSize_Desktop({"model": this.model}),
				new LayoutSize_Tablet({"model": this.model}),
				new LayoutSize_Mobile({"model": this.model}),
			]);
		},
		render: function () {
			var me = this;
			me.$el.find("li").remove();
			me.$el.html("<nav><ul /></nav>")
			me.sizes.each(function (size) {
				size.render();
				size.bind("upfront:layout_size:change_size", me.change_size, me);
				me.$el.find("nav ul").append(size.el);
			});
			this.sizes.first().$el.trigger("click");
		},
		change_size: function (new_size) {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			this.sizes.each(function (size) {
				$main.removeClass(size.get_size_class());
			});
			$main.addClass(new_size);
			
			Upfront.Settings.LayoutEditor.Grid.size = Upfront.Settings.LayoutEditor.Grid.breakpoint_columns[new_size];
			Upfront.Settings.LayoutEditor.Grid.baseline = Upfront.Settings.LayoutEditor.Grid.baseline;
			Upfront.Settings.LayoutEditor.Grid.class = Upfront.Settings.LayoutEditor.Grid.size_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.left_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_left_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.right_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_right_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.top_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_top_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.bottom_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_bottom_classes[new_size];
		}
	});
	
	
	var Upfront_Icon_Mixin = {
		get_icon_html: function (src) {
			if ( ! src )
				return '';
			if ( src.match(/^https?:\/\//) ) {
				var attr = {
					'src': src,
					'alt': '',
					'class': 'upfront-field-icon-img'
				}
				return '<img ' + this.get_field_attr_html(attr) + ' />';
			}
			else {
				return '<i class="upfront-field-icon upfront-field-icon-' + src + '"></i>';
			}
		}
	};
	
	
	var Field = Backbone.View.extend({
		className: 'upfront-field-wrap',
		initialize: function () {
			this.multiple = this.options.multiple ? this.options.multiple : (this.multiple ? this.multiple : false);
			this.label = this.options.label ? this.options.label : '';
			this.default_value = this.options.default_value ? this.options.default_value : (this.multiple ? [] : '');
			this.property = this.model.get_property_by_name(this.options.property);
			if ( this.property === false ){
				this.model.init_property(this.options.property, this.default_value);
				this.property = this.model.get_property_by_name(this.options.property);
			}
			this.selected_state = this.selected_state ? this.selected_state : '';
			if ( this.init )
				this.init();
		},
		get_name: function () {
			return this.property.get('name');
		},
		get_saved_value: function () {
			return this.property.get('value');
		},
		get_value: function () {
			var $field = this.get_field();
			if ( ! this.multiple || ($field.size() == 1 && $field.is('select')) )
				return $field.val();
			else
				return _.map($field, function (el) { return $(el).val(); });
			return false;
		},
		get_field_id: function () {
			return this.cid + '-' + this.get_name();
		},
		get_field_name: function () {
			return this.get_name();
		},
		get_field: function () {
			return this.$el.find( '[name=' + this.get_field_name() + ']' + (this.selected_state ? ':'+this.selected_state : '') );
		},
		get_label_html: function () {
			var attr = {
				'for': this.get_field_id(),
				'class': 'upfront-field-label ' + ( this.options.label_style == 'inline' ? 'upfront-field-label-inline' : 'upfront-field-label-block' )
			};
			return '<label ' + this.get_field_attr_html(attr) + '>' + this.label + '</label>';
		},
		get_field_attr_html: function (attr) {
			return _.map(attr, function(value, att){
				return att + '="' + value + '"';
			}).join(' ');
		}
	});
	
	var Field_Text = Field.extend({
		className: 'upfront-field-wrap upfront-field-wrap-text',
		render: function () {
			this.$el.html('');
			if ( !this.options.compact )
				this.$el.append(this.get_label_html());
			this.$el.append(this.get_field_html());
			var me = this;
			this.$el.find('.upfront-field').keyup(function(){
				if ( $(this).val() == '' ){
					$(this).addClass('upfront-field-empty');
					if ( me.options.compact )
						me.$el.removeClass('tooltip');
				}
				else if ( $(this).hasClass('upfront-field-empty') ) {
					$(this).removeClass('upfront-field-empty');
					if ( me.options.compact )
						me.$el.addClass('tooltip');
				}
			}).trigger('keyup');
			this.trigger('rendered');
		},
		get_field_html: function () {
			var attr = {
				'type': 'text',
				'class': 'upfront-field upfront-field-text',
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.get_saved_value()
			};
			if ( this.options.compact ) {
				attr.placeholder = this.label;
				this.$el.attr('data-tooltip', this.label);
			}
			else if ( this.options.placeholder ) {
				attr.placeholder = this.options.placeholder;
			}
			return '<input ' + this.get_field_attr_html(attr) + ' />';
		}
	});

	var Field_Email = Field_Text.extend({
		get_field_html: function () {
			var attr = {
				'type': 'email',
				'class': 'upfront-field upfront-field-text upfront-field-email',
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.get_saved_value()
			};
			if ( this.options.compact ) {
				attr.placeholder = this.label;
				this.$el.attr('data-tooltip', this.label);
			}
			else if ( this.options.placeholder ) {
				attr.placeholder = this.options.placeholder;
			}
			return '<input ' + this.get_field_attr_html(attr) + ' />';
		}
	});
	
	var Field_Textarea = Field_Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-text upfront-field-wrap-textarea',
		get_field_html: function () {
			var attr = {
				'cols': '40',
				'rows': '5',
				'class': 'upfront-field upfront-field-text upfront-field-textarea',
				'id': this.get_field_id(),
				'name': this.get_field_name()
			};
			if ( this.options.compact ) {
				attr.placeholder = this.label;
				this.$el.attr('data-tooltip', this.label);
			}
			else if ( this.options.placeholder ) {
				attr.placeholder = this.options.placeholder;
			}
			return '<textarea ' + this.get_field_attr_html(attr) + '>' + this.get_saved_value() + '</textarea>';
		}
	});
	
	var Field_Number = Field_Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-number',
		get_field_html: function () {
			var attr = {
				'type': 'number',
				'class': 'upfront-field upfront-field-number',
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.get_saved_value(),
				'min': this.options.min,
				'max': this.options.max,
				'step': this.options.step
			};
			return ' <input ' + this.get_field_attr_html(attr) + ' /> ' + (this.options.suffix ? this.options.suffix : '');
		}
	});

	var Field_Color = Field_Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-color sp-cf',
		spectrumDefaults: {
			clickoutFiresChange: true,
			chooseText: 'OK',
			showPalette: true,
			showSelectionPalette: true
		},
		initialize: function(){
			debugger;
			var me = this,
				spectrumOptions = typeof this.options.spectrum == 'object' ? _.extend({}, this.spectrumDefaults, this.options.spectrum) : this.spectrumDefaults
			;

			Field_Color.__super__.initialize.apply(this, arguments);

			this.on('rendered', function(){
				me.$('input[name=' + me.get_field_name() + ']').spectrum(spectrumOptions);
			});
		},
		get_field_html: function () {
			var attr = {
				'type': 'text',
				'class': 'upfront-field upfront-field-color',
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.get_saved_value()
			};
			return ' <input ' + this.get_field_attr_html(attr) + ' /> ' + (this.options.suffix ? this.options.suffix : '');
		}

	})
	
	var Field_Multiple = Field.extend(_.extend({}, Upfront_Icon_Mixin, {
		get_values_html: function () {
			return _.map(this.options.values, this.get_value_html, this).join('');
		}
	}));
	
	var Field_Select = Field_Multiple.extend(_.extend({}, Upfront_Scroll_Mixin, {
		selected_state: 'checked',
		className: 'upfront-field-wrap upfront-field-wrap-select',
		render: function () {
			var me = this;
			var select_label = ( this.options.select_label ) ? this.options.select_label : '';
			this.$el.html('');
			if ( this.label )
				this.$el.append(this.get_label_html());
			this.$el.append(this.get_field_html());
			if ( !this.multiple ){
				this.$el.on('click', '.upfront-field-select-value', function(e){
					e.stopPropagation();
					if ( me.options.disabled )
						return;
					me.$el.find('.upfront-field-select').addClass('upfront-field-select-expanded');
				});
				this.$el.on('click', '.upfront-field-select-option label', function(e){
					e.stopPropagation();
					if ( $(this).closest('.upfront-field-select-option').hasClass('upfront-field-select-option-disabled') )
						return;
					me.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
				});
				$('#settings').on('click', '.upfront-settings_panel', function(){
					me.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
				});
			}
			this.$el.on('change', '.upfront-field-select-option input', function(){
				var $select_value = me.$el.find('.upfront-field-select-value');
				var $checked = me.$el.find('.upfront-field-select-option input:checked');
				if ( $checked.size() == 1 && !this.multiple )
					$select_value.text($checked.closest('.upfront-field-select-option').text());
				else
					$select_value.text( select_label ? select_label : me.$el.find('.upfront-field-select-option:eq(0)').text() );
				me.$el.find('.upfront-field-select-option').each(function(){
					if ( $(this).find('input:checked').size() > 0 )
						$(this).addClass('upfront-field-select-option-selected');
					else
						$(this).removeClass('upfront-field-select-option-selected');
				});
			});;
			this.stop_scroll_propagation(this.$el.find('.upfront-field-select-options'));
			if ( ! this.multiple && ! this.get_saved_value() )
				this.$el.find('.upfront-field-select-option:eq(0) input').prop('checked', true);
			this.$el.find('.upfront-field-select-option:eq(0) input').trigger('change');

			this.trigger('rendered');
		},
		get_field_html: function () {
			var attr = {
				'class': 'upfront-field-select',
				'id': this.get_field_id()
			};
			attr.class += ' upfront-field-select-' + ( this.options.multiple ? 'multiple' : 'single' );
			if ( this.options.disabled )
				attr.class += ' upfront-field-select-disabled';
			if ( this.options.style == 'zebra' )
				attr.class += ' upfront-field-select-zebra';
			//return '<select ' + this.get_field_attr_html(attr) + '>' + this.get_values_html() + '</select>';
			return '<div ' + this.get_field_attr_html(attr) + '><div class="upfront-field-select-value"></div><ul class="upfront-field-select-options">' + this.get_values_html() + '</ul></div>';
		},
		get_value_html: function (value, index) {
			var id = this.get_field_id() + '-' + index;
			var attr = {
				'type': ( this.multiple ? 'checkbox' : 'radio' ),
				'id': id,
				'name': this.get_field_name(),
				'class': 'upfront-field-' + ( this.multiple ? 'checkbox' : 'radio' ),
				'value': value.value
			};
			var saved_value = this.get_saved_value();
			var classes = 'upfront-field-select-option';
			if ( value.disabled ) {
				attr.disabled = 'disabled';
				classes += ' upfront-field-select-option-disabled';
			}
			if ( this.multiple && _.contains(saved_value, value.value) )
				attr.checked = 'checked';
			else if ( ! this.multiple && saved_value == value.value )
				attr.checked = 'checked';
			if ( attr.checked )
				classes += ' upfront-field-select-option-selected';
			classes += ' upfront-field-select-option-' + ( index%2 == 0 ? 'odd' : 'even' );
			//return '<option ' + this.get_field_attr_html(attr) + '>' + value.label + '</option>';
			var input = '<input ' + this.get_field_attr_html(attr) + ' />';
			return '<li class="' + classes + '">' + '<label for="' + id + '">' + this.get_icon_html(value.icon) + '<span class="upfront-field-label-text">' + value.label + '</span></label>' + input + '</li>';
		}
	}));
	
	
	var Field_Multiple_Input = Field_Multiple.extend({
		selected_state: 'checked',
		render: function () {
			var me = this;
			this.$el.html('');
			if ( this.label )
				this.$el.append(this.get_label_html());
			this.$el.append(this.get_field_html());
			this.$el.on('change', '.upfront-field-multiple input', function(){
				me.$el.find('.upfront-field-multiple').each(function(){
					if ( $(this).find('input:checked').size() > 0 )
						$(this).addClass('upfront-field-multiple-selected');
					else
						$(this).removeClass('upfront-field-multiple-selected');
				});
			});

			this.trigger('rendered');
		},
		get_field_html: function () {
			return this.get_values_html();
		},
		get_value_html: function (value, index) {
			var id = this.get_field_id() + '-' + index;
			var classes = "upfront-field-multiple";
			var attr = {
				'type': this.type,
				'id': id,
				'name': this.get_field_name(),
				'value': value.value,
				'class': 'upfront-field-' + this.type
			};
			var saved_value = this.get_saved_value();
			if ( this.options.layout && this.options.layout == 'vertical' )
				classes += ' upfront-field-multiple-vertical';
			if ( value.disabled ){
				attr.disabled = 'disabled';
				classes += ' upfront-field-multiple-disabled';
			}
			if ( this.multiple && _.contains(saved_value, value.value) )
				attr.checked = 'checked';
			else if ( ! this.multiple && saved_value == value.value )
				attr.checked = 'checked';
			if ( attr.checked )
				classes += ' upfront-field-multiple-selected';
			return '<span class="' + classes + '"><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '">' + this.get_icon_html(value.icon) + '<span class="upfront-field-label-text">' + value.label + '</span></label></span>';
		}
	});
	
	var Field_Radios = Field_Multiple_Input.extend({
		className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
		type: 'radio'
	});
	
	var Field_Checkboxes = Field_Multiple_Input.extend({
		className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes',
		type: 'checkbox',
		multiple: true
	});
	
	var Field_Multiple_Suggest = Field.extend(_.extend({}, Upfront_Scroll_Mixin, {
		events: {
			"click .upfront-suggest-add": "add_list",
			"focus .upfront-field-text-suggest": "reveal_suggest",
			"keyup .upfront-field-text-suggest": "update_suggest"
		},
		multiple: true,
		selected_state: 'checked',
		added_list: [],
		checked_list: [],
		suggest_list: [],
		render: function () {
			var me = this;
			this.$el.html('');
			if ( this.label )
				this.$el.append(this.get_label_html());
			this.$el.append('<div class="upfront-suggest-wrap" />');
			var $wrap = this.$el.find('.upfront-suggest-wrap')
			$wrap.append(this.get_field_html());
			$wrap.append('<div class="upfront-suggest-list-wrap" />');
			this.checked_list = this.get_saved_value();
			var $list_wrap = this.$el.find('.upfront-suggest-list-wrap');
			$list_wrap.append('<ul class="upfront-suggest-lists">' + this.get_suggest_list_html() + '</ul>');
			$list_wrap.append('<div class="upfront-suggest-add-wrap"><span class="upfront-suggest-add-value"></span><span class="upfront-suggest-add">Add New</span></div>');
			this.stop_scroll_propagation(this.$el.find('.upfront-suggest-lists'));
			this.$el.on('change', '.upfront-suggest-list input', function () {
				var value = $(this).val();
				if ( !$(this).is(':checked') && _.contains(me.checked_list, value) )
					me.checked_list = _.without(me.checked_list, value);
				else
					me.checked_list.push(value);
			});
			this.$el.on('click', function (e) {
				e.stopPropagation();
			});
			$('#settings').on('click', '.upfront-settings_panel', function(){
				me.$el.find('.upfront-suggest-list-wrap').removeClass('upfront-suggest-list-wrap-expanded');
			});

			this.trigger('rendered');
		},
		reveal_suggest: function () {
			this.$el.find('.upfront-suggest-list-wrap').addClass('upfront-suggest-list-wrap-expanded');
			this.update_suggest();
		},
		update_suggest: function () {
			var value = this.get_field_input_value();
			this.$el.find('.upfront-suggest-lists').html(this.get_suggest_list_html());
			if ( value ){
				this.$el.find('.upfront-suggest-add-wrap').show()
				this.$el.find('.upfront-suggest-add-value').text(value);
				this.$el.find('.upfront-suggest-add').toggle( !(_.contains(this.suggest_list, value)) );
			}
			else {
				this.$el.find('.upfront-suggest-add-wrap').hide();
			}
		},
		get_field_html: function () {
			var attr = {
				'type': 'text',
				'class': 'upfront-field upfront-field-text upfront-field-text-suggest',
				'id': this.get_field_id()
			};
			if ( this.options.placeholder )
				attr['placeholder'] = this.options.placeholder;
			return '<input ' + this.get_field_attr_html(attr) + ' />';
		},
		get_suggest_list_html: function () {
			var value = this.get_field_input_value();
			var rgx = value ? new RegExp('('+value+')', 'ig') : false;
			var lists = this.get_suggest_list(rgx);
			var me = this;
			return _.map(lists, function(list, index){
				var id = me.get_field_id() + '-' + index;
				var attr = {
					'type': 'checkbox',
					'id': id,
					'name': me.get_field_name(),
					'value': list,
					'class': 'upfront-field-checkbox'
				};
				if ( _.contains(me.checked_list, list) )
					attr.checked = 'checked';
				var label = rgx ? list.replace(rgx, '<span class="upfront-suggest-match">$1</span>') : list;
				return '<li class="upfront-suggest-list"><input ' + me.get_field_attr_html(attr) + ' /><label for="' + id + '">' + label +'</label></li>';
			}).join('');
		},
		get_suggest_list: function (rgx) {
			var suggest = [];
			_.each([this.options.source, this.added_list, this.get_saved_value()], function(list, index){
				_.each(list, function(value){
					if ( !( index == 2 && _.contains(suggest, value) ) && ( ( rgx && value.match(rgx) ) || !rgx ) )
						suggest.push(value);
				});
			});
			this.suggest_list = suggest;
			return suggest;
		},
		get_field_input_value: function () {
			return this.$el.find('#'+this.get_field_id()).val();
		},
		empty_field_input_value: function () {
			return this.$el.find('#'+this.get_field_id()).val('');
		},
		add_list: function (e) {
			var value = this.get_field_input_value();
			this.added_list.push(value);
			this.checked_list.push(value);
			this.empty_field_input_value();
			this.update_suggest();
		}
	}));

	var SettingsItem = Backbone.View.extend({
		group: true, 
		get_name: function () {
			if ( this.fields.length == 1 )
				return this.fields[0].get_name();
			else if ( this.fields.length > 1 )
				return this.fields.map(function(field){ return field.get_name(); });
		},
		get_value: function () {
			if ( this.fields.length == 1 )
				return this.fields[0].get_value();
			else if ( this.fields.length > 1 )
				return this.fields.map(function(field){ return field.get_value(); });
		},

		get_title: function () {
			return this.options.title ? this.options.title : '';
		},

		initialize: function (opts) {
			var me = this;
			this.fields = opts.fields ? _(opts.fields) : _([]);
			this.group = typeof opts.group != 'undefined' ? opts.group : true;
			this.on('panel:set', function(){
				me.fields.each(function(field){
					field.panel = me.panel;
					field.trigger('panel:set');
				});
			});
		},
		
		render: function () {
			if(this.group){
				this.$el.append(
					'<div class="upfront-settings-item">' +
						'<div class="upfront-settings-item-title">' + this.get_title() + '</div>' +
						'<div class="upfront-settings-item-content"></div>' +
					'</div>'
				);
			}
			else
				this.$el.append('<div class="upfront-settings-item-content"></div>');

			$content = this.$el.find('.upfront-settings-item-content');
			this.fields.each(function(field){
				field.render();
				$content.append(field.el);
			});

			this.trigger('rendered');
		},
		
		save_fields: function () {
			var changed = _([]);
			this.fields.each(function(field, index, list){
				if(field.property){
					var value = field.get_value();
					var saved_value = field.get_saved_value();
					if ( ! field.multiple && value != saved_value ){
						changed.push(field);
					}
					else if ( field.multiple && (value.length != saved_value.length || _.difference(value, saved_value).length != 0) ) {
						changed.push(field);
					}
				}
			});
			changed.each(function(field, index, list){
				console.log([index, list.length]);
				field.property.set({'value': field.get_value()}, {'silent': (index < list.length-1)});
			});
		},
		
		//@TODO remove wrap method below when all elements have changed to use setting fields API
		wrap: function (wrapped) {
			if (!wrapped) return false;
			var title = wrapped.title || '',
				markup = wrapped.markup || wrapped
			;
			this.$el.append(
				'<div id="usetting-' + this.get_name() + '" class="upfront-settings-item">' +
					'<div class="upfront-settings-item-title">' + title + '</div>' +
					'<div class="upfront-settings-item-content">' + markup + '</div>' +
				'</div>'
			);
		}
	});
	
	var SettingsItemTabbed = Backbone.View.extend(_.extend({}, Upfront_Icon_Mixin, {
		className: 'upfront-settings-item-tab-wrap',
		radio: false,
		is_default: false,
		events: {
			"click .upfront-settings-item-tab": "reveal"
		},
		initialize: function (opts) {
			this.settings = opts.settings ? _(opts.settings) : _([]);
			this.radio = ( typeof opts.radio != 'undefined' ) ? opts.radio : this.radio;
			this.is_default = ( typeof opts.is_default != 'undefined' ) ? opts.is_default : this.is_default;
		},
		get_title: function () {
			return this.options.title ? this.options.title : '';
		},
		get_icon: function () {
			return this.options.icon ? this.options.icon : '';
		},
		get_property: function () {
			return this.options.property ? this.options.property : '';
		},
		get_value: function () {
			return this.options.value ? this.options.value : '';
		},
		get_property_model: function () {
			var property = this.get_property();
			if ( !property )
				return false;
			return this.model.get_property_by_name(property);
		},
		get_property_value: function () {
			var property_model = this.get_property_model();
			return property_model ? property_model.get('value') : '';
		},
		render: function () {
			this.$el.html('');
			this.$el.append('<div class="upfront-settings-item-tab" />');
			this.$el.append('<div class="upfront-settings-item-tab-content" />');
			var $tab = this.$el.find('.upfront-settings-item-tab'),
				$tab_content = this.$el.find('.upfront-settings-item-tab-content');
			if ( this.radio ){
				var property_model = this.get_property_model();
				if ( ! property_model ){
					if ( this.is_default )
						this.model.init_property(this.get_property(), this.get_value());
				}
				var id = this.cid + '-' + this.get_property();
				var $label = $('<label for="' + id + '" />')
				var checked = ( this.get_property_value() == this.get_value() );
				$label.append(this.get_icon_html(this.get_icon()));
				$label.append('<span class="upfront-settings-item-tab-radio-text">' + this.get_title() + '</span>');
				$tab.append($label);
				$tab.append('<input type="radio" id="' + id + '" class="upfront-field-radio" name="' + this.get_property() + '" value="' + this.get_value() + '" ' + ( checked ? 'checked="checked"' : '' ) +  ' />');
				this.$el.addClass('upfront-settings-item-tab-radio');
			}
			else {
				$tab.text(this.get_title());
			}
			this.settings.each(function(setting){
				setting.render();
				$tab_content.append(setting.el);
			});
			this.panel.on('rendered', this.panel_rendered, this);

			this.trigger('rendered');
		},
		conceal: function () {
			this.$el.removeClass('upfront-settings-item-tab-active');
		},
		reveal: function () {
			this.panel.settings.invoke('conceal');
			this.$el.addClass('upfront-settings-item-tab-active');
			if ( this.radio )
				this.$el.find('.upfront-settings-item-tab input').prop('checked', true);
		},
		panel_rendered: function () {
			if ( this.radio && (this.get_property_value() == this.get_value()) )
				this.reveal();
		},
		save_fields: function () {
			this.settings.invoke('save_fields');
			if ( this.radio && this.$el.find('.upfront-settings-item-tab input:checked').size() > 0 ) {
				var property_model = this.get_property_model();
				if ( property_model )
					property_model.set({'value': this.get_value()});
				else
					this.model.init_property(this.get_property(), this.get_value());
			}
		}
	}));

	var SettingsPanel = Backbone.View.extend(_.extend({}, Upfront_Scroll_Mixin, {
		//tagName: "ul",
		className: 'upfront-settings_panel_wrap',
		
		events: {
			"click .upfront-save_settings": "on_save",
			"click .upfront-cancel_settings": "on_cancel",
			"click .upfront-settings_label": "on_toggle"
		},

		get_title: function () {
			return this.options.title ? this.options.title : '';
		},

		get_label: function () {
			return this.options.label ? this.options.label : '';
		},

		initialize: function (opts) {
			var me = this;
			this.settings = opts.settings ? _(opts.settings) : _([]);
			this.settings.each(function(setting){
				setting.panel = me;
				setting.trigger('panel:set');
			});
			this.tabbed = ( typeof opts.tabbed != 'undefined' ) ? opts.tabbed : this.tabbed;
		},
		
		tabbed: false,

		render: function () {
			this.$el.empty().show();
			this.$el.append('<div class="upfront-settings_label" />');
			this.$el.append('<div class="upfront-settings_panel" style="display:none"><div class="upfront-settings_panel_scroll" /></div>');
			var $label = this.$el.find(".upfront-settings_label"),
				$panel = this.$el.find(".upfront-settings_panel"),
				$panel_scroll = this.$el.find(".upfront-settings_panel_scroll"),
				me = this
			;
			$label.append(this.get_label());
			this.settings.each(function (setting) {
				if ( ! setting.panel )
					setting.panel = me;
				setting.render();
				$panel_scroll.append(setting.el)
			});
			if ( this.tabbed ) {
				var first_tab = this.settings.first();
				if ( !first_tab.radio )
					first_tab.reveal();
				$panel_scroll.append('<div class="upfront-settings-tab-height" />');
			}
			this.stop_scroll_propagation($panel_scroll);
			$panel.append(
				"<div class='upfront-settings-button_panel'>" +
					//"<button type='button' class='upfront-cancel_settings'><i class='icon-arrow-left'></i> Back</button>" +
					"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> Save</button>" +
				'</div>'
			);
			this.trigger('rendered');
		},

		conceal: function () { 
			this.$el.find(".upfront-settings_panel").hide();
			this.$el.find(".upfront-settings_label").removeClass("active");
			//this.$el.find(".upfront-settings_label").show();
			this.trigger('concealed');
		},

		reveal: function () {
			this.$el.find(".upfront-settings_label").addClass("active");
			//this.$el.find(".upfront-settings_label").hide();
			this.$el.find(".upfront-settings_panel").show();
			if ( this.tabbed ) {
				var tab_height = 0;
				this.$el.find('.upfront-settings-item-tab-content').each(function(){
					var h = $(this).outerHeight(true);
					tab_height = h > tab_height ? h : tab_height;
				});
				this.$el.find('.upfront-settings-tab-height').css('height', tab_height);
			}
			this.trigger('revealed');
		},

		show: function () {
			this.$el.show();
		},
		
		hide: function () {
			this.$el.hide();
		},

		is_active: function () {
			return this.$el.find(".upfront-settings_panel").is(":visible");
		},

		on_toggle: function () {
			this.trigger("upfront:settings:panel:toggle", this);
			this.show();
		},

		on_save: function () {
			if (!this.settings) return false;

			var me = this;
			this.settings.each(function (setting) {
				if ( setting.fields.size() > 0 ) {
					setting.save_fields();
				}
				else {
					var value = me.model.get_property_value_by_name(setting.get_name());
					if ( value != setting.get_value() )
						me.model.set_property(
							setting.get_name(),
							setting.get_value()
						);
				}
			});
			this.trigger("upfront:settings:panel:saved", this);
			Upfront.Events.trigger("entity:settings:deactivate");
		},
		
		on_cancel: function () {
			this.trigger("upfront:settings:panel:close", this);
		}

	}));

	var Settings = Backbone.View.extend({
		get_title: function () {
			return "Settings";
		},

		render: function () {
			var me = this,
				$view = me.for_view.$el.find(".upfront-editable_entity"),
				view_pos = $view.offset(),
				view_pos_right = view_pos.left + $view.outerWidth(),
				$button = me.for_view.$el.find(".upfront-entity-settings_trigger"),
				button_pos = $button.offset(),
				button_pos_right = button_pos.left + $button.outerWidth(),
				$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				main_pos = $main.offset(),
				main_pos_right = main_pos.left + $main.outerWidth()
			;
			me.$el
				.empty()
				.show()
				.html(
					'<div class="upfront-settings_title">' + this.get_title() + '</div>'
				)
			;
			me.panels.each(function (panel) {
				panel.render();
				panel.on("upfront:settings:panel:toggle", me.toggle_panel, me);
				panel.on("upfront:settings:panel:close", me.close_panel, me);
				panel.on("upfront:settings:panel:refresh", me.refresh_panel, me);
				me.$el.append(panel.el)
			});
			this.toggle_panel(this.panels.first());
			
			var label_width = this.panels.first().$el.find('.upfront-settings_label').outerWidth(),
				panel_width = this.panels.first().$el.find('.upfront-settings_panel').outerWidth();

			this.$el
				.css({
					"position": "absolute",
					"z-index": 10000000
				})
				.offset({
					"top": view_pos.top /*+ $view.height() + 16*/,
					"left": view_pos.left + $view.outerWidth() - ((view_pos_right+label_width+panel_width > main_pos_right) ? label_width+panel_width+(view_pos_right-button_pos.left)+5 : 0)
				})
				.addClass('upfront-ui')
			;
		},

		set_title: function (title) {
			if (!title || !title.length) return false;
			this.$el.find(".upfront-settings_title").html(title);
		},

		toggle_panel: function (panel) {
			this.panels.invoke("conceal");
			panel.show();
			panel.reveal();
			this.set_title(panel.get_title());
			var min_height = 0;
			this.panels.each(function(p){
				min_height += p.$el.find(".upfront-settings_label").outerHeight();
			});
			var panel_height = panel.$el.find(".upfront-settings_panel").outerHeight() - 1;
			if ( panel_height >= min_height ) {
				this.$el.css('height', panel_height);
			}
			else {
				panel.$el.find(".upfront-settings_panel").css('height', min_height);
				this.$el.css('height', min_height);
			}
		},

		refresh_panel: function (panel) {
			if (panel.is_active()) this.toggle_panel(panel);
		},

		close_panel: function (panel) {
			this.panels.invoke("conceal");
			this.panels.invoke("show");
			this.set_title(this.get_title());
		}
	});

	var ContentEditorUploader = Backbone.View.extend({

		initialize: function () {
			window.send_to_editor = this.add_to_editor;
			Upfront.Events.on("upfront:editor:init", this.rebind_ckeditor_image, this);
		},
		open: function () {
			var height = $(window).height()*0.67;
			tb_show("Upload Image", Upfront.Settings.admin_url + "media-upload.php?type=image&TB_iframe=1&width=640&height="+height);
			return false;
		},
		close: function () {
			tb_remove();
			this.remove();
		},
		rebind_ckeditor_image: function () {
			var me = this;
			_(CKEDITOR.instances).each(function (editor) {
				var img = editor.getCommand('image');
				if (img && img.on) img.on("exec", me.open, me);
			});
		},
		add_to_editor: function (html) {
			var instance = CKEDITOR.currentInstance,
				el = CKEDITOR.dom.element.createFromHtml(html)
			;
			if (instance) instance.insertElement(el);
			tb_remove();
		}
	});

	var NotifierView = Backbone.View.extend({
		notices: new Backbone.Collection([]),
		elId: 'upfront-notice',
		timer: false,
		timeoutTime: 5000,
		$notice: false,
		tpl: _.template($(_Upfront_Templates.popup).find('#upfront-notifier-tpl').html()),
		initialize: function(options){
			this.notices.on('add', this.messageAdded, this);
			this.notices.on('remove', this.messageRemoved, this);

			$('body').append(this.tpl({}));

			this.setElement($('#' + this.elId));

			// Hey admin bar!
			if($('#wpadminbar').length)
				$('#upfront-notifier').css({top: 28});
		},
		addMessage: function(message, type){
			var notice = {
				message: message ? message : 'No message', 
				type: type ? type : 'info'
			};
			
			this.notices.add(notice);
		},
		show: function(notice) {
			var me = this;
			this.setMessage(notice);
			this.$el.addClass('notify open')
				.removeClass('out')
			;
			this.timer = setTimeout(function(){
				me.notices.remove(notice);
			}, this.timeoutTime)
		},
		replace: function(notice) {
			var me = this;
			this.setMessage(notice);
			this.timer = setTimeout(function(){
				me.notices.remove(notice);
			}, this.timeoutTime);

			this.$el.removeClass('notify').
				addClass('shake');

			setTimeout(function(){
				me.$el.removeClass('shake');
			}, this.timeoutTime / 2);
		},
		setMessage: function(notice) {
			this.$el.removeClass('info warning error')
				.addClass(notice.get('type'))
				.html(notice.get('message'))
			;
		},
		close: function() {
			this.$el.addClass('out');
			this.$el.removeClass('notify shake open');
		},
		messageAdded: function(notice){
			if(! this.$el.hasClass('notify')){
				this.show(notice);
			}
		},
		messageRemoved: function(notice){
			if(this.notices.length)
				this.replace(this.notices.at(0));
			else
				this.close();
		}
	});

	var notifier = new NotifierView();

	return {
		"Editor": {
			"Property": Property,
			"Properties": Properties,
			"Commands": Commands,
			"Command": Command,
			"Command_Merge": Command_Merge,
			"Layouts": LayoutSizes,
			"Settings": {
				"Settings": Settings,
				"Panel": SettingsPanel,
				"Item": SettingsItem,
				"ItemTabbed": SettingsItemTabbed,
			},
			"Field": {
				"Field": Field,
				"Text": Field_Text,
				"Email": Field_Email,
				"Textarea": Field_Textarea,
				"Color": Field_Color,
				"Multiple_Suggest": Field_Multiple_Suggest,
				"Number": Field_Number,
				"Select": Field_Select,
				"Radios": Field_Radios,
				"Checkboxes": Field_Checkboxes
			},
			"Sidebar": {
				"Sidebar": Sidebar,
				"Panel": SidebarPanel,
				"Element": DraggableElement
			},
			notify : function(message, type){
				notifier.addMessage(message, type);
			}
		},	
		"ContentEditor": {
			"Sidebar": ContentEditorSidebar,
			"Uploader": new ContentEditorUploader
		}
	};
});

})(jQuery);

//@ sourceURL=upfront-views-editor.js