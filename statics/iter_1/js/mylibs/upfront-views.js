(function () {

var _template_files = [
	"text!../mylibs/templates/object.html",
	"text!../mylibs/templates/module.html",
	"text!../mylibs/templates/layout.html",
];

define(_template_files, function () {
	// Auto-assign the template contents to internal variable
	var _template_args = arguments,
		_Upfront_Templates = {}
	;
	_(_template_files).each(function (file, idx) {
		_Upfront_Templates[file.replace(/text!..\/mylibs\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
	});

	var
		_dispatcher = _.clone(Backbone.Events),

		_Upfront_ViewMixin = {
			"dispatcher": _dispatcher
		},

	/* ----- Core views ----- */

		_Upfront_SingularEditor = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
			initialize: function () {
				this.model.bind("change", this.render, this);
				if (this.init) this.init();
			}
		})),

		_Upfront_EditableEntity = _Upfront_SingularEditor.extend({
			events: {
				"click": "on_click",
			},
			// Propagate collection sorting event
			resort_bound_collection: function () {
				this.$el.trigger("resort", [this]);
			},
			on_click: function () {
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				this.$el
					.addClass("upfront-active_entity")
					.trigger("upfront-editable_entity-selected", [this.model, this])
				;
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
				"resort": "on_resort_collection"
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
			}
		}),

		ObjectView = _Upfront_EditableEntity.extend({
			initialize: function () {
				//this.properties_view = new Upfront_PropertiesView({"model": this.model.get("properties")});
				this.model.get("properties").bind("change", this.render, this);
				this.model.get("properties").bind("add", this.render, this);
				this.model.get("properties").bind("remove", this.render, this);
			},
			render: function () {
				var props = {},
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					model = _.extend(this.model.toJSON(), {"properties": props}),
					template = _.template(_Upfront_Templates["object"], model)
				;
				this.$el.html(template);

				if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
			}
		}),

		Objects = _Upfront_EditableEntities.extend({
			"attributes": {
				"class": "upfront-editable_entities_container"
			},
			render: function () {
				var $el = this.$el;
				this.model.each(function (obj) {
					var local_view = new ObjectView({"model": obj});
					local_view.render();
					$el.append(local_view.el);
				});
			}
		}),

		Module = _Upfront_EditableEntity.extend({
			initialize: function () {
				//this.properties_view = new Upfront_PropertiesView({"model": this.model.get("properties")});
				this.model.get("properties").bind("change", this.render, this);
				this.model.get("properties").bind("add", this.render, this);
				this.model.get("properties").bind("remove", this.render, this);
			},
			render: function () {
				var props = {},
					run = this.model.get("properties").each(function (prop) {
						props[prop.get("name")] = prop.get("value");
					}),
					model = _.extend(this.model.toJSON(), {"properties": props}),
					template = _.template(_Upfront_Templates["module"], model)
				;
				this.$el.html(template);

				var objects_view = new Objects({"model": this.model.get("objects")});
				objects_view.render();
				this.$(".upfront-objects_container").append(objects_view.el);

				if (this.$el.is(".upfront-active_entity")) this.$el.trigger("upfront-editable_entity-selected", [this.model, this]);
			}
		}),

		Modules = _Upfront_EditableEntities.extend({
			"attributes": {
				"class": "upfront-editable_entities_container"
			},
			render: function () {
				this.$el.html('');
				var $el = this.$el;
				this.model.each(function (module) {
					var local_view = new Module({"model": module});
					local_view.render();
					$el.append(local_view.el);
				});
			},
		}),

		Region = _Upfront_SingularEditor.extend({
			events: {
				"mouseup": "on_click" // Bound on mouseup because "click" prevents bubbling (for module/object activation)
			},
			attributes: {
				"class": "upfront-region c22" // @TODO: do not stub the region appearance like this!!!
			},
			init: function () {
				this.dispatcher.on("plural:propagate_activation", this.on_click, this);
			},
			on_click: function () {
				this.trigger("activate_region", this)
			},
			render: function () {
				this.$el.html('');
				var local_view = new Modules({"model": this.model.get("modules")})
				local_view.render();
				this.$el.append(local_view.el);
			}
		}),

		Regions = _Upfront_PluralEditor.extend({
			render: function () {
				this.$el.html('');
				var me = this,
					$el = this.$el
				;
				this.model.each(function (region) {
					var local_view = new Region({"model": region});
					local_view.render();
					local_view.bind("activate_region", me.activate_region, me);
					$el.append(local_view.el);
				});
				this.activate_region(this.model.at(0));
			},
			activate_region: function (region) {
				this.model.active_region = region.model || region;
			}
		}),

		Layout = _Upfront_PluralEditor.extend({
			initialize: function () {
				this.render();
			},
			render: function () {
				var template = _.template(_Upfront_Templates.layout, this.model.toJSON());
				this.$el.html(template);
				var local_view = new Regions({"model": this.model.get("regions")});
				local_view.render();
				this.$("section").append(local_view.el)
			}
		})
	;

	return {
		"Views": {
			"ObjectView": ObjectView,
			"Module": Module,
			"Layout": Layout
		}
	};
});

})();