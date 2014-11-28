(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html'
], function(tpl) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);

var Views = {
	
	DEFAULT: "initial",

	
	initial: Backbone.View.extend({
		className: 'upfront_posts-initial',
		tpl: _.template($template.filter("#initial").html()),
		events: {
			'click [href="#single"]': "initiate_single",
			'click [href="#list"]': "initiate_list",
			'click [href="#continue"]': "dispatch",
		},
		render: function () {
			this.$el.empty().append(this.tpl({l10n: l10n}));
		},
		initiate_single: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.model.set_property("display_type", "single", true);
		},
		initiate_list: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.model.set_property("display_type", "list", true);
		},
		dispatch: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.model.trigger("change");
		},
	}),


	_view: Backbone.View.extend({

		render: function () {
			var me = this,
				model = Upfront.Util.model_to_json(this.model),
				props = model.properties || {}
			;
			Upfront.Util
				.post({
					action: "upfront_posts-load",
					data: props
				})
				.success(function (response) {
					if (response.data && response.data.posts) {
						var posts = '';
						_.each(response.data.posts, function (post) {
							posts += post;
						});
						me.$el.empty().append(me.tpl.main({
							posts: posts,
							l10n: l10n
						}));
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