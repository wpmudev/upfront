(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html'
], function(tpl) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);

var Views = {

	DEFAULT: "initial",


	initial: Backbone.View.extend({
		className: 'upfront_posts-initial upfront-initial-overlay-wrapper',
		tpl: _.template($template.filter("#initial").html()),
		events: {
			'click [href="#continue"]': "dispatch",
		},
		render: function () {
			var opts = new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: 'display_type',
					label: l10n.display_type_label_initial,
					layout: 'horizontal-inline',
					icon_class: 'upfront-posts-display_type',
					values: [
						{label: l10n.single_post, value: 'single', icon: 'upfront-posts-single'},
						{label: l10n.post_list, value: 'list', icon: 'upfront-posts-list'}
					]
				}),
				row = this.element.parent_module_view.model.get_property_value_by_name('row'),
				height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0;
			opts.on("changed", function (value) {
				this.model.set_property(this.options.property, value, true);
			}, opts);
			opts.render();
			
			if (Upfront.Application.user_can_modify_layout()) {
				this.$el.empty().append(this.tpl({l10n: l10n}));
				this.$el.css('min-height', ( height > 150 ? height : 150 ));
				this.$el.find(".options").empty().append(opts.$el);
			} else {
				this.$el.empty();
				this.$el.removeClass('upfront-initial-overlay-wrapper');
			}
		},
		dispatch: function (e) {
			e.preventDefault();
			e.stopPropagation();

			var has_type = !!this.model.get_property_value_by_name('display_type');
			if (!has_type) return false;

			this.model.trigger("change", this.model, {});
		},
	}),


	_view: Backbone.View.extend({

		render: function () {
			var me = this,
				model = Upfront.Util.model_to_json(this.model),
				props = model.properties || {},
				query = {}
			;
			if (window._upfront_get_current_query) query = window._upfront_get_current_query();
			//console.log(query);
			this._posts_load = Upfront.Util
				.post({
					action: "upfront_posts-load",
					data: {
						props: props,
						query: query
					}
				})
				.success(function (response) {
					if (response.data && response.data.posts) {
						var posts = '';
						_.each(response.data.posts, function (post) {
							posts += post;
						});
						me.$el.empty().append(me.tpl.main({
							posts: posts,
							pagination: response.data.pagination,
							l10n: l10n
						}));
						// Unbind pagination clicks
						me.$el.find(".uf-pagination a")
							.off("click")
							.on("click", function (e) {
								e.preventDefault();
								e.stopPropagation();
								return false;
							})
						;
					}
					else me.$el.empty().append(me.tpl.error({l10n: l10n}));
				})
				.error(function () {
					me.$el.empty().append(me.tpl.error({l10n: l10n}));
				})
			;
			this.$el.empty().append(this.tpl.load({l10n: l10n}));
		}
	}),

};

Views.list = Views._view.extend({
	className: 'upfront_posts-list',
	tpl: {
		main: _.template($template.filter("#list").html()),
		error: _.template($template.filter("#error").html()),
		load: _.template($template.filter("#loading").html())
	},
});

Views.single = Views._view.extend({
	className: 'upfront_posts-single',
	tpl: {
		main: _.template($template.filter("#single").html()),
		error: _.template($template.filter("#error").html()),
		load: _.template($template.filter("#loading").html())
	},
});

return Views;

});
})(jQuery);
