;(function ($, undefined) {
define([
	'text!elements/upfront-code/css/editor.css',
	'text!elements/upfront-code/tpl/editor.html'
], function (style, tplSource) {

$("head").append('<style>' + style + '</style>');

var tpls = $(tplSource);
var l10n = Upfront.Settings.l10n.code_element;

var CodeModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.upfront_code.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var Views = {

	Start: Backbone.View.extend({
		events: {
			"click .embed": "embed_code",
			"click .create": "create_code"
		},
		render: function () {
			/*
			var me = this;

			this.$el.empty().append('Loading...');

			require([
				'//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'
			], function () {
			});
*/
			this.$el.empty()
				.append(
					'<p class="code-element-choose"><button type="button" class="embed">' + l10n.intro.embed + '</button>' +
					'&nbsp;or&nbsp;' +
					'<button type="button" class="create">' + l10n.intro.code + '</button></p>'
				)
			;
		},
		embed_code: function () {
			this.model.set_property("code_selection_type", "Embed", true);
			this.trigger("code:selection:selected");
		},
		create_code: function () {
			this.model.set_property("code_selection_type", "Create", true);
			this.trigger("code:selection:selected");
		}
	}),

	Create: Upfront.Views.ObjectView.extend({

		is_editing: false,
		script_error: false,

		SYNTAX_TYPES: {
			"markup": "html",
			"style": "css",
			"script": "javascript"
		},

		MIN_HEIGHT: 200,

		editorTpl: _.template(tpls.find('#editorTpl').html()),

		content_editable_selector: ".editable",

		initialize: function() {
			var script = this.fallback('script');
			this.checkJS(script);
		},

		get_content_markup: function () {
			var markup = this.fallback('markup'),
				raw_style = this.fallback('style'),
				script = this.script_error ? '' : '(function($){' + this.fallback('script') + '})(jQuery)',
				element_id = this.property('element_id'),
				style = ''
			;

			// Scope the styles!
			if (raw_style) _(raw_style.split("}")).each(function (el, idx) {
				if (!el.length) return true;
				style += '#' + element_id + ' .upfront_code-element ' + el + '}';
			});

			return '<div class="upfront_code-element clearfix">' + markup +
				'<style>' + style + '</style>' +
				'<script>' + script + '</script>' +
			'</div>';
		},

		on_render: function () {
			this.$el.find(".upfront-entity_meta").append('<a href="#" class="upfront-icon-button re-edit">...</a>');
			var me = this;
			this.$el.find(".upfront-entity_meta .re-edit").on("click", function (e) {
				e.preventDefault();
				me.start_markup_editor();
			});
			if (
				!this.property('markup') &&
				!this.property('style') &&
				!this.property('script')
			) {
				setTimeout(function () {
					me.start_markup_editor();
				}, 10); // Start in edit mode
			} else {
			// Boot all image editables
				var $editables = this.$el.find('.upfront_code-element ' + this.content_editable_selector);
				if ($editables.length) $editables.each(function (idx) {
					var $me = $(this);
					if ($me.is("img")) me.bootImageEditable($me, idx);
				});

				// Compensate for dead element double-click event
				this.$el.off("dblclick").on("dblclick", function () {
					me.on_edit();
				});
			}
		},

		start_markup_editor: function () {
			if (this.is_editing) return false;

			this.is_editing = true;
			var $editor = $('#upfront_code-editor');

			if(!$editor.length){
				$editor = $('<section id="upfront_code-editor" class="upfront-ui upfront_code-editor upfront_code-editor-complex"></section>');
				$('body').append($editor);
			}

			this.createEditor($editor);

		},

		on_edit: function(){
			if (this.is_editing) return false;

			// Since we're doing double duty here, let's first check if content editing mode is to boot
			var $contenteditables = this.$el.find('.upfront_code-element ' + this.content_editable_selector);
			if ($contenteditables.length) {
				// Yes? go for it
				return this.bootContentEditors($contenteditables);
			}
			// Oh well, let's just go ahead and boot code editing mode.
			this.is_editing = true;
			var $editor = $('#upfront_code-editor');

			if(!$editor.length){
				$editor = $('<section id="upfront_code-editor" class="upfront-ui upfront_code-editor upfront_code-editor-complex"></section>');
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
				// The editable is an image editable. Deal with that
				if ($me.is("img")) {
					//me.bootImageEditable($me, idx);
					return true;
				}
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

		bootImageEditable: function ($img, idx) {
			var src = $img.attr("src"),
				me = this,
				$markup = $(this.fallback("markup")),
				id_prefix = this.model.get_property_value_by_name("element_id"),
				id = "upfront-editable-" + id_prefix + "-" + idx,
				$root = $('#' + id),
				$all
			;
			if ($root.length) {
				$root.remove();
			}

			$("body").append("<div class='upfront-code-editable-image' id='" + id + "'>" + l10n.create.change + "</div>");
			$root = $('#' + id);

			$all = $img.add($root);
			$all
				.on("mouseenter", function () {
					var offset = $img.offset(),
						width = $img.width(),
						height = $img.height()
					;
					$root
						.width(width)
						.height(height)
						.css({
							top: offset.top,
							left: offset.left,
							"line-height": height + "px"
						})
						.show()
					;
				})
				.on("mouseleave", function (e) {
					if (!$(this).is("img")) $root.hide();
				})
				.on("click", function () {
					$root.hide();
					Upfront.Media.Manager.open({
						multiple_selection: false,
					}).done(function (popup, results) {
						if (results && results.at) {
							var selected = results.at(0).get("image").src,
								$existing = $($markup.find(me.content_editable_selector)[idx])
							;
							$img.attr("src", selected);
							$existing.attr("src", selected);
							me.property(
								"markup",
								$("<div />").append($markup).html()
							);
							Upfront.Events.trigger("upfront:element:edit:stop");
						}
					});
				})
			;
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

			$editor.find('.upfront_code-ace').each(function(){
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
							me.checkJS(value);

						if(me.script_error)
							$editor.find('.upfront_code-jsalert').show().find('i').attr('title', l10n.create.js_error + ' ' + me.script_error);
						else
							$editor.find('.upfront_code-jsalert').hide();

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
			$editor.find(".upfront_code-editor-complex-wrapper").resizable({
				handles: {
					n: ".upfront-css-top"
				},
				resize: function(e, ui){
					editorBody.height(ui.size.height - editorTop.outerHeight());
					_.each(me.editors, function(editor){
						editor.resize();
					});
				},
				minHeight: me.MIN_HEIGHT,
				delay:  100
			});

			//switch tabs
			$editor.find(".upfront_code-switch").on('click', function(e){
				var tab = $(e.target),
					syntax = tab.data('for')
				;
				$editor.find('.active').removeClass('active');
				tab.addClass('active');
				$editor.find('.upfront_code-' + syntax).addClass('active');
				me.editors[syntax].resize();
				me.currentEditor = me.editors[syntax];

				if(syntax == 'script')
					$editor.find('upfront-css-image').hide();
				else
					$editor.find('upfront-css-image').show();

			});

			//save edition
			$editor.find('button').on('click', function(e){
				_.each(me.editors, function(editor, type){
					me.property(type, editor.getValue());
				});

				me.$("section.upfront_code-element").replaceWith(me.get_content_markup()).end();
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

			this.prepareSpectrum($editor);

			//Prepare image picker
			$editor.on('click', '.upfront-css-image', function(){
				me.openImagePicker();
			});
		},

		prepareSpectrum: function($editor){
			var me = this;

			$editor.find('.upfront-css-color').spectrum({
				showAlpha: true,
				showPalette: true,
				palette: Upfront.Views.Theme_Colors.colors.pluck("color").length ? Upfront.Views.Theme_Colors.colors.pluck("color") : ['fff', '000', '0f0'],
				maxSelectionSize: 9,
				localStorageKey: "spectrum.recent_bgs",
				preferredFormat: "hex",
				chooseText: l10n.create.ok,
				showInput: true,
				allowEmpty:true,
				show: function(){
					spectrum = $('.sp-container:visible');
				},
				change: function(color) {
					var colorString = color.get_is_theme_color()
						? color.theme_color
						: (color.alpha < 1 ? color.toRgbString() : color.toHexString())
					;
					me.currentEditor.insert(colorString);
					me.currentEditor.focus();
				},
				move: function(color) {
					var rgba = color.toRgbString();
					spectrum.find('.sp-dragger').css('border-top-color', rgba);
					spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
				}
			});
		},

		openImagePicker: function(){
			var me = this,
				currentSyntax = $('#upfront_code-editor').find('.upfront_code-switch.active').data('for')
			;

			Upfront.Media.Manager.open({
				multiple_selection: false,
				media_type:['images']
			}).done(function(popup, result){
				Upfront.Events.trigger('upfront:element:edit:stop');
				if(!result)
					return;

				var imageModel = result.models[0],
					url = imageModel.get('image').src
				;

				url = url.replace(document.location.origin, '');

				if(currentSyntax == 'style')
					me.currentEditor.insert('url("' + url + '")');
				else {
					//Add the selected size
					var urlParts = url.split('.'),
						ext = urlParts[urlParts.length - 1],
						size = imageModel.get('selected_size')
					;
					if(size != 'full')
						url = url.replace(new RegExp('.' + ext + '$'), '-' + size + '.' + ext);

					me.currentEditor.insert('<img src="' + url + '" >');
				}

				me.currentEditor.focus();
			});

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
			$('#upfront_code-editor').html('').hide();
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

		checkJS: function(script){
			this.script_error = false;
			try {
				eval(script);
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
	}),

	Embed: Upfront.Views.ObjectView.extend({

		is_editing: false,
		tpl: _.template(tpls.find('#embedTpl').html()),

		get_content_markup: function () {
			var markup = this.fallback('markup'),
				element_id = this.model.get_property_value_by_name('element_id')
			;
			return '<section class="upfront_code-element clearfix">' + markup + '</section>';
		},

		update_property: function (model) {
			var $area = $(this),
				type = $area.attr("data-type"),
				value = $area.val()
			;
			model.set_property(type, value, true);
		},

		on_render: function () {
			this.$el.find(".upfront-entity_meta").append('<a href="#" class="upfront-icon-button re-edit">...</a>');
			var me = this;
			this.$el.find(".upfront-entity_meta .re-edit").on("click", function (e) {
				e.preventDefault();
				me.on_edit();
			});
			if (!this.model.get_property_value_by_name('markup')) {
				setTimeout(function () {
					me.on_edit();
				}, 10); // Start in edit mode
			}
		},

		on_edit: function () {
			if (this.is_editing)
				return false;

			this.is_editing = true;

			var me = this,
				$module = this.$el.parents(".upfront-module")
			;
			this.$el
				.find("section.upfront_code-element").hide().end()
				.append(this.tpl({markup: this.fallback('markup'), l10n: l10n.template}))
			;

			this.$el
				.find("textarea")
					.on("keyup change", function () {
						me.update_property.apply(this, [me.model]);
					})
					.on("focus click", function () {
						$module.draggable("disable")
					})
					.focus()
				.end()
				.find("button").on("click", function () {
					me.$el.find("pre code").each(function () {
						me.update_property.apply(this, [me.model]);
					});
					me.$el
						.find("section.upfront_code-element").replaceWith(me.get_content_markup()).end()
						.find("section.upfront_code-editor-simple").remove()
					;
					me.is_editing = false;
					me.trigger("code:model:updated");
				})
			;
		},
		fallback: function(attribute){
			return this.model.get_property_value_by_name(attribute) || Upfront.data.upfront_code.defaults.fallbacks[attribute];
		},
	})
};

var CodeView = Upfront.Views.ObjectView.extend({

	on_render: function () {
		var type = this.model.get_property_value_by_name("code_selection_type"),
			me = this,
			view = false
		;
		this.$el.empty().append("Loading...");
		require([
			'//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'
		], function () {
			if (!type) view = me.render_initial_view();
			else view = me.render_code_view();
		});
		if (!this.parent_module_view.$el.data("dragHandler")) {
			this.parent_module_view.$el.on('dragstart', this.cover_iframes);
			this.parent_module_view.$el.data("dragHandler", true);
		}
	},

	cover_iframes: function (e, ui) {
		ui.helper.append('<div class="upfront-iframe-draggable" style="width:100%;height:100%;position:absolute;top:0;left:0:z-index:1"></div>');
	},

	render_initial_view: function () {
		var view = new Views.Start({
			model: this.model
		});
		view.render();

		view.parent_view = this.parent_view;
		view.parent_module_view = this.parent_module_view;

		view.on("code:selection:selected", this.render_code_view, this);
		this.$el.empty().append(view.$el);
		return view;
	},

	render_code_view: function () {
		var type = this.model.get_property_value_by_name("code_selection_type");
		if (!type) {
			Upfront.Util.log("Missing type");
			return this.render_initial_view();
		}
		var view = new Views[type]({
			model: this.model
		});
		view.render();

		view.parent_view = this.parent_view;
		view.parent_module_view = this.parent_module_view;

		view.on("code:model:updated", this.propagate_model_update, this);
		this.$el.empty().append(view.$el);
		return view;
	},

	propagate_model_update: function () {
		Upfront.Events.trigger("upfront:element:edit:stop");
	}
});

var CodeElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 130,

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-code');
		this.$el.html(l10n.element_name);
	},

	add_element: function () {

		var object = new CodeModel(),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c24 upfront-code_element-module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(210)}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});


Upfront.Application.LayoutEditor.add_object("Code", {
	"Model": CodeModel,
	"View": CodeView,
	"Element": CodeElement,
	//"Settings": CodeSettings
});
Upfront.Models.CodeModel = CodeModel;
Upfront.Views.CodeView = CodeView;

});
})(jQuery);
