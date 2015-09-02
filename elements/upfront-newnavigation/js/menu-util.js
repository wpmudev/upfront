define([], function () {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var CurrentMenuItemData = Backbone.Model.extend({
		defaults: {
			'id':  false,
			'name':  false,
			'url':  false,
			'model_true':  true,
			"menu_id":     false,
			"menuList":    false
		}
	});

	var MenuUtil = function() {
		var self = this;
		var currentMenuItemData = new CurrentMenuItemData();
		var menus;

		Upfront.Events.on('menu_element:menu_created', function(menuData) {
			menus.push({name: menuData.slug, term_id: menuData.id});
			var menuList = currentMenuItemData.get('menuList');
			//menuList.push({label: menuData.slug, value: menuData.id});
		});

		// Initialize menu list
		Upfront.Util.post({"action": "upfront_new_load_menu_list"})
			.success(function (ret) {
				menus = ret.data;
				var values = _.map(ret.data, function (menu, index) {
					return  {label: menu.name, value: menu.term_id};
				});
				self.setMenuList(values);
			})
		.error(function (ret) {
			Upfront.Util.log("Error loading menu list");
		});

		this.setMenus = function(newMenus) {
			menus = newMenus;
		},

		this.getMenuSlugById = function(id) {
			return _.findWhere(menus, {term_id: id}).slug;
		};

		this.getMenuById = function(id) {
			return _.findWhere(menus, {term_id: id});
		};

		this.getMenuList = function() {
			var menuList = currentMenuItemData.get('menuList');
			//menuList.push({label: l10n.create_new, value: -1});
			return menuList;
		};

		this.setMenuList = function(values) {
			currentMenuItemData.set({menuList: values});
		};

		this.set = function(options) {
			currentMenuItemData.set(options);
		};
	};

	var menuUtil = new MenuUtil();

	return menuUtil;
});
