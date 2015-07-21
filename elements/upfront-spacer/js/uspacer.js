(function ($) {

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
		get_content_markup: function () {
			return "";
		},
		init: function () {
			this.listenTo(Upfront.Events, 'upfront:wrappers:before_fix_height', this.before_apply_height_from_wrapper);
			this.listenTo(Upfront.Events, 'upfront:wrappers:after_fix_height', this.apply_height_from_wrapper);
		},
		before_apply_height_from_wrapper: function (from_view) {
			if ( !this.parent_module_view || !this.parent_module_view.parent_view || this.parent_module_view.parent_view != from_view ) {
				return;
			}
			this.$el.find('>.upfront-object').css('min-height', '');
		},
		apply_height_from_wrapper: function (from_view) {
			if ( !this.parent_module_view || !this.parent_module_view.parent_view || this.parent_module_view.parent_view != from_view ) {
				return;
			}
			var $wrap = this.$el.closest('.upfront-wrapper');
			$wrap.addClass('upfront-wrapper-spacer');
			this.$el.find('>.upfront-object').css('min-height', $wrap.height());
		}
	});

	Upfront.Models.UspacerModel = UspacerModel;
	Upfront.Views.UspacerView = UspacerView;

})(jQuery);
