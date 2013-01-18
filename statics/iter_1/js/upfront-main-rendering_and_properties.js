require.config({
	baseUrl: 'js/libs',
	paths: {
		"underscore": "underscore-min",
		"backbone": "backbone-min",
		"jquery": "jquery-1.8.3",
	},
	shim: {
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: ["underscore", "jquery"],
			exports: "Backbone"
		}
	}
});

require(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {

_.templateSettings = {
	interpolate : /\{\{(.+?)\}\}/g
};
var _template_files = [
	"text!templates/property.html",
	"text!templates/properties.html",
	"text!templates/object.html",
	"text!templates/objects.html",
	"text!templates/module.html",
	"text!templates/layout.html",
	"text!templates/property_edit.html",
];

// Load all the templates
require(_template_files, function () {

// Auto-assign the template contents to internal variable
var _template_args = arguments,
	_Upfront_Templates = {}
;
_(_template_files).each(function (file, idx) {
	_Upfront_Templates[file.replace(/text!templates\//, '').replace(/\.html/, '')] = _template_args[idx];
});

var tmp = "tmp",

/* ----- Logic mixins ----- */
	
	_Upfront_ModelMixin = {

	},

/* ----- Core model definitions ----- */

	// Basic behavior/appearance dataset building block
	Upfront_Property = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"value": ""
		}
	}),

	// Basic behavior/appearance dataset
	Upfront_PropertyCollection = Backbone.Collection.extend({
		"model": Upfront_Property
	}),

	// Basic interface dataset container
	Upfront_Object = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"element_id": "",
			"properties":  new Upfront_PropertyCollection(),
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Upfront_PropertyCollection
					? args[0]["properties"]
					: new Upfront_PropertyCollection(args[0]["properties"])
				;
				this.set("properties", args[0].properties)
			}
		},
	// ----- Object interface ----- */
		get_property_by_name: function (name) {
			var prop = this.get("properties").where({"name": name});
			return prop.length ? prop[0] : false;
		},
		get_property_value_by_name: function (name) {
			var prop = this.get_property_by_name(name);
			return prop && prop.get ? prop.get("value") : false;
		},
		get_element_id: function () {
			return this.get_property_value_by_name("element_id");
		},
		is_visible: function () {
			return this.get_property_value_by_name("visibility");
		}
	}),

	// Basic interface dataset
	Upfront_ObjectCollection = Backbone.Collection.extend({
		"model": Upfront_Object
	}),

	// Module interface dataset container
	Upfront_Module = Upfront_Object.extend({
		"defaults": {
			"name": "",
			"objects": new Upfront_PropertyCollection(),
			"properties": new Upfront_ObjectCollection()
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["objects"]) {
				args[0]["objects"] = args[0]["objects"] instanceof Upfront_ObjectCollection
					? args[0]["objects"]
					: new Upfront_ObjectCollection(args[0]["objects"])
				;
				this.set("objects", args[0].objects)
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Upfront_PropertyCollection
					? args[0]["properties"]
					: new Upfront_PropertyCollection(args[0]["properties"])
				;
				this.set("properties", args[0].properties)
			}
		},
	}),

	Upfront_Layout = Backbone.Collection.extend({
		"model": Upfront_Object
	}),

/* ----- View mixins ----- */
	
	_Upfront_ViewMixin = {
		get_template: function (tpl, obj) {
			obj = obj || this.model.toJSON();
			return _.template(_Upfront_Templates[tpl], obj);
		}
	},

/* ----- Core views ----- */

	_Upfront_SingularEditorView = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
		initialize: function () {
			this.model.bind("change", this.render, this);
		}
	})),

	_Upfront_SingularEditableEntityView = _Upfront_SingularEditorView.extend({
		on_selected: function () {
			console.log(this)
		}
	}),

	_Upfront_PluralEditorView = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
		initialize: function () {
			this.model.bind("change", this.render, this);
			this.model.bind("add", this.render, this);
			this.model.bind("remove", this.render, this);
		}
	})),

	Upfront_ObjectView = _Upfront_SingularEditableEntityView.extend({
		events: {
			"click": "on_click",
		},
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
		},

		on_click: function () {
			$(".upfront-active_entity").removeClass("upfront-active_entity");
			this.$el
				.addClass("upfront-active_entity")
				.trigger("upfront-editable_entity-selected", [this.model])
			;
			return false;
		}
	}),

	Upfront_ObjectsView = _Upfront_PluralEditorView.extend({
		render: function () {
			var template = _.template(_Upfront_Templates.objects, this.model.toJSON());
			this.$el.html(template);
			var $el = this.$(".upfront-objects");
			this.model.each(function (obj) {
				var local_view = new Upfront_ObjectView({"model": obj});
				local_view.render();
				$el.append(local_view.el)
			});
		}
	}),

	Upfront_ModuleView = _Upfront_SingularEditableEntityView.extend({
		events: {
			"click": "on_click",
		},
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

			var objects_view = new Upfront_ObjectsView({"model": this.model.get("objects")});
			objects_view.render();
			this.$(".upfront-objects_container").append(objects_view.el);
		},

		on_click: function () {
			$(".upfront-active_entity").removeClass("upfront-active_entity");
			this.$el
				.addClass("upfront-active_entity")
				.trigger("upfront-editable_entity-selected", [this.model])
			;
			return false;
		}
	}),

	Upfront_LayoutView = _Upfront_PluralEditorView.extend({
		initialize: function () {
			this.render();
		},
		render: function () {
			var template = _.template(_Upfront_Templates.layout, this.model.toJSON());
			this.$el.html(template);
			this.model.each(function (obj) {
				var instance_view = (obj instanceof Upfront_Module ? Upfront_ModuleView : Upfront_ObjectView),
					local_view = new instance_view({"model": obj})
				;
				local_view.render();
				this.$("section").append(local_view.el)
			});
		},
	})


last = "last"
;




var test_data = [
	// Module 1
	{
		"name": "Module 1",
		"properties": [
			{"name": "element_id", "value": "object-1"},
			{"name": "class", "value": "c8 ml1"},
		],
		"objects": [
			{
				"name": "Module 1 - Object 1",
				"properties": [
					{"name": "element_id", "value": "object-1-1"},
					{"name": "class", "value": "c11"}
				]
			},
			{
				"name": "Module 1 - Object 2",
				"properties": [
					{"name": "element_id", "value": "object-1-2"},
					{"name": "class", "value": "c11"}
				]
			}
		]
	},
	// Module 2
	{
		"name": "Module 2",
		"properties": [
			{"name": "element_id", "value": "object-2"},
			{"name": "class", "value": "c8 ml1"},
		],
		"objects": [
			{
				"name": "Module 1 - Object 1",
				"properties": [
					{"name": "element_id", "value": "object-2-1"},
					{"name": "class", "value": "c11"}
				]
			},
			{
				"name": "Module 1 - Object 2",
				"properties": [
					{"name": "element_id", "value": "object-2-2"},
					{"name": "class", "value": "c11"}
				]
			}
		]
	}
];


_layout = new Upfront_Layout();
_(test_data).each(function (data) {
	var module = new Upfront_Module(data);
	_layout.add(module);
});
_layout_view = new Upfront_LayoutView({
	"model": _layout, 
	"el": $("#upfront-output")
});



// Stubbing interface control

var Upfront_Editor_PropertyView = _Upfront_SingularEditorView.extend({
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

var Upfront_Editor_PropertiesView = Backbone.View.extend({
	events: {
		"click #add-property": "show_new_property_partial",
		"click #done-adding-property": "add_new_property",
	},
	initialize: function () {
		//console.log(this.model)
		this.model.get("properties").bind("change", this.render, this);
		this.model.get("properties").bind("add", this.render, this);
		this.model.get("properties").bind("remove", this.render, this);
	},
	render: function () {
		var template = _.template(_Upfront_Templates.properties, this.model.toJSON());
		this.$el.html(template);
		this.model.get("properties").each(function (obj) {
			var local_view = new Upfront_Editor_PropertyView({"model": obj});
			local_view.render();
			this.$("dl").append(local_view.el)
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
		this.model.get("properties").add(new Upfront_Property({
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


// Temporary Event plumbing
$(document).on("upfront-editable_entity-selected", "#main", function (e, model) {
	var property_view = new Upfront_Editor_PropertiesView({
		"model": model, 
		"el": $("#properties")
	});
	property_view.render();
})


}); // Base deps
}); // Templates