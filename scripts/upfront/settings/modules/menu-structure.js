(function ($) {
define([
	'elements/upfront-newnavigation/js/menu-util',
	'scripts/upfront/settings/modules/menu-structure/menu-item'
], function(MenuUtil, MenuStructureItem) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var MenuStructureModule = Backbone.View.extend({
		className: 'settings_module menu_structure_module clearfix',

		initialize: function(options) {
			var me = this;
			this.options = options || {};
			this.menuId = this.model.get_property_value_by_name('menu_id');
			this.menu = MenuUtil.getMenuById(this.menuId);
			this.menuItems = [];
			this.menuItemViews = [];
			// Menu item properties:
			// name: "top-nav-menu"
			// parent: "0"
			// slug: "top-nav-menu"
			// taxonomy: "nav_menu"
			// term_id: "9"
			// term_taxonomy_id: "9"
			Upfront.Util.post({"action": "upfront_new_load_menu_array", "data": this.menuId})
				.success(function (response) {
					me.menuItems = response.data || [];
					_.each(me.menuItems, function(itemOptions) {
						me.menuItemViews.push(new MenuStructureItem({model: new Backbone.Model(itemOptions)}));
					});
					me.render();
				})
				.error(function (response) {
					Upfront.Util.log("Error loading menu items");
				})
			;
		},
		render: function() {
			var me = this;

			this.$el.html('');

			if (_.isEmpty(this.menuItems)) {
				this.$el.html('Loading...');
				return;
			}

			_.each(this.menuItemViews, function(view) {
				this.$el.append(view.render().el);
			}, this);
		},

		save_fields: function() {
			console.log('here be saved fields');
		}
	});

	return MenuStructureModule;
});
})(jQuery);
