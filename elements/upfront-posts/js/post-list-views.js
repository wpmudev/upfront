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
			'click [href="#continue"]': "dispatch"
		},
		render: function () {
			var single = new Upfront.Views.Editor.Field.Button({
				model: this.model,
					label: l10n.single_post,
					compact: true,
					on_click: function(){
						this.model.set_property('display_type', 'single', true);
					}
				}),
				list = new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.post_list,
					compact: true,
					on_click: function(){
						this.model.set_property('display_type', 'list', true);
					}
				}),

				row = this.element.parent_module_view.model.get_property_value_by_name('row'),
				height = row ? row * Upfront.Settings.LayoutEditor.Grid.baseline : 0;
			
			// Render Buttons
			single.render();
			list.render();

			if (Upfront.Application.user_can_modify_layout()) {
				this.$el.empty().append(this.tpl({l10n: l10n}));
				this.$el.css('min-height', ( height > 150 ? height : 150 ));
				this.$el.find('.upfront_posts-initial-content').empty().append(single.$el).append(list.$el);
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
		}
	}),


	_view: Backbone.View.extend({
		_do_cache: true,

		render: function (silent) {
			var me = this,
				model = Upfront.Util.model_to_json(this.model),
				props = model.properties || {},
				query = {}
			;
			if (window._upfront_get_current_query) query = window._upfront_get_current_query();
			//console.log(query);
			silent = _.isUndefined(silent) ? false : silent;
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
						/*var posts = '';
						_.each(response.data.posts, function (post) {
							posts += post;
						});
						me.$el.empty().append(me.tpl.main({
							posts: posts,
							pagination: response.data.pagination,
							l10n: l10n
						}));*/

						me.render_objects_view(response.data.posts, silent);

						if ( me._do_cache ) {
							me._cached_data = response.data.posts;
						}

						// Unbind pagination clicks
						me.$el.find(".uf-pagination a")
							.off("click")
							.on("click", function (e) {
								e.preventDefault();
								e.stopPropagation();
								return false;
							})
						;
						// Unbind title clicks
						me.$el.find(".uposts-part.title a")
							.off("click")
							.on("click", function (e) {

								var $me = $(this),
									href = $me.attr("href")
								;
								// Only if it's an absolute URL
								if (href.match(/^https?\:/)) {
									e.preventDefault();
									e.stopPropagation();

									window.location = href;

									return false;
								}
							})
						;
						me.$el.empty();
					}
					else {
						if ( !silent ) me.$el.empty().append(me.tpl.error({l10n: l10n}));
					}
				})
				.error(function () {
					if ( !silent ) me.$el.empty().append(me.tpl.error({l10n: l10n}));
				})
			;
			if ( !silent ) this.$el.empty().append(this.tpl.load({l10n: l10n}));
		},

		/**
		 * Re-render with the same cached data
		 * @param {Array} only_objects
		 */
		rerender: function (only_objects) {
			if ( this._cached_data ) {
				this.render_objects_view(this._cached_data);
			}
			else {
				this.render();
			}
		},

		/**
		 * Render the posts object view
		 * @param {Object} posts
		 */
		render_objects_view: function (posts, silent) {
			var me = this;
			_.each(posts, function (data, post_id) {
				me.element.render_post_view(post_id, data, silent);
			});
			Upfront.Events.trigger('entity:object:refresh', me);
		}
	})

};

Views.list = Views._view.extend({
	className: 'upfront_posts-list',
	tpl: {
		main: _.template($template.filter("#list").html()),
		error: _.template($template.filter("#error").html()),
		load: _.template($template.filter("#loading").html())
	}
});

Views.single = Views._view.extend({
	className: 'upfront_posts-single',
	tpl: {
		main: _.template($template.filter("#single").html()),
		error: _.template($template.filter("#error").html()),
		load: _.template($template.filter("#loading").html())
	}
});

return Views;

});
})(jQuery);
