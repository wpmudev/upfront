;(function ($, undefined) {

	var TYPES = {
		PLAIN: "plain",
		POST: "post"
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
			$(".upfront-module, #sidebar-ui").css("opacity", .3);
			options.parent.css("opacity", 1);
		};

		var stop = function () {
			if ($bar && $bar.length) $bar.remove();

			// Fade other stuff in
			$(".upfront-module, #sidebar-ui").css("opacity", 1);
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
			editor_bar = new Editor_SupplementalBar({
				post: post,
				editor: editor,
				parent: $parent
			});

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
			apply_styles($title);

			// We're ready, start editing
			editor_bar.start();
			Upfront.Events.on("entity:deactivated", view.on_cancel, view);
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