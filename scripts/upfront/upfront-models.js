(function () {

var _alpha = "alpha",

/* ----- Logic mixins ----- */
	
	_Upfront_ModelMixin = {

	},

/* ----- Core model definitions ----- */

	// Basic behavior/appearance dataset building block
	Property = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"value": ""
		}
	}),

	// Basic behavior/appearance dataset
	Properties = Backbone.Collection.extend({
		"model": Property
	}),

	// Basic interface dataset container
	ObjectModel = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"element_id": "",
			"properties":  new Properties(),
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties)
			}
			if (this.init) this.init();
		},
	// ----- Object interface ----- */
		get_view_class: function () {
			return Upfront.Views.ObjectView;
		},
		get_property_by_name: function (name) {
			var prop = this.get("properties").where({"name": name});
			return prop.length ? prop[0] : false;
		},
		get_property_value_by_name: function (name) {
			var prop = this.get_property_by_name(name);
			return prop && prop.get ? prop.get("value") : false;
		},
		has_property: function (name) {
			return !!this.get_property_value_by_name(name);
		},
		has_property_value: function (property, value) {
			return (value == this.get_property_value_by_name(property));
		},
		add_property: function (name, value) {
			this.get("properties").add(new Upfront.Models.Property({"name": name, "value": value}));
		},
		set_property: function (name, value) {
			if (!name) return false;
			var prop = this.get_property_by_name(name);
			if (!prop || !prop.set) return this.add_property(name, value);
			prop.set({"value": value});
		}, 
		init_property: function (name, value) {
			if (!this.has_property(name)) this.add_property(name, value);
		},
		init_properties: function (hash) {
			var me = this;
			_(hash).each(function (value, name) {
				me.init_property(name, value);
			})
		},
	// ----- Magic properties manipulation ----- */
		get_content: function () {
			return this.get_property_value_by_name("content");
		},
		set_content: function (content) {
			var prop = this.get_property_by_name("content");
			if (prop) return prop.set("value", content);
			return this.get("properties").add(new Upfront.Models.Property({"name": "content", "value": content}));
		},
		get_element_id: function () {
			return this.get_property_value_by_name("element_id");
		},
		replace_class: function (value) {
			var val_esc = value.replace(/\d+/, '\\d+')
				val_rx = new RegExp(val_esc),
				prop = this.get_property_by_name("class"),
				old = prop ? prop.get("value") : false
			;
			if (prop && old && old.match(val_rx)) return prop.set("value", old.replace(val_rx, value)); // Have class, have old value to replace
			else if (prop && old) return prop.set("value", old + " " + value); // Have class, no old value to replace
			else if (!prop) this.get("properties").add(new Property({"name": "class", "value": value})); // No class property
			return false;
		},
		is_visible: function () {
			return this.get_property_value_by_name("visibility");
		}
	}),

		// Basic interface dataset
	Objects = Backbone.Collection.extend({
		"model": ObjectModel,
		initialize: function (raw_models) {
			var models = [];
			if (!raw_models || !raw_models.length) return false;
			_(raw_models).each(function (model) {
				var type_prop = model["properties"] ? _(model["properties"]).where({"name": "type"}) : model.get("properties").where({"name": "type"}),
					type = type_prop.length ? type_prop[0].value : "ObjectModel",
					instance = Upfront.Models[type] ? new Upfront.Models[type](model) : false
				;
				if (Upfront.Models[type] && instance) models.push(instance);
			});
			this.reset(models);
		},
		get_by_element_id: function (element_id) {
			var found = false;
			this.each(function (model) {
				if (model.get_element_id() == element_id) found = model;
			});
			return found;
		}
	}),

	// Module interface dataset container
	Module = ObjectModel.extend({
		"defaults": {
			"name": "",
			"objects": new Properties(),
			"properties": new Objects()
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["objects"]) {
				args[0]["objects"] = args[0]["objects"] instanceof Objects
					? args[0]["objects"]
					: new Objects(args[0]["objects"])
				;
				this.set("objects", args[0].objects)
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0]["properties"])
			}
			if (this.init) this.init();
		},
	}),

	Modules = Backbone.Collection.extend({
		"model": Module,
		/*
		initialize: function () {
			if (!arguments.length) return false;
			var _modules = [],
				me = this,
				args = arguments[0]
			;
			_(args).each(function (arg) {
				var self_class = _(arg.properties).where({"name": "type"}),
					self_instance =  (self_class.length && self_class[0].value && Upfront.Models[self_class[0].value]) 
						? new Upfront.Models[self_class[0].value](arg)
						: new Upfront.Models.Module(arg)
				;
				me.add(self_instance);
				//_modules.push(self_instance);
			});
			//this.reset(_modules);
			//console.log(this);
		},
		*/
		get_by_element_id: function (element_id) {
			var found = false;
			this.each(function (model) {
				if (model.get_element_id() == element_id) found = model;
			});
			return found;
		}
	}),

	Region = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"properties": new Properties(),
			"modules": new Modules(),
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["modules"]) {
				args[0]["modules"] = args[0]["modules"] instanceof Modules
					? args[0]["modules"]
					: new Modules(args[0]["modules"])
				;
				this.set("modules", args[0].modules)
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties)
			}
		}
	}),

	Regions = Backbone.Collection.extend({
		"model": Region,
	}),

	Layout = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"properties": new Properties(),
			"regions": new Regions(),
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["regions"]) {
				args[0]["regions"] = args[0]["regions"] instanceof Regions
					? args[0]["regions"]
					: new Regions(args[0]["regions"])
				;
				this.set("regions", args[0].regions)
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties)
			}
			this._upfront_undo_states = [];
			this._upfront_redo_states = [];
		},
		get_current_state: function () {
			return Upfront.Util.model_to_json(this.get("regions"));
		},
		has_undo_states: function () {
			return !!this._upfront_undo_states.length;
		},
		store_undo_state: function () {
			this._upfront_undo_states.push(this.get_current_state());
		},
		restore_undo_state: function () {
			if (!this.has_undo_states()) return false;

			var state = this._upfront_undo_states.pop();
			if (!state.length) {
				Upfront.Util.log("Invalid undo state");
				return false;
			}

			this._upfront_redo_states.push(this.get_current_state());
			this.get("regions").reset(state);
		}
	})

_omega = 'omega';

define({
	"Models": {
		"Property": Property,
		"ObjectModel": ObjectModel,
		"Module": Module,
		"Region": Region,
		"Layout": Layout,
	},
	"Collections": {
		"Properties": Properties,
		"Objects": Objects,
		"Modules": Modules,
		"Regions": Regions,
	}
});

})();