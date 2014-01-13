(function ($) {

define(function() {

	var _initial = {};


	Upfront.Util.post({
		"action": "uposts_list_initial_info"
	}).success(function (initialData) {
		_initial = initialData.data;
	}); // End response wrap


	/**
	 * Define the model - initialize properties to their default values.
	 * @type {Upfront.Models.ObjectModel}
	 */
	var UpostsModel = Upfront.Models.ObjectModel.extend({
		/**
		 * The init function is called after the contructor and Model intialize.
		 * Here the default values for the model properties are set.
		 */
		init: function () {
			var properties = _.clone(Upfront.data.uposts.defaults);
			properties.element_id = Upfront.Util.get_unique_id("uposts-object");
			this.init_properties(properties);
		}
	});

	var UpostsView = Upfront.Views.ObjectView.extend({
		changed: false,
		markup: false,
		editors: {},
		initialize: function(options){
			if(! (this.model instanceof UpostsModel)){
				this.model = new UpostsModel({properties: this.model.get('properties')});
			}
			//this.constructor.__super__.initialize.call(this, [options]);

			this.model.on('region:updated', this.refreshMarkup, this);
			this.listenTo(this.model.get("properties"), 'change', this.refreshMarkup);
			//this.listenTo(this.model.get("properties"), 'add', this.refreshMarkup);
			//this.listenTo(this.model.get("properties"), 'remove', this.refreshMarkup);

			console.log('Posts element');
		},

		/**
		 * Element contents markup.
		 * @return {string} Markup to be shown.
		 */
		get_content_markup: function () {
			if(this.changed || !this.markup){
				//Is it shadow?
				if(this.parent_module_view.region.get("name") != 'shadow')
					this.refreshMarkup();
				return 'Loading';
			}
			return this.markup;
		},

		on_render: function(){
			var me = this;
			//Give time to append when dragging.
			setTimeout(function(){
				me.updateEditors();
			}, 100);
		},

		refreshMarkup: function() {
			var props = this.model.get('properties').toJSON(),
				data = {},
				me = this,
				content_selector = '#' + this.property('element_id'),
				loading = new Upfront.Views.Editor.Loading({
					loading: "Refreshing ...",
					done: "Here we are!",
					fixed: true
				})
			;

			_.each(props, function(prop){
				data[prop.name] = prop.value;
			});


			loading.render();
			$('#page').append(loading.$el);

			if (window._upfront_get_current_query)
				data.query = _upfront_get_current_query();
			else
				data.query = {};

			Upfront.Util.post({
				"action": "uposts_get_markup",
				"data": JSON.stringify(data)
			}).success(function (response) {
				me.markup = response.data;
				$(content_selector)
					.find(".upfront-object-content")
					.html(me.get_content_markup())
				;
				loading.$el.remove();
				me.updateEditors();
			});
		},

		updateEditors: function(){
			var me = this,
				nodes = $('#' + this.property('element_id')).find('.uposts-post'),
				is_excerpt = this.property('content_type') == 'excerpt'
			;
			nodes.each(function(){
				var node = $(this),
					id = node.data('post_id')
				;

				if(me.editors[id])
					me.editors[id].updateElement(node);
				else{
					me.editors[id] = new Upfront.Content.editor({
						editor_id: 'uposts_meta_' + id,
						post_id: id,
						node: node,
						content_mode: is_excerpt ? 'post_excerpt' : 'post_content',
						view: me,
						onUpdated: function(post){
							me.onPostUpdated(post);
						}
					});
				}
			});
		},

		onPostUpdated: function(post){
			var loading = new Upfront.Views.Editor.Loading({
					loading: "Refreshing post ...",
					done: "Here we are!",
					fixed: false
				}),
				wrapper = $('#' + this.property('element_id')).find('[data-post_id=' + post.ID + ']'),
				me = this
			;

			if(wrapper.length){
				loading.render();
				wrapper.append(loading.$el);
				var flat = {},
					properties = this.model.get('properties').toJSON()
				;

				_.each(properties, function(prop){
					flat[prop.name] = prop.value;
				});

				Upfront.Util.post({
					"action": "uposts_single_markup",
					"data": {
						post: post,
						properties: flat
					}
				}).success(function (response) {
					loading.$el.remove();
					loading = false;
					wrapper.html(response.data);
					me.editors[post.ID].updateElement(wrapper);
				});
			}
		},

		/*
		Shorcut to set and get model's properties.
		*/
		property: function(name, value, silent) {
			if(typeof value != "undefined"){
				if(typeof silent == "undefined")
					silent = true;
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

	/**
	 * Sidebar element class - this let you inject element into
	 * sidebar elements panel and allow drag and drop element adding
	 * @type {Upfront.Views.Editor.Sidebar.Element}
	 */
	var UpostsElement = Upfront.Views.Editor.Sidebar.Element.extend({
        priority: 60,
		/**
		 * Set up element appearance that will be displayed on sidebar panel.
		 */
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-posts');
			this.$el.html('Posts');
		},

		/**
		 * This will be called by editor to request module instantiation, set
		 * the default module appearance here
		 */
		add_element: function () {
			var object = new UpostsModel(), // Instantiate the model
				// Since search entity is an object,
				// we don't need a specific module instance -
				// we're wrapping the search entity in
				// an anonymous general-purpose module
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c22 upfront-posts_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": 25}
					],
					"objects": [
						object // The anonymous module will contain our posts object model
					]
				})
			;
			// We instantiated the module, add it to the workspace
			this.add_module(module);
		}
	});


	// ----- Settings API -----
	// We'll be working from the bottom up here.
	// We will first define settings panels, and items for each panel.
	// Then we'll slot in the panels in a settings instance.

	// --- Query settings ---

	/**
	 * Query settings panel.
	 * @type {Upfront.Views.Editor.Settings.Panel}
	 */
	var UpostsQuerySettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
		/**
		 * Initialize the view, and populate the internal
		 * setting items array with Item instances.
		 */
		initialize: function () {
			var tax = new UpostsQuerySetting_Taxonomy({model: this.model}),
				term = new UpostsQuerySetting_Term({model: this.model})
			;
			this.settings = _([
				new UpostsQuerySetting_PostType({model: this.model}),
				tax, term,
				new UpostsQuerySetting_Limit({model: this.model})
			]);
			tax.on("uposts:taxonomy:changed", term.generate_term_markup, term);
		},
		/**
		 * Get the label (what will be shown in the settings overview)
		 * @return {string} Label.
		 */
		get_label: function () {
			return "Query";
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return "Query settings";
		}
	});

	/**
	 * Query settings - Post Type item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsQuerySetting_PostType = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function () {
			var pts = [];
			_(_initial.post_types).each(function (label, type) {
				pts.push({label: label, value: type});
			});
			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: "post_type",
					values: pts
				})
			]);
		},
		get_title: function () {
			return "Post Type";
		}
	});

	/**
	 * Query settings - Taxonomy item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsQuerySetting_Taxonomy = Upfront.Views.Editor.Settings.Item.extend({
		events: function () {
			return _.extend({},
				Upfront.Views.Editor.Settings.Item.prototype.events,
				{"click": "register_change"}
			);
		},
		initialize: function () {
			var pts = [];
			_(_initial.taxonomies).each(function (label, type) {
				pts.push({label: label, value: type});
			});
			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: "taxonomy",
					values: pts
				})
			]);
		},
		register_change: function () {
			this.fields.each(function (field) {
				field.property.set({'value': field.get_value()}, {'silent': false});
			});
			this.trigger("uposts:taxonomy:changed");
		},
		get_title: function () {
			return "Taxonomy";
		}
	});

	/**
	 * Query settings - Terms item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsQuerySetting_Term = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function () {
			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: "term",
					values: [{label:"Please, select a taxonomy", value:"", disabled: true}]
				})
			]);
			this.generate_term_markup();
		},
		get_title: function () {
			return "Term";
		},
		generate_term_markup: function () {
			var me = this;
			this.reset_fields(function () {
				me.$el.empty();
				me.render();
			});
		},
		reset_fields: function (callback) {
			var me = this,
				taxonomy = this.model.get_property_value_by_name("taxonomy")
			;
			if (!taxonomy) return false;
			Upfront.Util.post({
				"action": "upost_get_taxonomy_terms",
				"taxonomy": taxonomy}
			).success(function (terms) {
				var sel = [];
				_(terms.data).each(function (label, id) {
					sel.push({label: label, value: id});
				});
				me.fields = _([
					new Upfront.Views.Editor.Field.Select({
						model: me.model,
						property: "term",
						values: sel
					})
				]);
				if (callback) callback.apply(this);
			});
		},
	});

	/**
	 * Query settings - Limit item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsQuerySetting_Limit = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function () {
			var pts = [];
			_(_.range(20)).each(function (idx) {
				pts.push({label: idx, value: idx});
			});
			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: "limit",
					values: pts
				})
			]);
		},
		get_title: function () {
			return "Limit";
		}
	});


	// --- Post settings --

	/**
	 * Post settings panel.
	 * @type {Upfront.Views.Editor.Settings.Panel}
	 */
	var UpostsPostSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
		/**
		 * Initialize the view, and populate the internal
		 * setting items array with Item instances.
		 */
		initialize: function () {
			this.settings = _([
				new UpostsPostSetting_Content({model: this.model}),
				//new UpostsPostSetting_FeaturedImage({model: this.model})
			]);
		},
		/**
		 * Get the label (what will be shown in the settings overview)
		 * @return {string} Label.
		 */
		get_label: function () {
			return "Post";
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return "Post settings";
		}
	});

	/**
	 * Post settings - Content item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsPostSetting_Content = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function () {
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "content_type",
					values: [
						{label: "Full", value: "full"},
						{label: "Excerpt", value: "excerpt"},
					]
				})
			]);
		},
		get_title: function () {
			return "Content";
		}
	});

	/**
	 * Post settings - Featured image item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsPostSetting_FeaturedImage = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function () {
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "featured_image",
					layout: "vertical",
					values: [
						{label: "Yes", value: "1"},
						{label: "No", value: "0"},
					]
				})
			]);
		},
		get_title: function () {
			return "Show featured image?";
		}
	});

	// --- Tie the settings together ---

	/**
	 * Search settings hub, populated with the panels we'll be showing.
	 * @type {Upfront.Views.Editor.Settings.Settings}
	 */
	var UpostsSettings = Upfront.Views.Editor.Settings.Settings.extend({
		/**
		 * Bootstrap the object - populate the internal
		 * panels array with the panel instances we'll be showing.
		 */
		initialize: function () {
			var postPanel = new Upfront.data.thisPost.PostDataPanel({model: this.model});
			postPanel.label = "Elements";
			this.panels = _([
				new UpostsQuerySettingsPanel({model: this.model}),
				new UpostsPostSettingsPanel({model: this.model}),
				postPanel
			]);
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return "Posts settings";
		}
	});


	// ----- Bringing everything together -----
	// The definitions part is over.
	// Now, to tie it all up and expose to the Subapplication.

	Upfront.Application.LayoutEditor.add_object("Uposts", {
		"Model": UpostsModel,
		"View": UpostsView,
		"Element": UpostsElement,
		"Settings": UpostsSettings
	});
	Upfront.Models.UpostsModel = UpostsModel;
	Upfront.Views.UpostsView = UpostsView;



});
})(jQuery);
