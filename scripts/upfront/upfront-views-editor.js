(function ($) {

define([
    "text!upfront/templates/property.html",
    "text!upfront/templates/properties.html",
    "text!upfront/templates/property_edit.html",
    "text!upfront/templates/overlay_grid.html",
    "text!upfront/templates/edit_background_area.html",
    "text!upfront/templates/sidebar_settings_lock_area.html",
    "text!upfront/templates/sidebar_settings_background.html",
    "text!upfront/templates/popup.html",
    "text!upfront/templates/region_edit_panel.html"
  ], function () {
  var _template_files = [
    "text!upfront/templates/property.html",
    "text!upfront/templates/properties.html",
    "text!upfront/templates/property_edit.html",
    "text!upfront/templates/overlay_grid.html",
    "text!upfront/templates/edit_background_area.html",
    "text!upfront/templates/sidebar_settings_lock_area.html",
    "text!upfront/templates/sidebar_settings_background.html",
    "text!upfront/templates/popup.html",
    "text!upfront/templates/region_edit_panel.html"
  ];

	// Auto-assign the template contents to internal variable
	var _template_args = arguments,
		_Upfront_Templates = {}
	;
	_(_template_files).each(function (file, idx) {
		if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
	});

	console.log('refresh');

	Upfront.Events.on('data:ready', function(){
		Upfront.data.tpls = _Upfront_Templates;
	});

	var Upfront_Scroll_Mixin = {
		stop_scroll_propagation: function ($el) {
			$el.on('DOMMouseScroll mousewheel', function(ev) {
				var $this = $(this),
					scrollTop = this.scrollTop,
					scrollHeight = this.scrollHeight,
					height = $this.outerHeight(),
					delta = ev.originalEvent.wheelDelta,
					up = delta > 0,
					scroll = scrollHeight > height;

				if ( !scroll )
					return;

				ev.stopPropagation();

				var prevent = function() {
					ev.preventDefault();
					ev.returnValue = false;
					return false;
				};

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
/*
			this.model.get("properties").bind("change", this.render, this);
			this.model.get("properties").bind("add", this.render, this);
			this.model.get("properties").bind("remove", this.render, this);
			*/

			this.listenTo(this.model.get("properties"), 'change', this.render);
			this.listenTo(this.model.get("properties"), 'add', this.render);
			this.listenTo(this.model.get("properties"), 'remove', this.render);
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
						{"name": "class", "value": "c24 clr"}
					]
				});
			module.set_property('wrapper_id', wrapper_id);
			wrappers.add(wrapper);
			region.get("modules").add(module);
			Upfront.Events.trigger("entity:module:added", module, region);
		}
	});

	var Command_Logo = Command.extend({
		className: "command-logo",
		render: function () {
			var url = Upfront.Settings.site_url;
			if(url[url.length - 1] != '/')
				url += '/';

			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT )
				this.$el.html('<a class="upfront-logo" href="' + url + '"></a>');
			else
				this.$el.html('<a class="upfront-logo upfront-logo-small" href="' + url + '"></a>');
		},
		on_click: function () {
			/*var root = Upfront.Settings.site_url;
			root = root[root.length - 1] == '/' ? root : root + '/';

			if(window.location.origin + window.location.pathname != root)
				Upfront.Application.navigate('/' + root.replace(window.location.origin, '') + window.location.search, {trigger: true});*/
		}
	});

	var Command_Exit = Command.extend({
		className: "command-exit upfront-icon upfront-icon-exit",
		render: function () {
		},
		on_click: function () {
			// Upfront.Events.trigger("command:exit");
			var url = window.location.pathname,
				loading = new Upfront.Views.Editor.Loading({
					loading: "Exiting upfront...",
					done: "Wow, those are cool!",
					fixed: true
				})
			;

			loading.render();
			$('body').append(loading.$el);

			if(url.indexOf('/create_new/') !== -1)
				return (window.location.href = Upfront.Settings.site_url);
			if(url.indexOf('/edit/') !== -1 && _upfront_post_data && _upfront_post_data.post_id)
				return (window.location.href = Upfront.Settings.site_url + '/?p=' + _upfront_post_data.post_id);

			window.location.reload(true);
		}
	});


	var Command_NewPost = Command.extend({
		"className": "command-new-post",
		postView: false,
		postType: 'post',
		setMode: false,
		initialize: function () {
			this.setMode = Upfront.Application.MODE.CONTENT;
		},
		render: function () {
			Upfront.Events.trigger("command:newpost:start", true);
			this.$el.addClass('upfront-icon upfront-icon-post');
			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT )
				this.$el.removeClass('tooltip-inline tooltip-bottom').html("New post");
			else
				this.$el.addClass('tooltip-inline tooltip-bottom').html('<span class="tooltip-content">New post</span>');
		},
		on_click: function (e) {
			e.preventDefault();

			if(Upfront.Settings.LayoutEditor.newpostType == this.postType)
				return Upfront.Views.Editor.notify('You are already creating a new ' + this.postType + '.', 'warning');

			return Upfront.Application.navigate('/create_new/post', {trigger: true});

			//window.location = Upfront.Settings.Content.create.post;
			var me = this,
				loading = new Upfront.Views.Editor.Loading({
					loading: "Preparing new " + this.postType + "...",
					done: "Wow, those are cool!",
					fixed: true
				})
			;

			loading.render();
			$('body').append(loading.$el);

			if(Upfront.Settings.LayoutEditor.newpostType == this.postType)
				return Upfront.Views.Editor.notify('You are already creating a new ' + this.postType + '.', 'warning');

			if (this.setMode !== false && Upfront.Application.mode.current != this.setMode)
				Upfront.Application.set_current(Upfront.Settings.Application.MODE.CONTENT);
			Upfront.Application.new_post(this.postType)
				.done(function(post){
					loading.done();
					loading = false;
				})
			;

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
		initialize: function () {
			this.setMode = Upfront.Application.MODE.LAYOUT;
		},
		render: function () {
			Upfront.Events.trigger("command:newpage:start", true);
			this.$el.addClass('upfront-icon upfront-icon-page');
			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT )
				this.$el.removeClass('tooltip-inline tooltip-bottom').html("New page");
			else
				this.$el.addClass('tooltip-inline tooltip-bottom').html('<span class="tooltip-content">New page</span>');
		},
		on_click: function(e){
			e.preventDefault();
			Upfront.Application.navigate('/create_new/page', {trigger: true});
		}
	});

	var Command_SaveLayout = Command.extend({
		"className": "command-save",
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-save');
			this.$el.html("Save");
		},
		on_click: function () {
			if ( _upfront_post_data.layout.specificity && _upfront_post_data.layout.item )
				Upfront.Events.trigger("command:layout:save_as");
			else
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
	var Command_PreviewLayout = Command.extend({
		className: "command-preview",
		can_preview: false,
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-save');
			//this.$el.html("Preview");
			this.preview_built();
			Upfront.Events.on("preview:build:start", this.building_preview, this);
			Upfront.Events.on("preview:build:stop", this.preview_built, this);
		},
		on_click: function () {
			if (this.can_preview) Upfront.Events.trigger("command:layout:preview");
		},
		building_preview: function () {
			this.$el.html("Building...");
			this.can_preview = false;
		},
		preview_built: function () {
			this.$el.html("Preview");
			this.can_preview = true;
		},

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
			this.$el.css("opacity", 1);
		},
		deactivate: function () {
			this.$el.css("opacity", 0.5);
		},
		on_click: function () {
			var me = this,
				loading = new Upfront.Views.Editor.Loading({
					loading: "Undoing...",
					done: "Thank you for waiting",
					fixed: true
				})
			;
			loading.render();
			$('body').append(loading.$el);
			loading.done(function () {
				setTimeout(function () {
					me.model.restore_undo_state();
					Upfront.Events.trigger("command:undo")
					me.render();
				}, 100); // Need the timeout to start loading first
			});
			/*
			this.model.restore_undo_state();
			Upfront.Events.trigger("command:undo")
			this.render();
			*/
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
			this.$el.css("opacity", 1);
		},
		deactivate: function () {
			this.$el.css("opacity", 0.5);
		},
		on_click: function () {
			var me = this,
				loading = new Upfront.Views.Editor.Loading({
					loading: "Redoing...",
					done: "Thank you for waiting",
					fixed: true
				})
			;
			loading.render();
			$('body').append(loading.$el);
			loading.done(function () {
				setTimeout(function () {
					me.model.restore_redo_state();
					Upfront.Events.trigger("command:redo")
					me.render();
				}, 100); // Need the timeout to start loading first
			});
			/*
			this.model.restore_redo_state();
			Upfront.Events.trigger("command:redo")
			this.render();
			*/
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
					{"name": "class", "value": "c24"}
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
		className: "command-grid",
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-grid');
			//this.$el.html('Toggle grid');
			this.listenTo(Upfront.Events, "entity:region:added", this.update_grid);
		},
		on_click: function () {
			$('.upfront-overlay-grid').size() || this.create_grid();
			this.toggle_grid();
		},
		create_grid: function () {
			this.update_grid();
			//this.attach_event();
		},
		toggle_grid: function () {
			if(!Upfront.Application.get_gridstate())
				this.show_grid();
			else
				this.hide_grid();
		},
		show_grid: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			$main.addClass('show-debug');
			this.$el.addClass('upfront-icon-grid-active');
			$('.upfront-overlay-grid').addClass('upfront-overlay-grid-show');
			Upfront.Application.set_gridstate(true);
		},
		hide_grid: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			$main.removeClass('show-debug');
			this.$el.removeClass('upfront-icon-grid-active');
			$('.upfront-overlay-grid').removeClass('upfront-overlay-grid-show');
			Upfront.Application.set_gridstate(false)
		},
		update_grid: function (size) {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				columns = Upfront.Settings.LayoutEditor.Grid.size,
				size_class = Upfront.Settings.LayoutEditor.Grid.class,
				template = _.template(_Upfront_Templates.overlay_grid, {columns: columns, size_class: size_class, style: 'simple'});
			$('.upfront-overlay-grid').remove();
			$('.upfront-grid-layout').prepend(template);
			!Upfront.Application.get_gridstate() || this.show_grid();
		},
		attach_event: function () {
			var me = this;
			Upfront.Application.layout_sizes.sizes.each(function (layout_size) {
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

	var Command_ToggleMode = Command.extend({
		enabled: true,
		initialize: function () {
			Upfront.Events.on('upfront:element:edit:start', this.disable_toggle, this);
			Upfront.Events.on('upfront:element:edit:stop', this.enable_toggle, this);
		},
		render: function () {
			this.$el.html(_.template(
				"<span title='toggle editing mode'>Current mode: {{mode}}</span>",
				{mode: Upfront.Application.get_current()}
			));
		},
		on_click: function () {
			if ( !this.enabled )
				return false;
			var mode = Upfront.Application.mode && Upfront.Application.mode.current && Upfront.Application.mode.current != Upfront.Application.MODE.CONTENT
				? Upfront.Application.MODE.CONTENT
				: Upfront.Application.mode.last
			;
			Upfront.Application.start(mode);
		},
		disable_toggle: function () {
			this.$el.css('opacity', 0.5);
			this.enabled = false;
		},
		enable_toggle: function () {
			this.$el.css('opacity', 1);
			this.enabled = true;
		}
	});

	var Command_ToggleMode_Small = Command_ToggleMode.extend({
		className: 'command-toggle-mode upfront-icon',
		current_mode: false,
		render: function () {
			if ( this.current_mode )
				this.$el.removeClass('command-toggle-mode-' + this.current_mode + ' upfront-icon-collapse upfront-icon-expand');
			this.current_mode = Upfront.Application.get_current();
			var icon = ( this.current_mode != Upfront.Application.MODE.CONTENT ) ? 'upfront-icon-collapse' : 'upfront-icon-expand';
			this.$el.addClass('command-toggle-mode-' + this.current_mode + ' ' + icon);
		}
	});


	var Command_EditBackgroundArea = Command.extend({
		"className": "command-edit-background-area",
		events: {
			"click .switch": "on_switch"
		},
    initialize: function() {
      Upfront.Events.on("command:newpage:start", this.switchOff, this);
      Upfront.Events.on("command:newpost:start", this.switchOff, this);
    },
		render: function () {
			var template = _.template(_Upfront_Templates.edit_background_area, {})
			this.$el.html(template);
		},
		on_switch: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			if ( this.$el.find('.switch-on').hasClass('active') ){ // Switch off
        this.switchOff();
			}
			else { // Switch on
				this.$el.find('.switch-off').removeClass('active');
				this.$el.find('.switch-on').addClass('active');
				$main.addClass('upfront-region-editing');
				Upfront.Events.trigger("command:region:edit_toggle", true);
			}
		},
    switchOff: function() {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
      this.$el.find('.switch-off').addClass('active');
      this.$el.find('.switch-on').removeClass('active');
      $main.removeClass('upfront-region-editing');
      Upfront.Events.trigger("command:region:edit_toggle", false);
    }
	});

	var Command_NewLayout = Command.extend({
		className: "command-new-layout",
		render: function () {
			this.$el.addClass('upfront-icon upfront-icon-layout');
			this.$el.html('New Layout');
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:create");
		}
	});

	var Command_BrowseLayout = Command.extend({
		className: "command-browse-layout",
		render: function () {
			this.$el.html('Browse Layouts');
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:browse");
		}
	});

	var Command_EditStructure = Command.extend({
		tagName: 'div',
		className: "command-link command-edit-structure",
		render: function (){
			this.$el.html('Edit Grid');
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:edit_structure");
		}
	});

	var Command_EditLayoutBackground = Command.extend({
		tagName: 'div',
		className: "command-link command-edit-bg",
		render: function (){
			this.$el.text('Edit <body> BG');
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:edit_background");
		}
	});

	var Command_EditCustomCSS = Command.extend({
		tagName: 'div',
		className: "command-edit-css",
		render: function (){
			this.$el.text('Add Custom CSS Styling');
		},
		on_click: function () {
			var editor = Upfront.Application.cssEditor,
				name = '_upfront-body_global',
				selector = editor.elementTypes.Layout.id + '-' + name,
				styleId = 'upfront-style-' + selector,
				save_t;
	        if(!$('#' + styleId).length)
	          $('body').append('<style id="' + styleId + '"></style>');
			editor.init({
				model: this.model,
				name: selector,
				type: "Layout",
				sidebar: false,
				elementSelector: '',
				element_id: 'layout',
				global: true,
				change: function(ed){
					clearTimeout(save_t);
					save_t = setTimeout(function(){
						editor.$el.find('.upfront-css-save-ok').click();
					}, 1000);
				}
			});
		}
	});

	var Command_ExportLayout = Command.extend({
		className: "command-export",
		render: function (){
			this.$el.text('Export');
		},
		on_click: function () {
			Upfront.Events.trigger("command:layout:export_theme");
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
		"className": "draggable-element upfront-no-select",
		"shadow_id": '',
		"draggable": true,
		"priority": 10000,

		add_module: function (module) {
			// Add module to shadow region so it's available to add by dragging
			var region = this.model.get("regions").get_by_name('shadow');
			this.shadow_id = Upfront.Util.get_unique_id("shadow");
			module.set({"shadow": this.shadow_id}, {silent: true});
			region.get("modules").add(module);
		}
	});

	var SidebarPanel_DraggableElements = SidebarPanel.extend({
		"className": "sidebar-panel sidebar-panel-elements",
		initialize: function () {
			this.elements = _([]);
			Upfront.Events.on("command:layout:save", this.on_save, this);
			Upfront.Events.on("command:layout:save_as", this.on_save, this);
			Upfront.Events.on("command:layout:preview", this.on_preview, this);
			Upfront.Events.on("command:layout:save_success", this.on_save_after, this);
			Upfront.Events.on("command:layout:save_error", this.on_save_after, this);
			Upfront.Events.on("entity:drag_stop", this.reset_modules, this);
			Upfront.Events.on("layout:render", this.apply_state_binding, this);
		},
		get_title: function () {
			return "Draggable Elements";
		},
		on_save: function () {
			var regions = this.model.get('regions');
			this._shadow_region = regions.get_by_name('shadow');
			regions.remove(this._shadow_region, {silent: true});
		},
		on_preview: function () { return this.on_save(); },
		apply_state_binding: function () {
			Upfront.Events.on("command:undo", this.reset_modules, this);
			Upfront.Events.on("command:redo", this.reset_modules, this);
		},
		on_render: function () {
			this.$el.find('.sidebar-panel-title').addClass('upfront-icon upfront-icon-panel-elements');
			this.elements.each(this.render_element, this);
			this.reset_modules();
			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.THEME )
				this.$el.find('.sidebar-panel-title').trigger('click');
		},
		on_save_after: function () {
			var regions = this.model.get('regions');
			if ( this._shadow_region )
				regions.add(this._shadow_region, {silent: true});
			else
				this.reset_modules();
		},
		reset_modules: function () {
			var regions = this.model.get("regions"),
				region = regions ? regions.get_by_name('shadow') : false
			;
			if (!regions) return false;
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
				var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
					$shadow = $('[data-shadow='+element.shadow_id+']'),
					main_off = $main.offset(),
					pos = $shadow.position(),
					off = $shadow.offset(),
					target_off = element.$el.offset(),
					h = $shadow.outerHeight(),
					w = $shadow.outerWidth(),
					$clone = element.$el.clone(),
					clone_h = element.$el.outerHeight(),
					clone_w = element.$el.outerWidth(),
					$element_drag_wrapper = $('<div id="element-drag-wrapper" class="upfront-ui" />'),
					$gutter = $('.upfront-grid-layout-gutter-left:first, .upfront-grid-layout-gutter-right:first');
				$shadow.css({
					position: "absolute",
					top: e.pageY-(off.top-pos.top)-(h/2)+(clone_h/2),
					left: e.pageX-(off.left-pos.left)-(w/2)+(clone_w/2),
					visibility: "hidden",
					zIndex: -1
				})
				.trigger(e)
				.one('dragstart', function (e, ui) {
					element.$el.addClass('element-drag-active');
					$('body').append($element_drag_wrapper);
					$clone.appendTo($element_drag_wrapper);
					$clone.addClass('element-dragging');
					$clone.css({
						position: "absolute",
						top: e.pageY-(clone_h/2),
						left: e.pageX-(clone_w/2),
						zIndex: 999
					});
				})
				.on('drag', function (e, ui) {
					var in_gutter = false;
					$gutter.each(function(){
						if ( in_gutter )
							return;
						var off = $(this).offset(),
							w = $(this).width();
						if ( e.pageX >= main_off.left && e.pageX >= off.left+10 && e.pageX <= off.left+w-10 )
							in_gutter = true;
					});
					if ( in_gutter )
						$clone.addClass('element-dragging-no-drop');
					else
						$clone.removeClass('element-dragging-no-drop');
					$clone.css({
						top: e.pageY-(clone_h/2),
						left: e.pageX-(clone_w/2)
					});
				})
				.one('dragstop', function (e, ui) {
					element.$el.removeClass('element-drag-active');
					$clone.remove();
					$element_drag_wrapper.remove();
				});
			});
		}
	});

	var SidebarPanel_Settings_Item = Backbone.View.extend({
		"tagName": "div",
		"className": "panel-setting upfront-no-select",
		render: function () {
			if ( this.on_render ) this.on_render();
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
				setting.delegateEvents();
				me.$el.find('.panel-section-content').append(setting.el);
			});
			if ( this.on_render ) this.on_render();
		}
	});

	var SidebarPanel_Settings_Item_Typography_Editor = SidebarPanel_Settings_Item.extend({
		_loaded: false,
	    fields: {},
	    current_element: '',
	    typefaces_list: [
	    	{ name: "Default", value: '', family:'sans-serif' },
	        { name: "Arial", family:'sans-serif' },
            { name: "Arial Black", family:'sans-serif' },
            { name: "Arial Narrow", family:'sans-serif' },
            { name: "Arial Rounded MT Bold", family:'sans-serif' },
            { name: "Avant Garde", family:'sans-serif' },
            { name: "Calibri", family:'sans-serif' },
            { name: "Candara", family:'sans-serif' },
            { name: "Century Gothic", family:'sans-serif' },
            { name: "Franklin Gothic Medium", family:'sans-serif' },
            { name: "Futura", family:'sans-serif' },
            { name: "Geneva", family:'sans-serif' },
            { name: "Gill Sans", family:'sans-serif' },
            { name: "Helvetica", family:'sans-serif' },
            { name: "Impact", family:'sans-serif' },
            { name: "Lucida Grande", family:'sans-serif' },
            { name: "Optima", family:'sans-serif' },
            { name: "Segoe UI", family:'sans-serif' },
            { name: "Tahoma", family:'sans-serif' },
            { name: "Trebuchet MS", family:'sans-serif' },
            { name: "Verdana", family:'sans-serif' },
            { name: "Baskerville", family:'serif' },
            { name: "Big Caslon", family:'serif' },
            { name: "Bodoni MT", family:'serif' },
            { name: "Book Antiqua", family:'serif' },
            { name: "Calisto MT", family:'serif' },
            { name: "Cambria", family:'serif' },
            { name: "Didot", family:'serif' },
            { name: "Garamond", family:'serif' },
            { name: "Georgia", family:'serif' },
            { name: "Goudy Old Style", family:'serif' },
            { name: "Hoefler Text", family:'serif' },
            { name: "Lucida Bright", family:'serif' },
            { name: "Palatino", family:'serif' },
            { name: "Perpetua", family:'serif' },
            { name: "Rockwell", family:'serif' },
            { name: "Rockwell Extra Bold", family:'serif' },
            { name: "Times New Roman", family:'serif' },
            { name: "Andale Mono", family:'monospace' },
            { name: "Consolas", family:'monospace' },
            { name: "Courier New", family:'monospace' },
            { name: "Lucida Console", family:'monospace' },
            { name: "Lucida Sans Typewriter", family:'monospace' },
            { name: "Monaco", family:'monospace' },
	    ],
	    elements: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "blockquote"],
	    typefaces: {},
	    styles: {},
	    sizes: {},
	    colors: {},
	    line_heights: {},
		on_render: function () {
		    var me = this,
		        typefaces_list = (function(){
		            var lists = [];
		            _.each(me.typefaces_list, function(typeface){
		            	var value = typeof typeface.value != 'undefined' ? typeface.value : typeface.name;
		                lists.push({ label: typeface.name, value: value });
		            });
		            return lists;
		        })(),
    		    styles_list = (function(){
					var lists = [];
					_.each(['normal', 'italic', 'oblique'], function(style){
						_.each(_.range(100, 900, 100), function(weight){
							lists.push({ label: weight+' '+style, value: weight+' '+style });
						});
					});
  return lists;
    		    })(),
    		    options = this.model.get_property_value_by_name('typography'),
    		    $wrap_left = $('<div class="upfront-typography-fields-left" />'),
    		    $wrap_right = $('<div class="upfront-typography-fields-right" />');
			_.each(this.elements, function(element){
				var el = document.createElement(element);
				$('body').append(el);
				var styles = window.getComputedStyle(el),
					style = styles.fontStyle,
					weight = me._normalize_weight(styles.fontWeight),
					size = parseInt(styles.fontSize),
					line_height = parseInt(styles.lineHeight),
					color = styles.color;
				me.typefaces[element] = '';
				me.styles[element] = weight + ' ' + style;
				me.colors[element] = color;
				me.sizes[element] = size;
				me.line_heights[element] = Math.round(line_height/size*10)/10;
				$(el).remove();
			});
		  	if ( options ){
    			_.each(options, function (values, element) {
    				me.typefaces[element] = values.font_face;
    				me.styles[element] = values.weight + ' ' + values.style;
    				me.colors[element] = values.color;
    				me.sizes[element] = values.size;
    				me.line_heights[element] = values.line_height;
    			});
		   	}
	       	if ( !this.fields.length ){
    	       this.fields = {
    				element: new Upfront.Views.Editor.Field.Select({
    					label: "Typographic Element",
    					default_value: 'h1',
    					values: [
    						{ label: "Main Heading (H1)", value: "h1" },
                            { label: "Sub Heading (H2)", value: "h2" },
                            { label: "Sub Heading (H3)", value: "h3" },
                            { label: "Sub Heading (H4)", value: "h4" },
                            { label: "Sub Heading (H5)", value: "h5" },
                            { label: "Sub Heading (H6)", value: "h6" },
                            { label: "Paragraph (P)", value: "p" },
                            { label: "Anchor Link (A)", value: "a" },
                            { label: "Unordered List (UL)", value: "ul" },
                            { label: "Ordered List (OL)", value: "ol" },
                            { label: "Blockquote (BLOCKQUOTE)", value: "blockquote" },
    					],
    					change: function () {
    					    var value = this.get_value();
    					    me.current_element = value;
    					    me.fields.typeface.set_value( me.typefaces[value] );
                            me.fields.style.set_value( me.styles[value] );
                            me.fields.size.set_value( me.sizes[value] );
                            me.fields.line_height.set_value( me.line_heights[value] );
                            me.fields.color.set_value( me.colors[value] );
    					}
    				}),
    				typeface: new Upfront.Views.Editor.Field.Select({
    				    label: "Typeface",
                        values: typefaces_list,
                        default_value: me.typefaces['h1'],
                        change: function () {
                        	var value = this.get_value(),
                        		element = me.current_element;
                        	if ( me.typefaces[element] != value ){
                        		me.typefaces[element] = value;
                        		me.update_typography();
                        	}
                        }
                    }),
                    style: new Upfront.Views.Editor.Field.Select({
                        label: "Weight / Style",
                        values: styles_list,
                        default_value: me.styles['h1'],
                        change: function () {
                        	var value = this.get_value(),
                        		element = me.current_element;
                        	if ( me.styles[element] != value ){
                        		me.styles[element] = value;
                        		me.update_typography();
                        	}
                        }
                    }),
                    color: new Upfront.Views.Editor.Field.Color({
                        label: "Color",
                        default_value: me.colors['h1'],
                        spectrum: {
                            move: function (color) {
                                var rgb = color.toRgb(),
                               		rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')',
                               		element = me.current_element;
                               	if ( me.colors[element] != rgba_string ){
                               		me.colors[element] = rgba_string;
                               		me.update_typography();
                               	}
                            }
                        }
                    }),
                    size: new Upfront.Views.Editor.Field.Number({
                        label: "Size",
                        min: 0,
                        max: 100,
                        suffix: 'px',
                        default_value: me.sizes['h1'],
                        change: function () {
                        	var value = this.get_value(),
                        		element = me.current_element;
                        	if ( me.sizes[element] != value ){
                        		me.sizes[element] = value;
                        		me.update_typography();
                        	}
                        }
                    }),
                    line_height: new Upfront.Views.Editor.Field.Number({
                        label: "Line Height",
                        min: 0,
                        max: 10,
                        step: .1,
                        default_value: me.line_heights['h1'],
                        change: function () {
                        	var value = this.get_value(),
                        		element = me.current_element;
                        	if ( me.line_heights[element] != value ){
                        		me.line_heights[element] = value;
                        		me.update_typography();
                        	}
                        }
                    }),
				};
			};
			this.$el.html('');
			_.each( this.fields, function(field){
			    field.render();
			    field.delegateEvents();
			} );
			this.$el.append([this.fields.element.el, this.fields.typeface.el]);
			$wrap_left.append([this.fields.style.el, this.fields.size.el]);
			this.$el.append($wrap_left);
			$wrap_right.append([this.fields.color.el, this.fields.line_height.el]);
			this.$el.append($wrap_right);
			this.fields.element.trigger('changed');
			this.update_typography();
		},
		update_typography: function () {
			var me = this,
				css = [],
				options = {};
			_.each(this.elements, function(element){
				var rules = [],
					typeface = me.typefaces[element],
					face = _.findWhere(me.typefaces_list, {value: typeface}) || _.findWhere(me.typefaces_list, {name: typeface}),
					font = typeof face.value != 'undefined' ? ( face.value ? face.value : 'inherit' ) : '"' + face.name + '",' + face.family,
					style = me.styles[element].match(/^(\d+) +(\S+)/);
				rules.push('font-family: ' + font);
				rules.push('font-weight: ' + style[1]);
				rules.push('font-style: ' + style[2]);
				rules.push('font-size: ' + me.sizes[element] + 'px');
				rules.push('line-height: ' + me.line_heights[element] + 'em');
				rules.push('color: ' + me.colors[element]);
				css.push(
					'.upfront-object-content ' + element + '{ ' + rules.join("; ") + '; }'
				);
				options[element] = {
					weight: style[1],
					style: style[2],
					size: me.sizes[element],
					line_height: me.line_heights[element],
					font_face: typeof face.value != 'undefined' ? face.value : face.name,
					font_family: face.family,
					color: me.colors[element]
				};
			});
			this.model.set_property('typography', options);
			if ( $('#upfront-default-typography-inline').length )
				$('#upfront-default-typography-inline').html( css.join("\n") );
			else
				$('body').append('<style id="upfront-default-typography-inline">' +css.join("\n") + '</style>');
		},
		_normalize_weight: function (weight) {
			if ( weight == 'normal' )
				return 400;
			else if ( weight == 'bold' )
				return 700;
			else if ( weight == 'bolder' )
				return 900; // either 800-900 depend to the available weight
			else if ( weight == 'lighter' )
				return 100; // either 100-300 depend to the available weight
			return weight;
		}
	});

	var SidebarPanel_Settings_Section_Typography = SidebarPanel_Settings_Section.extend({
		initialize: function () {
			this.settings = _([
			    new SidebarPanel_Settings_Item_Typography_Editor({"model": this.model})
			]);
			this.edit_css = new Command_EditCustomCSS({"model": this.model});
		},
		get_title: function () {
			return "Typography and Colors";
		},
		on_render: function () {
			this.edit_css.render();
			this.edit_css.delegateEvents();
			this.$el.find('.panel-section-content').append(this.edit_css.el);
		}
	});

	var SidebarPanel_Settings_Section_Structure = SidebarPanel_Settings_Section.extend({
		initialize: function () {
			this.settings = _([]);
			this.edit_structure = new Command_EditStructure({"model": this.model});
			this.edit_background = new Command_EditLayoutBackground({"model": this.model});
		},
		get_title: function () {
			return "";
		},
		on_render: function () {
			this.edit_background.render();
			this.edit_background.delegateEvents();
			this.$el.find('.panel-section-content').append(this.edit_background.el);
			if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME ){
				this.edit_structure.render();
				this.edit_structure.delegateEvents();
				this.$el.find('.panel-section-content').append(this.edit_structure.el);
			}
		}
	});

	var SidebarPanel_Settings = SidebarPanel.extend({
		"className": "sidebar-panel sidebar-panel-settings",
		initialize: function () {
			this.sections = _([
				new SidebarPanel_Settings_Section_Typography({"model": this.model}),
				new SidebarPanel_Settings_Section_Structure({"model": this.model})
			]);
		},
		get_title: function () {
			return "Theme Settings";
		},
		on_render: function () {
			var me = this;
			this.$el.find('.sidebar-panel-title').addClass('upfront-icon upfront-icon-panel-settings');
			this.sections.each(function (section) {
				section.render();
				me.$el.find('.sidebar-panel-content').append(section.el);
			});
			if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME )
				this.$el.find('.sidebar-panel-title').trigger('click');
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
			// Dev feature only
			//if ( Upfront.Settings.Debug.dev )
			//	this.panels.settings = new SidebarPanel_Settings({"model": this.model});
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
				new Command_NewPost({"model": this.model}),
				new Command_NewPage({"model": this.model}),
				new Command_PopupList({"model": this.model}),
			]);
			if ( Upfront.Settings.Application.MODE.ALLOW.indexOf(Upfront.Settings.Application.MODE.LAYOUT) != -1 )
				this.commands.push( new Command_ToggleMode_Small({"model": this.model}) );
		}
	});

	var SidebarCommands_PrimaryLayout = Commands.extend({
		"className": "sidebar-commands sidebar-commands-primary",
		initialize: function () {
			this.commands = _([
				new Command_NewLayout({"model": this.model}),
				new Command_BrowseLayout({"model": this.model}),
			]);
			if ( Upfront.Settings.Application.MODE.ALLOW.indexOf(Upfront.Settings.Application.MODE.LAYOUT) != -1 )
				this.commands.push( new Command_ToggleMode_Small({"model": this.model}) );
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
				//new Command_EditBackgroundArea({"model": this.model}),
				new Command_Undo({"model": this.model}),
				new Command_Redo({"model": this.model}),
				//new Command_SaveLayout({"model": this.model}),
				//new Command_SaveLayoutAs({"model": this.model}),
				//new Command_LoadLayout({"model": this.model}),
				new Command_ToggleGrid({"model": this.model}),
				//new Command_ResetEverything({"model": this.model}),
			]);
			if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME ) {
				this.commands.push(new Command_ExportLayout({"model": this.model}));
			}
			if (!Upfront.Settings.Application.NO_SAVE) {
				this.commands.push(new Command_SaveLayout({"model": this.model}));
			} else {
				this.commands.push(new Command_PreviewLayout({"model": this.model}));
			}
			// Dev feature only
			if ( Upfront.Settings.Debug.dev ){
				//if (!Upfront.Settings.Application.NO_SAVE) this.commands.push(new Command_SaveLayoutAs({"model": this.model}));
				if (!Upfront.Settings.Application.NO_SAVE) this.commands.push(new Command_ResetEverything({"model": this.model}));
				this.commands.push(new Command_ToggleMode({"model": this.model}));
			}
		}
	});

	var SidebarCommands_Header = Commands.extend({
		className: "sidebar-commands sidebar-commands-header",
		initialize: function () {
			this.commands = _([
				new Command_Logo({"model": this.model}),
			]);
			if ( !Upfront.Settings.Application.NO_SAVE )
				this.commands.push(new Command_Exit({"model": this.model}));
		}
	});

	var SidebarProfile = Backbone.View.extend({
		className: "sidebar-profile",
		render: function () {
			var user = Upfront.data.currentUser;
			if ( !user ) return;
			var data = user.get('data'),
				roles = user.get('roles');
			this.$el.html(_.template(
				'<div class="sidebar-profile-avatar"><img src="http://www.gravatar.com/avatar/{{gravatar}}?s=26" /></div>' +
				'<div class="sidebar-profile-detail"><span class="sidebar-profile-name">{{name}}</span><span class="sidebar-profile-role">{{role}}</span></div>' +
				'<div class="sidebar-profile-edit"><a class="upfront-icon upfront-icon-edit" data-bypass="true" href="{{edit_url}}">edit profile</a></div>',
				{
					gravatar: data.gravatar,
					name: data.display_name,
					role: roles[0],
					edit_url: Upfront.Settings.admin_url + 'profile.php'
				}
			));
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
			var is_theme = ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME );
			//this.editor_mode = new SidebarEditorMode({"model": this.model});
			this.sidebar_profile = new SidebarProfile({"model": this.model});
			this.sidebar_commands = {
				header: new SidebarCommands_Header({"model": this.model}),
				primary: is_theme ? new SidebarCommands_PrimaryLayout({"model": this.model}) : new SidebarCommands_PrimaryPostType({"model": this.model}),
				additional: is_theme ? false : new SidebarCommands_AdditionalPostType({"model": this.model}),
				control: new SidebarCommands_Control({"model": this.model})
			};
			this.sidebar_panels = new SidebarPanels({"model": this.model});

			this.fetch_current_user();

			//Upfront.Events.on("upfront:posts:post:post_updated", this.handle_post_change, this);
			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT ){
				Upfront.Events.on('upfront:element:edit:start', this.preventUsage, this);
				Upfront.Events.on('upfront:element:edit:stop', this.allowUsage, this);
			}
			Upfront.Events.on("application:mode:after_switch", this.render, this);
		},
		preventUsage: function(type) {
			var tooltipText = 'Not available when<br>editing text.';
			if (type === 'media-upload') {
				tooltipText = 'Not available when<br>uploading media.';
			}
	 		if (type === 'write') {
				this.writingIsOn = true;
				tooltipText = 'Please publish your content<br>before modifying the layout.';
			}
			$('#preventUsageOverlay span').html(tooltipText);
			$('#preventUsageOverlay').show();
		},
		allowUsage: function(type) {
			if (this.writingIsOn && type !== 'write') {
			this.preventUsage('write');
				return;
			}

			this.writingIsOn = false;
			$('#preventUsageOverlay').hide();
		},
		render: function () {
			var output = $('<div id="sidebar-ui-wrapper" class="upfront-ui"></div>');;

			// Header
			this.sidebar_commands.header.render();
			output.append(this.sidebar_commands.header.el);

			// Editor Mode
			//this.editor_mode.render();
			//this.$el.append(this.editor_mode.el);

			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.THEME ){
				// Profile
				this.sidebar_profile.render();
				output.append(this.sidebar_profile.el);
			}

			// Primary commands
			this.sidebar_commands.primary.render();
			output.append(this.sidebar_commands.primary.el);

			if ( this.sidebar_commands.additional ){
				// Additional commands
				this.sidebar_commands.additional.render();
				output.append(this.sidebar_commands.additional.el);
			}

			if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT ){
				// Sidebar panels
				this.sidebar_panels.render();
				output.append(this.sidebar_panels.el);
				// Control
				this.sidebar_commands.control.render();
				output.append(this.sidebar_commands.control.el);

				output.append('<div id="preventUsageOverlay"><span></span></div>');

				this.$el.html(output);

				//Collapsible
				//this.addCollapsibleEvents();
			}
			else {
				this.$el.html(output);
			}
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
			/*
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
			*/
			console.log("to_content_editor got called");
		},
		from_content_editor: function () {
			/*
			var panel = this.sidebar_panels.panels.posts;
			//panel.commands = _([]);
			panel.hide();//render();
			$(".sidebar-panel-title.upfront-icon.upfront-icon-panel-elements").trigger("click");
			*/
			console.log("from_content_editor got called")
		},
		handle_post_change: function (post) {
			//this.to_content_editor();
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

	var Command_PopupList = ContentEditor_SidebarCommand.extend({
		tagName: 'li',
		className: 'command-popup-list',
		$popup: {},
		views: {},
		currentPanel: false,
		render: function () {
			this.$el.addClass("upfront-entity_list upfront-icon upfront-icon-browse");
			if ( Upfront.Application.get_current() == Upfront.Settings.Application.MODE.LAYOUT )
				this.$el.html('Browse Posts / Pages / Comments');
			else
				this.$el.html('Posts / Pages');
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
				if(panel != 'comments' || (Upfront.data.currentPost && Upfront.data.currentPost.id && me.views[panel].view.collection.postId == Upfront.data.currentPost.id))
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
				var post_id = Upfront.data.currentPost && Upfront.data.currentPost.id
					? Upfront.data.currentPost.id
					: _upfront_post_data.post_id
				;
				collection = new Upfront.Collections.CommentList([], {postId: post_id});
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
		initialize: function(opts){
			this.options = opts;
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
				//window.location = Upfront.Settings.Content.edit.post + post.id;
				var path = '/edit/post/' + post.id;
				Upfront.Popup.close();
				Upfront.Application.navigate(path, {trigger: true});
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
			var pages = this.collection.where({'post_parent': 0});
			// Render
			this.$el.html(
				this.pageListTpl({
					pages: pages,
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
			this.$el.find("#upfront-page_preview-edit button").one("click", function () {
				//window.location = Upfront.Settings.Content.edit.page + page.get('ID');
				var path = '/edit/page/' + page.get('ID');
				Upfront.Popup.close();
				Upfront.Application.navigate(path, {trigger: true});
			});
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

			Upfront.Settings.LayoutEditor.Grid.size_name = new_size;
			Upfront.Settings.LayoutEditor.Grid.size = Upfront.Settings.LayoutEditor.Grid.breakpoint_columns[new_size];
			Upfront.Settings.LayoutEditor.Grid.column_width = Upfront.Settings.LayoutEditor.Grid.column_widths[new_size];
			Upfront.Settings.LayoutEditor.Grid.column_padding = Upfront.Settings.LayoutEditor.Grid.column_paddings[new_size];
			Upfront.Settings.LayoutEditor.Grid.type_padding = Upfront.Settings.LayoutEditor.Grid.type_paddings[new_size];
			Upfront.Settings.LayoutEditor.Grid.baseline = Upfront.Settings.LayoutEditor.Grid.baselines[new_size];
			Upfront.Settings.LayoutEditor.Grid.class = Upfront.Settings.LayoutEditor.Grid.size_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.left_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_left_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.right_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_right_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.top_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_top_classes[new_size];
			Upfront.Settings.LayoutEditor.Grid.bottom_margin_class = Upfront.Settings.LayoutEditor.Grid.margin_bottom_classes[new_size];
		}
	});


	var Upfront_Icon_Mixin = {
		get_icon_html: function (src, classname) {
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
				var classes = ['upfront-field-icon'];
				if ( ! classname ){
					classes.push('upfront-field-icon-' + src);
				}
				else{
					classes.push(classname);
					classes.push(classname + '-' + src);
				}
				return '<i class="' + classes.join(' ') + '"></i>';
			}
		}
	};


	var Field = Backbone.View.extend({
		className: 'upfront-field-wrap',
		initialize: function (opts) {
			this.options = opts;
			this.multiple = typeof this.options.multiple != 'undefined' ? this.options.multiple : (typeof this.multiple != 'undefined' ? this.multiple : false);
			this.label = typeof this.options.label != 'undefined' ? this.options.label : '';
			this.default_value = typeof this.options.default_value != 'undefined' ? this.options.default_value : (this.multiple ? [] : '');
			if ( this.options.property ){
				this.property = this.model.get_property_by_name(this.options.property);
				if ( this.property === false ){
					this.model.init_property(this.options.property, this.default_value);
					this.property = this.model.get_property_by_name(this.options.property);
				}
			}
			else {
				this.property = false;
			}
			this.name = this.options.name ? this.options.name : this.cid;
			this.selected_state = this.selected_state ? this.selected_state : '';
			if ( this.init )
				this.init();
			if ( this.options.change )
				this.on('changed', this.options.change, this)
		},
		get_name: function () {
			return this.property ? this.property.get('name') : this.name;
		},
		get_saved_value: function () {
			if ( this.property ){
				return this.property.get('value');
			}
			else if ( this.model ){
				var value = this.model.get(this.name);
				return value ? value : this.default_value;
			}
			return this.default_value;
		},
		get_value: function () {
			var $field = this.get_field();
			if ( ! this.multiple || ($field.size() == 1 && $field.is('select')) )
				return $field.val();
			else
				return _.map($field, function (el) { return $(el).val(); });
			return false;
		},
		set_value: function (value) {
		    this.get_field().val(value);
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
			this.get_field().keyup(function(){
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
			}).trigger('keyup').change(function(){
				me.trigger('changed');
			});
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

	var Field_Button = Field.extend({
		className: 'upfront-field-wrap upfront-field-wrap-button',
		render: function () {
			this.$el.html('');
			if ( !this.options.compact )
				this.$el.append(this.get_label_html());
			this.$el.append(this.get_field_html());
			var me = this;

			this.trigger('rendered');
		},
		get_field_html: function () {
			var attr = {
				'type': 'button',
				'class': 'upfront-field upfront-field-button',
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.label
			};
			if ( this.options.compact ) {
				attr.placeholder = this.label;
				this.$el.attr('data-tooltip', this.label);
			}
			else if ( this.options.placeholder ) {
				attr.value = this.options.placeholder;
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


	var Field_Slider = Field_Text.extend(_.extend({}, Upfront_Icon_Mixin, {
		className: 'upfront-field-wrap upfront-field-wrap-slider',
		initialize: function(opts) {
			this.options = opts;
			Field_Slider.__super__.initialize.apply(this, arguments);

			var me = this,
				options = {
					range: this.getOption('range', 'min'),
					min: this.getOption('min', 0),
					max: this.getOption('max', 0),
					step: this.getOption('step', 1),
					orientation: this.getOption('orientation', 'horizontal'),
					value: this.get_saved_value()
				}
			;

			this.value = this.get_saved_value();
			if(typeof this.value == 'undefined')
				this.value = options.min;

			if(this.options.callbacks)
				_.extend(options, this.options.callbacks);

			options.slide = function(e, ui){
				var valueText = ui.value;
				me.value = valueText;

				me.$('input').val(me.value).trigger('change');

				if(me.options.valueTextFilter)
					valueText = me.options.valueTextFilter(valueText);

				me.$('.upfront-field-slider-value').text(valueText);

				if(me.options.callbacks && me.options.callbacks.slide)
					me.options.callbacks.slide(e, ui);
			}

			this.on('rendered', function(){
				var $field = me.$('#' + me.get_field_id());
				if ( options.orientation == 'vertical' ){
					$field.addClass('upfront-field-slider-vertical');
				}
				$field.slider(options);
			});
		},
		get_field_html: function () {
			var output = '<input type="hidden" name="' + this.get_field_name() + '" value="' + this.value + '">',
				value = this.value
			;

			if(this.options.info)
				output += '<div class="upfront-field-info">' + this.options.info + '</div>'

			output += '<div class="upfront-field upfront-field-slider" id="' + this.get_field_id() + '"></div>';

			if(this.options.valueTextFilter)
				value = this.options.valueTextFilter(value);

			output += '<div class="upfront-field-slider-value"> ' + value + '</div>';
			return output;
		},

		getOption: function(option, def){
			return this.options[option] ? this.options[option] : def;
		}
	}));

	var Field_Hidden = Field_Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-hidden',
		get_field_html: function(){
			var attr = {
				type: 'hidden',
				id: this.get_field_id(),
				name: this.get_field_name(),
				'class': 'upfront-field upfront-field-hidden',
				'value': this.get_saved_value()
			};
			return ' <input ' + this.get_field_attr_html(attr) + ' /> ';
		}
	});

	var Field_Color = Field_Text.extend({
		className: 'upfront-field-wrap upfront-field-wrap-color sp-cf',
		spectrumDefaults: {
			clickoutFiresChange: true,
			chooseText: 'OK',
			showPalette: true,
			showSelectionPalette: true,
			showAlpha: true,
			showPalette: true,
			palette: ['fff', '000', 'f00'],
			maxSelectionSize: 10,
			preferredFormat: "hex",
			showInput: true,
			allowEmpty:true
		},
		initialize: function(opts){
			this.options = opts;
			var me = this,
				spectrumOptions = typeof this.options.spectrum == 'object' ? _.extend({}, this.spectrumDefaults, this.options.spectrum) : this.spectrumDefaults
			;

			spectrumOptions.move = function(color){
				var rgb = color.toHexString();
				$('.sp-dragger').css({
					'border-top-color': rgb,
					'border-right-color': rgb
				});
				if(me.options.spectrum && me.options.spectrum.move)
					me.options.spectrum.move(color);
			};

			spectrumOptions.show = function(color){
				var rgb = color.toHexString();
				$('.sp-dragger').css({
					'border-color': rgb
				});
				if(me.options.spectrum && me.options.spectrum.show)
					me.options.spectrum.show(color);
			};

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

	});


	var Field_Multiple = Field.extend(_.extend({}, Upfront_Icon_Mixin, {
		get_values_html: function () {
			return _.map(this.options.values, this.get_value_html, this).join('');
		},
		set_value: function (value) {
		    this.$el.find('[value="'+value+'"]').trigger('click');
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
					$('.upfront-field-select-expanded').removeClass('upfront-field-select-expanded');
					me.$el.find('.upfront-field-select').addClass('upfront-field-select-expanded');
				});
				this.$el.on('click', '.upfront-field-select-option label', function(e){
					e.stopPropagation();
					if ( $(this).closest('.upfront-field-select-option').hasClass('upfront-field-select-option-disabled') )
						return;
					me.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
				});
				this.$el.on('mouseup', '.upfront-field-select', function(e){
					e.stopPropagation();
				});
				$('body').on('mouseup', function(){
					me.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
				});
			}
			this.$el.on('change', '.upfront-field-select-option input', function(){
				var $select_value = me.$el.find('.upfront-field-select-value');
				var $checked = me.$el.find('.upfront-field-select-option input:checked');
				if ( $checked.size() == 1 && !this.multiple ){
					var $option = $checked.closest('.upfront-field-select-option'),
						select_text = $option.text(),
						$select_icon = $option.find('.upfront-field-icon').clone();
					$select_value.html('');
					if ( $select_icon )
						$select_value.append($select_icon);
					$select_value.append('<span>'+select_text+'</span>');
				}
				else{
					var select_texts = [];
					$checked.each(function(){
						select_texts.push( $(this).closest('.upfront-field-select-option').text() );
					});
					$select_value.text( $checked.size() == 0 ? select_label : select_texts.join(', ') );
				}
				me.$el.find('.upfront-field-select-option').each(function(){
					if ( $(this).find('input:checked').size() > 0 )
						$(this).addClass('upfront-field-select-option-selected');
					else
						$(this).removeClass('upfront-field-select-option-selected');
				});
				me.trigger('changed');
			});
			this.stop_scroll_propagation(this.$el.find('.upfront-field-select-options'));
			if ( ! this.multiple && ! this.get_saved_value() )
				this.$el.find('.upfront-field-select-option:eq(0) input').prop('checked', true);
			this.$el.find('.upfront-field-select-option:eq(0) input').trigger('change');

			if ( this.options.width )
				this.$el.find('.upfront-field-select').css('width', this.options.width);

			this.trigger('rendered');
		},
		get_field_html: function () {
			var attr = {
				'class': 'upfront-field-select upfront-no-select',
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
			var icon_class = this.options.icon_class ? this.options.icon_class : null;
			if ( this.multiple && _.contains(saved_value, value.value) )
				attr.checked = 'checked';
			else if ( ! this.multiple && saved_value == value.value )
				attr.checked = 'checked';
			if ( attr.checked )
				classes += ' upfront-field-select-option-selected';
			classes += ' upfront-field-select-option-' + ( index%2 == 0 ? 'odd' : 'even' );
			//return '<option ' + this.get_field_attr_html(attr) + '>' + value.label + '</option>';
			var input = '<input ' + this.get_field_attr_html(attr) + ' />';
			return '<li class="' + classes + '">' + '<label for="' + id + '">' + this.get_icon_html(value.icon, icon_class) + '<span class="upfront-field-label-text">' + value.label + '</span></label>' + input + '</li>';
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
				me.trigger('changed');
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
			var icon_class = this.options.icon_class ? this.options.icon_class : null;
			if ( this.options.layout )
				classes += ' upfront-field-multiple-'+this.options.layout;
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
			return '<span class="' + classes + '"><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '">' + this.get_icon_html(value.icon, icon_class) + '<span class="upfront-field-label-text">' + value.label + '</span></label></span>';
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
			$wrap.append('<div class="upfront-suggest-list-wrap upfront-no-select" />');
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
				me.trigger('changed');
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
			me.options = opts;
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
				field.property.set({'value': field.get_value()}, {'silent': true});
			});
			if ( changed.size() > 0 )
				this.panel.is_changed = true;
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
		},

		remove: function(){
			if(this.fields)
				this.fields.each(function(field){
					field.remove();
				});
			Backbone.View.prototype.remove.call(this);
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
			this.options = opts;
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
			var me = this;
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
				setting.panel = me.panel;
				setting.render();
				$tab_content.append(setting.el);
			});
			//this.panel.on('rendered', this.panel_rendered, this);
			this.listenTo(this.panel, 'rendered', this.panel_rendered);

			this.trigger('rendered');
		},
		conceal: function () {
			this.$el.removeClass('upfront-settings-item-tab-active');
		},
		reveal: function () {
			this.panel.settings.invoke('conceal');
			this.$el.addClass('upfront-settings-item-tab-active');
			if ( this.radio )
				this.$el.find('.upfront-settings-item-tab input').prop('checked', true).trigger('change');
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
					property_model.set({'value': this.get_value()}, {silent: true});
				else
					this.model.init_property(this.get_property(), this.get_value());
				if ( this.get_property_value() != this.get_value() )
					this.panel.is_changed = true;
			}
		},
		remove: function(){
			if(this.settings)
				this.settings.each(function(setting){
					setting.remove();
				});
			Backbone.View.prototype.remove.call(this);
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
			me.options = opts;
			this.settings = opts.settings ? _(opts.settings) : _([]);
			this.settings.each(function(setting){
				setting.panel = me;
				setting.trigger('panel:set');
			});
			this.tabbed = ( typeof opts.tabbed != 'undefined' ) ? opts.tabbed : this.tabbed;
		},

		tabbed: false,
		is_changed: false,

		render: function () {
			this.$el.empty();
			this.$el.append('<div class="upfront-settings_label" />');
			this.$el.append('<div class="upfront-settings_panel" ><div class="upfront-settings_panel_scroll" /></div>');
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
			if ( this.options.min_height )
				$panel_scroll.css('min-height', this.options.min_height);
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
			this.$el.fadeIn('fast', function() {
				// Scroll the window if settings box clips vertically
				var elementbottom = $(this).parent().offset().top+$(this).parent().height();
				var winheight = jQuery(window).height();

				if( (elementbottom +60) > (winheight+jQuery('body').scrollTop()))
					jQuery('body').animate({scrollTop:(elementbottom - winheight + 60)}, 'slow');

			});
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
        //@Furqan and this for Loading for pnaels
        start_loading: function (loading_message, loading_complete_message) {
            this.loading = new Upfront.Views.Editor.Loading({
                loading: loading_message,
                done: loading_complete_message
            });
            this.loading.render();
            this.$el.find(".upfront-settings_panel").append(this.loading.$el);
        },
        end_loading: function (callback) {
            if ( this.loading )
                this.loading.done(callback);
            else
                callback();
        },
        //end
		on_save: function () {
			var any_panel_changed = false;
			this.parent_view.panels.each(function(panel){
				panel.save_settings();
				if ( panel.is_changed ){
					any_panel_changed = true;
					panel.is_changed = false;
				}
			});
			if ( any_panel_changed )
				this.parent_view.model.get("properties").trigger('change');
			this.trigger("upfront:settings:panel:saved", this);
			Upfront.Events.trigger("entity:settings:deactivate");
		},
		save_settings: function () {
			if (!this.settings) return false;

			var me = this;
			this.settings.each(function (setting) {
				if ( (setting.fields || setting.settings).size() > 0 ) {
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
		},

		on_cancel: function () {
			this.trigger("upfront:settings:panel:close", this);
		},
		remove: function(){
			if(this.settings)
				this.settings.each(function(setting){
					setting.remove();
				});
			this.$el.off();
			Backbone.View.prototype.remove.call(this);
		}

	}));

	var Settings = Backbone.View.extend({
		initialize: function(opts) {
			this.options = opts;
		},
		get_title: function () {
			return "Settings";
		},

		render: function () {
			var me = this,
				$view = me.for_view.$el.find(".upfront-editable_entity"),
				view_pos = $view.offset(),
				view_outer_width = $view.outerWidth(),
				view_pos_right = view_pos.left + view_outer_width,
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

			this.add_common_items();

			me.panels.each(function (panel) {
				panel.render();

				me.listenTo(panel, "upfront:settings:panel:toggle", me.toggle_panel);
				me.listenTo(panel, "upfront:settings:panel:close", me.close_panel);
				me.listenTo(panel, "upfront:settings:panel:refresh", me.refresh_panel);

				panel.parent_view = me;
				me.$el.append(panel.el);
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
					"left": view_pos.left + view_outer_width - ((view_pos_right+label_width+panel_width > main_pos_right) ? label_width+panel_width+(view_pos_right-button_pos.left)+5 : 0)
				})
				.addClass('upfront-ui')
			;

			this.trigger('open');
		},

		add_common_items: function(){
			var first = this.panels.first();

			//Adding CSS item
			first.settings.push(new _Settings_CSS({
				model: this.model,
				title: ' Element Styles:'
			}));

			// Adding anchor trigger
			if (this.options.anchor && this.options.anchor.is_target) {
				var item = new _Settings_AnchorSetting({model: this.for_view.model});

				first.settings.push(item);
				this.listenTo(item, "anchor:item:updated", function () {
					this.toggle_panel(first);
				});
			}


		},

		set_title: function (title) {
			if (!title || !title.length) return false;
			this.$el.find(".upfront-settings_title").html(title);
		},
		toggle_panel: function (panel) {
			this.panels.invoke("conceal");
			panel.$el.find(".upfront-settings_panel").css('height', '');
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
		},
		remove: function(){
			if(this.panels)
				this.panels.each(function(panel){
					panel.remove();
				});
			Backbone.View.prototype.remove.call(this);
		}
	});

var Field_Complex_Toggleable_Text_Field = Field.extend({
	className: "upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple",
	tpl: '<input type="checkbox" class = "upfront-field-checkbox" /> <label><span class="upfront-field-label-text">{{element_label}}</span></label> <div class="upfront-embedded_toggleable" style="display:none">{{field}}<div class="upfront-embedded_toggleable-notice">Please, use ID that contains letters only, eg. <b>myProductSlider</b><br />No spaces or special characters.</div></div>',
	initialize: function (opts) {
		Field.prototype.initialize.call(this, opts);
		this.options.field = new Field_Text(this.options);
	},
	render: function () {
		var me = this;
		this.$el.empty();
		this.$el.append(this.get_field_html());

		this.$el.on("click", ':checkbox', function (e) {
			e.stopPropagation();
			me.field_toggle.apply(me);
		});
		if (this.model.get_property_value_by_name(this.options.field.get_name())) {
			this.$el.find(':checkbox').attr("checked", true);
			this.check_value();
			this.field_toggle();
		}

		this.$el.on("keyup", '[name="' + this.options.field.get_name() + '"]', function (e) {
			e.stopPropagation();
			me.check_value.apply(me);
		});

		setTimeout(function () {
			me.trigger("anchor:updated");
		}, 50);
	},
	field_toggle: function () {
		if (this.$el.find(":checkbox").is(":checked")) {
			this.$el.find(".upfront-embedded_toggleable").show();
		} else this.$el.find(".upfront-embedded_toggleable").hide();
		this.trigger("anchor:updated");
	},
	check_value: function () {
		var $field = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
			$root = this.$el.find(".upfront-embedded_toggleable"),
			val = $field.length && $field.val ? $field.val() : ''
		;
		$root.removeClass("error").removeClass("ok");
		if (val.length && !val.match(/^[a-zA-Z]+$/)) {
			$root.addClass("error");
		} else if (val.length) {
			$root.addClass("ok");
		}
	},
	get_field_html: function () {
		this.options.field.render();
		var $input = this.options.field.$el;
		return _.template(this.tpl, _.extend({}, this.options, {field: $input.html()}));
	},
	get_value: function () {
		var data = {},
			$field = this.$el.find(":checkbox"),
			$subfield = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
			value = $subfield.val().replace(/[^a-zA-Z]/g, '')
		;
		return $field.is(":checked") && value ? value : false;
	}
});

var _Settings_CSS = SettingsItem.extend({
	className: 'upfront-settings-css',
	events: {
		'click a.upfront-css-edit': 'openEditor',
		'click .upfront-css-new>a': 'openNewEditor',
		'change input[name=theme_style]': 'stylesChanged'
	},
	initialize: function(options) {
		SettingsItem.prototype.initialize.call(this, options);
		if (!Upfront.Application.cssEditor) return false;

		var styleType = Upfront.Application.cssEditor.elementTypes[this.model.get_property_value_by_name('type')],
			values = [{label: 'Default', value: ''}],
			prefix = new RegExp('^' + styleType.id + '-')
		;
		if(Upfront.data.styles[styleType.id])
			_.each(Upfront.data.styles[styleType.id], function(styleName){
				values.push({label: styleName.replace(prefix, ''), value: styleName});
			});

		this.fields = _([
			new _Settings_CSS_Field({
				model: this.model,
				property: 'theme_style',
				values: values
			})
		]);
	},
	stylesChanged: function(e) {
		var style = this.$('input[name=theme_style]:checked').val(),
			$text = this.$('.upfront-css-new-text')
		;
		this.model.set_property('theme_style', style);
	},

	openEditor: function(e){
		e.preventDefault();
		Upfront.Application.cssEditor.init({
			model: this.model,
			name: this.fields._wrapped[0].get_value()
		});

		Upfront.Events.trigger("entity:settings:deactivate");

		//$('#settings').find('.upfront-save_settings').click();
	},
	openNewEditor: function(e){
		e.preventDefault();
		Upfront.Application.cssEditor.init({
			model: this.model,
			name: ''
		});

		this.model.set_property('theme_style', '');

		Upfront.Events.trigger("entity:settings:deactivate");
		//$('#settings').find('.upfront-save_settings').click();
	}
});

var _Settings_CSS_Field = Field_Select.extend({
	render: function(){
		Field_Select.prototype.render.call(this);
		var text = 'add new style'; //this.model.get_property_value_by_name('theme_style') ? 'edit style' : 'add new style';
		this.$el.append('<a href="#" title="Edit style" class="upfront-css-edit"></a><p class="upfront-css-new"><a href="#"><span class="codeicon">&lt;/&gt;</span> <span class="upfront-css-new-text">' + text + '</span></a></p>');
		return this;
	},
	remove: function(){
		Field.prototype.remove.call(this);
	}
});

var CSSEditor = Backbone.View.extend({
	className: 'upfront-ui',
	id: 'upfront-csseditor',
	tpl: _.template($(_Upfront_Templates.popup).find('#csseditor-tpl').html()),
	prepareAce: false,
	ace: false,
	events: {
		'click .upfront-css-save-ok': 'save',
		'click .upfront-css-close': 'close',
		'click .upfront-css-image': 'openImagePicker',
		'click .upfront-css-selector': 'addSelector',
		'click .upfront-css-type' : 'scrollToElement',
		'click .upfront-css-delete': 'deleteStyle',
		'mouseenter .upfront-css-selector': 'hiliteElement',
		'mouseleave .upfront-css-selector': 'unhiliteElement',
		'keyup .upfront-css-save-name': 'checkDeleteToggle'
	},

	//elemenTypes' element id matches model's 'id_slug' attribute
	elementTypes: {
		UaccordionModel: {label: 'Accordion', id: 'uaccordion'},
		UcommentModel: {label: 'Comments', id: 'ucomment'},
		UcontactModel: {label: 'Contact Form', id: 'ucontact'},
		UgalleryModel: {label: 'Gallery', id: 'ugallery'},
		UimageModel: {label: 'Image', id: 'image'},
		LoginModel: {label: 'Login', id: 'upfront-login_element'},
		LikeBox: {label: 'Like Box', id: 'Like-box-object'},
		MapModel: {label: 'Map', id: 'upfront-map_element'},
		//NavigationModel: {label: 'Navigation', id: 'nav'},
		UnewnavigationModel: {label: 'Navigation', id: 'unewnavigation'},
		UpostsModel: {label: 'Posts', id: 'uposts'},
		UsearchModel: {label: 'Search', id: 'usearch'},
		USliderModel: {label: 'Slider', id: 'uslider'},
		SocialMediaModel: {label: 'Social', id: 'SocialMedia'},
		UtabsModel: {label: 'Tabs', id: 'utabs'},
		ThisPageModel: {label: 'Page', id: 'this_page'},
		ThisPostModel: {label: 'Post', id: 'this_post'},
		UwidgetModel: {label: 'Widget', id: 'uwidget'},
		UyoutubeModel: {label: 'YoutTube', id: 'utube'},
		PlainTxtModel: {label: 'Text', id:'plaintext'},
		Layout: {label: 'Body', id: 'layout'}
	},
	initialize: function(){
		if(!$('#' + this.id).length)
			$('body').append(this.el);
	},
	init: function(options){
		if(this.$style)
			this.close();

		this.model = options.model;
		this.elementSelector = typeof options.elementSelector == 'string' ? options.elementSelector : '.upfront-object';
		this.sidebar = ( options.sidebar !== false );
		this.global = ( options.global === true );

		var me = this,
			deferred = $.Deferred(),
			modelType = options.type ? options.type : me.model.get_property_value_by_name('type'),
			elementType = this.elementTypes[modelType]
		;

		this.selector = options.name || '';
		if(this.selector)
			this.name = this.selector.replace(new RegExp('^' + elementType.id + '-'), '');
		else
			this.name = '';

		this.elementType = elementType || {label: 'Unknown', id: 'unknown'};
		this.selectors = this.elementSelectors[modelType] || {};

		console.log('Ace starting');

		this.prepareAce = deferred.promise();
		require(['//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'], function(){
			deferred.resolve();
		});

		this.resizeHandler = this.resizeHandler || function(){
			me.$el.width($(window).width() - $('#sidebar-ui').width() -1);
		};

		$(window).on('resize', this.resizeHandler);

		this.element_id = options.element_id ? options.element_id : this.model.get_property_value_by_name('element_id');
		if(!$('#' + this.element_id + '-styles').length){
			this.$style = $('<style id="' + this.element_id + '-style"></style');
			$('body').append(this.$style);
		}
		else
			this.$style = $('#' + this.element_id + '-style');
		
		
		if ( typeof options.change == 'function' )
			this.on('change', options.change);

		this.render();

		this.startResizable();
	},
	close: function(e){
		if(e)
			e.preventDefault();
		$(window).off('resize', this.resizeHandler);
		this.off('change');

		this.$style.remove();
		this.$style = false;
		if(this.editor)
			this.editor.destroy();

		$('#page').css('padding-bottom', 0);
		this.$el.hide();
	},
	render: function(){
		var me = this;

		if(!$('#' + this.id).length)
			$('#page').append(this.$el);
			
		if (!this.sidebar)
			this.$el.addClass('upfront-css-no-sidebar');
		else
			this.$el.removeClass('upfront-css-no-sidebar');

		this.$el.html(this.tpl({
			name: this.name,
			elementType: this.elementType.label,
			selectors: this.selectors
		}));

		this.resizeHandler('.');

		var bodyHeight = this.$el.height() - this.$('.upfront-css-top').outerHeight();
		this.$('.upfront-css-body').height(bodyHeight);

		this.prepareAce.done(function(){
			me.startAce();
		});

		this.prepareSpectrum();

		this.checkDeleteToggle(this.name);

		this.$el.show();
	},
	startAce: function(){
		var me = this,
			editor = ace.edit(this.$('.upfront-css-ace')[0]),
			session = editor.getSession()
		;

		session.setUseWorker(false);
		editor.setShowPrintMargin(false);

		session.setMode("ace/mode/css");
		editor.setTheme('ace/theme/monokai');

		editor.on('change', function(e){
			if(me.timer)
				clearTimeout(me.timer);
			me.timer = setTimeout(function(){
				me.updateStyles(editor.getValue());
			},1000);
			me.trigger('change', editor);
		});
		if(this.name){
			var scope = new RegExp(this.elementSelector+'.' + this.selector + '\s*', 'g'),
				styles = $('#upfront-style-' + this.selector).html().replace(scope, '')
			;
			editor.setValue($.trim(styles), -1);
		}

		// Set up the proper vscroller width to go along with new change.
		editor.renderer.scrollBar.width = 5;
		editor.renderer.scroller.style.right = "5px";

		editor.focus();
		this.editor = editor;
	},
	prepareSpectrum: function(){
		var me = this;

		me.$('.upfront-css-color').spectrum({
			showAlpha: true,
			showPalette: true,
			palette: ['fff', '000', '0f0'],
			maxSelectionSize: 9,
			localStorageKey: "spectrum.recent_bgs",
			preferredFormat: "hex",
			chooseText: "Ok",
			showInput: true,
			allowEmpty:true,
			show: function(){
				spectrum = $('.sp-container:visible');
			},
			change: function(color) {
				var colorString = color.alpha < 1 ? color.toRgbString() : color.toHexString();
				me.editor.insert(colorString);
				me.editor.focus();
			},
			move: function(color) {
				var rgba = color.toRgbString();
				spectrum.find('.sp-dragger').css('border-top-color', rgba);
				spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
			},
		});
	},
	startResizable: function(){
		// Save the fetching inside the resize
		var me = this,
			$cssbody = me.$('.upfront-css-body'),
			topHeight = me.$('.upfront-css-top').outerHeight(),
			$selectors = me.$('.upfront-css-selectors'),
			$saveform = me.$('.upfront-css-save-form'),
			onResize = function(e, ui){
				var height = ui ? ui.size.height : me.$('.upfront-css-resizable').height(),
					bodyHeight = height  - topHeight;
				$cssbody.height(bodyHeight);
				if(me.editor)
					me.editor.resize();
				$selectors.height(bodyHeight - $saveform.outerHeight());
				$('#page').css('padding-bottom', height);
			}
		;
		onResize();
		this.$('.upfront-css-resizable').resizable({
			handles: {n: '.upfront-css-top'},
			resize: onResize,
			minHeight: 200,
			delay: 100
		});
	},
	scrollToElement: function(){
		var $element = $('#' + this.element_id);
		if(!$element.length)
			return;

		var offset = $element.offset().top - 50;
		$(document).scrollTop(offset > 0 ? offset : 0);

		this.blink($element, 4);
	},

	blink: function(element, times) {
		var me = this;
		element.css('outline', '3px solid #3ea');
		setTimeout(function(){
			element.css('outline', 'none');

			times--;
			if(times > 0){
				setTimeout(function(){
					me.blink(element, times - 1);
				}, 100);
			}

		}, 100);
	},

	hiliteElement: function(e){
		var selector = $(e.target).data('selector');
		if(!selector.length)
			return;
		var element = $('#' + this.element_id).parent();
		element.find(selector).addClass('upfront-css-hilite');
	},

	unhiliteElement: function(e){
		var selector = $(e.target).data('selector');
		if(!selector.length)
			return;
		var element = $('#' + this.element_id).parent();
		element.find(selector).removeClass('upfront-css-hilite');
	},

	remove: function(){
		Backbone.View.prototype.remove.call(this);
		$(window).off('resize', this.resizeHandler);
	},

	updateStyles: function(contents){
		if(!this.$style.parent().length)
			$('body').append(this.$style);
		this.$style.html(this.stylesAddSelector(contents, this.global ? '' : '#' + this.element_id));
	},

	stylesAddSelector: function(contents, selector){
		var rules = contents.split('}'),
			separator = '\n\n' + selector + ' ',
			styles
		;

		rules = _.map(rules, function(rule){return $.trim(rule);});

		rules.pop();

		return separator + rules.join('\n}' + separator) + '\n}';
	},

	save: function(e){
		e.preventDefault();
		var me = this,
			styleName = $.trim(this.$('.upfront-css-save-name').val()),
			styles = $.trim(this.editor.getValue())
		;

		if(!styleName)
			return notifier.addMessage('You need to set a name for the style.', 'error');
		if(!styles)
			return notifier.addMessage('The slylesheet is empty.', 'error');


		var postData = {
			name: styleName,
			styles: styles,
			action: 'upfront_save_styles',
			elementType: this.elementType.id,
			global: this.global
		};

		Upfront.Util.post(postData)
			.success(function(response){
				var data = response.data,
					elementType = me.elementType.id,
					selector = elementType + '-' + data.name,
					$style = $('#upfront-style-' + selector)
				;
				if(!$style.length){
					$style = $('<style id="upfront-style-' + selector + '"></style>');
					$('body').append($style);
				}

				$style.html(me.stylesAddSelector(data.styles, me.elementSelector + '.' + selector));

				if(!Upfront.data.styles[elementType])
					Upfront.data.styles[elementType] = [];

				if(Upfront.data.styles[elementType].indexOf(selector) == -1)
					Upfront.data.styles[elementType].push(selector);

				me.model.set_property('theme_style', elementType + '-' + data.name);

				me.checkDeleteToggle(data.name);

				return notifier.addMessage('Styles saved as ' + data.name);
			})
			.error(function(response){
				return notifier.addMessage('There was an error.');
			});
	},

	checkDeleteToggle: function(e){
		if(!this.deleteToggle)
			this.deleteToggle = $('<a href="#" class="upfront-css-delete">Delete this style</a>');

		var value = _.isString(e) ? e : e.target.value,
			elementType = this.elementType.id,
			styles = Upfront.data.styles[elementType],
			showdelete = styles && styles.indexOf(elementType + '-' + value) != -1,
			inDom = this.deleteToggle.parent().length
		;

		if(showdelete && !inDom)
			this.$('.upfront-css-save-form').append(this.deleteToggle);
		else if(!showdelete && inDom)
			this.deleteToggle.detach();
	},

	deleteStyle: function(e){
		e.preventDefault();
		var me = this,
			elementType = this.elementType.id,
			styleName = elementType + '-' + this.$('.upfront-css-save-name').val()
		;

		if(!confirm('If you delete the "' + styleName + '" style, all the elements with it will get unstyled. Are you sure?'))
			return;

		var deleteData = {
			elementType: elementType,
			styleName: styleName,
			action: 'upfront_delete_styles'
		};

		Upfront.Util.post(deleteData)
			.done(function(){
				var styleIndex = Upfront.data.styles[elementType].indexOf(styleName);
				notifier.addMessage('The style "' + styleName + '" was deleted.');

				//Clean the editor up
				me.$('.upfront-css-save-name').val('');
				me.editor.setValue('');

				//Remove the styles from the available styles
				if(styleIndex != -1)
					Upfront.data.styles[elementType].splice(styleIndex, 1);

				//Remove the styles from the dom
				$('#upfront-style-' + styleName).remove();

				//Unset the styles of the element if they are the same as the deleted ones.
				if(me.model.get_property_value_by_name('theme_style') == styleName)
					me.model.set_property('theme_style', '');

				//Remove the delete link
				me.deleteToggle.detach();
			});
		;
	},

	/* Used by upfront application */
	fetchThemeStyles: function(separately){
		var fetchData = {
				action:'upfront_theme_styles',
				separately: separately
			},
			deferred = $.Deferred()
		;

		Upfront.Util.post(fetchData)
			.success(function(response){
				deferred.resolve(response.data.styles);
			});
		return deferred.promise();
	},

	createSelectors: function(objects){
		var me = this,
			selectors = {}
		;

		_.each(objects, function(object){
			var model = new object.Model(),
				view = new object.View({model: model}),
				id = model.get_property_value_by_name('type')
			;

			selectors[id] = view.cssSelectors || {};
		});

		me.elementSelectors = selectors;
	},

	openImagePicker: function(){
		var me = this;
		Upfront.Media.Manager.open({}).done(function(popup, result){
			Upfront.Events.trigger('upfront:element:edit:stop');
			if(!result)
				return;

			var url = result.models[0].get('image').src.replace(document.location.origin, '');
			me.editor.insert('url("' + url + '")');
			me.editor.focus();
		});
	},

	addSelector: function(e){
		var selector = $(e.target).data('selector');
		this.editor.insert(selector);
		this.editor.focus();
	}
});

var _Settings_AnchorSetting = SettingsItem.extend({
	className: "upfront-settings-item-anchor",
	group: false,
	initialize: function () {
		SettingsItem.prototype.initialize.call(this, this.options);
		var item = new Field_Complex_Toggleable_Text_Field({
			element_label: "Make this element an anchor",
			model: this.model,
			property: 'anchor'
		});
		item.on("anchor:updated", function () {
			this.trigger("anchor:item:updated");
		}, this);
		this.fields = _([item]);
	}
});

var Settings_AnchorTrigger = SettingsItem.extend({
	//className: "upfront-settings-item upfront-settings-item-anchor",
	initialize: function (opts) {
		this.options = opts;
		var anchors = [],
			raw = this.get_anchors()
		;
		_(raw).each(function (idx) {
			anchors.push({label: idx, value: idx});
		});
		this.options.fields = _([
			new Field_Select({
				model: this.model, property: 'anchor_target',
				values: anchors
			})
		]);
		SettingsItem.prototype.initialize.call(this, this.options);
	},
	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = ['']
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				module.get("objects").each(function (object) {
					var anchor = object.get_property_value_by_name("anchor");
					if (anchor && anchor.length) anchors.push(anchor);
				});
			});
		});
		return anchors;
	},
	get_values: function () {
        return this.fields._wrapped[0].get_value();
    }
});

var Settings_LabeledAnchorTrigger = Settings_AnchorTrigger.extend({
	//className: "upfront-settings-item upfront-settings-item-anchor",
	initialize: function (opts) {
		this.options = opts;
		Settings_AnchorTrigger.prototype.initialize.call(this, this.options);
		this.options.fields.push(
			new Field_Text({
				model: this.model,
				property: 'anchor_label',
				label: 'Label'
			})
		);
	},
	get_values: function () {
		return {
			anchor: this.fields._wrapped[0].get_value(),
			label: this.fields._wrapped[1].get_value()
		}
	}
});

var Field_Anchor = Field_Select.extend({
	initialize: function (opts) {
		Field_Select.prototype.initialize.call(this, opts);
		this.options.values = this.get_anchors();
	},
	get_anchors: function () {
		var raw = Settings_AnchorTrigger.prototype.get_anchors.call(this),
			anchors = []
		;
		_(raw).each(function (idx) {
			anchors.push({label: idx, value: idx});
		});
		return anchors;
	}
});


/*
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
*/
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
			/*
			// Hey admin bar!
			var $bar = $('#wpadminbar'); // We'll use it a couple of times, so cache
			if($bar.length && $bar.is(":visible")) // Check existence *and* visibility
				$('#upfront-notifier').css({top: 28});
			*/
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

	var PostSelectorNavigation = ContentEditorPagination.extend({
		className: 'upfront-selector-navigation',
		handle_pagination_request: function (e, page) {
			var me = this,
				pagination = this.collection.pagination,
				page = page ? page : parseInt($(e.target).attr("data-page_idx"), 10) || 0
			;
			this.options.pageSelection(page);
		},
	});

	var PostSelector = Backbone.View.extend({
		postTypeTpl: _.template($(_Upfront_Templates.popup).find('#selector-post_type-tpl').html()),
		postListTpl: _.template($(_Upfront_Templates.popup).find('#selector-post-tpl').html()),
		postType: 'post',
		posts: [],
		pagination: false,
		selected: false,
		deferred: false,
		popup: false,
		defaultOptions: {
			// Title for the top
			title: 'Select a content to link',
			postTypes: [
				{name: 'post', label: 'Posts'},
				{name: 'pages', label: 'Pages'}
			]
		},
		events: {
			'click .upfront-field-select-value': 'openTypesSelector',
			'click .upfront-field-select-option': 'selectType',
			'click .upfront-selector-post': 'selectPost',
			'click .use': 'postOk',
			'click #upfront-search_action': 'search',
			'keyup .search_container>input': 'inputSearch'
		},
		open: function(options){
			var me = this
				bindEvents = false
			;

			options = _.extend({}, this.defaultOptions, options);

			if(!$("#upfront-popup").length && this.$el.attr('id') != 'upfront-popup')
				bindEvents = true;

			this.popup = Upfront.Popup.open(function(){});

			this.deferred = $.Deferred();

			this.posts = new Upfront.Collections.PostList([], {postType: options.postTypes[0].name});
			this.posts.pagination.pageSize = 20;
			this.pagination = new PostSelectorNavigation({
				collection: this.posts,
				pageSelection: function(page){
					me.fetch({page: page});
				}
			});

			this.setElement($('#upfront-popup'));

			this.$('#upfront-popup-top').html('<h3 class="upfront-selector-title">' + options.title +'</h3>');
			this.$('#upfront-popup-content').html(this.postTypeTpl(options));

			this.fetch({});

			this.$('#upfront-popup-bottom')
				.html('<div class="use_selection_container inactive"><a href="#use" class="use">Ok</a></div><div class="search_container clearfix"><input type="text" placeholder="Search" value=""><div class="search upfront-icon upfront-icon-popup-search" id="upfront-search_action"></div></div>')
				.append(this.pagination.$el)
			;
			return this.deferred.promise();
		},

		openTypesSelector: function(){
			var selector = this.$('.upfront-field-select');
			if(!selector.hasClass('open')) {
				selector
					.addClass('open')
				;
      } else {
				selector
					.removeClass('open')
				;
      }
		},

		selectType: function(e){
			var type = $(e.target).attr('rel');
			if(type != this.posts.postType){
				this.$('.upfront-field-select-value').text($(e.target).text());
				this.$('.upfront-field-select').removeClass('open');
				this.fetch({postType: type});
			}
		},

		selectPost: function(e){
			var post = $(e.currentTarget);
			this.$('.upfront-selector-post.selected').removeClass('selected');

			this.selected = $(e.currentTarget).addClass('selected').attr('rel');
			this.$('.use_selection_container').removeClass('inactive');
		},

		postOk: function(e){
			e.preventDefault();
			if(!this.selected)
				return;

			Upfront.Popup.close();
			return this.deferred.resolve(this.posts.get(this.selected));
		},

		fetch: function(options){
			var me = this,
				loading = new Upfront.Views.Editor.Loading({
					loading: "Loading...",
					done: "Thank you for waiting",
					fixed: false
				})
			;

			this.$('.use_selection_container').addClass('inactive');
			this.selected = false;

			loading.render();
			this.$('#upfront-selector-posts').append(loading.$el);

			if(options.postType && options.postType != this.posts.postType){
				options.flush = true;
				this.posts.postType = options.postType;
			}

			var page = options.page;
			if(!page)
				page = 0;

			this.posts.fetchPage(page, options).done(function(pages){
				loading.done();
				me.$('#upfront-selector-posts').find('table').remove();
				me.$('#upfront-selector-posts').append(me.postListTpl({posts: me.posts.getPage(page)}));
				me.pagination.render();
			});
		},

		search: function(e){
			e.preventDefault();
			var s = this.$('.search_container input').val();
			if(s){
				this.fetch({search: s, flush: true});
			}
			else
				this.$('.search_container input').focus();
		},
		inputSearch: function(e){
			if(e.which == 13)
				this.search(e);
		}
	});



	var Loading = Backbone.View.extend({
		className: 'upfront-loading',
		is_done: false,
		done_callback: [],
		done_timeout: false,
		initialize: function (opts) {
			this.options = opts;
		},
		render: function () {
			var me = this;
			if ( this.options.fixed )
				this.$el.addClass('upfront-loading-fixed');
			this.$el.html('<div class="upfront-loading-ani" />');
			if ( this.options.loading )
				this.$el.append('<p class="upfront-loading-text">' + this.options.loading + '</p>');
			this.$el.find('.upfront-loading-ani').on('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){
				var state = me.$el.hasClass('upfront-loading-repeat') ? 'repeat' : (me.$el.hasClass('upfront-loading-done') ? 'done' : 'start');
				if ( state == 'start' ){
					if ( me.is_done ){
						var done = me.done_text || me.options.done;
						me.$el.addClass('upfront-loading-done');
						me.$el.find('.upfront-loading-text').text(done);
					}
					else
						me.$el.addClass('upfront-loading-repeat');
				}
				else if ( state == 'repeat' ) {
					me.$el.removeClass('upfront-loading-repeat');
				}
				else if ( state == 'done' ) {
					me.remove();
					clearTimeout(me.done_timeout);
					if ( me.done_callback ) _(me.done_callback).each(function(cbk) { if (cbk && cbk.call) cbk.call(me); });
				}
			});
		},
		update_loading_text: function (loading) {
			this.$el.find('.upfront-loading-text').text(loading);
		},
		on_finish: function (callback) {
			this.done_callback.push(callback);
		},
		done: function (callback, done) {
			var me = this;
			this.is_done = true;
			this.done_timeout = setTimeout(function(){
				if ( me ){
					me.remove();
					_(me.done_callback).each(function(cbk) {
						if (cbk && cbk.call) cbk.call(me);
					});
				}
			}, 6000);
			if (callback) callback.call(me);
			this.done_text = done;
		},
		cancel: function (callback, canceled) {
			this.remove();
			if ( callback ) callback();
		}
	});

	var Modal = Backbone.View.extend({
		attributes: function () {
			return {
				class: "upfront-inline-modal upfront-ui upfront-no-select",
				id: "upfront-inline-modal-"+this.cid
			};
		},
		initialize: function (opts) {
			this.options = opts;
			this.$to = opts.to;
			this.button_text = opts.button_text ? opts.button_text : "Ok";
			this.button = typeof opts.button != 'undefined' ? opts.button : true;
			this.width = typeof opts.width != 'undefined' ? opts.width : '50%';
			this.top = typeof opts.top != 'undefined' ? opts.top : -1;
		},
		events: {
			"click": "on_click",
			"click .upfront-inline-modal-content": "on_click_content",
			"click .upfront-inline-modal-save": "on_click_save"
		},
		render: function () {
			this.$el.html(
				'<div class="upfront-inline-modal-wrap">' +
					'<div class="upfront-inline-modal-content"></div>' +
				'</div>'
			);
			this.$el.hide();
		},
		open: function (render_callback, context, button) {
			var me = this,
				$wrap = this.$el.find('.upfront-inline-modal-wrap'),
				$content = this.$el.find('.upfront-inline-modal-content'),
				$button = $('<button type="button" class="upfront-inline-modal-save">' + this.button_text + '</button>'),
				top = this.top,
				height, parent_height;
			this._deferred = $.Deferred();
			this.$el.show();
			render_callback.apply(context, [$content, this.$el]);
			button = typeof button != 'undefined' ? button : this.button;
			if ( button )
				$button.appendTo($content);
			// this.listenTo(Upfront.Events, "entity:region:deactivated", function(){
				// me.close(false);
			// });
			if ( top == -1 ){
				parent_height = this.$el.height() > $(window).height() ? $(window).height() : this.$el.height();
				height = $content.outerHeight();
				this.top = parent_height-height > 0 ? (parent_height-height)/2 : 0;
			}
			$wrap.css({
				top: this.top,
				bottom: 'auto',
				width: this.width
			});
			this.update_pos();
			$(window).on('scroll', this, this.on_scroll);
			this.trigger('modal:open');
			return this._deferred.promise();
		},
		close: function (save) {
			this.$el.hide();
			$(window).off('scroll', this.on_scroll);
			this.trigger('modal:close');
			if ( save )
				this._deferred.resolve(this);
			else
				this._deferred.reject(this);
		},
		on_scroll: function (e) {
			var me = e.data;
			me.update_pos();
		},
		on_click: function () {
			this.close(false);
		},
		on_click_content: function (e) {
			e.stopPropagation();
		},
		on_click_save: function () {
			this.close(true);
		},
		update_pos: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			if ( this.$el.css('display') == 'none' )
				return;
			var	$wrap = this.$el.find('.upfront-inline-modal-wrap'),
				offset = this.$to.offset(),
				top = offset.top,
				bottom = top + this.$to.outerHeight(),
				scroll_top = $(document).scrollTop(),
				scroll_bottom = scroll_top + $(window).height(),
				rel_top = $main.offset().top,
				rel_bottom = 50,
				modal_offset = this.$el.offset(),
				modal_right = modal_offset.left+this.$el.width(),
				modal_height = this.$el.find('.upfront-inline-modal-wrap').outerHeight(),
				modal_bottom = top + modal_height
			;
			if ( scroll_top >= top-rel_top ) {
				if ( this.$el.css('position') != 'fixed' ){
					this.$el.css({
						position: 'fixed',
						top: 0,
						bottom: 0,
						left: modal_offset.left,
						right: $(window).width()-modal_right
					});
					$wrap.css({
						top: rel_top + this.top
					});
				}
			}
			else if ( ( bottom > modal_bottom ? bottom : modal_bottom )+rel_bottom > scroll_bottom ) {
				if ( this.$el.css('position') != 'fixed' ){
					this.$el.css({
						position: 'fixed',
						top: 0,
						bottom: 0,
						left: modal_offset.left,
						right: $(window).width()-modal_right
					});
					$wrap.css({
						top: ( bottom > modal_bottom ? $(window).height()-(bottom-top)-rel_bottom : $(window).height()-modal_height-rel_bottom ) + this.top
					});
				}
			}
			else {
				this.$el.css({
					position: '',
					top: '',
					bottom: '',
					left: '',
					right: ''
				});
				$wrap.css({
					top: this.top
				});
			}
		},
	});

	var ModalBgSetting = Modal.extend({
		open: function () {
			return this.constructor.__super__.open.call(this, this.render_modal, this, true);
		},
		render_modal: function ($content, $modal) {
			var me = this,
				is_region = ( this.model instanceof Upfront.Models.Region ),
				$template = $(_Upfront_Templates.region_edit_panel),
				setting = $template.find('#upfront-region-bg-setting').html(),
				bg_type = new Field_Select({
					model: this.model,
					property: 'background_type',
					default_value: 'color',
					icon_class: 'upfront-region-field-icon',
					values: [
						{ label: "Solid color", value: 'color', icon: 'color' },
						{ label: "Image", value: 'image', icon: 'image' },
						{ label: "Image slider", value: 'slider', icon: 'slider' },
						{ label: "Map", value: 'map', icon: 'map' },
						{ label: "Video", value: 'video', icon: 'video' }
					],
					change: function () {
						var value = this.get_value();
						$content.find('.upfront-region-bg-setting-tab').not('.upfront-region-bg-setting-tab-'+value).hide();
						$content.find('.upfront-region-bg-setting-tab-'+value).show();
						me.render_modal_tab(value, $content.find('.upfront-region-bg-setting-tab-'+value), $content);
						this.property.set({value: value});
					}
				}),
				$region_global, $region_type, $region_nav;
			if ( is_region ){
				var collection = this.model.collection,
					index = collection.indexOf(this.model),
					index_container = collection.index_container(this.model),
					total_container = collection.total_container(),
					is_top = index_container == 0,
					is_bottom = index_container == total_container-2, // don't include shadow region
					region_global = new Field_Checkboxes({
						model: this.model,
						name: 'scope',
						multiple: false,
						values: [
							{ label: "Use this area as a global theme " + ( is_top ? 'header' : ( is_bottom ? 'footer' : '' ) ), value: 'global' }
						],
						change: function(){
							var value = this.get_value(),
								sub_regions = this.model.get_sub_regions();
							_.each(sub_regions, function(each){
								if ( each )
									each.set({scope: (value == 'global' ? 'global' : 'local')}, {silent: true});
							});
							this.model.set({scope: (value == 'global' ? 'global' : 'local')}, {silent: true});
						}
					}),
					region_type = new Field_Radios({
						model: this.model,
						name: 'type',
						default_value: 'wide',
						layout: 'horizontal-inline',
						values: [
							{ label: "Full Screen", value: 'full', disabled: index_container > 0 },
							{ label: "100% wide", value: 'wide' },
							{ label: "Contained", value: 'clip' }
						],
						change: function () {
							var value = this.get_value();
							this.model.set({type: value}, {silent: true});
							if ( value == 'full' )
								$region_nav.show();
							else
								$region_nav.hide();
							this.model.get('properties').trigger('change');
						}
					}),
					region_nav = new Field_Radios({
						model: this.model,
						property: 'nav_region',
						default_value: '',
						layout: 'horizontal-inline',
						values: [
							{ label: "No nav", value: '' },
							{ label: "Bottom nav", value: 'bottom' },
							{ label: "Full screen, top", value: 'top' }
						],
						change: function () {
							var value = this.get_value(),
								sub_regions = me.model.get_sub_regions(),
								add_region = false,
								copy_data = false,
								copy_region = false;
							index = collection.indexOf(me.model);
							if ( value == '' ){
								if ( sub_regions.top )
									collection.remove(sub_regions.top);
								else if ( sub_regions.bottom )
									collection.remove(sub_regions.bottom);
							}
							else {
								if ( value == 'bottom' ){
									if ( sub_regions.top ){
										copy_data = Upfront.Util.model_to_json(sub_regions.top);
										copy_region = new Upfront.Models.Region(copy_data);
										collection.remove(sub_regions.top);
										copy_region.set({sub: value}, {silent:true});
										copy_region.add_to(collection, index, {sub: value});
									}
									else if ( !sub_regions.bottom ){
										add_region = sub_regions.right ? index+2 : index+1;
									}
								}
								else {
									if ( sub_regions.bottom ){
										copy_data = Upfront.Util.model_to_json(sub_regions.bottom);
										copy_region = new Upfront.Models.Region(copy_data);
										collection.remove(sub_regions.bottom);
										copy_region.set({sub: value}, {silent:true});
										copy_region.add_to(collection, index, {sub: value});
									}
									else if ( !sub_regions.top ){
										add_region = sub_regions.left ? index-1 : index;
									}
								}
								if ( add_region !== false ){
									var name = me.model.get('name') + '_nav',
										title = me.model.get('title') + ' Nav',
										new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
											"name": name,
											"title": title,
											"container": me.model.get('name'),
											"sub": value
										}));
									new_region.add_to(collection, add_region, {sub: value});
								}
							}
							this.property.set({value: value});
						}
					});
			}
			$content.html(setting);
			$modal.addClass('upfront-region-modal-bg');
			$region_global = $content.find('.upfront-region-bg-setting-region-global');
			$region_type = $content.find('.upfront-region-bg-setting-region-type');
			$region_nav = $content.find('.upfront-region-bg-setting-region-nav');
			if ( is_region && this.model.is_main() ) {
				if ( is_top || is_bottom ){
					region_global.render();
					$region_global.append(region_global.$el);
				}
				region_type.render();
				$region_type.append(region_type.$el);
				region_nav.render();
				$region_nav.append(region_nav.$el);
			}
			else {
				$region_global.hide();
				$region_type.hide();
				$region_nav.hide();
			}
			bg_type.render();
			$content.find('.upfront-region-bg-setting-type').append(bg_type.$el);
			$content.find('.upfront-region-bg-setting-change-image').on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				me.upload_image();
			});
			if ( is_region ){
				$content.find('.upfront-region-bg-setting-auto-resize').on('click', function (e) {
					e.preventDefault();
					e.stopPropagation();
					me.trigger_expand_lock($(this));
				});
				this.render_expand_lock($content.find('.upfront-region-bg-setting-auto-resize'));
				region_type.trigger('changed');
			}
			else {
				$content.find('.upfront-region-bg-setting-auto-resize').hide();
			}
			bg_type.trigger('changed');
		},
		on_close_modal: function () {
			var me = this;
			me._active = false;
			me.render_icon();
		},
		notify: function () {
			Upfront.Views.Editor.notify("Background settings have been updated");
		},
		render_modal_tab: function (tab, $tab, $content) {
			var $change_image = $content.find('.upfront-region-bg-setting-change-image');
			$change_image.hide();
			switch (tab){
				case 'color':
					this.render_modal_tab_color($tab);
					break;
				case 'image':
					$change_image.show();
					this.render_modal_tab_image($tab);
					break;
				case 'slider':
					this.render_modal_tab_slider($tab);
					break;
				case 'map':
					this.render_modal_tab_map($tab);
					break;
				case 'video':
					this.render_modal_tab_video($tab);
					break;
			}
		},
		_render_tab_template: function($target, primary, secondary, template){
			var $template = $(_Upfront_Templates.region_edit_panel),
				$tab = $('<div>'+$template.find( template ? '#upfront-region-bg-setting-tab-'+template : '#upfront-region-bg-setting-tab').html()+'</div>');
			$tab.find('.upfront-region-bg-setting-tab-primary').append(primary);
			if ( secondary )
				$tab.find('.upfront-region-bg-setting-tab-secondary').append(secondary);
			$target.append($tab);
		},
		// Color tab
		render_modal_tab_color: function ($tab) {
			var me = this,
				picker = new Field_Color({
					model: this.model,
					property: 'background_color',
					default_value: '#ffffff',
					spectrum: {
						move: function (color) {
							me.preview_color(color);
						},
						change: function (color) {
							me.update_color(color);
						},
						hide: function (color) {
							me.reset_color();
						}
					}
				});
			this._default_color = this.model.get_property_value_by_name('background_color');
			picker.render();
			$tab.html('');
			this._render_tab_template($tab, picker.$el, '', 'color');
		},
		preview_color: function (color) {
			var rgb = color.toRgb(),
				rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
			this.model.set_property('background_color', rgba_string);
		},
		update_color: function (color) {
			this.preview_color(color);
			this._default_color = this.model.get_property_value_by_name('background_color');
		},
		reset_color: function () {
			this.model.set_property('background_color', this._default_color);
		},
		// Image tab
		render_modal_tab_image: function ($tab) {
			var me = this,
				image = this.model.get_property_value_by_name('background_image'),
				$style = $('<div class="upfront-region-bg-image-style"></div>'),
				$tile = $('<div class="upfront-region-bg-image-tile" />'),
				$fixed = $('<div class="upfront-region-bg-image-fixed clearfix" />'),
				$fixed_pos = $('<div class="upfront-region-bg-image-fixed-pos"><div class="upfront-region-bg-setting-label-alt">Image Position:</div></div>'),
				$fixed_pos_num = $('<div class="upfront-region-bg-image-fixed-pos-num" />'),
				$fixed_color = $('<div class="upfront-region-bg-image-fixed-color"><div class="upfront-region-bg-setting-label-alt">Background Color:</div></div>');
			if ( !image ) {
				this.upload_image();
			}
			var pos_option = {
					default_value: 50,
					min: 0,
					max: 100,
					step: 1
				},
				fields = {
					bg_style: new Field_Select({
						model: this.model,
						property: 'background_style',
						default_value: 'full',
						icon_class: 'upfront-region-field-icon',
						values: [
							{ label: "Full Width", value: 'full', icon: 'bg-image-full' },
							{ label: "Tiled / Pattern", value: 'tile', icon: 'bg-image-tile' },
							{ label: "Fixed Position", value: 'fixed', icon: 'bg-image-fixed' }
						],
						change: function () {
							var value = this.get_value();
							if ( value == 'tile' ){
								$tile.show();
								$fixed.hide();
							}
							else if ( value == 'fixed' ){
								$fixed.show();
								$tile.hide();
							}
							else {
								$fixed.hide();
								$tile.hide();
							}
							me._bg_style = value;
							me.update_image();
						}
					}),
					bg_tile: new Field_Checkboxes({
						model: this.model,
						layout: 'horizontal-inline',
						default_value: ['y', 'x'],
						values: [
							{ label: "Tile Vertically", value: 'y' },
							{ label: "Tile Horizontally", value: 'x' }
						],
						change: function () {
							var value = this.get_value();
							me._bg_tile = value;
							me.update_image();
						}
					}),
					bg_color: new Field_Color({
						model: this.model,
						property: 'background_color',
						default_value: '#ffffff',
						spectrum: {
							move: function (color) {
								me.preview_color(color);
							},
							change: function (color) {
								me.update_color(color);
							},
							hide: function (color) {
								me.reset_color();
							}
						}
					}),
					bg_position_y: new Field_Slider(_.extend({
						model: this.model,
						orientation: 'vertical',
						property: 'background_position_y',
						range: false,
						change: function () {
							var value = this.get_value();
							fields.bg_position_y_num.get_field().val(value);
							me._bg_position_y = value;
							this.property.set({value: value});
							me.update_image();
						}
					}, pos_option)),
					bg_position_x: new Field_Slider(_.extend({
						model: this.model,
						property: 'background_position_x',
						range: false,
						change: function () {
							var value = this.get_value();
							fields.bg_position_x_num.get_field().val(value);
							me._bg_position_x = value;
							this.property.set({value: value});
							me.update_image();
						}
					}, pos_option)),
					bg_position_y_num: new Field_Number(_.extend({
						model: this.model,
						label: "Y:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							var value = this.get_value(),
								s = fields.bg_position_y;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						}
					}, pos_option)),
					bg_position_x_num: new Field_Number(_.extend({
						model: this.model,
						label: "X:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							var value = this.get_value(),
								s = fields.bg_position_x;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						}
					}, pos_option))
				};
			$tab.html('');
			_.each(fields, function (field) {
				field.render();
			});
			$style.append(fields.bg_style.$el);
			$tile.append(fields.bg_tile.$el);
			$fixed_pos_num.append(fields.bg_position_y_num.$el);
			$fixed_pos_num.append(fields.bg_position_x_num.$el);
			$fixed_pos.append($fixed_pos_num);
			$fixed_pos.append(fields.bg_position_y.$el);
			$fixed_pos.append(fields.bg_position_x.$el);
			$fixed_color.append(fields.bg_color.$el);
			$fixed.append($fixed_pos);
			$fixed.append($fixed_color);
			this._render_tab_template($tab, $style, [$tile, $fixed], 'image');
			this._bg_style = fields.bg_style.get_value();
			this._bg_tile = fields.bg_tile.get_value();
			this._bg_position_y = fields.bg_position_y.get_value();
			fields.bg_position_y.trigger('changed');
			this._bg_position_x = fields.bg_position_x.get_value();
			fields.bg_position_x.trigger('changed');
			//this._default_color = fields.bg_color.get_value();
			fields.bg_style.trigger('changed');
		},
		upload_image: function () {
			var me = this;
			Upfront.Views.Editor.ImageSelector.open().done(function(images){
				var sizes = {},
					image_id;
				_.each(images, function(image, id){
					sizes = image;
					image_id = id;
				});
				$('<img>').attr('src', sizes.full[0]).load(function(){
					Upfront.Views.Editor.ImageSelector.close();
					me.model.set_property('background_image', sizes.full[0]);
					me.model.set_property('background_image_ratio', Math.round(sizes.full[2]/sizes.full[1]*100)/100);
				});
			});
		},
		update_image: function () {
			var style = this._bg_style,
				tile = this._bg_tile,
				is_repeat_y = _.contains(tile, 'y'),
				is_repeat_x = _.contains(tile, 'x'),
				pos_y = this._bg_position_y,
				pos_x = this._bg_position_x;
			if ( style == 'full' ) {
				this.model.set_property('background_style', 'full');
			}
			else {
				if ( style == 'tile' ){
					this.model.set_property('background_style', 'tile');
					if ( is_repeat_x && is_repeat_y )
						this.model.set_property('background_repeat', 'repeat');
					else if ( is_repeat_y )
						this.model.set_property('background_repeat', 'repeat-y');
					else if ( is_repeat_x )
						this.model.set_property('background_repeat', 'repeat-x');
					else
						this.model.set_property('background_repeat', 'no-repeat');
				}
				else if ( style == 'fixed' ){
					this.model.set_property('background_style', 'fixed');
					this.model.set_property('background_repeat', 'no-repeat');
					this.model.set_property('background_position', pos_x + '% ' + pos_y + '%');
				}
			}
		},
		// Slider tab
		render_modal_tab_slider: function ($tab) {
			var me = this,
				slide_images = this.model.get_property_value_by_name('background_slider_images'),
				$rotate = $('<div class="upfront-region-bg-slider-rotate clearfix" />'),
				$transition = $('<div class="upfront-region-bg-slider-transition upfront-settings-item"><div class="upfront-settings-item-title" /><div class="upfront-settings-item-content" /></div>'),
				$transition_title = $transition.find('.upfront-settings-item-title'),
				$transition_content = $transition.find('.upfront-settings-item-content'),
				$slides = $('<div class="upfront-region-bg-slider-slides upfront-settings-item"><div class="upfront-settings-item-title" /><div class="upfront-settings-item-content upfront-no-select clearfix" /></div>'),
				$slides_title = $slides.find('.upfront-settings-item-title'),
				$slides_content = $slides.find('.upfront-settings-item-content'),
				set_value = function () {
					var value = this.get_value();
					this.property.set({value: value});
				};
			if ( !slide_images ){
				Upfront.Views.Editor.ImageSelector.open({multiple: true}).done(function(images){
					var image_ids = [];
					_.each(images, function(image, id){
						image_ids.push(id);
					});
					me.model.set_property('background_slider_images', image_ids);
					me.update_slider_slides($slides_content);
					Upfront.Views.Editor.ImageSelector.close();
				});
			}
			var fields = {
					rotate: new Field_Checkboxes({
						model: this.model,
						property: 'background_slider_rotate',
						default_value: true,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: "Rotate automatically every ", value: true } ],
						change: function () {
							var value = this.get_value();
							this.property.set({value: value ? true : false});
						}
					}),
					rotate_time: new Field_Number({
						model: this.model,
						property: 'background_slider_rotate_time',
						default_value: 5,
						min: 1,
						max: 60,
						step: 1,
						suffix: 'sec',
						change: set_value
					}),
					control: new Field_Radios({
						model: this.model,
						property: 'background_slider_control',
						default_value: 'always',
						layout: 'horizontal-inline',
						values: [
							{ label: "Always show slider controls", value: 'always' },
							{ label: "Show controls on hover", value: 'hover' }
						],
						change: set_value
					}),
					transition: new Field_Select({
						model: this.model,
						property: 'background_slider_transition',
						default_value: 'crossfade',
						icon_class: 'upfront-region-field-icon',
						values: [
							{ label: "Slide Down", value: 'slide-down', icon: 'bg-slider-slide-down' },
							{ label: "Slide Up", value: 'slide-up', icon: 'bg-slider-slide-up' },
							{ label: "Slide Left", value: 'slide-left', icon: 'bg-slider-slide-left' },
							{ label: "Slide Right", value: 'slide-right', icon: 'bg-slider-slide-right' },
							{ label: "Crossfade", value: 'crossfade', icon: 'bg-slider-crossfade' }
						],
						change: set_value
					})
				};
			$tab.html('');
			_.each(fields, function (field) {
				field.render();
			});
			$rotate.append(fields.rotate.$el);
			$rotate.append(fields.rotate_time.$el);
			$slides_title.text("Slides Order:");
			this._render_tab_template($tab, fields.transition.$el, [$rotate, fields.control.$el, $slides], 'slider');
			me.update_slider_slides($slides_content);
			$slides_content.on('click', '.upfront-region-bg-slider-add-image', function (e) {
				e.preventDefault();
				e.stopPropagation();
				Upfront.Views.Editor.ImageSelector.open({multiple: true}).done(function(images){
					var slide_images = _.clone(me.model.get_property_value_by_name('background_slider_images') || []);
					_.each(images, function(image, id){
						slide_images.push(id);
					});
					me.model.set_property('background_slider_images', slide_images);
					Upfront.Views.Editor.ImageSelector.close();
					me.update_slider_slides($slides_content);
				});
			});
			$slides_content.on('click', '.upfront-region-bg-slider-delete-image', function (e) {
				e.preventDefault();
				e.stopPropagation();
				var $image = $(this).closest('.upfront-region-bg-slider-image'),
					image_id = $image.data('image-id'),
					slide_images = me.model.get_property_value_by_name('background_slider_images');
				slide_images = _.without(slide_images, image_id);
				me.model.set_property('background_slider_images', slide_images);
				$image.remove();
			});
		},
		update_slider_slides: function ($wrap) {
			var me = this,
				slide_images = me.model.get_property_value_by_name('background_slider_images'),
				$add = $('<div class="upfront-region-bg-slider-add-image upfront-icon upfront-icon-region-add-slide">Add Slide</div>');
			$wrap.html('');

			if ( slide_images ) {
				Upfront.Views.Editor.ImageEditor.getImageData(slide_images).done(function(response){
					var images = response.data.images;
					_.each(slide_images, function (id) {
						var image = images[id],
							$image = $('<div class="upfront-region-bg-slider-image" />');
						$image.data('image-id', id);
						//$image.append('<img src="' + image.thumbnail[0] + '" alt="" />');
						$image.css({
							background: 'url("' + image.thumbnail[0] + '") no-repeat 50% 50%',
							backgroundSize: '100% auto'
						});
						$image.append('<span href="#" class="upfront-region-bg-slider-delete-image">&times;</span>');
						$wrap.append($image);
					});
					if ( $wrap.hasClass('ui-sortable') )
						$wrap.sortable('refresh');
					else
						$wrap.sortable({
							items: '>  .upfront-region-bg-slider-image',
							update: function () {
								var slide_images = [];
								$wrap.find('.upfront-region-bg-slider-image').each(function(){
									var id = $(this).data('image-id');
									if ( id )
										slide_images.push(id);
								});
								me.model.set_property('background_slider_images', slide_images);
							}
						});
					$wrap.append($add);
				});
			}
			else {
				$wrap.append($add);
			}
		},
		// Map tab
		render_modal_tab_map: function ($tab) {
			var me = this,
				map_center = this.model.get_property_value_by_name('background_map_center'),
				$location = $('<div class="upfront-region-bg-map-location clearfix" />'),
				$style_control = $('<div class="upfront-region-bg-map-style-control clearfix" />'),
				set_value = function () {
					var value = this.get_value();
					this.property.set({value: value});
				};
			if ( ! map_center ){
				this.model.init_property('background_map_center', [10.722250, 106.730762]);
				this.model.init_property('background_map_zoom', 10);
				this.model.init_property('background_map_style', "ROADMAP");
				this.model.init_property('background_map_controls', "");
			}
			this.once('modal:close', function(){
				me.geocode_location();
			});
			var fields = {
					location: new Field_Text({
						model: this.model,
						label: "Location:",
						property: 'background_map_location',
						placeholder: "e.g 123 Nice St",
						change: function () {
							var value = this.get_value();
							this.property.set({value: value}, {silent: true});
							me._location = value;
							me._location_changed = true;
						}
					}),
					zoom: new Field_Slider({
						model: this.model,
						label: "Zoom:",
						property: 'background_map_zoom',
						default_value: 8,
						min: 1,
						max: 19,
						step: 1,
						change: set_value
					}),
					style: new Field_Select({
						model: this.model,
						label: "Map Style:",
						property: 'background_map_style',
						values: [
							{ label: "Roadmap", value: 'ROADMAP' },
							{ label: "Satellite", value: 'SATELLITE' },
							{ label: "Hybrid", value: 'HYBRID' },
							{ label: "Terrain", value: 'TERRAIN' }
						],
						change: set_value
					}),
					controls: new Field_Select({
						model: this.model,
						label: "Controls:",
						property: 'background_map_controls',
						multiple: true,
						default_value: ["pan"],
						values: [
							{ label: "Pan", value: "pan" },
							{ label: "Zoom", value: "zoom" },
							{ label: "Map Type", value: "map_type" },
							{ label: "Scale", value: "scale" },
							{ label: "Street View", value: "street_view" },
							{ label: "Overview Map", value: "overview_map" }
						],
						change: set_value
					})
				};
			_.each(fields, function (field) {
				field.render();
			});
			$tab.html('');
			this._location = fields.location.get_value();
			$location.append(fields.location.$el);
			$location.append('<i class="upfront-field-icon upfront-field-icon-refresh-2 upfront-refresh-map" />');
			$location.on('click', '.upfront-refresh-map', function () {
				me.geocode_location();
			});
			$style_control.append(fields.style.$el);
			$style_control.append(fields.controls.$el);
			this._render_tab_template($tab, '', [$location, fields.zoom.$el, $style_control]);
		},
		geocode_location: function () {
			if ( this._geocoding == true || !this._location_changed )
				return;
			var me = this,
				location = this._location,
				geocoder = new google.maps.Geocoder();
			this._geocoding = true;
			geocoder.geocode({address: location}, function (results, status) {
				if (status != google.maps.GeocoderStatus.OK) return false;
				var pos = results[0].geometry.location;

				me.model.set_property("background_map_center", [pos.lat(), pos.lng()]);
				me._geocoding = false;
				me._location_changed = false;
			});
		},
		// Video tab
		render_modal_tab_video: function ($tab) {
			var me = this,
				label_html = '<div class="upfront-region-bg-setting-label"></div>',
				$style_label = $(label_html).text("Video background behavior"),
				$video_label = $(label_html).text("Video URL"),
				fields = {
					mute: new Field_Checkboxes({
						model: this.model,
						property: 'background_video_mute',
						default_value: true,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: "Mute video on play?", value: true } ],
						change: function () {
							var value = this.get_value();
							this.property.set({value: value ? true : false});
						}
					}),
					video: new Field_Text({
						model: this.model,
						property: 'background_video',
						default_value: '',
						placeholder: 'Video URL (YouTube, Vimeo or Wistia)',
						change: function () {
							var value = this.get_value();
							if ( value ){
								me.model.set_property('background_video_embed', "");
								me.get_video_embed(value).done(function(response){
									console.log(response);
									if ( !response.data || !response.data.width || !response.data.height )
										return;
									me.model.set_property('background_video_width', response.data.width);
									me.model.set_property('background_video_height', response.data.height);
									me.model.set_property('background_video_embed', response.data.html);
								});
							}
							this.property.set({value: value});
						}
					}),
					style: new Field_Radios({
						model: this.model,
						property: 'background_video_style',
						layout: 'horizontal-inline',
						default_value: ["crop"],
						values: [
							{ label: "Scale & crop", value: "crop" },
							{ label: "No crop embed", value: "full" },
							{ label: "No crop + bg color", value: "inside" }
						],
						change: function () {
							var value = this.get_value();
							if ( value == 'inside' )
								fields.color.$el.show();
							else
								fields.color.$el.hide();
							this.property.set({value: value});
						}
					}),
					color: new Field_Color({
						model: this.model,
						label: "Area BG Color:",
						label_style: 'inline',
						property: 'background_color',
						default_value: '#ffffff',
						spectrum: {
							move: function (color) {
								me.preview_color(color);
							},
							change: function (color) {
								me.update_color(color);
							},
							hide: function (color) {
								me.reset_color();
							}
						}
					}),
				};
			$tab.html('');
			_.each(fields, function (field) {
				field.render();
			});
			this._render_tab_template($tab, /*fields.mute.$el*/ '', [$style_label, fields.style.$el, fields.color.$el, $video_label, fields.video.$el], 'video');
			fields.style.trigger('changed');
		},
		get_video_embed: function (url) {
			return Upfront.Util.post({
				action: "upfront-media-get_embed_raw",
				media: url
			});
		},
		// Expand lock trigger
		render_expand_lock: function ($el) {
			var locked = this.model.get_property_value_by_name('expand_lock'),
				$icon = $('<i class="upfront-field-icon upfront-region-field-icon" />'),
				$status = $('<span />');
			if ( locked ){
				$icon.addClass('upfront-region-field-icon-expand-lock');
				$status.addClass('auto-resize-off').text('OFF');
			}
			else {
				$icon.addClass('upfront-region-field-icon-expand-unlock');
				$status.addClass('auto-resize-on').text('ON');
			}
			$el.html('');
			$el.append($icon);
			$el.append('<span>Auto-resize is </span>');
			$el.append($status);
		},
		trigger_expand_lock: function ($el) {
			var locked = this.model.get_property_value_by_name('expand_lock');
			this.model.set_property('expand_lock', !locked);
			this.render_expand_lock($el);
		}
	});


	var InlinePanelItem = Backbone.View.extend({
		className: 'upfront-inline-panel-item',
		width: 40,
		height: 40,
		render_icon: function () {
			var icon = typeof this.icon == 'function' ? this.icon() : this.icon;
			if ( !icon )
				return;
			var icons = icon.split(" "),
				icons_class = [],
				$icon = this.$el.find('.upfront-icon');
			_.each(icons, function(each){
				icons_class.push('upfront-icon-region-' + each);
			});
			if ( !$icon.length )
				this.$el.append('<i class="upfront-icon ' + icons_class.join(' ') + '" />');
			else
				$icon.attr('class', 'upfront-icon ' + icons_class.join(' '));
		},
		render_label: function () {
			var label = typeof this.label == 'function' ? this.label() : this.label;
			if ( !label )
				return;
			var $label = this.$el.find('.upfront-inline-panel-item-label');
			if ( !$label.length )
				this.$el.append('<span class="upfront-inline-panel-item-label">' + label + '</span>');
			else
				$label.html(label);
		},
		render_tooltip: function () {
			var tooltip = typeof this.tooltip == 'function' ? this.tooltip() : this.tooltip;
			if ( ! tooltip )
				return;
			var tooltip_pos = typeof this.tooltip_pos == 'function' ? this.tooltip_pos() : (this.tooltip_pos ? this.tooltip_pos : 'bottom'),
				$content = this.$el.find('.tooltip-content');
			this.$el.removeClass('tooltip-top tooltip-bottom tooltip-left tooltip-right');
			this.$el.addClass('tooltip-inline tooltip-' + tooltip_pos);
			if ( !$content.length )
				this.$el.prepend('<span class="tooltip-content">' + tooltip + '</span>');
			else
				$content.html(tooltip);
		},
		render: function () {
			this.render_icon();
			this.render_label();
			this.render_tooltip();
			this.$el.css({
				width: this.width,
				height: this.height
			});
			if ( typeof this.on_render == 'function' )
				this.on_render();
		},
		open_modal: function (render_callback, button) {
			if ( ! this.modal ){
				var me = this;
				var $region_container = this.$el.closest('.upfront-region-container');
				this.modal = new Upfront.Views.Editor.Modal({ to: $region_container, top: 60 });
				this.modal.render();
				$region_container.append(this.modal.$el);
			}
			this.listenToOnce(Upfront.Events, "entity:region:deactivated", function(){
				 me.close_modal(false);
			});
			return this.modal.open(render_callback, this, button);
		},
		close_modal: function (save) {
			return this.modal.close(save);
		},
		remove: function(){
			this.panel_view = false;
		}
	});

	var InlinePanelItemMulti = InlinePanelItem.extend({
		events: {
			'click >.upfront-icon': 'toggle_subitem'
		},
		initialize: function () {
			this.sub_items = {};
			this.listenTo(Upfront.Events, 'entity:region:activated', this.on_region_change);
		},
		get_selected_item: function () {

		},
		get_default_item: function () {

		},
		get_selected_icon: function (selected) {
			return selected + '-active';
		},
		set_selected_item: function (selected) {

		},
		select_item: function (selected) {
			this.set_selected_item(selected);
			this.render();
		},
		render: function () {
			var me = this,
				selected = this.get_selected_item() || this.get_default_item(),
				$sub_items = $('<div class="upfront-inline-panel-subitem" />');
			this.$el.html('');
			this.icon = this.get_selected_icon(selected);
			this.render_icon();
			this.render_tooltip();
			_.each(this.sub_items, function(item, id){
				item.panel_view = me.panel_view;
				item.parent_view = me;
				item.render();
				item.delegateEvents();
				if ( selected != id )
					$sub_items.append(item.el);
			});
			$sub_items.append(this.sub_items[selected].el);
			this.$el.append($sub_items);
		},
		toggle_subitem: function () {
			if ( this.$el.hasClass('upfront-inline-panel-subitem-active') )
				this.close_subitem();
			else
				this.open_subitem();
		},
		open_subitem: function () {
			this.$el.addClass('upfront-inline-panel-subitem-active');
			this.$el.removeClass('upfront-inline-panel-subitem-inactive');
		},
		close_subitem: function () {
			this.$el.addClass('upfront-inline-panel-subitem-inactive');
			this.$el.removeClass('upfront-inline-panel-subitem-active');
		},
		on_region_change: function (region) {
			if ( region.model != this.model )
				this.close_subitem();
		},
		remove: function(){
			if(this.sub_items)
				_.each(this.sub_items, function(item){
					item.remove();
				});
			this.panel_view = false;
			Backbone.View.prototype.remove.call(this);
		}
	});

	var RegionPanelItem = InlinePanelItem.extend({
		initialize: function () {
			this.on('modal:open', this.on_modal_open, this);
			this.on('modal:close', this.on_modal_close, this);
		},
		on_modal_open: function () {
			// Disable region changing
			Upfront.Events.trigger('command:region:edit_toggle', false);
		},
		on_modal_close: function () {
			// Re-enable region changing
			Upfront.Events.trigger('command:region:edit_toggle', true);
		}
	});

	var RegionPanelItem_BgSetting = RegionPanelItem.extend({
		events: {
			'click .upfront-icon': 'open_bg_setting'
		},
		className: 'upfront-inline-panel-item upfront-region-panel-item-bg',
		icon: function(){
			return this._active ? 'bg-setting-active' : 'bg-setting';
		},
		tooltip: "Change Background",
		_active: false,
		open_bg_setting: function () {
			var type = this.model.get_property_value_by_name('background_type');
			if ( !type ){
				if ( this.model.get_property_value_by_name('background_image') )
					this.model.set_property('background_type', 'image');
			}
			this._active = true;
			this.render_icon();
			this.open_modal(this.render_modal, true).always($.proxy(this.on_close_modal, this)).fail($.proxy(this.notify, this));
		},
	});

	var RegionPanelItem_ExpandLock = InlinePanelItem.extend({
		events: {
			'click .upfront-icon': 'toggle_lock'
		},
		className: 'upfront-inline-panel-item upfront-region-panel-item-expand-lock',
		icon: function () {
			var locked = this.model.get_property_value_by_name('expand_lock');
			return locked ? 'expand-lock' : 'expand-unlock';
		},
		tooltip: function () {
			var locked = this.model.get_property_value_by_name('expand_lock'),
				status = '<span class="' + (locked ? 'expand-lock-active' : 'expand-lock-inactive') + '">' + (locked ? 'OFF' : 'ON') + '</span>';
			return "Auto-expand to fit <br />elements as they <br />are added " + status;
		},
		toggle_lock: function () {
			var locked = this.model.get_property_value_by_name('expand_lock');
			this.model.set_property('expand_lock', !locked);
			this.render_icon();
			this.render_tooltip();
		}
	});

	var RegionPanelItem_AddRegion = InlinePanelItem.extend({
		events: {
			'click .upfront-icon': 'add_region'
		},
		className: 'upfront-inline-panel-item upfront-region-panel-item-add-region',
		icon: function () {
			var to = this.options.to;
			return 'add ' + 'add-' + to;
		},
		tooltip: function () {
			var to = this.options.to;
			switch ( to ){
				case 'bottom':
					var pos = "below"; break;
				case 'left':
					var pos = "before"; break;
				case 'right':
					var pos = "after"; break;
				default:
					var pos = "above"; break;
			}
			return "Insert new region " + pos;
		},
		tooltip_pos: function () {
			var to = this.options.to;
			switch ( to ){
				case 'bottom':
					var pos = 'top'; break;
				case 'left':
					var pos = 'right'; break;
				case 'right':
					var pos = 'left'; break;
				default:
					var pos = 'bottom'; break;
			}
			return pos;
		},
		initialize: function (opts) {
			this.options = opts;
			if ( ! this.options.to )
				this.options.to = 'top';
		},
		get_new_title: function (start) {
			var title = 'Region ' + start,
				name = title.toLowerCase().replace(/\s/, '-');
			if ( this.model.collection.get_by_name(name) )
				return this.get_new_title(start+1);
			return title;
		},
		add_region: function (e) {
			var to = this.options.to,
				collection = this.model.collection,
				total = collection.size()-1, // total minus shadow region
				index = collection.indexOf(this.model),
				position = this.model.get('position'),
				sub_model = this.model.get_sub_regions(),
				is_new_container = ( to == 'top' || to == 'bottom' ),
				is_before = ( to == 'top' || to == 'left' ),
				title = is_new_container ? this.get_new_title(total) : this.model.get('name') + ' ' + to.charAt(0).toUpperCase() + to.slice(1),
				name = title.toLowerCase().replace(/\s/, '-'),
				new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
					"name": name,
					"container": is_new_container ? name : this.model.get('name'),
					"title": title
				}));
			if ( ! is_new_container ) {
				new_region.set_property('col', 5);
				new_region.set_property('sub', is_before ? 'left' : 'right');
				new_region.set_property('position', is_before ? position-1 : position+1 );
				new_region.set({scope: this.model.get('scope')});
			}
			else {
				new_region.set_property('row', Upfront.Util.height_to_row(300)); // default to 300px worth of rows
				if ( to == 'top' && sub_model.left )
					index--;
				else if ( to == 'bottom' && sub_model.right )
					index++;
			}
			if ( new_region.get('clip') || !is_new_container ){
				Upfront.Events.once('entity:region:before_render', this.before_animation, this);
				Upfront.Events.once('entity:region:added', this.run_animation, this);
			}
			else {
				Upfront.Events.once('entity:region_container:before_render', this.before_animation, this);
				Upfront.Events.once('entity:region:added', this.run_animation, this);
			}
			console.log(index);
			new_region.add_to(collection, (is_before ? index : index+1), {sub: is_before ? 'left' : 'right'});
			e.stopPropagation();
		},
		before_animation: function (view, model) {
			// prepare to run animation, disable edit
			Upfront.Events.trigger('command:region:edit_toggle', false);
		},
		run_animation: function (view, model) {
			var to = this.options.to,
				ani_class = 'upfront-add-region-ani upfront-add-region-ani-' + to,
				end_t = setTimeout(end, 2000);
			// add animation class to trigger css animation
			view.$el.addClass(ani_class);
			// scroll if needed
			if ( to == 'top' || to == 'bottom' ){
				var $container = view.$el.hasClass('upfront-region-container') ? view.$el : view.$el.closest('.upfront-region-container'),
					offset = $container.offset(),
					scroll_top = $(document).scrollTop(),
					scroll_to = false,
					height = $container.height(),
					w_height = $(window).height();
				if ( to == 'top' && offset.top < scroll_top )
					scroll_to = offset.top - 50;
				else if ( to == 'bottom' && offset.top+height > scroll_top+w_height )
					scroll_to = offset.top+height-w_height;
				if ( scroll_to !== false )
					$('html,body').animate( {scrollTop: scroll_to}, 600 );
			}
			view.$el.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function () {
				end();
				clearTimeout(end_t);
			});
			function end () {
				var baseline = Upfront.Settings.LayoutEditor.Grid.baseline,
					height = view.$el.outerHeight();
				//model.set_property('row', Math.ceil(height/baseline), true);
				view.$el.removeClass(ani_class);
				// enable edit and activate the new region
				Upfront.Events.trigger('command:region:edit_toggle', true);
				view.trigger("activate_region", view);
			}
		}
	});

	var RegionPanelItem_DeleteRegion = InlinePanelItem.extend({
		events: {
			'click .upfront-icon': 'delete_region'
		},
		className: 'upfront-inline-panel-item upfront-region-panel-item-delete-region',
		icon: 'delete',
		tooltip: "Delete this section",
		//label: "Delete this section",
		delete_region: function () {
			if ( confirm("Are you sure you want to delete this section?") )
				this.model.collection.remove(this.model);
		}
	});

	var InlinePanel = Backbone.View.extend({
		className: 'upfront-inline-panel upfront-no-select',
		position_v: 'top',
		position_h: 'center',
		initialize: function () {
			this.items = _([]);
		},
		render: function() {
			var me = this,
				items = typeof this.items == 'function' ? this.items() : this.items,
				classes = [
					'upfront-inline-panel-'+this.position_v,
					'upfront-inline-panel-'+this.position_v+'-'+this.position_h
				],
				width = 0,
				height = 0;
			this.$el.html('');
			items.each(function(item){
				item.panel_view = me;
				item.render();
				item.delegateEvents();
				me.$el.append(item.el);
				if ( me.position_v == 'center' ) {
					width = item.width > width ? item.width : width;
					height += item.height;
				}
				else {
					width += item.width;
					height = item.height > height ? item.height : height;
				}
			});
			this.$el.attr('class', this.className + ' ' + classes.join(' '));
			this.$el.css({
				width: width,
				height: height
			});
		},
		remove: function() {
			var items = typeof this.items == 'function' ? this.items() : this.items;

			if(items)
				items.each(function(item){
					item.remove();
				})
			Backbone.View.prototype.remove.call(this);
		}
	});

	var RegionPanel = InlinePanel.extend({
		className: 'upfront-inline-panel upfront-region-panel upfront-no-select',
		initialize: function () {
			this.items = _([]);
		},
		render: function() {
			var me = this,
				items = typeof this.items == 'function' ? this.items() : this.items,
				classes = [
					'upfront-inline-panel-'+this.position_v,
					'upfront-inline-panel-'+this.position_v+'-'+this.position_h
				],
				width = 0,
				height = 0;
			this.$el.html('');
			items.each(function(item){
				item.panel_view = me;
				item.render();
				item.delegateEvents();
				me.$el.append(item.el);
				if ( me.position_v == 'center' )
					height += item.$el.height();
				else
					width += item.$el.width();
			});
			this.$el.attr('class', this.className + ' ' + classes.join(' '));
		},
		remove: function() {
			var items = typeof this.items == 'function' ? this.items() : this.items;

			if(items)
				items.each(function(item){
					item.remove();
				})
			Backbone.View.prototype.remove.call(this);
		}
	});

	var RegionPanel_Edit = InlinePanel.extend({
		initialize: function () {
			//this.bg = new RegionPanelItem_BgSetting({model: this.model});
			if ( this.model.is_main() ){
				//this.expand_lock = new RegionPanelItem_ExpandLock({model: this.model});
				this.add_region = new RegionPanelItem_AddRegion({model: this.model, to: 'top'});
			}
			//this.delete_region = new RegionPanelItem_DeleteRegion({model: this.model});
		},
		items: function () {
			var items = _([]),
				type = this.model.get_property_value_by_name('background_type'),
				sub = this.model.get('sub');
			//items.push(this.bg);
			//if ( this.expand_lock )
			//	items.push(this.expand_lock);
			if ( this.add_region && type != 'full' )
				items.push(this.add_region);
			if ( this.model.is_main() ) {
				// if ( ! this.model.has_side_region() && ! this.model.get('default') && this.model.get('scope') != 'global' )
					// items.push( this.delete_region );
			}
			else {
				// if ( sub != 'top' && sub != 'bottom' )
					// items.push( this.delete_region );
			}
			return items;
		}
	});

	var RegionPanel_Add = InlinePanel.extend({
		initialize: function (opts) {
			this.options = opts;
			if ( ! this.options.to )
				this.options.to = 'bottom';
			var to = this.options.to;
			this.items = _( [ new RegionPanelItem_AddRegion({model: this.model, to: to}) ] );
			if ( to == 'bottom' ){
				this.position_v = 'bottom';
			}
			else if ( to == 'left' || to == 'right' ) {
				this.position_v = 'center';
				this.position_h = to;
			}
		},
		items: function () {
			return _([ this.add_region ]);
		}
	});

	var RegionPanel_Delete = InlinePanel.extend({
		position_h: 'right',
		initialize: function () {
			this.items = _( [ new RegionPanelItem_DeleteRegion({model: this.model}) ] );
		}
	});

	var InlinePanels = Backbone.View.extend({
		className: 'upfront-inline-panels upfront-ui',
		initialize: function () {
			this.panels = _([]);
		},
		render: function () {
			var me = this,
				panels = typeof this.panels == 'function' ? this.panels() : this.panels,
				$wrap = $('<div class="upfront-inline-panels-wrap" />');
			this.$el.html('');
			panels.each(function(panel){
				if ( !panel )
					return;
				panel.panels_view = me;
				panel.render();
				panel.delegateEvents();
				$wrap.append(panel.el);
			});
			this.$el.append($wrap);
			if ( typeof this.on_render == 'function' )
				this.on_render();
		},
		on_active: function () {
			$('.upfront-inline-panels-active').removeClass('upfront-inline-panels-active');
			this.$el.addClass('upfront-inline-panels-active');
		},
		remove: function() {
			var panels = typeof this.panels == 'function' ? this.panels() : this.panels;
			if(panels)
				panels.each(function(panel){
					panel.remove();
				});
			Backbone.View.prototype.remove.call(this);
		}
	});

	var RegionPanels = InlinePanels.extend({
		className: 'upfront-inline-panels upfront-region-panels upfront-ui',
		initialize: function () {
			var container = this.model.get('container'),
				name = this.model.get('name');
			this.listenTo(this.model.collection, 'add', this.render);
			this.listenTo(this.model.collection, 'remove', this.render);
			this.listenTo(Upfront.Events, "entity:region:activated", this.on_region_active);
			this.listenTo(Upfront.Events, "command:region:edit_toggle", this.update_pos);
			$(window).on('scroll', this, this.on_scroll);
			this.edit_panel = new RegionPanel_Edit({model: this.model});
			//this.delete_panel = new RegionPanel_Delete({model: this.model});
			this.add_panel_bottom = new RegionPanel_Add({model: this.model, to: 'bottom'});
			if ( this.model.is_main() && this.model.get('allow_sidebar') ){
				this.add_panel_left = new RegionPanel_Add({model: this.model, to: 'left'});
				this.add_panel_right = new RegionPanel_Add({model: this.model, to: 'right'})
			}
		},
		panels: function () {
			var panels = _([]),
				collection = this.model.collection || new Backbone.Collection([]),
				container = this.model.get('container') || this.model.get('name'),
				index = collection.indexOf(this.model),
				total = collection.size()-1; // total minus shadow region
			panels.push( this.edit_panel );
			//if ( index == total-1 ) // last region
			//	panels.push( this.add_panel_bottom );
			if ( this.model.is_main() ) {
				var sub_models = this.model.get_sub_regions();
				if ( this.model.get('allow_sidebar') ){
					if ( sub_models.left === false )
						panels.push( this.add_panel_left );
					if ( sub_models.right === false )
						panels.push( this.add_panel_right );
				}
				panels.push( this.add_panel_bottom );
			}
			this._panels = panels;
			return panels;
		},
		on_scroll: function (e) {
			var me = e.data;
			me.update_pos();
		},
		on_region_active: function (region) {
			if ( region.model != this.model )
				return;
			this.on_active();
			this.update_pos();
		},
		update_pos: function () {
			var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				$region = this.$el.closest('.upfront-region');
			if ( !$main.hasClass('upfront-region-editing') || !$region.hasClass('upfront-region-active') )
				return;
			var	offset = $region.offset(),
				top = offset.top,
				bottom = top + $region.outerHeight(),
				scroll_top = $(document).scrollTop(),
				scroll_bottom = scroll_top + $(window).height(),
				rel_top = $main.offset().top;
			/*this.$el.css({
				top: scroll_top > top ? scroll_top-top+25 : 0,
				bottom: bottom > scroll_bottom ? bottom-scroll_bottom : 0
			});*/
			this._panels.each(function (panel) {
				var panel_offset = panel.$el.offset();
				if ( panel.position_v == 'top' && scroll_top > top-rel_top && scroll_top < bottom-rel_top ){
					if ( panel.$el.css('position') != 'fixed' )
						panel.$el.css({
							position: 'fixed',
							top: rel_top,
							left: panel_offset.left,
							right: 'auto'
						});
				}
				else if ( panel.position_v == 'bottom' && bottom > scroll_bottom && top < scroll_bottom ){
					if ( panel.$el.css('position') != 'fixed' )
						panel.$el.css({
							position: 'fixed',
							bottom: 0,
							left: panel_offset.left,
							right: 'auto'
						});
				}
				else if ( panel.position_v == 'center' && ( scroll_top > top-rel_top || bottom > scroll_bottom ) ){
					var panel_top = scroll_top > top-rel_top ? rel_top : top-scroll_top,
						panel_bottom = bottom > scroll_bottom ? 0 : scroll_bottom-bottom,
						panel_left = panel.position_h == 'left' ? panel_offset.left : 'auto',
						panel_right = panel.position_h == 'right' ? $(window).width()-(offset.left+$region.width()) : 'auto';
					if ( panel.$el.css('position') != 'fixed' )
						panel.$el.css({
							position: 'fixed',
							top: panel_top,
							bottom: panel_bottom,
							left: panel_left,
							right: panel_right
						});
					else
						panel.$el.css({
							top: panel_top,
							bottom: panel_bottom
						});
				}
				else {
					panel.$el.css({
						position: '',
						top: '',
						bottom: '',
						left: '',
						right: ''
					});
				}
			});
		},
		remove: function() {
			this.edit_panel.remove();
			//this.delete_panel.remove();
			this.add_panel_bottom.remove();
			this.edit_panel = false;
			this.delete_panel = false;
			this.add_panel_bottom = false;
			if ( this.model.is_main() && this.model.get('allow_sidebar') ){
				this.add_panel_left.remove();
				this.add_panel_right.remove();
				this.add_panel_left = false;
				this.add_panel_right = false;
			}
			$(window).off('scroll', this, this.on_scroll);
			Backbone.View.prototype.remove.call(this);
		}
	});

	return {
		"Editor": {
			"Property": Property,
			"Properties": Properties,
			"Commands": Commands,
			"Command": Command,
			"Command_SaveLayout": Command_SaveLayout,
			"Command_Undo": Command_Undo,
			"Command_ToggleGrid": Command_ToggleGrid,
			"Command_Merge": Command_Merge,
			"Layouts": LayoutSizes,
			"Settings": {
				"Settings": Settings,
				"Panel": SettingsPanel,
				"Item": SettingsItem,
				"ItemTabbed": SettingsItemTabbed,
				"Anchor": {
					"Trigger": Settings_AnchorTrigger,
					"LabeledTrigger": Settings_LabeledAnchorTrigger
				}
			},
			"Field": {
				"Field": Field,
				"Text": Field_Text,
				"Button": Field_Button,
				"Email": Field_Email,
				"Textarea": Field_Textarea,
				"Color": Field_Color,
				"Multiple_Suggest": Field_Multiple_Suggest,
				"Number": Field_Number,
				"Slider": Field_Slider,
				"Select": Field_Select,
				"Radios": Field_Radios,
				"Checkboxes": Field_Checkboxes,
				"Hidden": Field_Hidden,
				"Anchor": Field_Anchor
			},
			"Sidebar": {
				"Sidebar": Sidebar,
				"Panel": SidebarPanel,
				"Element": DraggableElement
			},
			notify : function(message, type){
				notifier.addMessage(message, type);
			},
			"Loading": Loading,
			"Modal": Modal,
			"ModalBgSetting": ModalBgSetting,
			"PostSelector": new PostSelector(),
			"InlinePanels": {
				"Panels": InlinePanels,
				"Panel": InlinePanel,
				"ItemMulti": InlinePanelItemMulti,
				"Item": InlinePanelItem
			},
			"RegionPanels": RegionPanels,
			"CSSEditor": CSSEditor
		}
	};
});

})(jQuery);

