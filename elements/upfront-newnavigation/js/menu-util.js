define([], function () {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var MenuUtil = function() {
		var self = this;
		// Array of wp menus with all data
		var menus = Upfront.mainData.menus;
		// Array of {label: "Menu Name", value: "42"} items
		var menuList = _.map(menus, function (menu, index) {
			return  {label: menu.name, value: menu.term_id};
		});

		Upfront.Events.on('menu_element:menu_created', function(menuData) {
			menuData.term_id = menuData.term_id + '';
			menus.push(menuData);
			menuList.unshift({label: menuData.slug, value: menuData.term_id});
		});

		this.getMenuById = function(id) {
			var menu = _.findWhere(menus, {term_id: id});
			if (_.isUndefined(menu)) _.findWhere(menus, {term_id: id + ''})
			return menu;
		};

		this.getMenuSlugById = function(id) {
			return this.getMenuById(id).slug;
		};

		this.getMenuList = function() {
			return menuList;
		};
	};

	var menuUtil = new MenuUtil();

	return menuUtil;
});
