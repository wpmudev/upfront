;(function ($, undefined) {

	var TYPES = {
		PLAIN: "plain",
		POST: "post",
		META: "meta"
	};

	var IEditor = {
		start: function () {},
		stop: function () {}
	};

	var Editor_SupplementalBar = function (options) {
		var OVERLAY_Z_INDEX = 10;

		var _defaults = {
			editor: false,
			post: false,
			parent: false
		};
		options = _.extend(_defaults, options); 

		var $bar = false,
			sidebar = false
		;

		var start = function () {
			$("body").append("<div id='upfront-editor_bar' />");
			$bar = $("#upfront-editor_bar");
			sidebar = new Upfront.Views.ContentEditor.Sidebar({
				"model": new Backbone.Model([]),
				"el": $bar
			});
			sidebar.render();
			$bar.show();

			// Fade other stuff out
			$(".upfront-module, #sidebar-ui").css({
				"opacity": .3,
				"pointer-events": "none"
			});
			options.parent.css({
				"opacity": 1,
				"pointer-events": "auto"
			});

			// Make the bar snapping work
			$(window).on("scroll", reposition_bar);
			options.editor.on("change", reposition_bar);
		};

		var stop = function () {
			if ($bar && $bar.length) $bar.remove();

			// Fade other stuff in
			$(".upfront-module, #sidebar-ui").css({
				"opacity": 1,
				"pointer-events": "auto"
			});

			// Kill the bar snapping
			$(window).off("scroll", reposition_bar);
			options.editor.removeListener("change", reposition_bar);
		};

		var hide = function () {
			if ($bar && $bar.length) $bar.hide();
		};

		var show = function () {
			if ($bar && $bar.length) $bar.css({
				zIndex: OVERLAY_Z_INDEX,
				top: $(window).height() - 120,
				left: options.parent.offset().left + Upfront.Settings.LayoutEditor.Grid.baseline
			}).show();
			reposition_bar();
		};

		var reposition_bar = function () {
			if (!$bar || !$bar.length) return;

			var parent_pos = options.parent.offset(),
				parent_height = options.parent.height(),
				bottom = parent_pos.top + parent_height,
				min_point = $(window).height() - 120,
				current_scroll = $(window).scrollTop(),
				scroll_pos = current_scroll + min_point,
				position = "fixed",
				anchor_point = min_point
			;
			if (bottom > scroll_pos) {
				//Upfront.Util.log("Over min point: " + JSON.stringify({bt: bottom, cs: current_scroll, sp: scroll_pos}));
			} else {
				anchor_point = bottom;
				position = "absolute";
			}
			$bar.css({
				position: position,
				top: anchor_point
			});
		};

		return {
			start: start,
			stop: stop,
			hide: hide,
			show: show
		};
	};

	var Editor_Post = function (options) {
		var _defaults = {
			editor_id: false,
			view: false,
			type: TYPES.POST,
			post: false,
			selectors: {
				title: false,
				body: false
			},
			content_mode: 'post_content'
		};
		options = _.extend(_defaults, options);

		var view = options.view,
			post = options.post,
			editor = false,
			editor_bar = false
		;
		if (post && Upfront.data.currentPost != post) {
			Upfront.data.currentPost = post;
			Upfront.Events.trigger("data:current_post:change");			
		}

		var setFocus = function(e){
			if(!e) {
				view.$('[contenteditable]').focus();
				editor.focus();
			} else if($(e.target).is(options.selectors.title) || $(e.target).parents(options.selectors.title).length){
				var title = view.$(options.selectors.title).find('input').focus(),
					value = title.val()
				;
				setTimeout(function(){
					title.focus().val(value);
				}, 500);
			} else {
				view.$('[contenteditable]').focus();
				editor.focus();
			}
		};

		var start = function (event) {
			/*
			// Post loading if needed
			if (!view.content) return view.loading.done(function () {
				start();
			});
*/			
			// It's a new post, so hack-override the layout cascade
			if (post.get("is_new")) {
				var type = post.get("post_type") || 'post';
				_upfront_post_data.layout = {
					specificity: "single-" + type + "-" + post.id,
					item: "single-" + type,
					type: "single"
				};
			}
			// Hacky way of closing other instances
			if ($("#upfront-post-cancel_edit").length) {
				$("#upfront-post-cancel_edit").trigger("click");
			}

			// Initialize variables
			var $el = view.$el,
				$body = $el.find(options.selectors.body),
				$title = $el.find(options.selectors.title),
				$parent = view.parent_module_view.$el.find('.upfront-editable_entity:first')
			;

			// Markup conversions
			
			$title.html((post.get("is_new")
				? '<input type="text" id="upfront-title" style="width:100%" value="" placeholder="' + $.trim($title.text()) + '"/>'
				: '<input type="text" id="upfront-title" style="width:100%" value="' + $.trim($title.text()) + '"/>'
			));
			
			$body.html(
				'<input type="hidden" name="post_id" id="upfront-post_id" value="' + post.id + '" />' +
				'<div contenteditable="true" rows="8" style="width:100%">' + post.get(options.content_mode) + '</div>' +
				'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
			);
			// Init editor
			var $editor = $body.find('[contenteditable]');
			
			// Detecting the race condition when editor DOM element is not yet ready.
			if (!$editor.length) {
				return setTimeout(function () {
					start(event);
				}, 100);;
			}

			// If we got this far, we're good to go. Boot up CKE
			editor = CKEDITOR.inline($editor.get(0), {
				floatSpaceDockedOffsetY: 62 + $title.height()
			});
			editor_bar = new Editor_SupplementalBar({
				post: post,
				editor: editor,
				parent: $parent
			});

			// Prevent default events, we're in editor mode.
			view.undelegateEvents();
			// Kill the draggable, so we can work with regular inline editor.
			if ($parent.is(".ui-draggable")) $parent.draggable('disable');

			// Bind misc events
			editor.on("focus", function () {
				editor_bar.show();
			});
			editor.on("blur", function () {
				editor_bar.hide();
			});
			editor.on("instanceReady", function () {
				// Do this on instanceReady event, as doing it before CKE is fully prepped
				// causes the focus manager to mis-fire first couple of blur/focus events.
				setFocus(event);
			});

			$body.find("#upfront-post-cancel_edit").on("click", function () {
				stop();
			});
			//apply_styles($title);

			// We're ready, start editing
			editor_bar.start();
			//Upfront.Events.on("entity:deactivated", view.on_cancel, view);
		};

		var stop = function () {
			if (editor && editor.destroy) editor.destroy();
			editor_bar.stop();
			view.$el.html(view.get_content_markup());
			var $parent = view.parent_module_view.$el.find('.upfront-editable_entity:first');
			view.undelegateEvents();
			view.deactivate();
			// Re-enable the draggable on edit stop
			if ($parent.is(".ui-draggable")) $parent.draggable('enable');
			view.delegateEvents();
			Upfront.Events.off("entity:deactivated", view.on_cancel, view);
			view.render();
		};

		var get_title = function () {
			return view.$el.find(options.selectors.title).find("input").val();
		};

		var get_content = function () {
			return editor.getData();
		};

		var apply_styles = function ($el) {
			var styles = window.getComputedStyle ? window.getComputedStyle($el[0]) : $el[0].currentStyle,
				transform = !window.getComputedStyle
			;
			if (!styles) return false;
			$el.children().css({
				background: 'transparent',
				border: 0,
				'font-weight': styles[camel_case('font-weight', transform)],
				'font-size': styles[camel_case('font-size', transform)],
				'font-family': styles[camel_case('font-family', transform)],
				'text-transform': styles[camel_case('text-transform', transform)],
				'text-decoration': styles[camel_case('text-decoration', transform)],
				'color': styles.color,
				'outline': 0,
				margin:0,
				padding: 0
			});
		};

		var camel_case = function(str, transform) {
			if (!transform) return str;
			return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
		};

		return _.extend(IEditor, {
			start: start,
			stop: stop,
			get_title: get_title,
			get_content: get_content
		});
	};

	var Editor_Plain = function (options) {
		var _defaults = {
			editor_id: false,
			view: false,
			type: TYPES.PLAIN
		};
		options = _.extend(_defaults, options);

		var view = options.view,
			editor = false
		;

		var start = function () {
			view.$el.html('<div contenteditable class="upfront-object">' + view.get_content_markup() + '</div>');
			var $el = view.$el.find('div[contenteditable]'),
				$parent = view.parent_module_view.$el.find('.upfront-editable_entity:first')
			;
			editor = CKEDITOR.inline($el.get(0))
			if ($parent.is(".ui-draggable")) $parent.draggable('disable');
			editor.on('change', function (e) {
				view.model.set_content(e.editor.getData(), {silent: true});
			});
			$el.focus();
			Upfront.Events.on("entity:deactivated", view.on_cancel, view);
			$el.on("dblclick", function (e) {e.stopPropagation();}); // Allow double-click word selecting.
		};

		var stop = function () {
			if (editor && editor.destroy) editor.destroy();
			view.$el.html(view.get_content_markup());
			var $parent = view.parent_module_view.$el.find('.upfront-editable_entity:first');
			view.undelegateEvents();
			view.deactivate();
			// Re-enable the draggable on edit stop
			if ($parent.is(".ui-draggable")) $parent.draggable('enable');
			view.delegateEvents();
			Upfront.Events.off("entity:deactivated", view.on_cancel, view);
			view.render();
		};

		return _.extend(IEditor, {
			start: start,
			stop: stop
		});
	};

	var Editor_Meta = Backbone.View.extend({
		post: false,
		postId: false,
		loadingPost: false,
		isNew: false,
		mode: 'post_excerpt',
		view: false,

		events: {
			'dblclick .ueditor_title': 'editTitle',
			'dblclick .ueditor_content': 'editContent',
			'click .upost_thumbnail_changer': 'editThumb'
		},

		initialize: function(options){
			this.postId = options.post_id;
			this.setElement(options.node);
			this.isNew = !!options.is_new;
			if(typeof options.content_mode != 'undefined')
				this.mode = options.content_mode;
			this.view = options.view;
			this.Bar = new Editor_SupplementalBar();
			this.initEditAreas();

		},

		/**
		 * Update view's element. Useful when updating the markup.
		 */
		updateElement: function(node){
			this.setElement(node);
			this.initEditAreas();
		},

		initEditAreas: function(){
			var me = this,
				selectors = Upfront.data.post_selectors;
			_.each(selectors, function(area, selector){
				if(area == 'content' || area == 'excerpt'){
					me.prepareContentEditor(selector);
				}
				else if(area == 'title'){
					me.prepareTitleEditor(selector);
				}
				else if(area == 'thumbnail'){
					me.prepareThumbEditor(selector);
				}
			});
		},

		fetchPost: function(){
			var me = this;
			this.post = new Upfront.Models.Post({ID: this.postId});
			this.loadingPost = new $.Deferred();
			this.post.fetch({withMeta: true}).done(function(response){
				if(!Upfront.data.posts)
					Upfront.data.posts = {};
				Upfront.data.posts[me.postId] = me.post;
				me.loadingPost.resolve(me.post);
			});
			return this.loadingPost.promise();
		},

		getPost: function(){
			if(this.post || this.loadingPost)
				return this.loadingPost.promise();

			return this.fetchPost();
		},

		prepareContentEditor: function(selector){
			this.$(selector).addClass('ueditor_content');
			console.log('Content editor prepared.');
		},

		prepareTitleEditor: function(selector){
			this.$(selector).addClass('ueditor_title');
		},

		prepareThumbEditor: function(selector){
			this.$(selector)
				.addClass('ueditor_thumb')
				.css({position:'relative', 'min-height': '60px', 'margin-bottom':'30px'})
				.append('<div class="upost_thumbnail_changer">Click to edit the post\'s featured image</div>')
				.find('img').css({'z-index': '2', position: 'relative'})
			;
		},

		editTitle: function(e){
			e.preventDefault();
			e.stopPropagation();

			if(this.$('.ueditor_title input').length)
				return;

			var apply_styles = function($el){
					var styles = window.getComputedStyle ? window.getComputedStyle($el[0]) : $el[0].currentStyle,
						transform = !window.getComputedStyle
					;
					if (!styles) return false;
					$el.children().css({
						background: 'transparent',
						border: 0,
						'font-weight': styles[camel_case('font-weight', transform)],
						'font-size': styles[camel_case('font-size', transform)],
						'font-family': styles[camel_case('font-family', transform)],
						'text-transform': styles[camel_case('text-transform', transform)],
						'text-decoration': styles[camel_case('text-decoration', transform)],
						'color': styles.color,
						'outline': 0,
						margin:0,
						padding: 0
					});
				},
				camel_case = function(str, transform) {
					if (!transform) return str;
					return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
				},
				$title = this.$('.ueditor_title'),
				title = $.trim($title.text())
			;

			//Let's retrieve the post
			this.getPost();

			$title.html(this.isNew
				? '<input type="text" id="upfront-title" style="width:100%" value="" placeholder="' + title + '"/>'
				: '<input type="text" id="upfront-title" style="width:100%" value="' + title + '"/>'
			);
			apply_styles($title);
			$title.find('input').focus().val(title);
		},

		editThumb: function(e){
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
					loading.$el.remove();
					me.openImageEditor(false, imageInfo, postId);
				});
			}
			else{
				loading.render();
				target.parent().append(loading.$el);
				this.fetchPost(postId).done(function(response){
					me.getImageInfo(me.post).done(function(imageInfo){
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

		getImageInfo: function(post){
			var me = this,
				imageData = post.meta.get('_thumbnail_data'),
				imageId = post.meta.get('_thumbnail_id'),
				deferred = $.Deferred(),
				$img = $('.uposts-posts-' + post.id).find('.ueditor_thumb').find('img')
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
				mask = $('.uposts-posts-' + postId).find('.ueditor_thumb'),
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

		editContent: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_content', 'post_content');
		},
		editExcerpt: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_excerpt', 'post_excerpt');
		},
		editPost: function(selector, mode){
			var me = this;
			$body = this.$(selector);
			$body.css('opacity', '.6');

			this.getPost().done(function(post){
				$body.css('opacity', '1');
				$body.html(
					'<input type="hidden" name="post_id" id="upfront-post_id" value="' + me.postId + '" />' +
					'<div contenteditable="true" rows="8" style="width:100%">' + post.get(me.mode) + '</div>' //+
					//'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
				);

				// Init editor
				var $editor = $body.find('[contenteditable]');
				// Boot up CKE
				editor = CKEDITOR.inline($editor.get(0), {
					floatSpaceDockedOffsetY: 0
				});
				// Prevent default events, we're in editor mode.
				me.view.undelegateEvents();

				// Kill the draggable, so we can work with regular inline editor.
				var $parent = me.view.parent_module_view.$el.find('.upfront-editable_entity:first')
				if ($parent.is(".ui-draggable"))
					$parent.draggable('disable');


				editor.on("instanceReady", function () {
					// Do this on instanceReady event, as doing it before CKE is fully prepped
					// causes the focus manager to mis-fire first couple of blur/focus events.
					$editor.focus();
					editor.focus();
				});

				$body.find("#upfront-post-cancel_edit").on("click", function () {
					me.stopEditPost();
				});
			});
		},

		stopEditPost: function(){
			if (editor && editor.destroy) editor.destroy();
			//editor_bar.stop();
			this.view.$el.html(view.get_content_markup());
			var $parent = view.parent_module_view.$el.find('.upfront-editable_entity:first');
			view.undelegateEvents();
			view.deactivate();
			// Re-enable the draggable on edit stop
			if ($parent.is(".ui-draggable")) $parent.draggable('enable');
			view.delegateEvents();
			Upfront.Events.off("entity:deactivated", view.on_cancel, view);
			//view.render();
		},

		openBar: function (){
			$("body").append("<div id='upfront-editor_bar' />");
			$bar = $("#upfront-editor_bar");
			sidebar = new Upfront.Views.ContentEditor.Sidebar({
				"model": new Backbone.Model([]),
				"el": $bar
			});
			sidebar.render();
			$bar.show();

			// Fade other stuff out
			$(".upfront-module, #sidebar-ui").css({
				"opacity": .3,
				"pointer-events": "none"
			});
			options.parent.css({
				"opacity": 1,
				"pointer-events": "auto"
			});

			// Make the bar snapping work
			$(window).on("scroll", reposition_bar);
			options.editor.on("change", reposition_bar);			
		}
	});

	var ContentEditors = function () {
		var _editors = {};

		var add = function (options) {
			var editor = /*_editors[options.editor_id] ||*/ spawn_content_editor(options);
			if (!editor) return false;
			_editors[options.editor_id] = editor;
			return editor;
		};

		var get = function (editor_id) {
			return (_editors[editor_id] || false);
		};

		var spawn_content_editor = function (options) {
			var type = options.type || TYPES.PLAIN,
				old = get(options.editor_id)
			;
			if (old) old.stop();
			if (type == TYPES.PLAIN) return new Editor_Plain(options);
			if (type == TYPES.POST) return new Editor_Post(options);
			if (type == TYPES.META) return new Editor_Meta(options);
			return false;
		}

		return {
			add: add,
			get: get,
			_list: function () {
				return _editors;
			}
		};
	};

	Upfront.Content = {
		TYPES: TYPES,
		editors: new ContentEditors()
	};


})(jQuery);