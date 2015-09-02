define([
	'text!scripts/upfront/settings/modules/menu-structure/menu-item.tpl'
], function(tpl) {
	var MenuItem = Backbone.View.extend({
		className: 'menu-structure-module-item',

		initialize: function(options) {
			this.options = options || {};
			this.subViews = [];
			this.depth = this.options.depth || 0;
			var sub = this.model.get('sub');

			if (sub) {
				_.each(sub, function(itemOptions) {
					this.subViews.push(
						new MenuItem({
							model: new Backbone.Model(itemOptions),
							depth: this.depth + 1
						})
					);
				}, this);
			}
		},

		render: function() {
			var me = this;
			// menu-item-db-id: 586
			// menu-item-object: "custom"
			// menu-item-object-id: "586"
			// menu-item-parent-id: "0"
			// menu-item-position: 1
			// menu-item-target: ""
			// menu-item-title: "Home"
			// menu-item-type: "custom"
			// menu-item-url: "http://local.wordpress.dev/"
			this.$el.html(_.template(tpl, {
				title: this.model.get('menu-item-title'),
				type:  this.model.get('menu-item-type')
			}));
			this.$el.data('menu-item-object-id', this.model.get('menu-item-object-id'));
			this.$el.data('menu-item-depth', this.depth);
			this.$el.addClass('menu-structure-item-depth-' + this.depth);

			// Gotta let this.$el render to use $.after()
			setTimeout(function() {
				_.each(me.subViews, function(view) {
					me.$el.after(view.render().el);
				});
			}, 100);

			return this;
		}
	});

	return MenuItem;
});
