;(function ($, undefined) {

var deps = [
	"text!upfront/templates/content.html",
	'upfront/post-editor/upfront-post-content',
	'upfront/post-editor/upfront-post-layout'
];

define("content", deps, function(postTpl, ContentTools) {

	var PostEditor = function (opts) {
		var me = this;
		this.postId = opts.post_id;
		this.autostart = opts.autostart || false;
		this.content_mode = opts.content_mode;
		this.changed = {};

		_.extend(this, Backbone.Events);

		//If the post is in the cache, prepare it!
		if(Upfront.data.posts[this.postId]){
			this.post = Upfront.data.posts[this.postId];
			if(!this.post.meta.length)
				this.post.meta.fetch();

			this.loadingPost = new $.Deferred();
			this.loadingPost.resolve(this.post);
		}

		//this.postView = opts.view;
		this.contentEditor = false;
		this.getPost().done(function(){
			me.contentEditor = new ContentTools.PostContentEditor({
				post: me.post,
				//postView: me.postView,
				content_mode: me.content_mode,
				/*authorTpl: this.getTemplate('author'),
				partOptions: this.postView.partOptions,*/
			});

			me.trigger('loaded', me.contentEditor);
			
			me.listenTo(me.contentEditor, 'cancel', me.cancelChanges);
			me.listenTo(me.contentEditor, 'publish', me.publish);
			me.listenTo(me.contentEditor, 'draft', me.saveDraft);
			me.listenTo(me.contentEditor, 'auto-draft', me.saveAutoDraft);
			me.listenTo(me.contentEditor, 'trash', me.trash);
			// Listen to edit start/stop
			me.listenTo(me.contentEditor, 'edit:start', me.editStart);
			me.listenTo(me.contentEditor, 'edit:stop', me.editStop);
			// Specific change event handles
			me.listenTo(me.contentEditor, 'change:title', me.changeTitle);
			me.listenTo(me.contentEditor, 'change:content', me.changeContent);
			me.listenTo(me.contentEditor, 'change:author', me.changeAuthor);
			me.listenTo(me.contentEditor, 'change:date', me.changeDate);
			me.listenTo(me.contentEditor, 'bar:date:updated', me.changeDate);
		});

		//this.getPostLayout();
	};

	PostEditor.prototype = {
		_partViews: [],

		addPartView: function (type, el, model, parentModel) {
			var deferred = new $.Deferred();
			this._partViews.push({
				type: type,
				el: el,
				model: model,
				parentModel: parentModel,
				deferred: deferred
			});
			this.setPartViews();
			return deferred.promise();
		},

		setPartViews: function () {
			if ( !this.contentEditor )
				return;
			var partView = this._partViews.pop();
			if ( !partView )
				return;
			var view = this.contentEditor.setView(partView.type, partView.el, partView.model, partView.parentModel);
			partView.deferred.resolve(view);
		},

		setDefaults: function(){
			this.mode = 'content'; // Also 'layout' to edit post layout.
		},

		getPost: function(){
			var deferred = $.Deferred();
			if(this.post){
				deferred.resolve(this.post);
				this.loadingPost = deferred.promise();
			}
			if(this.loadingPost) {
				return this.loadingPost;
			}

			var post = Upfront.data.posts[this.postId];
			if(post){
				this.post = post;
				deferred.resolve(post);
				this.loadingPost = deferred.promise();
				return this.loadingPost;
			}

			return this.fetchPost();
		},

		fetchPost: function(){
			var me = this,
				deferred = $.Deferred()
			;
			this.post = new Upfront.Models.Post({ID: this.postId});

			//this.bindPostEvents();
			me.loadingPost = deferred.promise();
			this.post.fetch({withMeta: true, filterContent: true}).done(function(response){
				if(!Upfront.data.posts)
					Upfront.data.posts = {};
				Upfront.data.posts[me.postId] = me.post;
				deferred.resolve(me.post);
			});


			return this.loadingPost;
		},

		stopEditContents: function(){
			this.contentEditor.stopEditors();
			this.trigger('stop');
		},

		cancelChanges: function(){
			this.stopEditContents();
			this.trigger('post:cancel');
		},

		publish: function(results){
			this.save(results, 'publish', Upfront.Settings.l10n.global.content.publishing.replace(/%s/, this.post.get('post_type')), Upfront.Settings.l10n.global.content.published.replace(/%s/, this.capitalize(this.post.get('post_type'))));
		},

		saveDraft:function(results){
			this.save(results, 'draft', Upfront.Settings.l10n.global.content.saving.replace(/%s/, this.post.get('post_type')), Upfront.Settings.l10n.global.content.drafted.replace(/%s/, this.capitalize(this.post.get('post_type'))));
		},

		saveAutoDraft:function(results){
			this.save(results, 'auto-draft');
		},

		trash: function(){
			var me = this,
				postType = this.post.get('post_type'),
				$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				loading = new Upfront.Views.Editor.Loading({
					loading: Upfront.Settings.l10n.global.content.deleting.replace(/%s/, postType),
					done: Upfront.Settings.l10n.global.content.here_we_are,
					fixed: false
				})
			;
			loading.render();
			$main.append(loading.$el);
			this.post.set('post_status', 'trash').save().done(function(){
				loading.$el.remove();
				Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.content.deleted.replace(/%s/, postType));
				me.stopEditContents();
				me.trigger('post:trash');

				// navigate to home
				Upfront.Application.sidebar.toggleSidebar();
				if(_upfront_post_data) _upfront_post_data.post_id = false;
				Upfront.Application.navigate( "/" , true);
			});
		},

		save: function(results, status, loadingMsg, successMsg){
			var me = this,
				changed = this.changed,
				updateMeta = true,
				metaUpdated = !updateMeta,
				is_auto_draft = status === "auto-draft",
				post_name = this.post.get("post_name"),
				$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
				loading = new Upfront.Views.Editor.Loading({
					loading: loadingMsg,
					done: Upfront.Settings.l10n.global.content.here_we_are,
					fixed: true
				}),
				postUpdated = false
			;

			if ( !is_auto_draft ) {
				loading.render();
				$main.append(loading.$el);
			} else {
				status = "draft";
			}



			if ( results.title ) {
				this.post.set('post_title', results.title);
			}
			if ( results.excerpt ) {
				this.post.set('post_excerpt', results.content);
			}
			if ( results.content ) {
				this.post.set('post_content', results.content);
			}
			if ( results.author ) {
				this.post.set('post_author', results.author);
			}

			if ( results.inserts ) {
				this.post.meta.setValue('_inserts_data', results.inserts);
			}

			if ( results.date ) {
				this.post.set('post_date', results.date);
			}

			if ( results.visibility ) {
				this.post.setVisibility(results.visibility);
				if ( results.pass ) {
					this.post.set('post_password', results.pass);
				}
			}

			this.post.set('post_status', status);

			/* If this is a new post, take out the default post_name so that the system assigns a new one based on the edited title */
			if($('body').hasClass('is_new'))
				this.post.set('post_name', '');

			this.post.save().done(function(result){
				if ( me.post.is_new && post_name.length ) {
					me.post.set("post_name", post_name).save();
				}
				me.post.set("post_name", result.data.post_name);
				me.post.permalink = result.data.permalink;
				if ( metaUpdated ) {
					if( !is_auto_draft ) {
						loading.done();
						Upfront.Views.Editor.notify(successMsg);
						me.stopEditContents();
						me.trigger('post:saved');
					}
				}
				postUpdated = true;
			});

			if ( updateMeta ) {
				me.post.meta.save().done(function(){
					if ( postUpdated ) {
						if( !is_auto_draft ) {
							loading.done();
							Upfront.Views.Editor.notify(successMsg);
							me.stopEditContents();
							me.trigger('post:saved');
						}
					}
					metaUpdated = true;
				});
			}
			else {
				metaUpdated = true;
			}

			this.post.is_new = false;
		},

		capitalize: function(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
		},

		preventLinkNavigation: function(e){
			e.preventDefault();
		},

		editStart: function () {
			this.trigger('editor:edit:start');
		},

		editStop: function () {
			this.trigger('editor:edit:stop');
		},

		changeTitle: function (title) {
			this.trigger('editor:change:title', title);
		},

		changeContent: function (content, isExcerpt) {
			this.trigger('editor:change:content', content, isExcerpt);
		},

		changeAuthor: function (authorId) {
			this.trigger('editor:change:author', authorId);
		},

		changeDate: function (date) {
			this.trigger('editor:change:date', date);
		}
	};

	_.extend(PostEditor.prototype, Backbone.Events.prototype);

	var PostEditorLegacy = Backbone.View.extend(_.extend({}, PostEditor.prototype, {
		tpl: Upfront.Util.template(postTpl),
		events: {
			'dblclick': 'editContents',
			'click a': 'preventLinkNavigation'
		},
		initialize: function(options){
			var me = this;
			this.postId = options.post_id;
			this.setElement(options.node);
			this.autostart = options.autostart || false;
			this.content_mode = options.content_mode;
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
			this.getPost();

			this.getPostLayout();

		},


		getPostLayout: function(){
			if(this.loadingLayout)
				return this.loadingLayout;

			var me = this,
				deferred = $.Deferred(),
				layoutData
			;

			if(me.postView.postLayout && me.postView.parts[me.postId]){
				layoutData = {
					postLayout: me.postView.postLayout,
					partOptions: me.postView.partOptions || {}
				};

				me.layoutData = true;
				me.parts = me.postView.parts[me.postId];

				deferred.resolve(layoutData);
				this.loadingLayout = deferred.promise();
				return this.loadingLayout;
			}


			this.loadingLayout = this.fetchPostLayout();
			return this.loadingLayout;
		},

		fetchPostLayout: function(){
			var deferred = $.Deferred(),
				me = this,
				layoutType = me.postView.property('type') == 'ThisPostModel' ? 'single' : 'archive',
				id = layoutType == 'single' ? this.postId : me.postView.property('element_id').replace('uposts-object-',''),
				properties = {
					hide_featured_image: me.postView.property('hide_featured_image'),
					full_featured_image: me.postView.property('full_featured_image')
				}
			;

			this.getPost().done(function(){
				Upfront.Util.post({
					action: 'upfront_get_postlayout',
					type: layoutType,
					id: id,
					layout_cascade: Upfront.Application.current_subapplication.get_layout_data().layout,
					post_id: me.postId,
					post_type: me.post.get('post_type'),
					properties: properties
				}).done(function(response){
					var layoutData = response.data;
					if(!layoutData.partOptions)
						layoutData.partOptions = {};

					_.extend(me.postView, layoutData);

					if(!me.postView.parts)
						me.postView.parts = {};

					me.postView.parts[me.postId] = layoutData.partContents;
					me.parts = layoutData.partContents;

					me.layoutData = true;

					deferred.resolve(layoutData);
				}).fail(function(error){
					console.log('error!!');
				});
			});

			return deferred.promise();
		},

		render: function(){
			var me = this,
				markupper = ContentTools.getMarkupper()
			;

			if(!this.layoutData){
				this.$el.html(Upfront.Settings.l10n.global.content.loading);
				return this.loadingLayout.done(function(){
					me.render();
				});
			}

			var wrappers = this.postView.postLayout || {},
				options = this.postView.partOptions || {},
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
					});

					layout.attributes[object.slug] = attrs;
					layout.extraClasses[object.slug] = options && options[object.slug] && options[object.slug].extraClasses ? options[object.slug].extraClasses : '';

					if ( object.slug in me.parts.classes && me.parts.classes[object.slug] && me.parts.classes[object.slug].length )
						layout.extraClasses[object.slug] = me.parts.classes[object.slug].join(' ');

					object.markup = markupper.markup(object.slug, me.parts.replacements, me.getTemplate(object.slug));
				});
			});


			this.$el.html(this.tpl(layout));
			this.setContentPadding();
			this.trigger('rendered');


		},

		getTemplate: function(part){
			var templates = this.postView.partTemplates;

			if(part == 'contents' && this.content_mode == 'post_excerpt')
				part = 'excerpt';
			if(templates && templates[part])
				return templates[part];

			return Upfront.data.thisPost.templates[part];
		},

		editContents: function(e, focusElement) {
			if (Upfront.Application.user_can("EDIT") === false) {
				if (parseInt(this.post.get('post_author'), 10) === Upfront.data.currentUser.id && Upfront.Application.user_can("EDIT_OWN") === true) {
					// Pass through
				} else {
					return;
				}
			}

			var me = this,
				ram = function () {
					arguments.callee.iter = arguments.callee.iter || 0;
					arguments.callee.iter++;
					if (arguments.callee.iter < 30) setTimeout(function () { // Total 3s wait time
						me.editContents(e, focusElement);
					}, 100);
				}
			;

			//If we are already editing, don't do anything
			if(this.contentEditor || Upfront.Application.is_builder())// || Upfront.Application.current_subapplication == Upfront.Application.PostContentEditor)
				return;

			//If we haven't fetched all the data, return too
			if(!this.layoutData || !this.post) {
				// Yeah, so wait a bit and ram this again. It'll give at some point.
				ram();
				return;
			}

			// Make sure that the content is ready for editing, if not, render again and...
			if(this.$el.find('.upfront-content-marker').length < 1) {
				this.render();
				// Yeah, so wait a bit and ram this again. It'll give at some point.
				ram();
				return;
			}

			var target = e ? $(e.currentTarget) : focusElement;


			this.contentEditor = new ContentTools.PostContentEditorLegacy({
				post: this.post,
				postView: this.postView,
				content_mode: this.content_mode,
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
			this.listenTo(this.contentEditor, 'auto-draft', this.saveAutoDraft);
			this.listenTo(this.contentEditor, 'trash', this.trash);

			// So let's focus on title
			this.contentEditor.focus(this.contentEditor.parts.titles, true);
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

		trash: function(){
			var me = this,
				postType = this.post.get('post_type'),
				loading = new Upfront.Views.Editor.Loading({
					loading: Upfront.Settings.l10n.global.content.deleting.replace(/%s/, postType),
					done: Upfront.Settings.l10n.global.content.here_we_are,
					fixed: false
				})
			;
			loading.render();
			this.$el.append(loading.$el);
			this.post.set('post_status', 'trash').save().done(function(){
				loading.$el.remove();
				Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.content.deleted.replace(/%s/, postType));
				me.stopEditContents();

				if(me.postView.property('type') == 'UpostsModel')
					me.postView.refreshMarkup();

				// navigate to home
				Upfront.Application.sidebar.toggleSidebar();
				if(_upfront_post_data) _upfront_post_data.post_id = false;
				Upfront.Application.navigate( "/" , true);
			});
		},

		save: function(results, status, loadingMsg, successMsg){
			var me = this,
				rerender = function(){
					me.fetchPostLayout().then(function(){
						me.render();
					});
				};
			this.once('post:saved', rerender);
			if( results.content && this.postView.property('content_type') == 'excerpt' ) {
				results.excerpt = results.content;
				results.content = false;
			}
			PostEditor.prototype.save.call(this, results, status, loadingMsg, successMsg);
		},

		setContentPadding: function(){
			var colSize = Upfront.Behaviors.GridEditor.col_size,
				options = this.postView.partOptions,
				rightPadding = options.contents ? options.contents.padding_right * colSize : 0,
				leftPadding = options.contents ? options.contents.padding_left * colSize : 0,
				styles = this.postView.$('.upfront-post-padding'),
				rules = '#' + this.postView.property('element_id') + ' .upfront-content-marker-contents>* {'
			;

			if(!styles.length){
				styles = $('<style class="upfront-post-padding"></style>');
				this.postView.$el.append(styles);
			}

			rules += 'padding-left: ' + leftPadding + 'px; padding-right: ' + rightPadding + 'px;}';

			styles.html(rules);
		}
	}));

	// Publish the post editor to the Upfront.Content object, make sure Upfront.Content object exists
	if(!Upfront.Content)
		Upfront.Content = {};
	Upfront.Content.PostEditor = PostEditor;
	Upfront.Content.PostEditorLegacy = PostEditorLegacy;
});

})(jQuery);
