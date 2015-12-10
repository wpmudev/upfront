(function ($) {

define([
	"text!upfront/templates/object.html"
], function (object_template) {
	var l10n = Upfront.Settings.l10n.spacer_element;

	var UspacerModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			this.init_property("type", "UspacerModel");
			this.init_property("view_class", "UspacerView");
			this.init_property("element_id", Upfront.Util.get_unique_id("spacer-object"));
			this.init_property("class", "c24");
			this.init_property("has_settings", 0);
			this.init_property("id_slug", "uspacer");
		}
	});

	var UspacerView = Upfront.Views.ObjectView.extend({
		className: 'upfront-spacer',
		display_size_hint: false,
		get_content_markup: function () {
			return "";
		},
		init: function () {
			this.listenTo(Upfront.Events, 'upfront:wrappers:before_fix_height', this.before_apply_height_from_wrapper);
			this.listenTo(Upfront.Events, 'upfront:wrappers:after_fix_height', this.apply_height_from_wrapper);
		},
		render: function () {
			var props = {},
				me = this,
				column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
				model, template
			;
			// Force add upfront-object-view class as element object can override the view and left without this class
			this.$el.addClass('upfront-object-view');

			this.model.get("properties").each(function (prop) {
				props[prop.get("name")] = prop.get("value");
			});

			props.preset = props.preset || '';

			model = _.extend(this.model.toJSON(), {
				"properties": props,
				"buttons": "",
				"content": "",
				"height": 0,
				"extra_buttons": ""
			});
			template = _.template(object_template, model);

			Upfront.Events.trigger("entity:object:before_render", this, this.model);
			// Listen to module resize and drop event
			if (this.parent_module_view) {
				this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resize_start');
				this.listenTo(this.parent_module_view, 'entity:resize_start', this.on_element_resize_start);
				this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resizing');
				this.listenTo(this.parent_module_view, 'entity:resizing', this.on_element_resizing);
				this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:resize_stop');
				this.listenTo(this.parent_module_view, 'entity:resize_stop', this.on_element_resize);

				this.stopListening((this._previous_parent_module_view || this.parent_module_view), 'entity:drop');
				this.listenTo(this.parent_module_view, 'entity:drop', this.on_element_drop);

				// Make sure module class is added
				this.parent_module_view.$el.find('> .upfront-module').addClass('upfront-module-spacer');
				this.parent_module_view.model.add_class('upfront-module-spacer');
			}

			this.$el.html(template);

			Upfront.Events.trigger("entity:object:after_render", this, this.model);
		},
		// Don't have any controls
		getControlItems: function () {
			return _([]);
		},
		createControls: function () {
			return false;
		},
		apply_paddings: function () {
			return false;
		},
		before_apply_height_from_wrapper: function (from_view) {
			if (!this.parent_module_view || !this.parent_module_view.parent_view || this.parent_module_view.parent_view != from_view) return;
			if (!this.$el.is(':visible')) return;
			var $wrap = this.$el.closest('.upfront-wrapper');
			$wrap.addClass('upfront-wrapper-spacer');
			this.$el.find('>.upfront-object').css('min-height', '');
		},
		apply_height_from_wrapper: function (from_view) {
			if (!this.parent_module_view || !this.parent_module_view.parent_view || this.parent_module_view.parent_view != from_view) return;
			if (!this.$el.is(':visible')) return;
			var $wrap = this.$el.closest('.upfront-wrapper');
			this.$el.find('>.upfront-object').css('min-height', $wrap.height());
		}
	});

	Upfront.Models.UspacerModel = UspacerModel;
	Upfront.Views.UspacerView = UspacerView;
});

})(jQuery);
