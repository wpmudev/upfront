(function ($) {

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
		 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
		 * Used for setting up instance defaults, initialization and the like.
		 */
		init: function () {
			this.init_properties({
				type: 'UpostsModel',
				view_class: 'UpostsView',
				element_id: Upfront.Util.get_unique_id("uposts-object"),
				has_settings: 1,

				post_type: 'post',
				taxonomy: '',
				term: '',
				limit: 10,
				content_type: 'full',
				featured_image: true
			});
		}
	});

	/**
	 * View instance - what the element looks like.
	 * @type {Upfront.Views.ObjectView}
	 */
	var UpostsView = Upfront.Views.ObjectView.extend({
		post: false,
		currentPost: false,
		titleSelector: Upfront.data.posts_element && Upfront.data.posts_element.title_selector ? Upfront.data.posts_element.title_selector : 'h1.post_title',
		contentSelector: Upfront.data.posts_element && Upfront.data.posts_element.content_selector ? Upfront.data.posts_element.content_selector : '.post_content',
		/**
		 * Element contents markup.
		 * @return {string} Markup to be shown.
		 */
		get_content_markup: function () {
			var element_id = this.model.get_property_value_by_name("element_id"),
				data = $(document).data("content-" + element_id)
			;
			return data || 'Hold on please';
		},

		on_render: function () {
			var 
				element_id = this.model.get_property_value_by_name("element_id"),
				raw_settings = $(document).data('settings-' + element_id),
				settings = raw_settings || [],
				post_type = this.model.get_property_value_by_name("post_type"),
				taxonomy = this.model.get_property_value_by_name("taxonomy"),
				term = this.model.get_property_value_by_name("term"),
				limit = this.model.get_property_value_by_name("limit"),
				content_type = this.model.get_property_value_by_name("content_type"),
				featured_image = this.model.get_property_value_by_name("featured_image"),
				data = !!$(document).data("content-" + element_id),
				is_shadow = !!this.parent_module_view.model.get("shadow")
			;
			if (is_shadow && data) return false;
			if (settings.length) {
				settings = _.object(
					_(settings).pluck("name"),
					_(settings).pluck("value")
				);
			} else settings = {};
			if (
				settings.post_type != post_type
				||
				settings.taxonomy != taxonomy
				||
				settings.term != term
				||
				settings.limit != limit
				||
				settings.content_type != content_type
				||
				settings.featured_image != featured_image
				|| !data
			) {
				var request_data = {
					"post_type": post_type,
					"taxonomy": taxonomy,
					"term": term,
					"limit": limit,
					"content_type": content_type,
					"featured_image": featured_image,
					"element_id": element_id,
				};
				if (window._upfront_get_current_query) request_data.query = _upfront_get_current_query();
				else request_data.query = {};
				Upfront.Util.post({
					"action": "uposts_get_markup",
					"data": JSON.stringify(request_data)
				}).success(function (response) {
					$("#" + element_id)
						.find(".upfront-object-content")
						.html(response.data)
					;
					$(document).data("content-" + element_id, response.data);
				});
			}
			$(document).data('settings-' + element_id, this.model.get("properties").toJSON());
		},

		on_edit: function (e) {
			var me = this,
				$post = $(e.target).parents(".uposts-post"),
				post_id = $post.attr("data-post_id")
			;
			// Hacky way of closing other instances
			if ($("#upfront-post-cancel_edit").length) {
				$("#upfront-post-cancel_edit").trigger("click");
			}

			this.post = Upfront.data.posts ? Upfront.data.posts[post_id] : false;
			if(!this.post){
				this.post = new Upfront.Models.Post({ID: post_id});
				this.post.fetch().done(function(response){
					if(!Upfront.data.posts)
						Upfront.data.posts = {};
					Upfront.data.posts[post_id] = me.post;
					Upfront.data.currentPost = me.post;
					Upfront.Events.trigger("data:current_post:change");
					me.editPost(me.post);
				});
			}
			else{
				this.editPost(this.post);
				Upfront.data.currentPost = me.post;
				Upfront.Events.trigger("data:current_post:change");
			}
		},
		stop_editor: function () {
			this.updatePost();
			this.on_cancel();
			Upfront.Application.ContentEditor.stop();
		},
		on_cancel: function () {
			_upfront_post_data.post_id = _upfront_post_data._old_post_id;
			if(_upfront_post_data.post_id && Upfront.data.posts[_upfront_post_data.post_id]){
				Upfront.data.currentPost = Upfront.data.posts[_upfront_post_data.post_id];
				Upfront.Events.trigger("data:current_post:change");				
			}
			if (CKEDITOR.instances['upfront-body']) CKEDITOR.instances['upfront-body'].destroy(); // Clean up the editor.
			// Re-enable the draggable on edit stop
			this.parent_module_view.$el.find('.upfront-editable_entity:first').draggable('enable');
			this.undelegateEvents();
			this.deactivate();
			this.delegateEvents();
			this.render();
		},
		editPost: function(post){
			var me = this,
				$post = this.$('.uposts-posts-' + post.id),
				$title = $post.find(this.titleSelector),
				$body = $post.find(this.contentSelector),
				is_excerpt = 'excerpt' == this.model.get_property_value_by_name("content_type")
			;

			_upfront_post_data._old_post_id = _upfront_post_data.post_id;
			_upfront_post_data.post_id = post.id;

			if(Upfront.data.currentPost != post){
				Upfront.data.currentPost = post;
				Upfront.Events.trigger("data:current_post:change");
			}

			$title.html('<input type="text" id="upfront-title" style="width:100%" value="' + post.get('post_title') + '"/>');
			$body.html(
				'<input type="hidden" name="post_id" id="upfront-post_id" value="' + post.id + '" />' +
				'<div contenteditable="true" id="upfront-body" rows="8" style="width:100%">' + (is_excerpt ? post.get('post_excerpt') : post.get('post_content')) + '</div>' +
				'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
			);

			// Prevent default events, we're in editor mode.
			this.undelegateEvents();
			// Kill the draggable, so we can work with regular inline editor.
			this.parent_module_view.$el.find('.upfront-editable_entity:first').draggable('disable');

			CKEDITOR.inline('upfront-body', {
				floatSpaceDockedOffsetY: 62 + $title.height()
			});
			$body
				.find("#upfront-body").focus().end()
				.find("#upfront-post-cancel_edit").click(function () {
					me.stop_editor();
				})
			;
			Upfront.Application.ContentEditor.run();
			Upfront.Events.on("entity:deactivated", this.stop_editor, this);
		},
		updatePost: function() {
			var $title = this.$(this.titleSelector).find(":text"),
				$content =  this.$(this.contentSelector).find("#upfront-body"),
				is_excerpt = 'excerpt' == this.model.get_property_value_by_name("content_type"),
				element_id = this.model.get_property_value_by_name("element_id")
			;
			if($title.length)
				this.post.set('post_title', $title.val());
			if($content.length) {
				this.post.set(
					(is_excerpt ? 'post_excerpt' : 'post_content'), $content.html()
				);
			}
			$(document).data("content-" + element_id, false);
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
						{"name": "class", "value": "c6 upfront-posts_module"},
						{"name": "has_settings", "value": 0}
					],
					"objects": [
						object // The anonymous module will contain our search object model
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
				new UpostsPostSetting_FeaturedImage({model: this.model})
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
			this.panels = _([
				new UpostsQuerySettingsPanel({model: this.model}),
				new UpostsPostSettingsPanel({model: this.model})
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



})(jQuery);