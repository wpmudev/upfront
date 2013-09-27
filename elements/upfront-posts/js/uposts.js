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
		excerptSelector: Upfront.data.posts_element && Upfront.data.posts_element.excerpt_selector ? Upfront.data.posts_element.excerpt_selector : this.contentSelector,
		featuredSelector: Upfront.data.this_post && Upfront.data.this_post.featured_image_selector ? Upfront.data.this_post.featured_image_selector : '.entry-thumbnail',
		
		initialize: function(options){

			this.constructor.__super__.initialize.call(this, [options]);
			this.events = _.extend({}, this.events, {
				'click .upost_thumbnail_changer': 'changeFeaturedImage'
			});
		},

		/**
		 * Element contents markup.
		 * @return {string} Markup to be shown.
		 */
		get_content_markup: function () {
			var element_id = this.model.get_property_value_by_name("element_id"),
				data = $(document).data("content-" + element_id)
			;
			if(data){
				console.log('Post');
				data = this.setFeaturedImageSelector($(data));
				data.find(this.featuredSelector)
					.css({position:'relative', 'min-height': '60px', 'margin-bottom':'30px'})
					.append('<div class="upost_thumbnail_changer">Click to edit the post\'s featured image</div>')
					.find('img').css({'z-index': '2', position: 'relative'})
				;
				data = data.html();
			}

			return data || 'Hold on please';
		},

		on_render: function () {
			var 
				me = this,
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
					$(document).data("content-" + element_id, response.data);
					$("#" + element_id)
						.find(".upfront-object-content")
						.html(me.get_content_markup())
					;
				});
			}
			$(document).data('settings-' + element_id, this.model.get("properties").toJSON());
		},

		on_edit: function (e) {
			var me = this,
				$post = $(e.target).parents(".uposts-post"),
				post_id = $post.attr("data-post_id")
			;
			this.post = Upfront.data.posts ? Upfront.data.posts[post_id] : false;
			if(!this.post){
				this.fetchPost(post_id).done(function(response){
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
		on_cancel: function () {
			var editor = Upfront.Content.editors.get(this._editor_id());
			editor.stop();
		},
		editPost: function () { //post){
			var 
				is_excerpt = 'excerpt' == this.model.get_property_value_by_name("content_type"),
				body_selector = is_excerpt ? this.excerptSelector : this.contentSelector,
				editor = Upfront.Content.editors.add({
					type: Upfront.Content.TYPES.POST,
					editor_id: this._editor_id(),
					view: this,
					post: this.post,
					content_mode: (is_excerpt ? 'post_excerpt' : 'post_content'),
					selectors: {
						title: '.uposts-posts-' + this.post.id + ' ' + this.titleSelector,
						body: '.uposts-posts-' + this.post.id + ' ' + body_selector
					}
				})
			;
			editor.start();
		},
		updatePost: function() {
			var editor = Upfront.Content.editors.get(this._editor_id()),
				title = editor.get_title ? editor.get_title() : false,
				content = editor.get_content ? editor.get_content() : false
			;
			if (editor) {
				this.post.set({is_new: false}, {silent: true});
				if (title) this.post.set('post_title', title);
				if (content) this.post.set(
					(is_excerpt ? 'post_excerpt' : 'post_content'),
					Upfront.Media.Transformations.apply(content)
				);
				editor.stop();
			}
		},

		setFeaturedImageSelector: function($data){
			return $data;
		},

		changeFeaturedImage: function(e){
			var me = this,
				target = $(e.target),
				postId = target.closest('.uposts-post').data('post_id')
				img = target.parent().find('img'),
				loading = new Upfront.Views.Editor.Loading({
					loading: "Starting image editor ...",
					done: "Here we are!",
					fixed: false
				})
			;

			if(!img.length){

				if(!Upfront.data.posts[postId])
					this.fetchPost(postId);

				me.openImageSelector(postId);
			}
			else if(Upfront.data.posts && Upfront.data.posts[postId]){
				loading.render();
				target.parent().append(loading.$el);
				me.getImageInfo(Upfront.data.posts[postId]).done(function(imageInfo){
					loading.done();
					loading.$el.remove();
					me.openImageEditor(false, imageInfo, postId);
				});
			}
			else{
				loading.render();
				target.parent().append(loading.$el);
				this.fetchPost(postId).done(function(response){
					me.getImageInfo(me.post).done(function(imageInfo){
						loading.done();
						loading.$el.remove();
						me.openImageEditor(false, imageInfo, postId);
					});
				});
			}
		},

		openImageSelector: function(postId){
			var me = this;
			Upfront.Views.Editor.ImageSelector.open().done(function(images){
				var sizes = {},
					imageId = 0
				;
				_.each(images, function(image, id){
					sizes = image;
					imageId = id;
				});
				var	imageInfo = {
						src: sizes.medium ? sizes.medium[0] : sizes.full[0],
						srcFull: sizes.full[0],
						srcOriginal: sizes.full[0],
						fullSize: {width: sizes.full[1], height: sizes.full[2]},
						size: sizes.medium ? {width: sizes.medium[1], height: sizes.medium[2]} : {width: sizes.full[1], height: sizes.full[2]},
						position: false,
						rotation: 0,
						id: imageId
					}
				;
				$('<img>').attr('src', imageInfo.srcFull).load(function(){
					Upfront.Views.Editor.ImageSelector.close();
					me.openImageEditor(true, imageInfo, postId);			
				});
			});
		},

		fetchPost: function(postId){
			var me = this;
			this.post = new Upfront.Models.Post({ID: postId});
			return this.post.fetch({withMeta: true}).done(function(response){
				if(!Upfront.data.posts)
					Upfront.data.posts = {};
				Upfront.data.posts[postId] = me.post;
			});
		},

		getImageInfo: function(post){
			var me = this,
				imageData = post.meta.get('_thumbnail_data'),
				imageId = post.meta.get('_thumbnail_id'),
				deferred = $.Deferred(),
				$img = $('.uposts-posts-' + post.id).find(this.featuredSelector).find('img')
			;

			if(!imageData || !_.isObject(imageData.get('meta_value')) || imageData.get('meta_value').imageId != imageId.get('meta_value')){
				if(!imageId)
					return false;
				Upfront.Views.Editor.ImageEditor.getImageData([imageId.get('meta_value')]).done(function(response){
					var images = response.data.images,
						sizes = {},
						imageId = 0
					;
					_.each(images, function(image, id){
						sizes = image;
						imageId = id;
					});

					deferred.resolve({
						src: sizes.medium ? sizes.medium[0] : sizes.full[0],
						srcFull: sizes.full[0],
						srcOriginal: sizes.full[0],
						fullSize: {width: sizes.full[1], height: sizes.full[2]},
						size: {width: $img.width(), height: $img.height()},
						position: {top: 0, left: 0},
						rotation: 0,
						id: imageId
					});
				});
			}
			else {
				var data = imageData.get('meta_value'),
					factor = $img.width() / data.cropSize.width
				;
				deferred.resolve({
					src: data.src,
					srcFull: data.srcFull,
					srcOriginal: data.srcOriginal,
					fullSize: data.fullSize,
					size: {width: data.imageSize.width * factor, height: data.imageSize.height * factor},//data.imageSize,
					position: {top: data.imageOffset.top * factor, left: data.imageOffset.left * factor},//data.imageOffset,
					rotation: data.rotation,
					id: data.imageId
				});
			}
			return deferred.promise();
		},

		openImageEditor: function(newImage, imageInfo, postId){
			var me = this,
				mask = $('.uposts-posts-' + postId).find(this.featuredSelector),
				maskHeight = Upfront.data && Upfront.data.posts_element && Upfront.data.posts_element.featured_image_height ? Upfront.data.posts_element.featured_image_height : 300
				editorOptions = _.extend({}, imageInfo, {
					maskOffset: mask.offset(),
					maskSize: {width: mask.width(), height: maskHeight},
					setImageSize: newImage,
					extraButtons: [
						{
							id: 'image-edit-button-swap',
							text: 'Swap Image',
							callback: function(e, editor){
								editor.cancel();
								me.openImageSelector(postId);
							}
						}
					]
				})
			;
			Upfront.Views.Editor.ImageEditor.open(editorOptions).done(function(imageData){
				var post = me.post,
					img = mask.find('img')
				;

				post.meta.add([
					{meta_key: '_thumbnail_id', meta_value: imageData.imageId},
					{meta_key: '_thumbnail_data', meta_value: imageData}
				], {merge: true});
				post.meta.save();
				if(!img.length)
					img = $('<img style="z-index:2;position:relative">').appendTo(mask);

				img.attr('src', imageData.src);
			})
		},

		_editor_id: function () {
			return this.model.get_property_value_by_name("element_id") + '-' + this.post.id;
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