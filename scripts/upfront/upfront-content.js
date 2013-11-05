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
				"opacity": 0.3,
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
		bar: false,
		backup: false,
		changed: {
			title: false,
			thumb: false,
			content: false
		},

		events: {
			'dblclick .ueditor_title': 'editTitle',
			'keydown .ueditor_title': 'goToEditor',
			'dblclick .ueditor_content': 'editContent',
			'click .upost_thumbnail_changer': 'editThumb',
			'click .ueditor_restore': 'restore'
		},

		/**
		 * Options to create a meta editor are:
		 * 		post_id: to fetch and update the post
		 *   	preload: when to fetch the post in the initialization of the editor or wait until trying to edit
		 * 		node: the HTML node to be this.$el
		 * 		view: the object view to prevent editable areas to be draggable
		 * 		content_mode: post_excerpt || post_content
		 * @param  {[type]} options [description]
		 * @return {[type]}         [description]
		 */
		initialize: function(options){
			this.postId = options.post_id;
			this.setElement(options.node);

			//If the post is in the cache, prepare it!
			if(Upfront.data.posts[this.postId]){
				this.post = Upfront.data.posts[this.postId];
				this.loadingPost = new $.Deferred();
				this.loadingPost.resolve(this.post);
				this.bindPostEvents();
			}

			if(options.preload)
				this.getPost();

			if(typeof options.content_mode != 'undefined')
				this.mode = options.content_mode;

			this.view = options.view;
			this.initEditAreas();

			this.backup = this.$el.html();
		},

		bindPostEvents: function(){
			this.post.on('editor:cancel', this.cancelChanges, this);
			this.post.on('editor:publish', this.publish, this);
			this.post.on('editor:draft', this.saveDraft, this);
			this.post.on('editor:trash', this.trash, this);
		},

		/**
		 * Update view's element. Useful when updating the markup.
		 */
		updateElement: function(node){
			this.setElement(node);
			this.initEditAreas();

			if (this.cke && this.cke.destroy){
				this.cke.destroy();
				this.cke = false;
			}

			if(this.bar){
				this.bar = false;
			}

			this.backup = this.$el.html();
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

			//Prevent dragging from editable areas
			var draggable = this.$el.closest('.ui-draggable'),
				cancel = draggable.draggable('option', 'cancel')
			;
			if(cancel && cancel.indexOf('.ueditable') == -1){
				draggable.draggable('option', 'cancel', cancel + ',.ueditable');
				console.log('Editable areas no draggable anymore.');
			}
		},

		fetchPost: function(){
			var me = this;
			this.post = new Upfront.Models.Post({ID: this.postId});

			this.bindPostEvents();

			this.loadingPost = new $.Deferred();
			this.post.fetch({withMeta: true, filterContent: true}).done(function(response){
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
			this.$(selector).addClass('ueditor_content ueditable');
			console.log('Content editor prepared.');
		},

		prepareTitleEditor: function(selector){
			this.$(selector).addClass('ueditor_title ueditable');
		},

		prepareThumbEditor: function(selector){
			this.$(selector)
				.addClass('ueditor_thumb ueditable')
				.css({position:'relative', 'min-height': '60px', 'margin-bottom':'30px'})
				.append('<div class="upost_thumbnail_changer">Click to edit the post\'s featured image</div>')
				.find('img').css({'z-index': '2', position: 'relative'})
			;
		},

		prepareBar: function(){
			if(this.bar){
				this.bar.calculateLimits();
				return;
			}

			this.bar = new EditionBar({post: this.post});
			this.bar.render();
			this.$el.append(this.bar.$el);
			this.bar.stick();

			return;
		},

		editTitle: function(e){
			if(e){
				e.preventDefault();
				e.stopPropagation();
			}

			if(this.$('.ueditor_title input').length)
				return;

			//Mark title as edited
			this.changed.title = true;

			var me = this,
				apply_styles = function($el){
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
						'text-align': styles[camel_case('text-align', transform)],
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
			this.getPost().done(function(post){
				//We will need the edition bar
				me.prepareBar();

				//Prepare the editor, because when editing the title, 99% we are going to edit the content
				if(!me.cke && me.mode == 'post_content')
					me.editPost('.ueditor_content', 'post_content', false);

			});

			$title.html(this.post && this.post.is_new
				? '<input type="text" id="upfront-title" style="width:100%" value="" placeholder="' + title + '"/>'
				: '<input type="text" id="upfront-title" style="width:100%" value="' + title + '"/>'
			);
			
			apply_styles($title);
			$title.find('input').focus().val(title);
		},

		goToEditor: function(e){
			if(e.which == 9|| e.which == 13){
				e.preventDefault();
				if(this.cke){
					this.cke.focus();
				}
				else {
					this.editPost('.ueditor_content', this.mode, true);
				}
			}
		},

		editThumb: function(e){
			var me = this,
				target = $(e.target),
				postId = this.postId,
				img = target.parent().find('img'),
				loading = new Upfront.Views.Editor.Loading({
					loading: "Starting image editor ...",
					done: "Here we are!",
					fixed: false
				})
			;

			//Fetch the post
			this.getPost().done(function(post){
				//We will need the edition bar
				me.prepareBar();
			});

			if(!img.length){
				me.openImageSelector(postId);
			}
			else{
				loading.render();
				target.parent().append(loading.$el);
				this.getPost().done(function(response){
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
				$img = this.$('.ueditor_thumb').find('img')
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
				mask = this.$('.ueditor_thumb'),
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

				me.post.meta.add([
					{meta_key: '_thumbnail_id', meta_value: imageData.imageId},
					{meta_key: '_thumbnail_data', meta_value: imageData}
				], {merge: true});
				//post.meta.save();
				if(!img.length)
					img = $('<img style="z-index:2;position:relative">').appendTo(mask);

				img.attr('src', imageData.src);

				me.changed.thumb = true;
			});
		},

		editContent: function(e){
			if(this.cke)
				return;
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_content', this.mode, true);
		},
		editExcerpt: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_excerpt', 'post_excerpt', true);
		},
		editPost: function(selector, mode, focus){
			var me = this,
				$body = this.$(selector)
			;
			if(!$body.length)
				return;

			//Where did the user click?
			var selection = window.getSelection ? _.clone(window.getSelection()) : false;

			$body.css('opacity', '.6');

			this.getPost().done(function(post){

				//We will need the edition bar
				me.prepareBar();


				var content = post.get(mode);

				if(!content && mode == 'post_excerpt'){
					if(confirm('This post has no excerpt, and what you could see before editing was the first words of the post content. Do you want to convert that words in the excerpt and edit the excerpt? Otherwise you will edit the post contents.')){
						post.set('post_excerpt', $body.text());
					}
					else {
						mode = 'post_content';
					}
				}
				$body.html(
					'<input type="hidden" name="post_id" id="upfront-post_id" value="' + me.postId + '" />' +
					'<div contenteditable="true" rows="8" style="width:100%">' + post.get(mode) + '</div>' //+
					//'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
				);

				// Init editor
				var $editor = $body.find('[contenteditable]');
				// Boot up CKE
				me.cke = CKEDITOR.inline($editor.get(0), {
					floatSpaceDockedOffsetY: 0
				});

				//Set the current mode
				me.cke.contentType = mode;

				me.cke.on("instanceReady", function () {
					// Do this on instanceReady event, as doing it before CKE is fully prepped
					// causes the focus manager to mis-fire first couple of blur/focus events.
					if(focus){
						$editor.focus();
						me.cke.focus();
						//Position the cursor inside the editor
						if(selection)
							me.positionEditor(selection);
					}
					else{ //This editPost request was made by the editTitle, so return the focus to it
						setTimeout(function(){
							me.$('.ueditor_title input').focus();
						}, 100);
					}
					$body.css('opacity', '1');
					me.changed.content = true;
					//Recalculate limits of the sidebar
					me.prepareBar();
				});

			});
		},
		positionEditor: function(selection){
			var range = this.cke.createRange(),
				domEndNode = selection.focusNode,
				domEndLabel = domEndNode.nodeName,
				editorElement = $(this.cke.element.$)
			;

			while(domEndLabel == '#text'){
				domEndNode = domEndNode.parentNode;
				domEndLabel = domEndNode.nodeName;
			}

			var $node = editorElement.find(domEndLabel + ':contains(' + domEndNode.textContent + ')'),
				node = false
			;

			if($node.length)
				node = $node[0];


			//this doesn't work
			
			if(node){
				node = new CKEDITOR.dom.node(node);
				
				range.setEnd(node, selection.focusOffset);
				range.setStart(node, selection.focusOffset);
				this.cke.getSelection().selectRanges( [ range ] );
				
			}
			
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
		},

		cancelChanges: function(){
			this.fetchPost();
			this.$el.html(this.backup);

			this.bar = false;
			if (this.cke && this.cke.destroy){
				this.cke.destroy();
				this.cke = false;
			}

			this.initEditAreas();
		},

		save: function(status, loadingMsg, successMsg){
			var me = this,
				changed = this.changed,
				updatePost = changed.title || changed.content || this.post.get('post_status') != 'publish',
				updateMeta = changed.thumb,
				postUpdated = !updatePost,
				metaUpdated = !updateMeta,
				loading = new Upfront.Views.Editor.Loading({
					loading: loadingMsg,
					done: "Here we are!",
					fixed: false
				})
			;

			loading.render();
			this.$el.append(loading.$el);

			if(changed.title){
				this.post.set('post_title', this.$('.ueditor_title input').val());
			}
			if(changed.content){
				this.post.set(this.cke.contentType, this.cke.getData());
			}

			if(updatePost){
				this.post.set('post_status', status);
				this.post.save().done(function(r){
					if(metaUpdated){
						loading.$el.remove();
						Upfront.Views.Editor.notify(successMsg);
						if(me.options.onUpdated)
							me.options.onUpdated(me.post.toJSON());						
					}
					postUpdated = true;
				});
			}
			if(updateMeta){
				me.post.meta.save().done(function(){
					if(postUpdated){
						loading.$el.remove();
						Upfront.Views.Editor.notify(successMsg);
						if(me.options.onUpdated)
							me.options.onUpdated(me.post.toJSON());	
					}
					metaUpdated = true;
				});
			}
		},

		publish: function(){
			this.save('publish', 'Publishing ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' published');
		},
		saveDraft:function(){
			this.save('draft', 'Saving ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' saved as a draft');
		},
		capitalize: function(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
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
		restore: function(){
			var me = this;
			if(confirm('Are you sure to restore this ' + this.post.get('post_type') + '?'))
				this.post.set('post_status', 'draft').save().done(function(){
					if(me.options.onUpdated)
						me.options.onUpdated(me.post.toJSON());	
				});
		}
	});

	var EditionBar = Backbone.View.extend({
		className: 'ueditor-bar-wrapper upfront-ui',
		post: false,

		offset: {min:0, max:0},
		position: {min:0, max:0},

		onScrollFunction: false,

		statusOptions: {
			future: {value:'future', name:'Scheduled'},
			publish: {value: 'publish', name: 'Published'},
			pending: {value: 'pending', name: 'Pending Review'},
			draft: {value: 'draft', name: 'Draft'},			
			'private': {value: 'private', name: 'Privately Published'},
			'auto-draft': {value: 'auto-draft', name:'New'},
			'trash': {value: 'trash', name: 'Deleted'}
		},

		visibilityOptions: {
			'public': {value: 'public', name:'Public'},
			'sticky': {value: 'sticky', name:'Sticky'},
			'password': {value: 'password', name: 'Protected'},
			'private': {value: 'private', name: 'Private'}
		},

		initialStatus: false,

		events: {
			'click .ueditor-action-cancel': 'cancel',
			'click .ueditor-action-publish': 'publish',
			'click .ueditor-action-draft': 'saveDraft',
			'click .ueditor-action-trash': 'trash',
			'click .ueditor-action-url': 'editUrl',
			'click .ueditor-action-tags': 'editTaxonomies',
			'click .ueditor-select-value': 'editSelect',
			'click .ueditor-action-status': 'changeStatus',
			'click .ueditor-action-visibility': 'changeVisibility',
			'click .ueditor-pass-ok': 'changePass'
		},

		initialize: function(options){
			this.post = options.post;
			this.initialStatus = this.post.get('post_status');
			this.tpl = _.template(Upfront.data.uposts.barTemplate);
		},

		render: function(){
			this.destroy();
			var postData = this.post.toJSON();

			postData.status = this.statusOptions[postData.post_status];
			postData.statusOptions = this.getStatusOptions();			

			postData.visibility = this.visibilityOptions[this.post.getVisibility()];
			postData.visibilityOptions = this.getVisibilityOptions();

			postData.schedule = {
				key: 'Publish',
				value: postData.post_status == 'future' ? Upfront.Util.format_date(postData.post_date, true) : 'Immediately'
			};

			postData.buttonText = this.getButtonText();
			postData.draftButton = postData.buttonText == 'Publish';

			postData.cid = this.cid;

			this.$el.html(this.tpl(postData));
			if($('#' + this.cid).length)
				this.stick();
		},

		getStatusOptions: function(postata){
			var ops = [],
				status = this.initialStatus
			;

			if(status == 'publish'){
				ops.push(this.statusOptions.publish);
			}
			else if(status == 'future'){
				ops.push(this.statusOptions.future);
			}
			ops.push(this.statusOptions.pending);
			ops.push(this.statusOptions.draft);

			if(status == 'private'){
				ops = [ this.statusOptions.private ];
			}

			return ops;
		},

		getVisibilityOptions: function(){
			var now = this.post.getVisibility(),
				ops = this.visibilityOptions
			;
			if(now == 'password')
				return [
					{value: 'password', name: 'Edit password...'},
					ops.public,
					ops.sticky,
					ops.private
				]
			;
			return _.values(ops);
		},

		getButtonText: function(){
			var status = this.post.get('post_status');

			if(status == 'future')
				return 'Schedule';

			return this.initialStatus == 'publish' ? 'Update' : 'Publish';
		},

		calculateLimits: function(){
			var ph = this.$('.ueditor-bar-ph'),
				container = this.$el.parent()
			;

			//We make sure that we are positing the bar again:
			ph.css('position', 'static');

			this.offset = {
				min: container.offset().top + 100,
				max: ph.offset().top + ph.height()
			};

			this.position = {
				min: this.offset.min - container.offset().top,
				max: ph.position().top
			};
		},

		onScroll: function(e, bar){
			var me = this,
				now = $(window).scrollTop() + $(window).height(),
				position = bar.css('position')
			;
			if(position == 'fixed'){
				if (now <= me.offset.min){
					bar.css({
							position: 'absolute',
							bottom: 'auto',
							top: me.position.min + 'px',
							left:0,
							width: '100%',
							opacity: 1
						})
						.removeClass('floating')
					;
					me.calculateLimits();
				}
				else if( now >= me.offset.max){
					bar.css({
							position: 'absolute',
							bottom: 'auto',
							top: me.position.max + 'px',
							left:0,
							width: '100%',
							opacity: 1
						})
						.removeClass('floating')
					;
					me.calculateLimits();
				}
			}
			else if(position == 'absolute'){
				if(now < me.offset.max && now > me.offset.min){
					bar.css({
							position: 'fixed',
							bottom: '0px',
							left: bar.offset().left + 'px',
							top: 'auto',
							width: bar.outerWidth() + 'px',
							opacity: 0.4
						})
						.addClass('floating')
					;						
					me.calculateLimits();
				}
			}

		},

		stick: function(){
			var ph = this.$('.ueditor-bar-ph'),
				bar = this.$('.ueditor-bar'),
				container = this.$el.parent(),
				me = this
			;

			ph.height(bar.height());

			container.css('position', 'relative');

			bar.css({
				position: 'absolute',
				bottom: '0',
				left: '0',
				width: '100%'
			});

			this.calculateLimits();

			this.onScrollFunction = function(e){
				me.onScroll(e, bar);
			};

			$(window).on('scroll', this.onScrollFunction);
			this.onScroll(null, bar);
		},

		destroy: function(){
			$(window).off('scroll', this.onScrollFunction);
			this.onScrollFunction = false;
		},

		cancel: function(e){
			e.preventDefault();
			if(confirm('Are you sure to discard the changes made to ' + this.post.get('post_title') + '?')){
				this.destroy();
				this.post.trigger('editor:cancel');
			}
		},

		publish: function(e){
			e.preventDefault();

			this.destroy();
			this.post.trigger('editor:publish');
		},

		saveDraft: function(e){
			e.preventDefault();

			this.destroy();
			this.post.trigger('editor:draft');
		},

		trash: function(e){
			e.preventDefault();
			if(confirm('Are you sure you want to delete this ' + this.post.get('post_type') + '?')){
				this.destroy();
				this.post.trigger('editor:trash');				
			}
		},

		editUrl: function(e){
			e.preventDefault();
			var me = this,
				$popup = {},
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder">No such thing as <q>too many drinks</q>.</p>')
					;
					$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				}),
				update = function(slug){
					me.post.set('post_name', slug);
					Upfront.Popup.close();
				},
				tpl = _.template($(Upfront.data.tpls.popup).find('#upfront-slug-tpl').html())
			;			

			$popup.content.html(tpl({
				rootURL: window.location.origin + '/',
				slug: me.post.get('post_name')
			}));

			$popup.content.off('click', '#upfront-post_slug-send')
				.on('click', '#upfront-post_slug-send', function(){
					update($('#upfront-post_slug').val());
				})
				.off('keydown', '#upfront-post_slug')
				.on('keydown', '#upfront-post_slug', function(e){
					if(e.which == 13){
						e.preventDefault();
						update($('#upfront-post_slug').attr('disabled', true).val());
					}
				})
			;
		},
		editTaxonomies: function(e){
			if(e)
				e.preventDefault();

			var me = this,
				tmp = $('body').append('<div id="upfront-post_taxonomies" style="display:none" />'),
				$tax = $("#upfront-post_taxonomies"),
				$popup = {},
				views = {category: false, post_tag: false},
				currentView = 'category',
				terms = {},
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder"><q>I enjoy eating cheese.</q></p>')
						.append($tax)
					;
					$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				}),
				dispatch_taxonomy_call = function (el) {
					var $el = $(el),
						tax = $el.attr("data-type"),
						type = $el.attr('rel'),
						termsList = terms[tax] ? terms[tax] : false
					;
					$popup.top.find('.upfront-tabs li').removeClass('active');
					$el.addClass('active');

					currentView = tax;

					if(views[tax])
						return render_panel(views[tax]);

					if(!termsList){
						termsList = new Upfront.Collections.TermList([], {postId: me.post.id, taxonomy: tax});
						terms[tax] = termsList;
					}

					$popup.content.html('<p class="upfront-popup-placeholder"><q>Them frogs chirp really loud today.</q></p>');

					termsList.fetch({allTerms: true}).done(function(response){
						var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
							tax_view = new tax_view_constructor({collection: termsList})
						;

						tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);

						views[tax] = tax_view;
						render_panel();

					});

					return false;
				},
				render_panel = function(view){
					var v = views[currentView];
					v.render();
					$popup.content.html(v.$el);
					v.setElement(v.$el);
				}
			;
			
			$(".upfront-popup-placeholder").remove();
			$popup.top.html(
				'<ul class="upfront-tabs">' +
					'<li data-type="category">Categories</li>' +
					'<li data-type="post_tag">Tags</li>' +
				'</ul>' +
				$popup.top.html()
			);

			$popup.top.find('.upfront-tabs li').on("click", function () { 
				dispatch_taxonomy_call(this);
			});

			$tax.show();

			dispatch_taxonomy_call($popup.top.find('.upfront-tabs li:first'));

			Upfront.Events.on("upfront:post:taxonomy_changed", function () {
				dispatch_taxonomy_call($popup.top.find('.upfront-tabs li.active'));
			});
		},

		editSelect: function(e){
			var parent = $(e.target).parent(),
				options = parent.find('.ueditor-select-options').show()
			;
			parent.find('.ueditor-select-focus').focus().one('blur', function(){
				setTimeout(function(){
					options.hide();
				}, 300);
			});
		},

		changeStatus: function(e){
			var target = $(e.target);
			this.post.set('post_status', target.data('id'));
			this.render();
		},

		changeVisibility: function(e){
			var target = $(e.target),
				visibility = target.data('id')
			;
			if(visibility == 'password')
				this.showPassEditor(target);
			else{
				this.post.setVisibility(target.data('id'));
				this.render();
			}
		
		},

		showPassEditor: function(target){
			var parent = target.closest('.ueditor-select'),
				op = this.visibilityOptions.password,
				me = this
			;

			parent.find('.ueditor-select-value')
				.data('id', op.value)
				.text(op.name)
			;

			parent.find('.ueditor-select-options').hide();

			parent.find('.ueditor-pass-editor').show()
				.find('input')
					.one('blur', function(e){
						setTimeout(function(){
							me.render();
						}, 300);
					})
					.off('keydown')
					.on('keydown', function(e){
						if(e.which == 13){
							me.changePass(e);
						}
					})
					.focus()
			;
		},

		changePass: function(e){
			var pass = $(e.target).parent().find('input').val();
			if(pass){
				this.post.setVisibility('password');
				this.post.set('post_password', pass);
				this.render();
			}
		}
	});
	

	var ContentEditorTaxonomy_Hierarchical = Backbone.View.extend({
		className: "upfront-taxonomy-hierarchical",
		events: {
			"click #upfront-add_term": "handle_new_term",
			"keydown #upfront-add_term": "handle_enter_new_term",
			"change .upfront-taxonomy_item": "handle_terms_update",
			'keydown #upfront-new_term': 'handle_enter_new_term'
		},
		termListTpl: false,
		termSingleTpl: false,
		updateTimer: false,
		allTerms: false,
		initialize: function(options){
			//this.collection.on('add remove', this.render, this);
			this.termListTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-list-tpl').html());
			this.termSingleTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-single-tpl').html());
		},

		render: function() {
			this.$el.html(
				this.termListTpl({ 
					allTerms: this.allTerms,
					postTerms: this.collection,
					termTemplate: this.termSingleTpl, 
					labels: this.collection.taxonomyObject.labels,
				})
			);
		},

		handle_new_term: function() {
			var me = this,
				termId = this.$el.find("#upfront-new_term").val(),
				parentId, term
			;

			if(!termId)
				return false;

			if ($("#upfront-taxonomy-parents").length) 
				parentId = $("#upfront-taxonomy-parents").val();

			term = new Upfront.Models.Term({
				taxonomy: this.collection.taxonomy,
				name: termId,
				parent: parentId
			});

			term.save().done(function(response){
				me.allTerms.add(term);
				me.collection.add(term).save();
				me.render();
			});
		},

		handle_terms_update: function(e){
			var me = this,
				$target = $(e.target),
				termId = $target.val()
			;

			if(!$target.is(':checked')){
				this.collection.remove(this.allTerms.get(termId));
			}
			else
				this.collection.add(this.allTerms.get(termId));

			//Delay the current update to let the user add/remove more terms
			clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(function(){
				me.collection.save();
			}, 2000);
		},

		handle_enter_new_term: function (e) {
			if(e.which == 13){
				this.handle_new_term(e);
			}
		}
	});

	var ContentEditorTaxonomy_Flat = Backbone.View.extend({
		"className": "upfront-taxonomy-flat",
		termListTpl: false,
		termSingleTpl: false,
		changed: false,
		updateTimer: false,
		events: {
			"click #upfront-add_term": "handle_new_term",
			'click .upfront-taxonomy_item-flat': 'handle_term_click',
			'keydown #upfront-add_term': 'handle_enter_new_term',
			'keydown #upfront-new_term': 'handle_enter_new_term'
		},
		initialize: function(options){
			this.collection.on('add remove', this.render, this);
			this.termListTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-flat-term-list-tpl').html());
			this.termSingleTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-flat-single-tpl').html());
		},
		render: function () {
			var	me = this,
				currentTerms = [],
				otherTerms = []
			;
			this.allTerms.each(function (term, idx) {
				term.children = [];
				if(me.collection.get(term.get('term_id')))
					currentTerms.push(term);
				else
					otherTerms.push(term);
			});

			this.$el.html(this.termListTpl({
				currentTerms: currentTerms,
				otherTerms: otherTerms,
				termTemplate: this.termSingleTpl,
				labels: this.collection.taxonomyObject.labels
			}));
		},

		handle_term_click: function(e){
			var me = this,
				$target = $(e.currentTarget),
				termId = $target.attr('data-term_id');

			if($target.parent().attr('id') == 'upfront-taxonomy-list-current')
				this.collection.remove(termId);
			else
				this.collection.add(this.allTerms.get(termId));

			//Delay the current update to let the user add/remove more terms
			clearTimeout(this.updateTimer);
			this.updateTimer = setTimeout(function(){
				me.collection.save();
			}, 2000);
		},

		handle_new_term: function (e) {
			var me = this,
				termId = this.$el.find("#upfront-new_term").val(),
				term
			;

			e.preventDefault();

			if(! termId)
				return false;

			term = new Upfront.Models.Term({
				taxonomy: this.collection.taxonomy,
				name: termId
			});

			term.save().done(function(response){
				me.allTerms.add(term);
				me.collection.add(term).save();
			});
		},

		handle_enter_new_term: function (e) {
			if(e.which == 13){
				this.handle_new_term(e);
			}
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