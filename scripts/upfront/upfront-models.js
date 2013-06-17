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
			});
		},
	// ----- Magic properties manipulation ----- */
		get_content: function () {
			return this.get_property_value_by_name("content");
		},
		set_content: function (content, options) {
			var prop = this.get_property_by_name("content");
			var options = typeof options != 'undefined' ? options: {};
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
			var val_esc = value.replace(/-?\d+/, '-?\\d+')
				val_rx = new RegExp(val_esc),
				prop = this.get_property_by_name("class"),
				old = prop ? prop.get("value") : false
			;
			if (prop && old && old.match(val_rx)) return prop.set("value", old.replace(val_rx, value)); // Have class, have old value to replace
			else if (prop && old) return prop.set("value", old + " " + value); // Have class, no old value to replace
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
				this.set("objects", args[0].objects);
			}
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
				this.set("modules", args[0].modules)
			}
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers)
			}
			if (args && args[0] && args[0]["properties"]) {
				args[0]["properties"] = args[0]["properties"] instanceof Properties
					? args[0]["properties"]
					: new Properties(args[0]["properties"])
				;
				this.set("properties", args[0].properties);
			} else this.set("properties", new Properties([]));
		}
	}),

	Regions = Backbone.Collection.extend({
		"model": Region,
		
		get_by_name: function (name) {
			var found = false,
				name = name.toLowerCase();
			this.each(function (model) {
				if (model.get("name").toLowerCase() == name) found = model;
			});
			return found;
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
				this.set("properties", args[0].properties)
			}
		},
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

	Layout = Backbone.Model.extend({
		"defaults": {
			"name": "",
			"properties": new Properties(),
			"regions": new Regions(),
			"wrappers": new Wrappers(),
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
			if (args && args[0] && args[0]["wrappers"]) {
				args[0]["wrappers"] = args[0]["wrappers"] instanceof Wrappers
					? args[0]["wrappers"]
					: new Wrappers(args[0]["wrappers"])
				;
				this.set("wrappers", args[0].wrappers)
			}
		},
		get_current_state: function () {
			return Upfront.Util.model_to_json(this.get("regions"));
		},
		has_undo_states: function () {
			return !!Upfront.Util.Transient.length("undo");
		},
		has_redo_states: function () {
			return !!Upfront.Util.Transient.length("redo");
		},
		store_undo_state: function () {
			Upfront.Util.Transient.push("undo", this.get_current_state());
		},
		restore_undo_state: function () {
			if (!this.has_undo_states()) return false;
			this.restore_state_from_stack("undo");
		},
		restore_redo_state: function () {
			if (!this.has_redo_states()) return false;
			this.restore_state_from_stack("redo");
		},
		restore_state_from_stack: function (stack) {
			var other = ("undo" == stack ? "redo" : "undo"),
				state = Upfront.Util.Transient.pop(stack)
			;
			if (!state) {
				Upfront.Util.log("Invalid " + stack + " state");
				return false;
			}

			Upfront.Util.Transient.push(other, this.get_current_state());
			this.get("regions").reset(state);
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

	WPModel = Backbone.Model.extend({
		action: 'upfront-wp-model',
		fetchAttributes: [],
		saveAttributes: [],
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
		post: function(data){
			data = _.isObject(data) ? _.clone(data) : {};
			data.model_action = data.action;
			data.action = this.action;

			return Upfront.Util.post(data);
		},
		get: function(attr){
			var value = this.attributes[attr];
			if(_.isString(value) && value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/))
				return new Date(value);
			return this.attributes[attr];
		},
		set: function(key, val, options){
			var newval = val,
				parsedAttrs = {};

			if(_.isObject(key)){
				for(var attr in key){
					var value = key[attr];
					if(val instanceof Date)
						parsedAttrs[attr] = value.format('yyyy-mm-dd hh:MM:ss');
					else
						parsedAttrs[attr] = value;
				}
				Backbone.Model.prototype.set.call(this, parsedAttrs, options);
			}
			else{
				if(val instanceof Date)
					newval = val.format('yyyy-mm-dd hh:MM:ss');

				Backbone.Model.prototype.set.call(this, key, newval, options);
			}

			return this;
		}
	}),

	WPCollection = Backbone.Collection.extend({
		action: 'upfront-wp-model',
		fetchAttributes: [],
		saveAttributes: [],
		changedModels: [],
		addedModels: [],
		removedModels: [],
		isNew: true,
		parentAttribute: false,
		childrenAttribute: false,
		orphans: {},
		orderby: false,
		order: 'desc',
		pagination: {
			pages: 1,
			pageSize: 10,
			currentPage:1,
			totalElements: 0,
			loaded: {}
		},
		lastFetchOptions: {},
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
								pages: Math.ceil(pagination.total / pagination.page_size),
								currentPage: pagination.page,
								loaded: postdata.flush ? {} : me.pagination.loaded
							}
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
		post: function(data){
			data = _.isObject(data) ? _.clone(data) : {};
			data.model_action = data.action;
			data.action = this.action;

			return Upfront.Util.post(data);
		},
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
		updateChanged: function(model){
			var id = model.id,
				addedIndex = _.indexOf(this.addedModels, id)
			;
			if(addedIndex != -1)
				this.addedModels[addedIndex] = id;

			else if(!_.contains(this.changedModels, id))
				this.changedModels.push(id);
		},
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

		getPage: function(pageNumber){
			var me = this;

			return this.filter(function(model){
				return model.belongsToPage == pageNumber;
			});
		},

		fetchPage: function(pageNumber, options){
			if(this.pagination.loaded[pageNumber]){
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
		},

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
			comment_count: 0
		},


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
					this.meta = new Upfront.Collections.MetaList(model['meta'], {postId: this.id, metaType: 'post'});
			}
		},

		fetch: function(data) {
			var me = this;
			return WPModel.prototype.fetch.call(this, data)
				.done(function(response){
					if(response.data.author)
						me.author = new Upfront.Models.User(response.data.author);
					if(response.data.meta)
						me.meta = new Upfront.Collections.MetaList(response.data.meta, {postId: this.id, metaType: 'post'});
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
			this.meta = new Upfront.Collection.MetaList([], {postId: this.id, metaType: 'post'});
			return this.meta.fetch();
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
		fetchAttributes: ['postId', 'postType', 'withMeta', 'withAuthor'],
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
			}
		}
	});
	
	Comment = WPModel.extend({
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

		trash: function(thrashed){
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
			if(!meta)
				return false;
			meta.set('meta_value', value);
			return meta;
		}
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

_omega = 'omega';

define({
	"Models": {
		"Property": Property,
		"ObjectModel": ObjectModel,
		"Module": Module,
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
		"Term": Term,
		"User": User
	},
	"Collections": {
		"Properties": Properties,
		"Objects": Objects,
		"Modules": Modules,
		"Regions": Regions,
		"Wrappers": Wrappers,
		"CommentList": CommentList,
		"MetaList": MetaList,
		"PostList": PostList,
		"TermList": TermList
	}
});

})();