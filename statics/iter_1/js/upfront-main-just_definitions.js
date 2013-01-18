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

var _template_files = [
	"text!templates/property.html"
];

// Load all the templates
require(_template_files, function () {

// Auto-assign the template contents to internal variable
var _Upfront_Templates = {};
_(_template_files).each(function (file, idx) {
	_Upfront_Templates[file.replace(/text!templates\//, '').replace(/\.html/, '')] = arguments[idx];
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

	},

/* ----- Core views ----- */

	_Upfront_SingularEditorView = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
		initialize: function () {
			this.model.bind("change", this.render, this);
		}
	})),

	_Upfront_PluralEditorView = Backbone.View.extend(_.extend({}, _Upfront_ViewMixin, {
		initialize: function () {
			this.model.bind("change", this.render, this);
			this.model.bind("add", this.render, this);
			this.model.bind("remove", this.render, this);
		}
	})),

	Upfront_PropertyView = _Upfront_SingularEditorView.extend({
		render: function () {
			//console.log(this.model.toJSON());
			console.log('		- setting property ' + this.model.get("name") + ' to ' + this.model.get("value"));
		}
	}),

	Upfront_PropertiesView = _Upfront_PluralEditorView.extend({
		render: function () {
			console.log('	- start rendering multiple properties:')
			this.model.each(function (obj) {
				var local_view = new Upfront_PropertyView({"model": obj});
				local_view.render();
			});
		}
	}),

	Upfront_ObjectView = _Upfront_SingularEditorView.extend({
		initialize: function () {
			this.properties_view = new Upfront_PropertiesView({"model": this.model.get("properties")});
		},
		render: function () {
			console.log('rendering object ' + this.model.get("name") + ':')
			this.properties_view.render();
		}
	}),

	Upfront_ObjectsView = _Upfront_PluralEditorView.extend({
		render: function () {
			console.log('	- start rendering multiple objects:')
			this.model.each(function (obj) {
				var el_id = obj.get_element_id(),
					$el = $("#" + el_id),
					local_view = new Upfront_ObjectView({"model": obj, "el": $el})
				;
				local_view.render();
			});
		}
	}),

	Upfront_ModuleView = _Upfront_SingularEditorView.extend({
		initialize: function () {
			this.objects_view = new Upfront_ObjectsView({"model": this.model.get("objects")});
			this.properties_view = new Upfront_PropertiesView({"model": this.model.get("properties")});
		},
		render: function () {
			console.log('rendering module ' + this.model.get("name") + ':')
			this.properties_view.render();
			this.objects_view.render();
		}
	}),

	Upfront_LayoutView = _Upfront_PluralEditorView.extend({
		initialize: function () {
			this.render();
		},
		render: function () {
			this.model.each(function (obj) {
				var instance_view = (obj instanceof Upfront_Module ? Upfront_ModuleView : Upfront_ObjectView),
					local_view = new instance_view({"model": obj})
				;
				local_view.render();
			});
		}
	})


last = "last"
;

test_prop = new Upfront_Property({"name": "test property", "value": 'is a test'});

visible_obj = new Upfront_Object({
	"name": "visible",
	"properties": [
		{"name": "element_id", "value": "element-1"},
		{"name": "visibility", "value": true},
		{"name": "class", "value": "col1"}
	]
});
invisible_obj = new Upfront_Object({
	"name": "invisible",
	"properties": [
		{"name": "element_id", "value": "element-2"},
		{"name": "visibility", "value": true},
		{"name": "class", "value": "col2"}
	]
});
test_obj = new Upfront_Object({
	"name": "TEST",
	"properties": [
		{"name": "element_id", "value": "element-3"},
		{"name": "visibility", "value": true},
		{"name": "class", "value": "col3"}
	]
});

//console.log(visible_obj instanceof Upfront_Object);
//console.log(visible_obj instanceof Array);

_module = new Upfront_Module({
	"name": "Test module",
	"objects": [
		visible_obj, 
		invisible_obj,
	],
	"properties": [
		{"name": "visibility", "value": true}
	]
});


_layout = new Upfront_Layout([_module, test_obj]);
_layout_view = new Upfront_LayoutView({"model": _layout});


}); // Base deps
}); // Templates