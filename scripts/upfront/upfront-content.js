;(function ($, undefined) {

var deps = [
	"text!upfront/templates/content.html",
	'upfront/post-editor/upfront-post-content',
	'upfront/post-editor/upfront-post-layout'
];

define("content", deps, function(postTpl, ContentTools) {
	var PostEditor = Backbone.View.extend({
		tpl: Upfront.Util.template(postTpl),
		events: {
			'dblclick .upfront-content-marker': 'editContents',
			'click a': 'preventLinkNavigation'
		},
		initialize: function(options){
			var me = this;
			this.postId = options.post_id;
			this.setElement(options.node);
			this.autostart = options.autostart || false;

			this.changed = {};

			//If the post is in the cache, prepare it!
			if(Upfront.data.posts[this.postId]){
				this.post = Upfront.data.posts[this.postId];
				if(!this.post.meta.length)
					this.post.meta.fetch();

				this.loadingPost = new $.Deferred();
				this.loadingPost.resolve(this.post);
			}

			this.postView = options.view;

			this.getPostLayout();

			this.fetchParts();
		},

		fetchParts: function(parts){
			if(this.loadinParts)
				return this.loadingParts;

			var me = this,
				request = {
					action: 'content_part_markup',
					post_id: this.postId,
					options: this.postView.property('partOptions'),
					templates: this.postView.property('templates')
				}
			;

			if(parts)
				request.parts = JSON.stringify(parts);

			this.loadingParts =  Upfront.Util.post(request).done(function(response){
					me.parts = response.data;
					me.replacements = response.data.replacements;
					console.log(response);
				})
			;

			return this.loadingParts;
		},

		setDefaults: function(){
			this.mode = 'content'; // Also 'layout' to edit post layout.
		},

		getPost: function(){
			if(this.post || this.loadingPost) {
				return this.loadingPost.promise();
			}

			var post = Upfront.data.posts[this.postId];
			if(post){
				this.post = post;
				this.loadingPost = $.Deferred();
				this.loadingPost.resolve(post);
				return this.loadingPost.promise();
			}

			return this.fetchPost();
		},


		getPostLayout: function(){
			if(this.loadingLayout)
				return this.loadingLayout;
			var me = this,
				deferred = $.Deferred(),
				layoutType = me.postView.property('type') == 'ThisPostModel' ? 'single' : 'archive',
				id = layoutType == 'single' ? this.postId : me.postView.property('element_id').replace('uposts-object-','')
			;
			if(me.postView.postLayout){
				me.layoutData = {
					postLayout: me.postView.postLayout,
					partOptions: me.postView.partOptions || {}
				}
				deferred.resolve(me.layoutData);
				this.loadingLayout = deferred.promise();
				return this.loadingLayout;
			}
			this.getPost().done(function(){
				Upfront.Util.post({
					action: 'upfront_get_postlayout',
					type: layoutType,
					id: id,
					post_type: me.post.get('post_type')
				}).done(function(response){
					me.layoutData = response.data;
					if(!me.layoutData.partOptions)
						me.layoutData.partOptions = {};
					me.postView.postLayout = me.layoutData.postLayout;
					me.postView.partOptions = me.layoutData.partOptions;
					deferred.resolve(me.layoutData);
				});
			})
			this.loadingLayout = deferred.promise();
			return this.loadingLayout;
		},

		render: function(){
			var me = this,
				markupper = ContentTools.getMarkupper()
			;
			if(!this.parts){
				this.$el.html('Loading');
				return this.loadingParts.done(function(){
					me.render();
				});
			}

			if(!this.layoutData){
				this.$el.html('Loading');
				return this.loadingLayout.done(function(){
					me.render();
				})
			}
			else // When rerender from saving the layout
				this.layoutData = {
					postLayout: this.postView.postLayout,
					partOptions: this.postView.partOptions
				}

			var wrappers = this.layoutData.postLayout,
				options = this.layoutData.partOptions || {},
				layout = {
					wrappers: wrappers,
					wrappersLength: wrappers.length,
					extraClasses: {},
					attributes: {}
				}
			;

			_.each(wrappers, function(wrapper){
				wrapper.objectsLength = wrapper.objects.length;
				_.each(wrapper.objects, function(object){
					var attributes = options && options[object.slug] && options[object.slug].attributes ? options[object.slug].attributes : {},
						attrs = ''
					;
					_.each(attributes, function(value, key){
						attrs += key +'="' + value + '" ';
					})

					layout.attributes[object.slug] = attrs;
					layout.extraClasses[object.slug] = options && options[object.slug] && options[object.slug].extraClasses ? options[object.slug].extraClasses : '';
					object.markup = markupper.markup(object.slug, me.replacements, me.getTemplate(object.slug));
				});
			});

			this.$el.html(this.tpl(layout));
			this.trigger('rendered');
		},

		getTemplate: function(part){
			var templates = this.postView.property('templates');
			if(templates && templates[part])
				return templates[part];

			return Upfront.data.thisPost.templates[part];
		},

		fetchPost: function(){
			var me = this;
			this.post = new Upfront.Models.Post({ID: this.postId});

			//this.bindPostEvents();

			this.loadingPost = new $.Deferred();
			this.post.fetch({withMeta: true, filterContent: true}).done(function(response){
				if(!Upfront.data.posts)
					Upfront.data.posts = {};
				Upfront.data.posts[me.postId] = me.post;
				me.loadingPost.resolve(me.post);
			});


			return this.loadingPost.promise();
		},

		editContents: function(e, focusElement){
			if(this.contentEditor)
				return;

			var target = e ? $(e.currentTarget) : focusElement;
			this.contentEditor = new ContentTools.PostContentEditor({
				post: this.post,
				el: this.el,
				triggeredBy: target,
				authorTpl: this.getTemplate('author'),
				partOptions: this.postView.partOptions,
				rawContent: this.parts.replacements['%raw_content%'],
				rawExcerpt: this.parts.replacements['%raw_excerpt%']
			});

			this.$el.closest('.upfront-wrapper').addClass('upfront-postcontent-editor');
			Upfront.Events.trigger('post:content:edit:start', this.contentEditor);

			this.listenTo(this.contentEditor, 'cancel', this.cancelChanges);
			this.listenTo(this.contentEditor, 'publish', this.publish);
			this.listenTo(this.contentEditor, 'draft', this.saveDraft);
			this.listenTo(this.contentEditor, 'trash', this.trash);
		},

		stopEditContents: function(){
			this.stopListening(this.contentEditor);
			this.contentEditor.stop();
			this.contentEditor = false;
			this.$el.closest('.upfront-wrapper').removeClass('upfront-postcontent-editor');
			Upfront.Events.trigger('post:content:edit:stop', this.contentEditor);
		},

		cancelChanges: function(){
			this.stopEditContents();
			this.render();
		},

		publish: function(results){
			this.save(results, 'publish', 'Publishing ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' published');
		},
		saveDraft:function(results){
			this.save(results, 'draft', 'Saving ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' saved as a draft');
		},

		trash: function(){
			var me = this,
				postType = this.post.get('post_type'),
				loading = new Upfront.Views.Editor.Loading({
					loading: 'Deleting ' + postType + ' ...',
					done: "Here we are!",
					fixed: false
				})
			;
			loading.render();
			this.$el.append(loading.$el);
			this.post.set('post_status', 'trash').save().done(function(){
				loading.$el.remove();
				Upfront.Views.Editor.notify('The ' + postType + ' has been deleted.');
				if(me.options.onUpdated)
					me.options.onUpdated(me.post.toJSON());
			});
		},

		save: function(results, status, loadingMsg, successMsg){
			var me = this,
				changed = this.changed,
				updateMeta = true,
				metaUpdated = !updateMeta,
				loading = new Upfront.Views.Editor.Loading({
					loading: loadingMsg,
					done: "Here we are!",
					fixed: false
				}),
				postUpdated = false
			;

			loading.render();
			this.$el.append(loading.$el);
			this.contentEditor.bar.$el.hide()

			if(results.title)
				this.post.set('post_title', results.title);
			if(results.content)
				this.post.set('post_content', results.content);
			if(results.author)
				this.post.set('post_author', results.author);

			if(results.inserts)
				this.post.meta.setValue('_inserts_data', results.inserts);

			this.post.set('post_status', status);
			this.post.save().done(function(data){
				if(metaUpdated){
					loading.done();
					Upfront.Views.Editor.notify(successMsg);
					me.fetchParts().then(function(){
						me.stopEditContents();
						me.render();
					});
				}

				postUpdated = true;
			});

			if(updateMeta){
				me.post.meta.save().done(function(){
					if(postUpdated){
						loading.done();
						Upfront.Views.Editor.notify(successMsg);
						me.fetchParts().then(function(){
							me.stopEditContents();
							me.render();
						});
					}
					metaUpdated = true;
				});
			}
		},

		capitalize: function(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
		},

		preventLinkNavigation: function(e){
			e.preventDefault();
		}
	});

	// Publish the post editor to the Upfront.Content object
	Upfront.Content.PostEditor = PostEditor;
});

})(jQuery);
