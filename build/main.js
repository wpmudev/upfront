
(function ($) {

define('application',[],function() {

var Subapplication = Backbone.Router.extend({
	start: function () {
		Upfront.Util.log("Implement runner method");
	},

	go: function (frag) {
		Upfront.Events.trigger("subapplication:navigate:" + frag);
		return this.navigate(frag);
	}
});

var LayoutEditor = new (Subapplication.extend({

	Objects: {},

	boot: function () {

	},

	start: function () {
		this.set_up_event_plumbing_before_render();
		this.set_up_editor_interface();

		this.set_up_event_plumbing_after_render();
		$("html").removeClass("upfront-edit-content").addClass("upfront-edit-layout");
	},

	stop: function () {
		Upfront.Events.off("entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable, this);
		Upfront.Events.off("entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable, this);
// Hack
$(".upfront-layout .ui-draggable").each(function () {
	$(this).draggable("disable")
})
		Upfront.Events.off("entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable, this);
		Upfront.Events.off("entity:region_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable, this);

		Upfront.Events.off("entity:activated", this.create_properties, this);
		Upfront.Events.off("entity:deactivated", this.destroy_properties, this);
		Upfront.Events.off("command:layout:save", this.save_layout, this);
		Upfront.Events.off("command:layout:save_as", this.save_layout_as, this);
		Upfront.Events.off("command:layout:preview", this.preview_layout, this);
		Upfront.Events.off("command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable, this);
		Upfront.Events.off("entity:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:region:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.off("command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.off("command:select", Upfront.Behaviors.LayoutEditor.create_mergeable, this);
		Upfront.Events.off("command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.off("command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.off("entity:settings:activate", this.create_settings, this);
		Upfront.Events.off("entity:settings:deactivate", this.destroy_settings, this);
		Upfront.Events.off("entity:removed:after", this.destroy_settings, this);

		Upfront.Events.off("layout:render", Upfront.Behaviors.GridEditor.refresh_draggables, this);
	},

	save_layout_as: function () {
		Upfront.Behaviors.LayoutEditor.save_dialog(this._save_layout, this);
	},

	save_layout: function () {
		this._save_layout(this.layout.get("current_layout"));
	},

	_save_layout: function (preferred_layout) {
		var data = Upfront.Util.model_to_json(this.layout);
		data.layout = _upfront_post_data.layout;
		data.preferred_layout = preferred_layout;
		data = JSON.stringify(data, undefined, 2);

		if (Upfront.Settings.Application.NO_SAVE) {
			Upfront.Events.trigger("command:layout:save_success");
			return false;
		}

		Upfront.Util.post({"action": Upfront.Application.actions.save, "data": data})
			.success(function () {
				Upfront.Util.log("layout saved");
				Upfront.Events.trigger("command:layout:save_success");
			})
			.error(function () {
				Upfront.Util.log("error saving layout");
				Upfront.Events.trigger("command:layout:save_error");
			})
		;
	},

	preview_layout: function () {
		var data = Upfront.Util.model_to_json(this.layout),
			preview = false
		;
		data.layout = _upfront_post_data.layout;
		data.preferred_layout = this.layout.get("current_layout");
		data = JSON.stringify(data, undefined, 2);

		preview = window.open("", "", "height=600,width=800,scrollbars=1,location=no,menubar=no,resizable=1,status=no,toolbar=no");
		preview.document.write("Building preview, please wait... ");

		Upfront.Util.post({action: "upfront_build_preview", "data": data, "current_url": window.location.href})
			.success(function (response) {
				var data = response.data || {};
				if ("html" in data && data.html) {
					preview.document.open();
					preview.document.write(data.html);
				} else {
					Upfront.Util.log("Invalid response");
					preview.close();
				}
			})
			.error(function () {
				Upfront.Util.log("error building layout preview");
				preview.close();
			})
		;
	},

	destroy_editor: function () {
		this.navigate("");
		window.location.reload();
		return false;
	},

	set_up_editor_interface: function () {
		if (!this.layout) return false;
		var app = this;

		var _set_up_draggables = function () {
			var elements = [];
			_(app.Objects).each(function (obj, idx) {
				if ( obj.Element ) {
					var el = new obj.Element({"model": app.layout});
					el.element_type = idx;
					elements.push(el);
				}
				if ( obj.Command )
					app.sidebar.get_commands("control").commands.push(new obj.Command({"model": app.layout}));
			});
			Upfront.Application.sidebar.get_panel("elements").elements = _(_.sortBy(elements, function(element){
				return element.priority;
			}));

			Upfront.Application.sidebar.render();
		}
		_set_up_draggables();
		Upfront.Events.on("elements:requirements:async:added", _set_up_draggables, this);
	},

	add_object: function (name, data) {
		this.Objects[name] = _.extend({}, Upfront.Mixins.Anchorable, data);
	},


	set_up_event_plumbing_before_render: function () {
		// Set up behavior
		Upfront.Events.on("entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable, this);
		Upfront.Events.on("entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable, this);
// Hack
$(".upfront-layout .ui-draggable").each(function () {
	$(this).draggable("enable")
})
		Upfront.Events.on("entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable, this);
		Upfront.Events.on("entity:region_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable, this);
		Upfront.Events.on("layout:render", Upfront.Behaviors.GridEditor.refresh_draggables, this);
	},

	set_up_event_plumbing_after_render: function () {
		// Set up properties
		Upfront.Events.on("entity:activated", this.create_properties, this);
		Upfront.Events.on("entity:deactivated", this.destroy_properties, this);

		// Layout manipulation
		Upfront.Events.on("command:layout:save", this.save_layout, this);
		Upfront.Events.on("command:layout:save_as", this.save_layout_as, this);
		Upfront.Events.on("command:layout:preview", this.preview_layout, this);

		Upfront.Behaviors.GridEditor.init();

		// Region
		Upfront.Events.on("command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable, this);

		// Undo / Redo
		Upfront.Events.on("entity:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:region:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);

		Upfront.Events.on("command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.on("command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);

		// Set up element merging
		Upfront.Events.on("command:select", Upfront.Behaviors.LayoutEditor.create_mergeable, this);
		Upfront.Events.on("command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.on("command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);

		// Set up entity settings (modules, for now)
		Upfront.Events.on("entity:settings:activate", this.create_settings, this);
		Upfront.Events.on("entity:settings:deactivate", this.destroy_settings, this);
		Upfront.Events.on("entity:removed:after", this.destroy_settings, this);

		//Upfront.Events.on("upfront:posts:post:post_updated", this.layout_view.render, this.layout_view);

		// Showing the "busy" overlay on saving.
		var loading = false,
			start = function () {
				loading = new Upfront.Views.Editor.Loading({
					loading: "Saving...",
					done: "All done!",
					fixed: true
				});
				loading.render();
				$('body').append(loading.$el);
			},
			stop = function () {
				loading.done();
			}
		;
		Upfront.Events.on("command:layout:save", start, this);
		Upfront.Events.on("command:layout:save_success", stop, this);
		Upfront.Events.on("command:layout:save_error", stop, this);
	},

	create_properties: function (view, model) {
		this.property_view = new Upfront.Views.Editor.Properties({
			"model": model,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.properties)
		});
		this.property_view.render();
	},

	destroy_properties: function () {
		$(Upfront.Settings.LayoutEditor.Selectors.properties).html('');
	},

	create_settings: function (view) {
		if (this.settings_view) return this.destroy_settings();
		if (!parseInt(view.model.get_property_value_by_name("has_settings"), 10)) return false;
		var current_object = _(this.Objects).reduce(function (obj, current) {
				return (view instanceof current.View) ? current : obj;
			}, false),
			current_object = (current_object && current_object.Settings ? current_object : Upfront.Views.Editor.Settings)
			settings_view = new current_object.Settings({
				model: view.model,
				anchor: current_object.anchor,
				el: $(Upfront.Settings.LayoutEditor.Selectors.settings)
			})
		;
		settings_view.for_view = view;
		settings_view.render();
		this.settings_view = settings_view;

		settings_view.trigger('rendered');
	},

	destroy_settings: function () {
		if (!this.settings_view) return false;
		$(Upfront.Settings.LayoutEditor.Selectors.settings).html('').hide();
		this.settings_view = false;

		settings_view.trigger('closed');
	},

	create_post: function(postType){
		Upfront.Settings.LayoutEditor.newpostType = postType;
		this.load_layout({item: 'single-' + postType, type: 'single'});
	}

}))();


var ContentEditor = new (Subapplication.extend({
	boot: function () {
		Upfront.Util.log("Preparing content mode for execution")
	},

	start: function () {
		Upfront.Util.log("Starting the content edit mode");

		// Null out draggables
		Upfront.Application.sidebar.get_panel("elements").elements = _([]);
		Upfront.Application.sidebar.render();
		if (Upfront.Application.sidebar.get_panel("settings")) {
			Upfront.Application.sidebar.get_panel("settings").$el.empty(); // This is UGLY, refactor
		}

		$("html").removeClass("upfront-edit-layout").addClass("upfront-edit-content");
	},

	stop: function () {
		Upfront.Util.log("Stopping the content edit mode");
	}

}))();


var Application = new (Backbone.Router.extend({
	LayoutEditor: LayoutEditor,
	ContentEditor: ContentEditor,

	actions: {
		"save": "upfront_save_layout",
		"load": "upfront_load_layout"
	},

	routes: {
		"done": "destroy_editor",
		"new-layout": "dispatch_layout_creation",
		"create(/:postType)": "create_post",
	},

	MODE: {
		CONTENT: "content",
		LAYOUT: "layout"
	},

	mode: {
		last: false,
		current: false
	},

	current_subapplication: false,
	sidebar: false,
	layout: false,

	boot: function () {
		this.MODE = Upfront.Settings.Application.MODE;
		var me = this;
		$("body").on("click", ".upfront-edit_layout", function () {
			$(".upfront-editable_trigger").hide();
			//app.go("layout");
			me.start();
			return false;
		});
		$(document).trigger("upfront-load");
	},

	start: function (mode) {
		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;
		this.set_current(mode);
		if (!(this.current_subapplication && this.current_subapplication.start)) {
			Upfront.Util.log("Can't boot invalid subapplication");
		}
		Upfront.Events.trigger("application:mode:before_switch");

		if (!!this.layout) {
			var regions = this.layout.get("regions"),
				region = regions.get_by_name("shadow")
			;
			if (regions && region) regions.remove(region, {silent: true});
			this.create_sidebar();
			this.current_subapplication.layout = this.layout;
			if (this.current_subapplication && this.current_subapplication.start) this.current_subapplication.start();
			else Upfront.Util.log("No current subapplication");
			Upfront.Events.trigger("application:mode:after_switch");
			return false;
		}

		var app = this;
		require(['models', 'views', 'editor_views', 'behaviors', 'upfront-data', 'media', 'content', 'spectrum', 'responsive', 'redactor', 'ueditor'], function (models, views, editor, behaviors, data) {
			_.extend(Upfront, data);
			Upfront.Events.trigger('data:ready');
			_.extend(Upfront, models);
			_.extend(Upfront, views);
			_.extend(Upfront.Views, editor);
			_.extend(Upfront, behaviors);

			// Start loading animation
			app.loading = new Upfront.Views.Editor.Loading({
				loading: "Loading...",
				done: "Thank you for waiting",
				fixed: true
			});
			app.loading.on_finish(function(){
				$(Upfront.Settings.LayoutEditor.Selectors.sidebar).show();
				$(".upfront-editable_trigger").hide();
			});
			app.loading.render();
			$('body').append(app.loading.$el)

			app.create_sidebar();

			require(Upfront.Settings.LayoutEditor.Requirements.entities, function (objects) {
				_.extend(Upfront.Objects, objects);
				app.load_layout(_upfront_post_data.layout);
			});
		});
	},

	stop: function () {

	},

	restart: function () {
		var last = this.mode.last || this.MODE.DEFAULT;
		this.start(last);
	},

	load_layout: function (layout_ids, new_post) {
		var app = this,
			present = !!this.layout,
			request_data = {
				action: this.actions.load,
				data: layout_ids
			}
		;
		if (new_post) request_data['new_post'] = new_post;
		$("body").removeClass(Upfront.Settings.LayoutEditor.Grid.scope);
		return Upfront.Util.post(request_data)
			.success(function (response) {
				if (response.data.post) app.new_post_set_up(response.data.post);

				var data = response.data.layout || {};
				app.layout = new Upfront.Models.Layout(data);
				app.current_subapplication.layout = app.layout;
				app.sidebar.model.set(app.layout.toJSON());
				Upfront.Application.loading.done(function () {
					Upfront.Events.trigger("upfront:layout:loaded");
					if (app.current_subapplication && app.current_subapplication.start) app.current_subapplication.start();
					else Upfront.Util.log("No current subapplication");

					//if (!app.layout_view) {
					app.layout_view = new Upfront.Views.Layout({
						"model": app.layout,
						"el": $(Upfront.Settings.LayoutEditor.Selectors.main)
					});
					Upfront.Events.trigger("layout:render", app.current_subapplication);
					//}

					Upfront.Events.trigger("application:mode:after_switch");
				});
			})
			.error(function (xhr) {
				Upfront.Util.log("Error loading layout " + layout_ids);
				app.loading.cancel(function(){
					$(Upfront.Settings.LayoutEditor.Selectors.sidebar).hide();
					$(".upfront-editable_trigger").show();
					app.go("");
				});
			})
		;
	},

	new_post: function(post_type){
		var layoutOps = {
				item: 'single-' + post_type,
				type: 'single',
				specificity: 'single-' + post_type + '-1000000' //Big number to assure default layout
			},
			deferred = new $.Deferred(),
			postData = {}
		;

		// @TODO is this correct to call stop before load_layout? fixed double event assignment
		if (this.current_subapplication && this.current_subapplication.stop) {
			this.current_subapplication.stop();
		}

		this.load_layout(layoutOps, post_type).done(function(response){
			postData = response.data.post;
			deferred.resolve(Upfront.data.posts[postData.ID]);
		});

		return deferred.promise();
	},

	new_post_set_up: function(postData){
		//Create the post with meta
		postData.meta = [];
		var post = new Upfront.Models.Post(postData);

		post.is_new = true;

		//Set global variables
		Upfront.data.posts[post.id] = post;
		_upfront_post_data.post_id = post.id;

		//Load body classes
		var bodyClasses = 'logged-in admin-bar upfront customize-support flex-support';

		if(postData.post_type == 'page')
			bodyClasses += ' page page-id-' + post.id + ' page-template-default';
		else
			bodyClasses += ' single single-' + postData.post_type + ' postid-' + post.id;

		$('body')
			.removeClass()
			.addClass(bodyClasses)
		;
	},

	get_current: function () {
		return this.mode.current || this.MODE.DEFAULT;
	},

	set_current: function (mode) {
		if (this.current_subapplication && this.current_subapplication.stop) {
			this.current_subapplication.stop();
		}
		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;

		this.mode.last = this.mode.current;

		if (mode && this.MODE.CONTENT == mode) {
			this.mode.current = this.MODE.CONTENT;
			this.current_subapplication = this.ContentEditor;
		} else {
			this.mode.current = this.MODE.LAYOUT;
			this.current_subapplication = this.LayoutEditor;
		}
		this.current_subapplication.boot();
	},

	create_sidebar: function () {
		if (!this.sidebar) {
			this.sidebar = new Upfront.Views.Editor.Sidebar.Sidebar({
				"model": new Upfront.Models.Layout({}),
				"el": $(Upfront.Settings.LayoutEditor.Selectors.sidebar)
			});
		}
		//this.sidebar.render(); <-- Subapplications do this

		if (!this.layout_sizes) {
			this.layout_sizes = new Upfront.Views.Editor.Layouts({
				"model": this.layout,
				"el": $(Upfront.Settings.LayoutEditor.Selectors.layouts)
			});
		}
		this.layout_sizes.render();
	}

}))();

return {
	"Application": Application
};
});

})(jQuery);

(function ($) {

define('util',[],function() {
  var Util = {
    model_to_json: function (model) {
      var raw = (model.toJSON ? model.toJSON() : model),
        data_str = JSON.stringify(raw),
        json = JSON.parse(data_str)
      ;
      return json;
    },

    get_unique_id: function (pfx) {
      return _.template("{{prefix}}-{{stamp}}-{{numeric}}", {
        prefix: pfx || "entity",
        stamp: (new Date).getTime(),
        numeric: Math.floor((Math.random()*999)+1000)
      });
    },

    log: function () {
      var msg = "UPFRONT: ",
        parts = "",
        vessel = (typeof console != "undefined" && console && console.log ? console.log : alert)
      ;
      if (arguments.length > 1) {
        for (var idx in arguments) {
          msg += "[" + idx + "]: " + arguments[idx] + "\n";
        }
      } else msg += arguments[0];
      console.log(msg);
    },

    dbg: function () {
      Upfront.Util.log(JSON.stringify(arguments[0]));
    },

    post: function (data) {
      var request = (_.isObject(data) && data.action)
        ? data
        : {"action": "upfront_request", "data": data}
      ;
      // @TODO need a better way to attach upfront layout data on request?
      if ( Upfront.Application.LayoutEditor.layout ) {
        //request.upfront_layout = Upfront.Application.LayoutEditor.layout.get('layout');
        request.layout = Upfront.Application.LayoutEditor.layout.get('layout');
      }
      return $.post(Upfront.Settings.ajax_url, request, function () {}, "json");
    },

    format_date: function(date, show_time, show_seconds){
      var output = date.getFullYear() + '/',
        day = date.getDate(),
        month = (date.getMonth()+1)
      ;
      if(day < 10)
        day = '0' + day;
      if(month < 10)
        month = '0' + month;

      output += month + '/' + day;

      if(show_time){
        var hours = date.getHours(),
          minutes = date.getMinutes()
        ;
        output += ' ' +
          (hours < 10 ? '0' : '') +
          hours + ':' +
          (minutes < 10 ? '0' : '') +
          minutes
        ;
        if(show_seconds){
          var seconds = date.getSeconds();
          output += ':' +
            (seconds < 10 ? '0' : '') +
            seconds
          ;
        }
      }
      return output;
    },

    get_avatar: function(obj, size){
      var protocolParts = window.location.href.split('//'),
        url = protocolParts[0] + '//www.gravatar.com/avatar/',
        hash = ''
      ;

      size = size && parseInt(size, 10) == size ? size : 32;

      if(_.isString(obj))
        hash = obj;
      else if(obj instanceof Upfront.Models.User || obj instanceof Upfront.Models.Comment)
        hash = obj.get('gravatar');
      else
        return false;

      return url + hash + '?d=mm&s=' + size;
    },

    /* JS - PHP compatible templates */
    template: function(markup){
      var oldSettings = _.templateSettings,
        tpl = false;

      _.templateSettings = {
        interpolate : /<\?php echo (.+?) \?>/g,
        evaluate: /<\?php (.+?) \?>/g
      };

      tpl = _.template(markup);

      _.templateSettings = oldSettings;

      return function(data){
        _.each(data, function(value, key){
          data['$' + key] = value;
        });

        return tpl(data);
      };
    },

    Transient: {

      // Local storage object, or the in-memory queue
      _memory_queue: {},

      _key: window.location.path + window.location.search,

      initialize: function () {
        /*try {
          if ('sessionStorage' in window && window['sessionStorage'] !== null) this._memory_queue = sessionStorage;
        } catch (e) {
          Util.log("No local storage available, working off memory");
        }*/
        if (!Upfront.Settings.Debug.transients) this._memory_queue[this._key] = JSON.stringify({});
      },

      get_current: function () {
        return (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : {});
      },

      length: function (key) {
        var data = this.get(key);
        return data.length;
      },

      set: function (key, value) {
        var current = this.get_current();
        current[key] = Util.model_to_json(value);
        this._memory_queue[this._key] = JSON.stringify(current);
      },

      get: function (key) {
        var current = this.get_current(),
          raw = current[key] || false
        ;
        return raw;// ? JSON.parse(raw) : false;
      },

      get_all: function (prefix) {
        var key_rx = (prefix ? new RegExp(prefix) : false),
          data = [],
          history = (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : false)
        ;
        if (history) _(history).each(function (obj, key) {
          if (key_rx && !key.match(key_rx)) return true;
          data = obj;
        });
        return data;
      },

  // ----- Stack-like interface (for history) -----

      push: function (key, value) {
        var items = this.get(key) || [];
        items.push(value);
        return this.set(key, items);
      },

      pop: function (key) {
        var items = this.get(key) || [],
          item = items && items.pop ? items.pop() : false
        ;
        this.set(key, items);
        return item;

      }
    }
  };

  var Popup = {

    $popup: {},
    $background: {},
    _deferred: {},

    init: function () {
      if (!$("#upfront-popup").length) {
        $("#page")
          .append('<div id="upfront-popup" class="upfront-ui" style="display:none">' +
            '<div id="upfront-popup-close" class="upfront-icon upfront-icon-popup-close"></div>' +
            '<div class="upfront-popup-meta" id="upfront-popup-top">' +
            '</div>' +
            '<div id="upfront-popup-content"></div>' +
            '<div class="upfront-popup-meta" id="upfront-popup-bottom">' +
            '</div>' +
          '</div>')
          .append("<div id='upfront-popup-background' style='display:none' />")
        ;
      } else {
        this.close();
      }
      this.$popup = $("#upfront-popup");
      this.$background = $("#upfront-popup-background");

      this.$popup.find("#upfront-popup-content").empty();
    },

    open: function (callback, data) {
      data = data || {};
      this.init();
      var me = this,
        sidebarWidth = $('#sidebar-ui').width(),
        $win = $(window),
        width = data.width || 630,
        left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
        height = ($win.height() / 3) * 2,
        close_func = function () { me.close(); return false; }
      ;
      data.width = width, data.height = height;
      this.$background
        .css({
          'height': $win.height(),
          'width': $win.width() - sidebarWidth,
          'left': sidebarWidth
        })
        .on("click", close_func)
        .show()
      ;
      this.$popup
        .css({
          'width': width,
          'height': height,
          'left': sidebarWidth
        })
        .show()
        .find("#upfront-popup-close").on("click", close_func).end()
      ;
      $('body').addClass('upfront-popup-open');

      $win.off("resize.upfront-popup").on("resize.upfront-popup", function () {
        var sidebarWidth = $('#sidebar-ui').width();

        if (me.$background.is(":visible")) me.$background
          .css({
            'height': $win.height(),
            'width': $win.width() - sidebarWidth,
            'left': sidebarWidth
          })
        ;
        if (me.$popup.is(":visible")) {
          var left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
            height = ($win.height() / 3) * 2
          ;
          me.$popup
            .css({
              'width': width,
              'height': height,
              'left': left_pos
            })
          ;
        }
      });

      callback.apply(this.$popup.find("#upfront-popup-content").get(), [data, this.$popup.find("#upfront-popup-top"), this.$popup.find("#upfront-popup-bottom")]);
      this._deferred = new $.Deferred();
      return this._deferred.promise();
    },

    close: function (result) {
      this._deferred.notify('before_close');

      this.$background.hide();
      this.$popup.hide().css('height', 'auto').find("#upfront-popup-content").empty();

      this.$popup.find("#upfront-popup-top").empty();
      this.$popup.find("#upfront-popup-bottom").empty();

      $('body').removeClass('upfront-popup-open');

      this._deferred.resolve(this.$popup, result);
    }

  };

  return {
    "Util": Util,
    "Popup": Popup
  };
});

})(jQuery);

// Set up the global namespace
var Upfront = window.Upfront || {};
Upfront.mainData = Upfront.mainData || {};
(function () {

require.config(Upfront.mainData.requireConfig);

(function ($) {
$(function () {
  // Fix Underscore templating to Mustache style
  _.templateSettings = {
    evaluate : /\{\[([\s\S]+?)\]\}/g,
    interpolate : /\{\{([\s\S]+?)\}\}/g
  };

  define('main',['application', 'util'], function (application, util) {
    // Shims and stubs
    Upfront.Events = {}
    Upfront.Settings = {
      "root_url": Upfront.mainData.root,
      "ajax_url": Upfront.mainData.ajax,
      "admin_url": Upfront.mainData.admin,
      "site_url": Upfront.mainData.site,
      "Debug": Upfront.mainData.debug,
      "ContentEditor": {
        "Requirements": Upfront.mainData.layoutEditorRequirements,
        "Selectors": {
          "sidebar": "#sidebar-ui"
        }
      },
      "Application": {
        "MODE": Upfront.mainData.applicationModes,
        "NO_SAVE": Upfront.mainData.readOnly
      },
      "LayoutEditor": {
        "Requirements": Upfront.mainData.layoutEditorRequirements,
        "Selectors": {
          "sidebar": "#sidebar-ui",
          "commands": "#commands",
          "properties": "#properties",
          "layouts": "#layouts",
          "settings": "#settings",
          //"main": "#upfront-output"
          "main": "#page"
        },
        "Specificity": Upfront.mainData.specificity,
        "Grid": Upfront.mainData.gridInfo,
      },
      "Content": Upfront.mainData.content,
    };

    // Populate basics
    _.extend(Upfront.Events, Backbone.Events);
    _.extend(Upfront, application);
    _.extend(Upfront, util);
    Upfront.Util.Transient.initialize();

    // Set up deferreds
    Upfront.LoadedObjectsDeferreds = {};
    Upfront.Events.trigger("application:loaded:layout_editor");

    if (Upfront.Application && Upfront.Application.boot) Upfront.Application.boot();
    else Upfront.Util.log('something went wrong');
  }); // Upfront
});
})(jQuery);

})();
