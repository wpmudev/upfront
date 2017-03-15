(function ($) {

define(['backbone'], function(Backbone) {

Upfront.Events = _.isEmpty(Upfront.Events) ? _.extend(Upfront.Events, Backbone.Events) : Upfront.Events;
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
		},
		idAttribute: 'name'
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
			"properties":  new Properties()
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties);
			} else this.set("properties", new Properties([]));
			if (this.init) this.init();

			// Take care of old preset API
			if (this.get_property_value_by_name('currentpreset')) {
			// Unset currentpreset property and set preset to correct value
				this.set_property('preset', this.get_property_value_by_name('currentpreset'), true);
				this.set_property('currentpreset', false, true);
			}
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

		/**
		 * Resolve the preset value from wherever we might be having it stored
		 *
		 * Resolves the preset and, as a side-effect, sets the `preset` property
		 * to the resolved value.
		 * This way the `preset` property is now more of a transient, contextyally
		 * dependent value - not fixed and given once by the mighty hand of god.
		 *
		 *  The value is resolved by first checking the passed breakpoint ID
		 *  (which will default to currently active one) and, if that fails,
		 *  will default to whatever the `preset` property says it should be.
		 *  Failing all of that, it'll fall back to "default"
		 *
		 * @param {String} breakpoint_id Breakpoint ID used to resolve the preset from storage
		 * *                               - will default to current one
		 *
		 * @return {String} Decoded preset ID
		 */
		decode_preset: function (breakpoint_id) {
			breakpoint_id = breakpoint_id || (Upfront.Views.breakpoints_storage.get_breakpoints().get_active() || {}).id;
			var current = this.get_property_value_by_name('current_preset') || this.get_property_value_by_name('preset') || 'default',
				model = this.get_property_value_by_name("breakpoint_presets") || {},
				breakpoint_preset
			;

			// we need to provide proper fallback here, mobile -> tablet -> desktop
			if ( breakpoint_id == 'mobile' ) {
				breakpoint_preset = (model[breakpoint_id] || model['tablet'] || model['desktop'] || {}).preset;
			} else if ( breakpoint_id == 'tablet' ) {
				breakpoint_preset = (model[breakpoint_id] || model['desktop'] || {}).preset;
			} else {
				breakpoint_preset = (model[breakpoint_id] || {}).preset;
				// when on desktop, set `current_preset` to desktop preset
				current = breakpoint_preset || current || 'default';
			}
			var actual = breakpoint_preset || current;

			// we have to retain current preset coz will be lose below
			this.set_property('current_preset', current, true);

			// this will repaint the element but will also lose our current preset
			this.set_property('preset', actual, false); // Do *not* be silent here, we do want repaint

			return actual;
		},

		/**
		 * Pack up the breakpoint preset values.
		 *
		 * The packed values will be decoded later on using the `decode_preset` method.
		 * As a side-effect, we also update the model `breakpoint_presets` property.
		 * As a side-effect #2, we also set whatever the current preset is (or default) as
		 * default breakpoint preset, if it's not already set.
		 *
		 * @param {String} preset_id Preset ID to pack
		 * @param {String} breakpoint_id Breakpoint ID used to resolve the preset in storage
		 *                               - will default to current one
		 *
		 * @return {Object} Packed breakpoint presets
		 */
		encode_preset: function (preset_id, breakpoint_id) {
			breakpoint_id = breakpoint_id || (Upfront.Views.breakpoints_storage.get_breakpoints().get_active() || {}).id;
			var	data = this.get_property_value_by_name("breakpoint_presets") || {},
				current = (this.get_property_by_name('preset').previousAttributes() || {value: 'default'}).value,
				default_bp_id = (Upfront.Views.breakpoints_storage.get_breakpoints().findWhere({'default': true}) || {}).id
			;

			data[breakpoint_id] = {preset: preset_id};
			if (!data[default_bp_id]) data[default_bp_id] = {preset: current};

			this.set_property("breakpoint_presets", data, true);

			return data;
		},

		add_property: function (name, value, silent) {
			if (!silent) silent = false;
			this.get("properties").add(new Upfront.Models.Property({"name": name, "value": value}), {"silent": silent});
			Upfront.Events.trigger("model:property:add", name, value, silent);
		},
		set_property: function (name, value, silent) {
			if (!name) return false;
			if (!silent) silent = false;
			var prop = this.get_property_by_name(name);
			if (!prop || !prop.set) return this.add_property(name, value, silent);
			prop.set({"value": value}, {"silent": silent});
			Upfront.Events.trigger("model:property:set", name, value, silent);
		},
		remove_property: function (name, silent) {
			if (!name) return false;
			if (!silent) silent = false;
			var prop = this.get_property_by_name(name);
			if (!prop || !prop.set) return;
			this.get("properties").remove(prop, {"silent": silent});
			Upfront.Events.trigger("model:property:remove", name, silent);
		},
		init_property: function (name, value) {
			if (!this.has_property(name)) this.add_property(name, value);
		},
		init_properties: function (hash) {
			var me = this;
			_(hash).each(function (value, name) {
				me.init_property(name, value);
			});
		},
	// ----- Magic properties manipulation ----- */
		get_content: function () {
			return this.get_property_value_by_name("content");
		},
		set_content: function (content, options) {
			options = typeof options != 'undefined' ? options: {};
			var prop = this.get_property_by_name("content");
			if (prop) return prop.set("value", content, options);
			return this.get("properties").add(new Upfront.Models.Property({"name": "content", "value": content}));
		},
		get_element_id: function () {
			return this.get_property_value_by_name("element_id");
		},
		get_wrapper_id: function () {
			return this.get_property_value_by_name("wrapper_id");
		},
		replace_class: function (value) {
			var prop = this.get_property_by_name("class"),
				old = prop ? prop.get("value") : false
			;
			if (prop && old){
				 // Have class
				var values = value.split(" "),
					new_val = old;
				for ( var i = 0; i < values.length; i++ ){
					var val_esc = values[i].replace(/-?\d+/, '-?\\d+'),
						val_rx = new RegExp(val_esc);
					if ( new_val.match(val_rx) )
						new_val = new_val.replace(val_rx, values[i]);
					else
						new_val += " " + values[i];
				}
				return prop.set("value", new_val);
			}
			else if (!prop) this.get("properties").add(new Property({"name": "class", "value": value})); // No class property
			return false;
		},
		add_class: function (value) {
			var val_rx = new RegExp(value),
				prop = this.get_property_by_name("class"),
				old = prop ? prop.get("value") : false;
			if (prop && !old.match(val_rx)) return prop.set("value", old + " " + value);
			else if (!prop) this.get("properties").add(new Property({"name": "class", "value": value}));
			return false;
		},
		remove_class: function (value) {
			var val_rx = new RegExp(value),
				prop = this.get_property_by_name("class"),
				old = prop ? prop.get("value") : false;
			if (prop && old.match(val_rx)) return prop.set("value", old.replace(val_rx, ""));
			return false;
		},
		is_visible: function () {
			return this.get_property_value_by_name("visibility");
		},
		get_breakpoint_property_value: function (property, return_default, default_value, breakpoint) {
			breakpoint = breakpoint ? breakpoint : Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
			default_value = typeof default_value === "undefined" ? false : default_value;

			if ( !breakpoint || breakpoint['default'] )
				return this.get_property_value_by_name(property);
			var data = this.get_property_value_by_name('breakpoint');
			if ( _.isObject(data) && _.isObject(data[breakpoint.id]) && property in data[breakpoint.id] )
				return data[breakpoint.id][property];
			if ( return_default )
				return this.get_property_value_by_name(property);
			return default_value;
		},
		set_breakpoint_property: function (property, value, silent, breakpoint) {
			breakpoint = breakpoint ? breakpoint : Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
			if ( !breakpoint || breakpoint['default'] ) {
				this.set_property(property, value, silent);
			}
			else {
				var data = Upfront.Util.clone(this.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(data[breakpoint.id]) )
					data[breakpoint.id] = {};
				data[breakpoint.id][property] = value;
				data.current_property = property;
				this.set_property('breakpoint', data, silent);
			}
		},
		add_to: function (collection, index, options) {
			options = _.isObject(options) ? options : {};
			var me = this,
				models = [],
				added = false
			;
			collection.each(function(each, i){
				if ( i == index ){
					models.push(me);
					added = true;
				}
				models.push(each);
			});
			if ( added ){
				collection.reset(models, {silent: true});
				collection.trigger('add', this, collection, _.extend(options, {index: index}));
			}
			else {
				collection.add(this, _.extend(options, {index: index}));
			}
		}
	}),

	ObjectGroup = ObjectModel.extend({
		"defaults": function(){
			return {
				"name": "",
				"objects": new Objects(),
				"wrappers": new Wrappers(),
				"properties": new Properties()
			};
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["objects"]) {
				args[0]["objects"] = args[0]["objects"] instanceof Objects
					? args[0]["objects"]
					: new Objects(args[0]["objects"])
				;
				this.set("objects", args[0]["objects"]);
			} else this.set("objects", new Objects([]));
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers);
			} else this.set("wrappers", new Wrappers([]));
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0]["properties"]);
			} else this.set("properties", new Properties([]));

			if (this.init) this.init();
		}
	}),

		// Basic interface dataset
	Objects = Backbone.Collection.extend({
		/*"model": ObjectModel,
		initialize: function (raw_models) {
			var models = [];
			if (!raw_models || !raw_models.length) return false;
			_(raw_models).each(function (model) {
				var type_prop = model["properties"] ? _(model["properties"]).where({"name": "type"}) : model.get("properties").where({"name": "type"}),
					default_type = model["objects"] ? "ObjectGroup" : "ObjectModel",
					type = type_prop.length ? type_prop[0].value : default_type,
					instance = Upfront.Models[type] ? new Upfront.Models[type](model) : false
				;
				if (Upfront.Models[type] && instance) models.push(instance);
			});
			this.reset(models);
		},*/
		model: function (attrs, options) {
			var type_prop = attrs["properties"] ? _(attrs["properties"]).where({"name": "type"}) : attrs.get("properties").where({"name": "type"}),
				type = type_prop.length ? type_prop[0].value : '';
			if (Upfront.Models[type]) return new Upfront.Models[type](attrs, options);
			return new ObjectModel(attrs, options);
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
			"objects": new Objects(),
			"properties": new Properties()
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["objects"]) {
				args[0]["objects"] = args[0]["objects"] instanceof Objects
					? args[0]["objects"]
					: new Objects(args[0]["objects"])
				;
				this.set("objects", args[0].objects);
			} else this.set("objects", new Objects([]));
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0]["properties"]);
			} else this.set("properties", new Properties([]));
			if (this.init) this.init();
		}
	}),

	ModuleGroup = ObjectModel.extend({
		"defaults": function(){
			return {
				"name": "",
				"modules": new Modules(),
				"wrappers": new Wrappers(),
				"properties": new Properties()
			};
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["modules"]) {
				args[0]["modules"] = args[0]["modules"] instanceof Modules
					? args[0]["modules"]
					: new Modules(args[0]["modules"])
				;
				this.set("modules", args[0]["modules"]);
			} else this.set("modules", new Modules([]));
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers);
			} else this.set("wrappers", new Wrappers([]));
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0]["properties"]);
			} else this.set("properties", new Properties([]));

			this.init_property('has_settings', 1);
			this.init_property('type', 'ModuleGroup');
			if (this.init) this.init();
		}
	}),

	Modules = Backbone.Collection.extend({
		/*
		"model": Module,
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

		model: function (attrs, options) {
			if ( attrs.modules )
				return new ModuleGroup(attrs, options);
			return new Module(attrs, options);
		},

		get_by_element_id: function (element_id) {
			var found = false;
			this.each(function (model) {
				if (model.get_element_id() == element_id) found = model;
			});
			return found;
		}
	}),

	Region = ObjectModel.extend({
		defaults: function(){
			return {
				"name": "",
				"properties": new Properties(),
				"wrappers": new Wrappers(),
				"modules": new Modules()
			};
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["modules"]) {
				args[0]["modules"] = args[0]["modules"] instanceof Modules
					? args[0]["modules"]
					: new Modules(args[0]["modules"])
				;
				this.set("modules", args[0].modules);
			} else this.set("modules", new Modules([]));
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers);
			} else this.set("wrappers", new Wrappers([]));
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties);
			} else this.set("properties", new Properties([]));
		},
		is_main: function () {
			var container = this.get('container'),
				name = this.get('name');
			return ( !container || container == name );
		},
		get_sub_regions: function () {
			if ( ! this.collection )
				return false;
			var collection = this.collection,
				index = collection.indexOf(this),
				total = collection.size()-1, // total minus shadow region
				container = this.get('container') || this.get('name'),
				ref_models = collection.filter(function(model){ return model.get('container') == container || model.get('name') == container; }),
				ref_models2 = [],
				ret = {
					fixed: [],
					lightbox: [],
					top: false,
					left: false,
					right: false,
					bottom: false
				};
			if ( ref_models.length > 1 ){
				_.each(ref_models, function(model, index){
					var sub = model.get('sub');
					if ( sub == 'fixed' )
						ret.fixed.push(model);
					else if ( sub == 'lightbox' )
						ret.lightbox.push(model);
					else if ( sub && sub.match(/^(top|left|bottom|right)$/) )
						ret[sub] = model;
					else
						ref_models2.push(model);
				});
			}
			if ( ref_models2.length > 1 ){
				var _index = _.indexOf(ref_models2, this);
				if ( _index === 0 )
					ret.right = ref_models2[1];
				else if ( _index === 1 ){
					ret.left = ref_models2[0];
					ret.right = ref_models2.length > 2 ? ref_models2[2] : false;
				}
			}
			return ret;
		},
		get_sub_region: function (sub) {
			return this.get_sub_regions()[sub];
		},
		has_sub_region: function () {
			return _.find( this.get_sub_regions(), function(each){ return ( each !== false ); } );
		},
		get_side_region: function (right) {
			return this.get_sub_region( right ? 'right' : 'left' );
		},
		has_side_region: function () {
			var sub = this.get_sub_regions();
			return ( sub.left || sub.right );
		}
	}),

	Regions = Backbone.Collection.extend({
		"model": Region,

		get_by_name: function (name) {
			name = name.toLowerCase();
			var found = false;
			this.each(function (model) {
				if (model.get("name").toLowerCase() == name) found = model;
			});
			return found;
		},

		at_container: function (index) {
			var i = 0;
			return this.find(function(m){
				if ( m.is_main() ){
					if ( i == index )
						return true;
					else
						i++;
				}
				return false;
			});
		},

		index_container: function (model, excludes) {
			excludes = _.isArray(excludes) ? excludes : [excludes];
			var collection = this.filter(function(m){
					return m.is_main() && ! _.contains(excludes, m.get('name'));
				}),
				index = collection.indexOf(model);
			return index;
		},

		total_container: function (excludes) {
			excludes = _.isArray(excludes) ? excludes : [excludes];
			var collection = this.filter(function(m){
					return m.is_main() && ! _.contains(excludes, m.get('name'));
				});
			return collection.length;
		},

		get_new_title: function (prefix, start) {
			var title = (prefix + start).replace(/[^A-Za-z0-9\s_-]/g, ''),
				name = title.toLowerCase().replace(/\s/g, '-');
			if ( this.get_by_name(name) )
				return this.get_new_title(prefix, start+1);
			return {
				title: title,
				name: name
			};
		}
	}),

	Wrapper = ObjectModel.extend({
		"defaults": {
			"name": "",
			"properties": new Properties()
		},
		initialize: function () {
			var args = arguments;
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties);
			} else this.set("properties", new Properties([]));
		}
	}),

	Wrappers = Backbone.Collection.extend({
		"model": Wrapper,

		get_by_wrapper_id: function (wrapper_id) {
			var found = false;
			this.each(function (model) {
				if (model.get_wrapper_id() == wrapper_id) found = model;
			});
			return found;
		}
	}),


	Layout = ObjectModel.extend({
		"defaults": {
			"name": "",
			"properties": new Properties(),
			"regions": new Regions(),
			"wrappers": new Wrappers()
		},
		initialize: function () {
			var typography;
			var args = arguments;
			if (args && args[0] && args[0]["regions"]) {
				args[0]["regions"] = args[0]["regions"] instanceof Regions
					? args[0]["regions"]
					: new Regions(args[0]["regions"])
				;
				this.set("regions", args[0].regions);
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties);
			}
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers);
			}
		},
		get_current_state: function () {
			return Upfront.PreviewUpdate.get_revision();
		},
		has_undo_states: function () {
			return !!Upfront.Util.Transient.length("undo");
		},
		has_redo_states: function () {
			return !!Upfront.Util.Transient.length("redo");
		},
		store_undo_state: function () {
			var state = this.get_current_state(),
				all = Upfront.Util.Transient.get_all()
			;
			if (all.indexOf(state) >= 0) return false;

			Upfront.Util.Transient.push("undo", state);

			Upfront.Events.trigger("upfront:undo:state_stored");
		},
		restore_undo_state: function () {
			if (!this.has_undo_states()) return false;
			return this.restore_state_from_stack("undo");
		},
		restore_redo_state: function () {
			if (!this.has_redo_states()) return false;
			return this.restore_state_from_stack("redo");
		},
		restore_state_from_stack: function (stack) {
			var other = ("undo" == stack ? "redo" : "undo"),
				revision = Upfront.Util.Transient.pop(stack)
			;
			if (!revision) {
				Upfront.Util.log("Invalid " + revision + " state");
				return false;
			}
			Upfront.Util.Transient.push(other, this.get_current_state());
			// ... 1. get the state that corresponds to this revision
			var me = this,
				dfr = new $.Deferred()
			;
			Upfront.Util.post({
				action: 'upfront_get_revision',
				revision: revision
			}).done(function (response) {
				if ("revision" in response.data) {
					// ... 2. do this:
					me.get("regions").reset(Upfront.Util.model_to_json(response.data.revision.regions));
					dfr.resolve();
				}
			});

			return dfr.promise();
		}
	}),

	Taxonomy = Backbone.Model.extend({
		initialize: function () {
			var args = arguments,
				data = args[0] || {}
			;
			this.taxonomy = data.taxonomy ? new Backbone.Model(data.taxonomy) : Backbone.Model({});
			this.all_terms = data.all_terms ? new Backbone.Collection(data.all_terms) : new Backbone.Collection([]);
			this.post_terms = data.post_terms ? new Backbone.Collection(data.post_terms) : new Backbone.Collection([]);

		}
	}),

	/**
	 * Represents a WP object. Extending WPModel it is easy to communicate with the server
	 * to fetch a Post, User or Comment, and let the user update them easily.
	 */
	WPModel = Backbone.Model.extend({
		action: 'upfront-wp-model',
		fetchAttributes: [],
		saveAttributes: [],

		/**
		 * Loads the model from the db data. Uses the attribute modelName, implemented in a children class, to
		 * know what to fecth. When finished it trigger the change event if there have been any change in the Model.
		 * @param  {Object} data Aditional data to be sent with the fetch request.
		 * @return {jQuery.Deferred}	A promise for the fetching. The server response will be passed as argument to the done function.
		 */
		fetch: function(data) {
			var me = this;
				postdata = {
					action: 'fetch_' + this.modelName,
					id: this.id
				}
			;

			_.each(this.fetchAttributes, function(attr){
				postdata[attr] = me[attr];
			});

			postdata = _.extend(postdata, data);

			return this.post(postdata)
				.done(function(response){
					me.set(response.data);
				}
			);
		},

		/**
		 * Update, or create if no model id given, the model in the database.
		 * Uses the attribute modelName, implemented in a children class, to
		 * know what to save.
		 * @return {jQuery.Deferred}	A promise for the saving. The server response will be passed as argument to the done function.
		 */
		save: function(){
			var me = this,
				data = this.toJSON()
			;

			_.each(this.saveAttributes, function(attr){
				data[attr] = me[attr];
			});

			data.action = 'save_' + this.modelName;
			return this.post(data)
				.done(function(response){
					me.changed = {};
				}
			);
		},

		/**
		 * Send a POST request to the server setting all the parameters needed to communicate with
		 * the models endpoint.
		 * @param  {Object} data Data to be sent with the request.
		 * @return {jQuery.Deferred}	A promise for the response. The server response will be passed as argument to the done function.
		 */
		post: function(data){
			data = _.isObject(data) ? _.clone(data) : {};
			data.model_action = data.action;
			data.action = this.action;

			return Upfront.Util.post(data);
		},
		/**
		 * Overrides Backbone.Model.get to convert the PHP dates in javascript ones.
		 * @param  {String} attr The attribute name to get.
		 * @return {Mixed}      The attribute value or false if not found.
		 */
		get: function(attr){
			var value = this.attributes[attr],
                dates = [
                    "post_date",
                    "post_date_gmt",
                    'post_modified',
                    "post_modified_gmt"
                ];
//			if(_.isString(value) && value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
//				return new Date(Date.parse(value.replace(/ /, 'T')));
//			}

            if( _.indexOf(dates, attr) !== -1 ){
                //return new Date( value  ); // <-- Breaks in FF
                var raw_offset = (new Date()).getTimezoneOffset(),
                	tz_offset = raw_offset / 60,
                	offset = tz_offset > 0 ? '-' : '+', // Reversed because Date.getTimezoneOffset() returns reversed values...
                	hours = parseInt(Math.abs(tz_offset), 10),
                	mins = parseInt((Math.abs(tz_offset) - hours) * 60, 10),
                	timestamp = value.replace(/ /, 'T')
                ;
                hours = hours >= 10 ? '' + hours : '0' + hours;
                mins = mins >= 10 ? '' + mins : '0' + mins;
                if (timestamp && hours.length && mins.length) timestamp += offset + hours + mins;


				//return new Date(Date.parse(timestamp)); // <-- We need this to instantiate Date object in Firefox. @See "batman bug" in Asana.

				/** Have to do this in order to satisfy safari as well.
				 * This works with Firefox and chrome too.
				*/

				var a = timestamp.split(/[^0-9]/);
				return new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5]);

            }
			return this.attributes[attr];
		},
		/**
		 * Overrides Backbone.Model.set to convert javascript dates in PHP format.
		 * @param  {String} key     Attribute name
		 * @param  {Mixed} val     The value for the attribute
		 * @param  {Object} options Extended options for set. See http://backbonejs.org/#Model-set
		 * @return {WPModel}         This object
		 */
		set: function(key, val, options){
			var newval = val,
				parsedAttrs = {};

			if(_.isObject(key)){
				for(var attr in key){
					var value = key[attr];
					if(val instanceof Date)
						parsedAttrs[attr] = Upfront.Util.format_date(value, true, true).replace(/\//g, '-');
					else
						parsedAttrs[attr] = value;
				}
				Backbone.Model.prototype.set.call(this, parsedAttrs, options);
			}
			else{
				if(val instanceof Date)
					newval = Upfront.Util.format_date(val, true, true).replace(/\//g, '-');

				Backbone.Model.prototype.set.call(this, key, newval, options);
			}

			return this;
		}
	}),


	/**
	 * Represent a collection of WPModels, to fetch and save Posts, Comments or metadata list.
	 * It handle pagination, sorting and hierarchical lists out of the box.
	 */
	WPCollection = Backbone.Collection.extend({
		//WP ajax action
		action: 'upfront-wp-model',
		// Collection's attributes to be sent with their values in every fetch request.
		fetchAttributes: [],
		// Collection's attributes to be sent with their values in every save request.
		saveAttributes: [],

		// These are used to know what has changed since the last save.
		changedModels: [],
		addedModels: [],
		removedModels: [],
		isNew: true,

		// Model attribute where the parent id is stored.
		parentAttribute: false,
		// Attribute to store the collection of children.
		childrenAttribute: false,

		// Used to store the store the models without parents. (Only when parentAttribute and childrenAttribute are set)
		orphans: {},

		// Attribute to sort the collection. Use the reSort methods to change it properly.
		orderby: false,
		order: 'desc',

		// Pagination default parameters. Set pageSize to -1 to deactivate pagination.
		pagination: {
			pages: 1,
			pageSize: 10,
			currentPage:1,
			totalElements: 0,
			loaded: {}
		},

		// Used to keep the last fetch options and be able to fetch more pages.
		lastFetchOptions: {},

		/**
		 * Loads the Collection with models from the database. Uses the collectionName attribute to know what to fetch.
		 * @param  {Object} data Extra data to be sent with the fetch request
		 * @return {jQuery.Deferred}      Promise for the fetch request. The server response will be passed as argument to the done function.
		 */
		fetch: function(data) {
			var me = this,
				postdata = {
					action: 'fetch_' + this.collectionName,
					id: this.id
				}
			;

			if(this.orderby){
				postdata['orderby'] = this.orderby;
				postdata['order'] = this.order;
			}

			_.each(this.fetchAttributes, function(attr){
				postdata[attr] = me[attr];
			});

			postdata = this.checkPostFlush(_.extend(postdata, data));




			// Set change observers here, so we leave the initialize method
			// easily overridable.
			this.changedModels = [];
			this.addedModels = [];
			this.removedModels = [];
			this.off('change', this.updateChanged, this);
			this.on('change', this.updateChanged, this);
			this.off('add', this.updateAdded, this);
			this.on('add', this.updateAdded, this);
			this.off('remove', this.updateRemoved, this);
			this.on('remove', this.updateRemoved, this);

			this.isNew = false;

			return this.post(postdata)
				.done(function(response){
					if(response.data.pagination){
						var pagination = response.data.pagination,
							models = [];
						if(postdata.flush || me.pagination.totalElements != pagination.total){
							me.pagination = {
								totalElements: pagination.total,
								pageSize: pagination.page_size,
								// If pages total is given use that. Otherwise calculate it.
								pages: (pagination.pages ? Math.ceil(pagination.pages) : Math.ceil(pagination.total / pagination.page_size)),
								currentPage: pagination.page,
								loaded: postdata.flush ? {} : me.pagination.loaded
							};
							me.pagination.loaded[pagination.page] = true;
							_.each(response.data.results, function(modelData){
								var model = new me.model(modelData);
								model.belongsToPage = pagination.page;
								models.push(model);
							});
							me.reset(models);
						}
						else {
							me.pagination.currentPage = pagination.page;
							me.pagination.loaded[pagination.page] = true;
							_.each(response.data.results, function(modelData){
								var model = new me.model(modelData);
								model.belongsToPage = pagination.page;
								me.add(model, {silent: true, merge: true});
							});
							me.trigger('reset', me);
						}
					}
					else
						me.reset(response.data.results);
				}
			);
		},

		/**
		 * Send a POST request to the server setting all the parameters needed to communicate with
		 * the models endpoint.
		 * @param  {Object} data Data to be sent with the request.
		 * @return {jQuery.Deferred}	A promise for the response. The server response will be passed as argument to the done function.
		 */
		post: function(data){
			data = _.isObject(data) ? _.clone(data) : {};
			data.model_action = data.action;
			data.action = this.action;

			return Upfront.Util.post(data);
		},

		/**
		 * Store the data base. Different lists are sent to the server with all, added, changed and removed models
		 * for making easy to store the changes.
		 * @return {jQuery.Deferred} A promise for the response. The server response will be passed as argument to the done function.
		 */
		save: function(){
			var me = this,
				data = {
					all: this.toJSON(),
					added: [],
					changed: [],
					removed: [],
					action: 'save_' + this.collectionName
				}
			;
			if(this.isNew){
				data.added = data.all;
			}
			else{
				this.each(function(model){
					if(me.addedModels.indexOf(model.id) != -1)
						data.added.push(model.toJSON());

					if(me.changedModels.indexOf(model.id) != -1)
						data.changed.push(model.toJSON());

					if(me.removedModels.indexOf(model.id) != -1)
						data.removed.push(model.toJSON());
				});
			}

			this.isNew = false;

			_.each(this.saveAttributes, function(attr){
				data[attr] = me[attr];
			});

			return this.post(data)
				.done(function(response){
					me.reset(response.data);
					me.addedModels = [];
					me.changedModels = [];
					me.removedModels = [];
				});
		},
		/**
		 * Used to synchro the changed model list.
		 * @param  {WPModel} model The model to add to the changed list.
		 * @return {null}
		 */
		updateChanged: function(model){
			var id = model.id,
				addedIndex = _.indexOf(this.addedModels, id)
			;
			if(addedIndex != -1)
				this.addedModels[addedIndex] = id;

			else if(!_.contains(this.changedModels, id))
				this.changedModels.push(id);
		},

		/**
		 * Used to synchro the added model list.
		 * @param  {WPModel} model The model to add to the added list.
		 * @return {null}
		 */
		updateAdded: function(model){
			var id = model.id,
				removedIndex = _.indexOf(this.removedModels, id)
			;
			if(removedIndex != -1){
				this.removedModels.splice(removedIndex, 1);
				this.changedModels.push(id);
			}
			else if(!_.contains(this.addedModels, id))
				this.addedModels.push(id);
		},

		/**
		 * Used to synchro the removed model list.
		 * @param  {WPModel} model The model to add to the removed list.
		 * @return {null}
		 */
		updateRemoved: function(model){
			var id = model.id,
				addedIndex = _.indexOf(this.addedModels, id),
				changedIndex = _.indexOf(this.changedModels, id)
			;
			if(addedIndex != -1)
				this.addedModels.splice(addedIndex, 1);
			else if(!_.contains(this.removedModels, id))
				this.removedModels.push(id);

			if(changedIndex != -1)
				this.changedModels.splice(changedIndex, 1);
		},

		/**
		 * Override the Backbone.Collection function to handle hierarchical data when the
		 * parentAttribute and childrenAttribute are set for the collection.
		 * @param  {Array} models  Array of data for the new models
		 * @param  {Object} options Options for the adding. See http://backbonejs.org/#Collection-add
		 */
		add: function(models, options){
			//Check for hierarchy
			if(!this.parentAttribute || !this.childrenAttribute)
				return Backbone.Collection.prototype.add.call(this, models, options);

			var me = this;
			if(_.isArray(models)){
				_.each(models, function(model){
					me.add(model, options);
				});
			}
			else {
				var parent_id = 0,
					model = models;
				if(this.model && model instanceof this.model){
					parent_id = model.get(this.parentAttribute);
				}
				else if(_.isObject(model)){
					parent_id = model[this.parentAttribute];
					if(this.model)
						model = new this.model(models);
				}
				else
					return Backbone.Collection.prototype.add.call(this, model, options);

				// We got the model to add
				// Add the children
				if(this.orphans[model.id]){
					if(!model[this.childrenAttribute])
						model[this.childrenAttribute] = new this.constructor(this.orphans[model.id], options);
					else
						model[this.childrenAttribute].add(this.orphans[model.id], options);
					delete this.orphans[model.id];
				}
				else if(!model[this.childrenAttribute])
					model[this.childrenAttribute] = new this.constructor([], options);



				if(parent_id){
					// Is it a child?
					var parent = this.get(parent_id);
					if(parent){
						parent[this.childrenAttribute].add(model, options);
					}
					else{ //An orphan
						var parentOrphans = this.orphans[parent_id];
						if(parentOrphans)
							parentOrphans.push(model);
						else
							this.orphans[parent_id] = [model];
					}
				}
				// Add the model to the collection
				return Backbone.Collection.prototype.add.call(this, model, options);
			}
		},

		/**
		 * Overrides Backbone.Collection.remove to handle hierarchical data when the
		 * parentAttribute and childrenAttribute are set for the collection.
		 *
		 * @param  {Array|Model} models  Models to remove.
		 * @param  {Object} options Options for removing elements. See http://backbonejs.org/#Collection-remove
		 * @return {WPCollection}        this
		 */
		remove: function(models, options){
			//Check for hierarchy
			if(!this.parentAttribute || !this.childrenAttribute)
				return Backbone.Collection.prototype.remove.call(this, models, options);

			var me = this;

			models = _.isArray(models) ? models.slice() : [models];

			// Delete the children
			for (i = 0, l = models.length; i < l; i++) {
				var model = this.get(models[i]);
				if(model){
					model[this.childrenAttribute].each(function(child){
						me.remove(child, options);
					});
				}
			}
			return Backbone.Collection.prototype.remove.call(this, models, options);
		},
		/**
		 * Get a page from the collection using the pagination parameters. The model must be fetched before
		 * using this function. A page is known to be loaded checking the WPCollection.pagination.loaded[pageNumber]
		 * attribute.
		 *
		 * @param  {Number} pageNumber The page number
		 * @return {Array}            Models that belongs to the requested paged
		 */
		getPage: function(pageNumber){
			var me = this;

			return this.filter(function(model){
				return model.belongsToPage == pageNumber;
			});
		},

		/**
		 * Load the models of the given page from the database.
		 * @param  {Number} pageNumber The number of the page to fetch.
		 * @return {jQuery.Deferred} A promise for the fetching. The server response will be passed as arguments for the done function.
		 */
		fetchPage: function(pageNumber, options){
			if(!options)
				options = {};

			if(!options.flush && this.pagination.loaded[pageNumber]){
				this.pagination.currentPage = pageNumber;
				/*
				//All elements loaded, return them following the current order (sorting without fetch)
				if(this.pagination.totalElements == this.length){
					var start = this.pagination.currentPage * this.pagination.pageSize,
						end = start + this.pagination.pageSize
						results = []
					;

					this.each(function(result, idx){
						if(idx >= start && idx < end)
							results.push(result);
					});

					return jQuery.Deferred().resolve({results: results});
				}
				*/

				var models = this.getPage(pageNumber),
					results = [];
				_.each(models, function(model){
					results.push(model.toJSON());
				});
				this.pagination.currentPage = pageNumber;
				return jQuery.Deferred().resolve({results: results});
			}



			return this.fetch(_.extend({page: pageNumber, limit: this.pagination.pageSize}, options));
		},

		/**
		 * Re-Sort the collection based on the model attribute. This always flush the collection elements.
		 * @param  {String} attribute Model attribute for using to sort.
		 * @param  {String} asc       asc|desc Order of the sorting.
		 * @return {[type]}           [description]
		 */
		reSort: function(attribute, asc){
			var direction = asc == 'asc' ? 'asc' : 'desc';

			this.orderby = attribute;
			this.order = direction;

			return this.fetch({page: 0, sort: attribute, direction: direction});


			/* // Possible changes to not reload when fetched all elements
			if(this.pagination.totalElements > this.length)
				return this.fetch({page: 0, sort: attribute, direction: direction});

			this.comparator = function(a, b){
				var factor = asc ? 1 : -1;
				return a.get(attribute) < b.get(attribute) ? 1 * factor : -1 * factor;
			}

			this.sort();

			return jQuery.Deferred().resolve(this.toJSON());
			*/
		},

		/**
		 * Check if the fetch options must be flushed.
		 */
		checkPostFlush: function(fetchOptions){
			var me = this,
				flush = false,
				newOptions = _.clone(fetchOptions)
			;

			if(fetchOptions.flush){
				delete newOptions.flush;
				this.lastFetchOptions = newOptions;
				return fetchOptions;
			}

			_.each(fetchOptions, function(value, key){
				if(['limit', 'page'].indexOf(key) == -1)
					flush = flush || me.lastFetchOptions[key] != value;
			});


			if(flush){
				me.lastFetchOptions = _.clone(fetchOptions);
				newOptions.flush = true;
			}
			else
				newOptions = _.extend(this.lastFetchOptions, newOptions);

			return newOptions;
		}
	}),

	Post = WPModel.extend({
		modelName: 'post',
		defaults: {
			ID: 0,
			post_author: 0,
			post_date: new Date(),
			post_date_gmt: new Date(),
			post_content: '',
			post_title: '',
			post_excerpt: '',
			post_status: '',
			comment_status: '',
			ping_status: '',
			post_password: '',
			post_name: '',
			to_ping: [], // To do initialize
			pinged: [], // To do initialize
			post_modified: new Date(),
			post_modified_gmt: new Date(),
			post_content_filtered: '',
			post_parent: 0,
			guid: '',
			menu_order: 0,
			post_type: 'post',
			post_mime_type: '',
			comment_count: 0,
			permalink: ''
		},

		saveAttributes: ['sticky'],

		author: false,
		comments: false,
		parent: false,
		terms: false,
		meta: false,

		initialize: function(model, options){
			var me = this;
			if(model){
				if(model['id'])
					this.set(this.idAttribute, model['id']);
				if(model['author'])
					this.author = new Upfront.Models.User(model['author']);

				if(model['meta'])
					this.meta = new Upfront.Collections.MetaList(model['meta'], {objectId: this.id, metaType: 'post'});

			}
		},

		getVisibility: function(){
			if(this.get('post_status') == 'private')
				return 'private';
			if(this.get('post_password'))
				return 'password';
			if(this.sticky)
				return 'sticky';
			return 'public';
		},

		setVisibility: function(visibility){
			this.sticky = 0;
			if(visibility == 'password'){
				this.set('post_status', 'publish');
			} else {
				this.set('post_password', '');
				if(visibility == 'private')
					this.set('post_status', 'private');
				else if(visibility == 'sticky')
					this.sticky = 1;
				else if(visibility == 'public')
					this.set('post_status', 'publish');
			}
		},

		fetch: function(data) {
			var me = this;
			return WPModel.prototype.fetch.call(this, data)
				.done(function(response){
					if(response.data.author)
						me.author = new Upfront.Models.User(response.data.author);
					if(response.data.meta)
						me.meta = new Upfront.Collections.MetaList(response.data.meta, {objectId: me.id, metaType: 'post'});

					me.sticky = response.data.sticky;
				})
			;
		},

		idAttribute: 'ID',

		fetch_comments: function(data){
			var  me = this;
			data = _.isObject(data) ? data : {};

			this.comments = new Upfront.Collections.CommentList([], {postId: this.id});

			return this.comments.fetch();
		},

		fetch_parent: function() {
			if(!this.get('post_parent'))
				return false;

			var me = this,
				data = {
					action: 'fetch_post',
					id: this.get('post_parent')
				}
			;

			return this.post(data)
				.done(function(response){
						me.parent = new Post(response.data);
				});
		},

		fetch_author: function() {
			console.log('Fetch author not yet implemented.');
		},

		fetch_terms: function(type){
			if(!type)
				return false;
			return this.post({
				taxonomy: type,
				post_id: this.get('ID'),
				action: 'get_terms'
			});
		},

		fetch_meta: function(){
			this.meta = new Upfront.Collection.MetaList([], {objectId: this.id, metaType: 'post'});
			return this.meta.fetch();
		}
	}),

	PageTemplate = WPModel.extend({
		modelName: 'template',
		defaults: {

		},

		initialize: function(model, options){
			var me = this;
		}

	}),

	PostList = WPCollection.extend({
		collectionName: 'post_list',
		model: Post,
		parentAttribute: 'post_parent',
		childrenAttribute: 'children',
		postId: false,
		postType: 'post',
		withMeta: false,
		withAuthor: false,
		withThumbnail: false,
		fetchAttributes: ['postId', 'postType', 'withMeta', 'withAuthor', 'withThumbnail'],
		initialize: function(models, options){
			if(options){
				if(options.postId)
					this.postId = options.postId;
				if(options.postType)
					this.postType = options.postType;
				if(options.withMeta)
					this.withMeta = options.withMeta;
				if(options.withAuthor)
					this.withAuthor = options.withAuthor;
				if(options.withThumbnail)
					this.withThumbnail = options.withThumbnail;
			}
		}
	});

	PageTemplateList = WPCollection.extend({
		collectionName: 'page_templates',
		model: PageTemplate,
		postId: false,
		templateObject: false,
		fetchAttributes: ['postId'],
		initialize: function(models, options){
			if(options){
				if(options.postId)
					this.postId = options.postId;
			}
		},
		fetch: function(options){
			var me = this;
			 return WPCollection.prototype.fetch.call(this, options)
				.done(function(response){
					me.templateObject = response.results;
				})
			;
		}

	});

	var Comment = WPModel.extend({
		modelName: 'comment',
		defaults: {
			comment_ID: 0,
			comment_post_id: 0,
			comment_author: '',
			comment_author_email: '',
			comment_author_url: '',
			comment_author_IP: '0.0.0.0',
			comment_date: new Date(),
			comment_date_gmt: new Date(),
			comment_content: '',
			comment_karma: '',
			comment_agent: '',
			comment_type: '',
			comment_approved: '0',
			comment_parent: 0,
			user_id: 0
		},

		idAttribute: 'comment_ID',

		initialize: function(options){
			if(options && options['id'])
				this.set(this.idAttribute, options['id']);
		},

		trash: function(trashed){
			if(trashed)
				this.set('comment_approved', 'trash');
			else if(!trashed && this.get('comment_approved') == 'trash')
				this.set('comment_approved', '0');
			return this;
		},

		spam: function(spammed){
			if(spammed)
				this.set('comment_approved', 'spam');
			else if(!spammed && this.get('comment_approved') == 'spam')
				this.set('comment_approved', '0');
			return this;
		},

		approve: function(approved){
			if(approved)
				this.set('comment_approved', '1');
			else if(!approved && this.get('comment_approved') == '1')
				this.set('comment_approved', '0');
			return this;
		},
		isTrash: function(){
			return this.get('comment_approved') == 'trash';
		},
		isApproved: function(){
			return this.get('comment_approved') == '1';
		},
		isSpam: function(){
			return this.get('comment_approved') == 'spam';
		}
	}),

	CommentList = WPCollection.extend({
		model: Comment,
		collectionName: 'comment_list',
		postId: false,
		fetchAttributes: ['postId', 'commentType'],
		parentAttribute: 'comment_parent',
		childrenAttribute: 'replies',
		commentType: 'comment', // all, comment, trackback, pingback

		initialize: function(models, options){
			if(options.postId)
				this.postId = options.postId;
		},
		save: function(){
			console.error('CommentList save: Use single comment save instead.');
		}

	}),

	Meta = Backbone.Model.extend({
		defaults: {
			meta_key: '',
			meta_value: ''
		},
		idAttribute: 'meta_key'
	}),

	MetaList = WPCollection.extend({
		model: Meta,
		collectionName: 'meta_list',
		metaType: 'post',
		objectId: 0,
		fetchAttributes: ['objectId', 'metaType'],
		saveAttributes: ['objectId', 'metaType'],
		initialize: function(models, options){
			var metaModels = [];
			if(options.objectId)
				this.objectId = options.objectId;
			if(options.metaType)
				this.metaType = options.metaType;
		},
		getValue: function(key){
			var meta = this.get(key);
			if(!meta)
				return undefined;
			return meta.get('meta_value');
		},
		setValue: function(key, value){
			var meta = this.get(key);
			if(!meta){
				meta = new Meta({meta_key: key, meta_value: value});
				this.add(meta);
			}
			else{
				meta.set('meta_value', value);
				this.changedModels.push(meta.id);
			}
			return meta;
		}
	}),

	Filter = Backbone.Model.extend({
		defaults: {
			value: '',
			label: ''
		},
	}),

	FilterList = WPCollection.extend({
		model: Filter,
		collectionName: 'filter_data',
		initialize: function(models, options){
		},
	}),

	Term =  WPModel.extend({
		modelName: 'term',
		defaults: {
			term_id: 0,
			name: '',
			slug: '',
			term_group: '',
			term_taxonomy_id: 0,
			taxonomy: '',
			description: '',
			parent: '',
			count: 0
		},
		idAttribute: 'term_id',
		taxonomy: false,
		fetchAttributes: ['taxonomy'],
		saveAttributes: ['taxonomy'],
		initialize: function(model, options){
			if(model && model.taxonomy)
				this.taxonomy = model.taxonomy;
		},
		save: function(data){
			var me = this;
			return WPModel.prototype.save.call(this, data).
				done(function(response){
					me.set('term_id', response.data.term_id);
				})
			;
		}
	}),

	TermList = WPCollection.extend({
		collectionName: 'term_list',
		model: Term,
		taxonomy: false,
		taxonomyObject: false,
		postId: false,
		fetchAttributes: ['taxonomy', 'postId'],
		saveAttributes: ['taxonomy', 'postId'],
		parentAttribute: 'parent',
		childrenAttribute: 'children',
		initialize: function(models, options){
			if(options){
				if(options.taxonomy){
					this.taxonomy = options.taxonomy;
				}

				if(options.postId)
					this.postId = options.postId;
			}
		},
		fetch: function(options){
			var me = this;
			 return WPCollection.prototype.fetch.call(this, options)
				.done(function(response){
					me.taxonomyObject = response.data.taxonomy;
				})
			;
		}
	}),

	User = WPModel.extend({
		modelName: 'user',
		defaults: {
			ID: 0,
			caps: [],
			cap_key: '',
			roles: [],
			allcaps: [],
			data: {}
		},
		idAttribute: 'ID'
	}),


	Posts = Backbone.Model.extend({
		initialize: function () {
			var args = arguments,
				data = args[0] || {}
			;
			this.posts = data.posts ? new Backbone.Collection(data.posts) : new Backbone.Collection([]);
			this.pagination = data.pagination ? new Backbone.Model(data.pagination) : new Backbone.Model([]);
		}
	}),

	Pages = Posts.extend({}),

	Comments = Backbone.Model.extend({
		initialize: function () {
			var args = arguments,
				data = args[0] || {}
			;
			this.comments = data.comments ? new Backbone.Collection(data.comments) : new Backbone.Collection([]);
			this.pagination = data.pagination ? new Backbone.Model(data.pagination) : new Backbone.Model([]);
		}
	}),

    ImageVariant = Backbone.Model.extend({
        defaults : function () {
        	return {
	            vid   : "",
	            label : "Variant Label",
	            group : {
					margin_left: 0,
					margin_right: 0,
	                col: 24,
	                row: 50,
	                left: 0,
	                "float": "none"
	            },
	            image : {
	            	order: 0,
	            	col: 24,
	            	top: 0,
	            	left: 0,
	            	row: 40,
	            	clear: true
	            },
	            caption : {
	                show: 1,
	                order: 1,
	                col: 24,
	                top: 0,
	                left: 0,
	                row: 10,
	                clear: true
	            }
        	};
        }
    }),
    ImageVariants = Backbone.Collection.extend({
        model : ImageVariant
    }),
_omega = 'omega';

return {
    "Models": {
      "Property": Property,
      "ObjectModel": ObjectModel,
      "ObjectGroup": ObjectGroup,
      "Module": Module,
      "ModuleGroup": ModuleGroup,
      "Region": Region,
      "Wrapper": Wrapper,
      "Layout": Layout,
      "Taxonomy": Taxonomy,
      "Post": Post,
      "Posts": Posts,
      "Pages": Pages,
      "Comment": Comment,
      "Comments": Comments,
      "Meta": Meta,
      "Filter": Filter,
      "Term": Term,
      "User": User,
      "ImageVariant" : ImageVariant
    },
    "Collections": {
      "Properties": Properties,
      "Objects": Objects,
      "Modules": Modules,
      "Regions": Regions,
      "Wrappers": Wrappers,
      "CommentList": CommentList,
      "MetaList": MetaList,
      "FilterList": FilterList,
      "PostList": PostList,
      "TermList": TermList,
      "ImageVariants" : ImageVariants,
      "PageTemplateList" : PageTemplateList
    }
  };
});

})(jQuery);
