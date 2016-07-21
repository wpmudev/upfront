(function ($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'text!scripts/upfront/templates/map-editor.html'
], function (editorTpl) {

	var MapEditorView = Upfront.Views.ObjectView.extend({

		is_editing: false,
		script_error: false,

		SYNTAX_TYPES: {
			"script": "json"
		},

		MIN_HEIGHT: 200,

		editorTpl: _.template(editorTpl),

		content_editable_selector: ".editable",

		initialize: function() {
			var json = this.fallback('script');
			this.checkJSon(json);
		},

		on_render: function () {
			this.start_json_editor();
		},

		start_json_editor: function () {
			if (this.is_editing) return false;

			this.is_editing = true;
			var $editor = $('#upfront_map-editor'),
				me = this
			;

			if(!$editor.length){
				$editor = $('<section id="upfront_map-editor" class="upfront-ui upfront_map-editor upfront_map-editor-complex"></section>');
				$('body').append($editor);
			}

			require([Upfront.Settings.ace_url], function () {
				me.createEditor($editor);
			});

		},

		on_edit: function(){
			if (this.is_editing) return false;

			// Since we're doing double duty here, let's first check if content editing mode is to boot
			var $contenteditables = this.$el.find('.upfront_map-element ' + this.content_editable_selector);
			if ($contenteditables.length) {
				// Yes? go for it
				return this.bootContentEditors($contenteditables);
			}
			// Oh well, let's just go ahead and boot code editing mode.
			this.is_editing = true;
			var $editor = $('#upfront_map-editor');

			if(!$editor.length){
				$editor = $('<section id="upfront_map-editor" class="upfront-ui upfront_map-editor upfront_map-editor-complex"></section>');
				$('body').append($editor);
			}

			this.createEditor($editor);
		},

		bootContentEditors: function ($editables) {
			if (!$editables || !$editables.length) return false;
			var $markup = $(this.fallback("markup")),
				me = this
			;
			$editables.each(function (idx) {
				var $me = $(this),
					start = idx <= 0
				;
				if ($me.data('ueditor')) return true;
				$me
					.ueditor({
						autostart: start,
						placeholder: "",
						disableLineBreak: true
					})
					.on("start", function () {
						me.is_editing = true;
					})
					.on("stop", function () {
						me.is_editing = false;
					})
					.on('syncAfter', function(){
						var $existing = $($markup.find(me.content_editable_selector)[idx]);
						if (!$existing.length) return false;
						$existing.html($me.html());
						me.property(
							"markup",
							$("<div />").append($markup).html()
						);
					})
				;
			});
		},
		startResizable: function(editor){
			// Save the fetching inside the resize
			var me = this,
				$cssbody = editor.find('.upfront-css-body'),
				topHeight = 0,

				$rsz = editor.find('.upfront_map-editor-complex-wrapper'),
				onResize = function(e, ui){
					var height = ui ? ui.size.height : editor.find('.upfront_map-editor-complex-wrapper').height(),
						bodyHeight = height  - topHeight;
					$cssbody.height(bodyHeight);

					_.each(me.editors, function(editor){
						editor.resize();
					});

					// Clean unneeded CSS
					$rsz.css({
						width: "",
						height: "",
						left: "",
						top: ""
					});

				}
			;
			// Add appropriate handle classes
			$rsz.find(".upfront-css-top")
				.removeClass("ui-resizable-handle").addClass("ui-resizable-handle")
				.removeClass("ui-resizable-n").addClass("ui-resizable-n")
			;
			topHeight = editor.find('.upfront-css-top').outerHeight();
			onResize();
			$rsz.resizable({
				handles: {n: '.upfront-css-top'},
				resize: onResize,
				minHeight: 200,
				delay: 100
			});
		},
		createEditor: function($editor){
			var me = this;
			$editor.html(this.editorTpl({
				markup: this.fallback('markup'),
				style: this.fallback('style'),
				script: this.fallback('script'),
				l10n: l10n.template
			}));

			$('#page').css('padding-bottom', '200px');
			$editor.show();

			this.resizeHandler = this.resizeHandler || function(){
				$editor.width($(window).width() - $('#sidebar-ui').width() -1);
			};
			$(window).on('resize', this.resizeHandler);
			this.resizeHandler();

			//Start the editors
			this.editors = {};
			this.timers = {};

			$editor.find('.upfront_map-ace').each(function(){
				var $this = $(this),
					html = $this.html(),
					editor = ace.edit(this),
					syntax = $this.data('type')
				;

				editor.getSession().setUseWorker(false);
				editor.setTheme("ace/theme/monokai");
				editor.getSession().setMode("ace/mode/" + me.SYNTAX_TYPES[syntax]);
				editor.setShowPrintMargin(false);

				if ("markup" === syntax && html)
						editor.getSession().setValue(html);

				// Live update
				editor.on('change', function(){
					if(me.timers[syntax])
						clearTimeout(me.timers[syntax]);
					me.timers[syntax] = setTimeout(function(){
						var value = editor.getValue();

						if(syntax == 'script')
							me.checkJSon(value);

						if(me.script_error)
							$editor.find('.upfront_map-jsalert').show().find('i').attr('title', l10n.create.js_error + ' ' + me.script_error);
						else
							$editor.find('.upfront_map-jsalert').hide();

						me.property(syntax, value, false);
					}, 1000);
				});

				// Set up the proper vscroller width to go along with new change.
				editor.renderer.scrollBar.width = 5;
				editor.renderer.scroller.style.right = "5px";

				me.editors[syntax] = editor;
			});
			this.currentEditor = this.editors['markup'];

			var editorTop = $editor.find('.upfront-css-top'),
				editorBody = $editor.find('.upfront-css-body')
			;

			//Start resizable
			editorBody.height(this.MIN_HEIGHT - editorTop.outerHeight());
			this.startResizable($editor);

			//save edition
			$editor.find('button').on('click', function(e){
				_.each(me.editors, function(editor, type){
					me.property(type, editor.getValue());
				});

				me.property('map_styles', me.fallback('script'), false);
				me.is_editing = false;
				me.destroyEditor();
			});

			//Highlight element
			$editor
				.on('click', '.upfront-css-type', function(e){
					me.hiliteElement(e);
				}) // Close editor
				.on('click', '.upfront-css-close', function(e){
					e.preventDefault();
					me.destroyEditor();
					$('#page').css('padding-bottom', 0);
				})
			;
		},

		destroyEditor: function(){
			var me = this;
			if(this.editors && this.editors.length){
				_.each(this.editors, function(ed){
					ed.destroy();
				});
				me.editors = false;
			}
			this.currentEditor = false;
			$('#upfront_map-editor').html('').hide();
			$(window).off('resize', this.resizeHandler);
			this.is_editing = false;
		},

		hiliteElement: function(e){
			e.preventDefault();
			var element = this.$el.find('.upfront-object-content');
			var offset = element.offset().top - 50;
			$(document).scrollTop(offset > 0 ? offset : 0);
			this.blink(element, 4);
		},

		blink: function(element, times) {
			var me = this;
			element.css('outline', '3px solid #3ea');
			setTimeout(function(){
				element.css('outline', 'none');

				times--;
				if(times > 0){
					setTimeout(function(){
						me.blink(element, times - 1);
					}, 100);
				}

			}, 100);
		},

		checkJSon: function(json){
			this.script_error = false;
			try {
				JSON.parse(json);
			} catch (e) {
				this.script_error = e.message;
			}
		},

		fallback: function(attribute){
			return this.model.get_property_value_by_name(attribute) || Upfront.data.upfront_code.defaults.fallbacks[attribute];
		},

		property: function(name, value, silent) {
			if(typeof value != "undefined"){
				if(typeof silent == "undefined")
					silent = true;
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

	return MapEditorView;

});

})(jQuery);
