(function ($) {

define(function() {

	var _initial = {};

	var l10n = Upfront.Settings.l10n.posts_element;


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
		editor: false,
		editing: false,
		currentpost: false,
		initialize: function(options){
			if(! (this.model instanceof UpostsModel)){
				this.model = new UpostsModel({properties: this.model.get('properties')});
			}

			this.events = _.extend({}, this.events, {
				'click .uposts-pagination>a': 'paginate',
				'click .upfront-post-layout-trigger': 'editPostLayout'
				//'mouseenter div.post_editor_container': 'moveEditButton'
			});

			this.page = 1;
			//this.constructor.__super__.initialize.call(this, [options]);

			this.model.on('region:updated', this.refreshMarkup, this);
			this.listenTo(this.model.get("properties"), 'change', this.refreshMarkup);
		},

		get_content_markup: function () {
			if(this.changed || !this.markup){
				//Is it shadow?
				if(this.parent_module_view.region.get("name") != 'shadow')
					this.refreshMarkup();
				return l10n.loading;
			}
			return this.markup;
		},

		moveEditButton: function(e) {
		if(this.editing)
			return;
			var target = $(e.target).closest('div.post_editor_container');
			var poisitontarget = target.find('div.upfront-output-wrapper:first-child');
			if(poisitontarget.length)
				target.prepend(this.$el.find('.upfront-post-layout-trigger').parent('b').addClass('post_layout_trigger').css({ top: poisitontarget.position().top+50, right: 5}));

		},

		on_render: function(){
			var me = this;

			//Give time to append when dragging.
			setTimeout(function(){
				me.updateEditors();
			}, 100);
		},

		get_buttons: function(){
			return '<a href="#" class="upfront-icon-button upfront-icon-button-nav upfront-post-layout-trigger"></a>';
		},
		editPostLayout: function(e){
			e.preventDefault();
			Upfront.Events.trigger('post:layout:edit', this, 'archive');
		},

		prepareEditor: function(id, node){
			is_excerpt = this.property('content_type') == 'excerpt';
			//this.currentpost = postId;
			//if(!this.editor || this.editor.post_id!=postId){post:layout:edit
			var editor = new Upfront.Content.PostEditor({
				editor_id: 'this_post_' + id,
				post_id: id,
				preload: true,
				node: node,
				content_mode: is_excerpt ? 'post_excerpt' : 'post_content',
				view: this,
				layout: this.property('layout')
			});

			editor.render();
			//}
			this.editors[id] = editor;
		},

		refreshMarkup: function(changes, options, page) {
			if(changes && changes.id == 'row')
				return;

			this.$el.find('div.upfront-editable_entity.upfront-object.uposts-object').prepend(this.$el.find('.upfront-post-layout-trigger').parent('b'));

			var props = this.model.get('properties').toJSON(),
				data = {},
				me = this,
				content_selector = '#' + this.property('element_id'),
				loading = new Upfront.Views.Editor.Loading({
					loading: l10n.refreshing,
					done: l10n.here_we_are,
					fixed: true
				})
			;

			if(!page)
				page = 1;
			data.page = page;

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
				layout_cascade: Upfront.Application.current_subapplication.get_layout_data().layout,
				"data": JSON.stringify(data)
			}).success(function (response) {
				me.markup = response.data;
				$(content_selector)
					.find(".upfront-object-content")
					.html(me.get_content_markup())
				;
				loading.$el.remove();
				me.updateEditors();

				//me.prepareEditor();
			});
		},

		updateEditors: function(){
			var me = this,
				nodes = $('#' + this.property('element_id')).find('.uposts-post'),
				container = me.$('.upfront-object-content')
			;

			if(!nodes.length)
				return;

			nodes.each(function(){
				var node = $(this),
					id = node.data('post_id')
				;

				me.prepareEditor(id, node);
			});

			//The first editor will be used for post layout editing
			this.editor = this.editors[$(nodes[0]).data('post_id')];
		},

		onPostUpdated: function(post){
			var loading = new Upfront.Views.Editor.Loading({
					loading: l10n.refreshing_post,
					done: l10n.here_we_are,
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
					me.editors[post.ID].initEditAreas();
				});
			}
		},

		paginate: function(e){
			console.log('Paginating!' + e.target.search);
			var search = e.target.search;
			if(search && search.match(/^\?paged=\d+$/))
				this.refreshMarkup(null, null, search.replace('?paged=', ''));
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
				priority: 70,
		/**
		 * Set up element appearance that will be displayed on sidebar panel.
		 */
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-posts');
			this.$el.html(l10n.element_name);
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
						{"name": "class", "value": "c24 upfront-posts_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(375)}
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
		initialize: function (opts) {
			this.options = opts;
			var SettingsItem =  Upfront.Views.Editor.Settings.Item,
				Fields = Upfront.Views.Editor.Field
			;
			this.settings = _([
				new QuerySettings({model: this.model})
			 /* new SettingsItem({
					title: 'Post Data',
					fields: [
						new Upfront.Views.Editor.Field.Checkboxes({
							className: 'inline-radios plaintext-settings upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes post-settings-data',
							model: this.model,
							label: "Show the following Post Data:",
							property: "post_data",
							values: [
								{label: "Author", value: "author"},
								{label: "Date", value: "date"},
								{label: "Categories", value: "categories"},
								{label: "Tags", value: "tags"},
								{label: "Comment count", value: "comments_count"},
								{label: "Featured image", value: "featured_image"}
							]
						})
					]
				}) */
			]);
		},
		/**
		 * Get the label (what will be shown in the settings overview)
		 * @return {string} Label.
		 */
		get_label: function () {
			return l10n.query;
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return l10n.query_settings;
		}
	});

	/**
	 * Query settings
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var QuerySettings = Upfront.Views.Editor.Settings.Item.extend({
		className: 'posts-settings-query',
		events: function () {
			return _.extend({},
				Upfront.Views.Editor.Settings.Item.prototype.events,
				{"click [id*=taxonomy] .upfront-field-select-option": "update_terms"}
			);
		},
		initialize: function (opts) {
			this.options = opts;
			var pts = [];
			_(_initial.post_types).each(function (label, type) {
				pts.push({label: label, value: type});
			});

			var taxs = [];
			_(_initial.taxonomies).each(function (label, type) {
				taxs.push({label: label, value: type});
			});

			var limits = [];
			_(_.range(20)).each(function (idx) {
				limits.push({label: idx, value: idx});
			});

			var orders = [
				{label: l10n.date_posted, value: 'date'},
				{label: l10n.date_modified, value: 'modified'},
				{label: l10n.comment_count, value: 'comment_count'},
				{label: l10n.author, value: 'author'},
				{label: l10n.title, value: 'title'},
				{label: l10n.slug, value: 'name'},
				{label: l10n.random, value: 'rand'}
			];

			var directions = [
				{label: l10n.descending, value: 'DESC'},
				{label: l10n.ascending, value: 'ASC'}
			];

			var Fields = Upfront.Views.Editor.Field;

			this.fields = _([
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-type',
					model: this.model,
					label: l10n.type,
					property: "post_type",
					values: pts
				}),
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-taxonomy',
					model: this.model,
					label: l10n.taxonomy,
					property: "taxonomy",
					values: taxs
				}),
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-term',
					model: this.model,
					label: l10n.term,
					property: "term",
					values: [{label:l10n.select_tax, value:"", disabled: true}]
				}),
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-limit',
					model: this.model,
					label: l10n.limit,
					property: "limit",
					values: limits
				}),
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-order',
					model: this.model,
					label: l10n.order,
					property: "order",
					values: orders
				}),
				new Fields.Select({
					className: 'upfront-field-wrap upfront-field-wrap-select post-settings-direction',
					model: this.model,
					label: l10n.direction,
					property: "direction",
					values: directions
				}),
				new Fields.Radios({
					className: 'inline-radios upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios plaintext-settings',
					model: this.model,
					label: l10n.pagination,
					property: 'pagination',
					values: [
						{
							label: l10n.none,
							value: 0
						},
						{
							label: l10n.prev_next,
							value: 'prevnext'
						},
						{
							label: l10n.numeric,
							value: 'numeric'
						}
					]
				}),
				new Fields.Radios({
					className: 'inline-radios upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios plaintext-settings',
					model: this.model,
					label: l10n.result_length,
					property: "content_type",
					values: [
						{label: l10n.full, value: "full"},
						{label: l10n.excerpt, value: "excerpt"}
					]
				})
			]);
		},
		update_terms: function () {
			var me = this, taxonomy;

			this.fields.each(function (field) {
				field.property.set({'value': field.get_value()}, {'silent': false});
			});

			taxonomy = this.model.get_property_value_by_name("taxonomy");
			if (!taxonomy) return false;
			Upfront.Util.post({
				"action": "upost_get_taxonomy_terms",
				"taxonomy": taxonomy}
			).success(function (terms) {
				var term_values = [];
				_(terms.data).each(function (label, id) {
					term_values.push({label: label, value: id});
				});
				me.fields._wrapped[2] = new Upfront.Views.Editor.Field.Select({
					model: me.model,
					label: l10n.term,
					property: "term",
					values: term_values
				});
				me.$el.empty();
				me.render();
			});
		},
		get_title: function () {
			return l10n.query_settings;
		}
	});

	// --- Post settings --

	/**
	 * Post settings - Featured image item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */
	var UpostsPostSetting_FeaturedImage = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function (opts) {
			this.options = opts;
			this.fields = _([
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "featured_image",
					layout: "vertical",
					values: [
						{label: l10n.yes, value: "1"},
						{label: l10n.no, value: "0"}
					]
				})
			]);
		},
		get_title: function () {
			return l10n.show_featured;
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
		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
            this.has_settings = false;
			this.panels = _([
				new UpostsQuerySettingsPanel({model: this.model})
			]);
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return l10n.posts_settings;
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
