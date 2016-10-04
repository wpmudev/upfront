define([], function () {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var MenuUtil = function() {
		var self = this;
		// Array of wp menus with all data
		var wpMenus = Upfront.mainData.menus;
		// Array of {label: "Menu Name", value: "42"} items
		var selectMenuOptions = _.map(wpMenus, function (menu, index) {
			return  {label: menu.name, value: menu.term_id};
		});

		this.getMenuById = function(id) {
			var id_str = id + '',
				id_int = parseInt(id_str, 10),
				menu = _.findWhere(wpMenus, {term_id: id_int})
			;
			if (_.isUndefined(menu))
				menu = _.findWhere(wpMenus, {term_id: id_str});
			return menu;
		};

		this.getMenuSlugById = function(id) {
			return (this.getMenuById(id) || {}).slug;
		};

		this.getSelectMenuOptions = function() {
			return selectMenuOptions;
		};

		this.addMenu = function(menuData) {
			menuData.term_id = menuData.term_id + '';
			wpMenus.push(menuData);
			selectMenuOptions.unshift({label: menuData.slug, value: menuData.term_id});
		};

		this.deleteMenu = function(menuId) {
			selectMenuOptions = _.reject(selectMenuOptions, function(option) {
				return option.value === menuId;
			});
			wpMenus = _.reject(wpMenus, function(menu) {
				return menu['term_id'] === menuId;
			});
		};

		Upfront.Events.on('menu_element:menu_created', function(menuData) {
			self.addMenu(menuData);
		});

		Upfront.Events.on('menu_element:delete', function(menuId) {
			self.deleteMenu(menuId);
		});
	};

	var menuUtil = new MenuUtil();

	return menuUtil;
});
