;(function ($, undefined) {
define([
	'text!elements/upfront-code/css/editor.css'
], function (style) {

$("head").append('<style>' + style + '</style>');

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

		MIN_HEIGHT: 50,

		get_content_markup: function () {
			var markup = this.model.get_property_value_by_name('markup') || Upfront.data.upfront_code.defaults.fallbacks.markup,
				raw_style = this.model.get_property_value_by_name('style') || Upfront.data.upfront_code.defaults.fallbacks.style,
				script = this.model.get_property_value_by_name('script') || Upfront.data.upfront_code.defaults.fallbacks.script,
				element_id = this.model.get_property_value_by_name('element_id'),
				style = ''
			;
			// Scope the styles!
			if (raw_style) _(raw_style.split("}")).each(function (el, idx) {
				if (!el.length) return true;
				style += '#' + element_id + ' .upfront_code-element ' + el + '}';
			});

			// Validate script before adding it in
			// DOWNSIDE! Executing twice.
			script = ';try { (function ($) {' + script + "\n" + '})(jQuery); } catch(e) {}';
			// Set up flag
			this.script_error = false;
			try {
				eval(script);
			} catch (e) {
				script = '';
				this.script_error = true;
			}

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
				!this.model.get_property_value_by_name('markup') &&
				!this.model.get_property_value_by_name('style') &&
				!this.model.get_property_value_by_name('script')
			) {
				setTimeout(function () {
					me.on_edit();
				}, 10); // Start in edit mode
			}
		},

		on_edit: function () {
			if (this.is_editing) return false;
			this.is_editing = true;
			var me = this,
				$draggable = this.$el.closest('.ui-draggable'),
				update_position = function () {
					var $output = me.$el.find("section.upfront_code-element"),
						$editor = me.$el.find("section.upfront_code-editor"),
						top = $output.height() + $output.offset().top
					;
					$editor.offset({top: top});
				},
				editors = {}
			;
			this.$el.append(
				'<section class="upfront_code-editor upfront_code-editor-complex">' +
					'<div class="upfront_code-editor-complex-wrapper">' +
						'<div class="upfront_code-switch active" data-for="markup">HTML</div>' +
						'<div class="upfront_code-switch" data-for="style">CSS</div>' +
						'<div class="upfront_code-switch" data-for="script">JS</div>' +
						'<div class="upfront_code-editor-section upfront_code-markup active">' +
							'<div data-type="markup" >' + (this.model.get_property_value_by_name('markup') || Upfront.data.upfront_code.defaults.fallbacks.markup)  + '</div>' +
						'</div>' +
						'<div class="upfront_code-editor-section upfront_code-style">' +
							'<div data-type="style" >' + (this.model.get_property_value_by_name('style') || Upfront.data.upfront_code.defaults.fallbacks.style) + '</div>' +
						'</div>' +
						'<div class="upfront_code-editor-section upfront_code-script">' +
							'<div data-type="script" >' + (this.model.get_property_value_by_name('script') || Upfront.data.upfront_code.defaults.fallbacks.script) + '</div>' +
						'</div>' +
						'<div class="handle ui-resizable-handle ui-resizable-s">&hellip;</div>' +
					'</div>' +
					'<button>ok</button>' +
				'</section>'
			);
			update_position();
			// Disable the draggable
			$draggable.draggable('disable');
			Upfront.Behaviors.GridEditor.toggle_resizables(false);
			this.$el
				.find(".upfront_code-editor-section>div").each(function () {
					var $me = $(this),
						type = $me.attr("data-type") || "markup",
						code = "markup" === type ? $me.html() : '',
						editor = ace.edit(this),
						syntax = me.SYNTAX_TYPES[type],
					// Height settings
						$parent = me.$el.closest(".upfront-module"),
						$out = me.$el.find("section.upfront_code-element"),
						$button = me.$el.find("section button"),
						height = ($parent.height() - ($out.outerHeight() + $button.outerHeight())) - 4*Upfront.Settings.LayoutEditor.Grid.baseline
					;
					$me.height(
						(height < me.MIN_HEIGHT ? me.MIN_HEIGHT : height)
					);
					editor.getSession().setUseWorker(false);
					editor.setTheme("ace/theme/monokai");
					editor.getSession().setMode("ace/mode/" + syntax);
					if ("markup" === type) {
						if (code.length) editor.getSession().setValue(code);
						// Okay, so let's do Emmet too, why not
						//editor.setOption("enableEmmet", true); // Because it wieghs 360kb, that's why not :)
					}
					editors[type] = editor;
				}).end()
				.find(".upfront_code-switch")
					.on("click", function () {
						var $me = $(this),
							tgt = $me.attr("data-for"),
							$target = $me.siblings(".upfront_code-editor-section.upfront_code-" + tgt)
						;
						$(".upfront_code-switch,.upfront_code-editor-section").removeClass("active");
						$me.addClass("active");
						$target.addClass("active");
					})
				.end()
				.find(".upfront_code-editor-complex-wrapper")
					.resizable({
						handles: {
							s: ".handle"
						}
					})
					.on("resizestop", function (e, ui) {
						var $editors = me.$el.find(".upfront_code-editor-section>div"),
							diff = ui.size.height - me.$el.find(".upfront_code-switch").height(),
							pads = ui.element.outerHeight() - ui.element.height()
						;
						$editors.height(diff-pads);
						_(editors).invoke("resize");
				}).end()
				.find("button").on("click", function () {
					_(editors).each(function (editor, type) {
						me.model.set_property(type, editor.getValue(), true);
					});
					me.$el
						.find("section.upfront_code-element").replaceWith(me.get_content_markup()).end()
						.find("section.upfront_code-editor").remove()
					;
					me.is_editing = false;
					$draggable.draggable('enable');
					Upfront.Behaviors.GridEditor.toggle_resizables(true);
					me.trigger("code:model:updated");
				})
			;
			_(editors).each(function (editor, type) {
				editor.on("change", function () {
					me.model.set_property(type, editor.getValue(), true);
					me.$el.find("section.upfront_code-element").replaceWith(me.get_content_markup());
					if (me.script_error) {
						if (!me.$el.find(".error.javascript").length) me.$el.find(".upfront_code-switch:last").after('<div class="error javascript"><i class="upfront-icon-button" title="There is an error in your JS code"></i></div>');
					} else {
						me.$el.find(".error.javascript").remove();
					}
					update_position();
				});
			});
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