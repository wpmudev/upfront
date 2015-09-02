define([
], function() {
	var MenuItem = Backbone.View.extend({
		className: 'menu-structure-module-item',

		render: function() {
			// menu-item-db-id: 586
			// menu-item-object: "custom"
			// menu-item-object-id: "586"
			// menu-item-parent-id: "0"
			// menu-item-position: 1
			// menu-item-target: ""
			// menu-item-title: "Home"
			// menu-item-type: "custom"
			// menu-item-url: "http://local.wordpress.dev/"
			this.$el.html(this.model.get('menu-item-title') + ' ' + this.model.get('menu-item-type'));

			return this;
		}
	});

	return MenuItem;
});
