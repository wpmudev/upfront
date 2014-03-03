;(function ($, undefined) {
define([
	'text!elements/upfront-code/css/editor.css',
	'text!elements/upfront-code/tpl/editor.html'
], function (style, tplSource) {

$("head").append('<style>' + style + '</style>');

var tpls = $(tplSource);

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
					'<p style="text-align:center"><button type="button" class="embed">Embed 3rd Party code</button>' +
					'&nbsp;or&nbsp;' +
					'<button type="button" class="create">Write Custom Code</button></p>'
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

			console.log('CODE');

			// Scope the styles!
			if (raw_style) _(raw_style.split("}")).each(function (el, idx) {
				if (!el.length) return true;
				style += '#' + element_id + ' .upfront_code-element ' + el + '}';
			});

			return '<section class="upfront_code-element clearfix">' + markup +
				'<style>' + style + '</style>' +
				'<script>' + script + '</script>' +
			'</section>';
		},

		on_render: function () {
			this.$el.find(".upfront-entity_meta").append('<a href="#" class="upfront-icon-button re-edit">...</a>');
			var me = this;
			this.$el.find(".upfront-entity_meta .re-edit").on("click", function () {
				me.on_edit();
			});
			if (
				!this.property('markup') &&
				!this.property('style') &&
				!this.property('script')
			) {
				setTimeout(function () {
					me.on_edit();
				}, 10); // Start in edit mode
			}
		},

		on_edit: function(){
			if (this.is_editing) return false;
			this.is_editing = true;

			var $editor = $('#upfront_code-editor')

			if(!$editor.length){
				$editor = $('<section id="upfront_code-editor" class="upfront_code-editor upfront_code-editor-complex"></section>');
				$('body').append($editor);
			}

			this.createEditor($editor);
		},

		createEditor: function($editor){
			var me = this;
			$editor.html(this.editorTpl({
				markup: this.fallback('markup'),
				style: this.fallback('style'),
				script: this.fallback('script')
			}));

			$editor.show();

			console.log('create editor');

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
							$editor.find('.upfront_code-jsalert').show().find('i').attr('title', 'JS error: ' + me.script_error);
						else
							$editor.find('.upfront_code-jsalert').hide();

						me.property(syntax, value, false);
					}, 1000);
				});

				me.editors[syntax] = editor;
			});

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
		},

		destroyEditor: function(){
			var me = this;
			if(this.editors && this.editors.length){
				_.each(this.editors, function(ed){
					ed.destroy();
				});
				me.editors = false;
			}
			$('#upfront_code-editor').html('').hide();
			$(window).off('resize', this.resizeHandler);
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

		get_content_markup: function () {
			var markup = this.model.get_property_value_by_name('markup') || Upfront.data.upfront_code.defaults.fallbacks.markup,
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
			this.$el.find(".upfront-entity_meta .re-edit").on("click", function () {
				me.on_edit();
			});
			if (!this.model.get_property_value_by_name('markup')) {
				setTimeout(function () {
					me.on_edit();
				}, 10); // Start in edit mode
			}
		},

		on_edit: function () {
			if (this.is_editing) return false;
			this.is_editing = true;
			var me = this;
			this.$el
				.find("section.upfront_code-element").hide().end()
				.append(
				'<section class="upfront_code-editor upfront_code-editor-simple">' +
					'<h3>Paste your embed code below</h3>' +
					'<textarea class="upfront_code-markup" data-type="markup" >' + (this.model.get_property_value_by_name('markup') || Upfront.data.upfront_code.defaults.fallbacks.markup)  + '</textarea>' +
					'<button>ok</button>' +
				'</section>'
			);
			this.$el
				.find("textarea")
					.on("keyup change", function () {
						me.update_property.apply(this, [me.model]);
					})
				.end()
				.find("button").on("click", function () {
					me.$el.find("pre code").each(function () {
						me.update_property.apply(this, [me.model]);
					});
					me.$el
						.find("section.upfront_code-element").replaceWith(me.get_content_markup()).end()
						.find("section.upfront_code-editor").remove()
					;
					me.is_editing = false;
					me.trigger("code:model:updated");
				})
			;
		}
	})
};

var CodeView = Upfront.Views.ObjectView.extend({

	on_render: function () {
		var type = this.model.get_property_value_by_name("code_selection_type"),
			me = this
		;
		this.$el.empty().append("Loading...");
		require([
			'//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'
		], function () {
			if (!type) me.render_initial_view();
			else me.render_code_view();
		});
	},

	render_initial_view: function () {
		var view = new Views.Start({
			model: this.model
		});
		view.render();
		view.on("code:selection:selected", this.render_code_view, this);
		this.$el.empty().append(view.$el);
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
		view.on("code:model:updated", this.propagate_model_update, this);
		this.$el.empty().append(view.$el);
	},

	propagate_model_update: function () {
		Upfront.Events.trigger("upfront:element:edit:stop");
	}
});

var CodeElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 130,

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-code');
		this.$el.html('Code');
	},

	add_element: function () {

		var object = new CodeModel(),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c22 upfront-code_element-module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 14}
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