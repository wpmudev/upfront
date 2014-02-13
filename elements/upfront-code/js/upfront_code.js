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
			return '<section class="upfront_code-element clearfix">' + markup +
				'<style>' + style + '</style>' +
				'<script>;(function ($) {' + script + "\n" + '})(jQuery);</script>' + '</section>'
			;
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
		},

		on_edit: function () {
			if (this.is_editing) return false;
			this.is_editing = true;
			var me = this,
				update_position = function () {
					var $output = me.$el.find("section.upfront_code-element"),
						$editor = me.$el.find("section.upfront_code-editor"),
						top = $output.height() + $output.offset().top
					;
					$editor.offset({top: top});

				}
			;
			this.$el.append(
				'<section class="upfront_code-editor upfront_code-editor-complex">' +
					'<div class="upfront_code-editor-complex-wrapper">' +
						'<div class="upfront_code-switch active" data-for="markup">HTML</div>' +
						'<div class="upfront_code-switch" data-for="style">CSS</div>' +
						'<div class="upfront_code-switch" data-for="script">JS</div>' +
						'<div class="upfront_code-editor-section upfront_code-markup active">' +
							'<textarea data-type="markup" >' + (this.model.get_property_value_by_name('markup') || Upfront.data.upfront_code.defaults.fallbacks.markup)  + '</textarea>' +
						'</div>' +
						'<div class="upfront_code-editor-section upfront_code-style">' +
							'<textarea data-type="style" >' + (this.model.get_property_value_by_name('style') || Upfront.data.upfront_code.defaults.fallbacks.style) + '</textarea>' +
						'</div>' +
						'<div class="upfront_code-editor-section upfront_code-script">' +
							'<textarea data-type="script" >' + (this.model.get_property_value_by_name('script') || Upfront.data.upfront_code.defaults.fallbacks.script) + '</textarea>' +
						'</div>' +
					'</div>' +
					'<button>ok</button>' +
				'</section>'
			);
			update_position();
			this.$el
				.find(".upfront_code-switch")
					.on("click", function () {
						var $me = $(this),
							tgt = $me.attr("data-for"),
							$target = $me.siblings(".upfront_code-editor-section.upfront_code-" + tgt)
						;
						$(".upfront_code-switch,.upfront_code-editor-section").removeClass("active");
						$me.addClass("active");
						$target.addClass("active").find("textarea").focus();

					})
				.end()
				.find("textarea")
					.on("keyup change", function () {
						// What about the realtime syntax highlighting?
						me.update_property.apply(this, [me.model]);
						me.$el.find("section.upfront_code-element").replaceWith(me.get_content_markup());
						update_position();
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
		var type = this.model.get_property_value_by_name("code_selection_type");
		if (!type) this.render_initial_view();
		else this.render_code_view();
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