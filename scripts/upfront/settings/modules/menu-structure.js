(function ($) {
define([
	'elements/upfront-newnavigation/js/menu-util',
	'scripts/upfront/settings/modules/menu-structure/menu-item'
], function(MenuUtil, MenuStructureItem) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var MenuStructureModule = Backbone.View.extend({
		className: 'settings_module menu_structure_module clearfix',
		handlesSaving: true,

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

			this.$el.sortable({
				axis: "y",
				items: '.menu-structure-module-item',
				start: function(event, ui) {
					me.watchItemDepth(ui.item);
				},
				stop: function(event, ui) {
					me.stopWatchingItemDepth(ui.item);
					me.updateItemsPosition(ui.item);
				},
			});
		},

		watchItemDepth: function(movedItem) {
			var me = this,
				mouseX;

			this.$el.on('mousemove', function(event) {
				if (_.isUndefined(mouseX)) {
					mouseX = event.pageX;
					return;
				}
				me.updateItemDepth(mouseX, event.pageX, movedItem);

				mouseX = event.pageX;
			});
		},

		updateItemDepth: function(oldX, newX, item) {
			// Decrease item depth
			var itemDepth = item.data('menu-item-depth'),
				prevDepth = item.prev().data('menu-item-depth'),
				nextDepth = item.nextAll().not('.ui-sortable-placeholder').first().data('menu-item-depth'),
				newDepth = itemDepth;

			if (oldX > newX) {
				this.decreaseItemDepth(newDepth - 1, itemDepth, prevDepth, nextDepth, item);
			}
			// Increase item depth
			if (oldX < newX) {
				this.increaseItemDepth(newDepth + 1, itemDepth, prevDepth, nextDepth, item);
			}
		},

		decreaseItemDepth: function(newDepth, itemDepth, prevDepth, nextDepth, item) {
			if (prevDepth < itemDepth && nextDepth < itemDepth) {
				item.data('menu-item-depth', newDepth);
				item.removeClass('menu-structure-item-depth-' + itemDepth);
				item.addClass('menu-structure-item-depth-' + newDepth);
			}
			if (prevDepth === itemDepth && nextDepth < itemDepth) {
				item.data('menu-item-depth', newDepth);
				item.removeClass('menu-structure-item-depth-' + itemDepth);
				item.addClass('menu-structure-item-depth-' + newDepth);
			}
		},

		increaseItemDepth: function(newDepth, itemDepth, prevDepth, nextDepth, item) {
			if (prevDepth >= itemDepth) {
				item.data('menu-item-depth', newDepth);
				item.removeClass('menu-structure-item-depth-' + itemDepth);
				item.addClass('menu-structure-item-depth-' + newDepth);
			}
			if (prevDepth === itemDepth && nextDepth < itemDepth) {
				item.data('menu-item-depth', newDepth);
				item.removeClass('menu-structure-item-depth-' + itemDepth);
				item.addClass('menu-structure-item-depth-' + newDepth);
			}
		},

		stopWatchingItemDepth: function() {
			this.$el.off('mousemove');
		},

		flattenItem: function(item) {
			var me = this,
				allItems = [item];

			if (item.sub) {
				_.each(item.sub, function(subItem) {
					allItems = _.union(allItems, me.flattenItem(subItem));
				});
			}

			return allItems;
		},

		updateItemsPosition: function(movedItem) {
			var me = this;
			// Flatten items
			var oldItems = [];
			_.each(this.menuItems, function(item) {
				oldItems = _.union(oldItems, me.flattenItem(item));
			});

			// Get all items
			var $items = this.$el.find('.menu-structure-module-item');
			var changedItems = [];
			// Start from top and keep track of parent item.
			// It needs to be an array because multiple levels of depth
			var parentItem = [0];
			var prevItemId = 0;
			var position = 1;
			var currentDepth = 0;
			$items.each(function() {
				var itemData = _.findWhere(
					oldItems, {'menu-item-object-id': $(this).data('menuItemObjectId')}
				);
				var itemDepth = $(this).data('menuItemDepth');

				// If depth increased change parent to previous item id
				if (itemDepth > currentDepth) {
					parentItem.push(prevItemId);
					currentDepth = currentDepth + 1;
				} else if (itemDepth === currentDepth) {
					// do nothing
				} else if (itemDepth < currentDepth) {
					// Drop one level if depth decreased
					parentItem = _.initial(parentItem);
					currentDepth = currentDepth - 1;
				}

				changedItems.push(_.extend(itemData, {
					'menu-item-parent-id': _.last(parentItem) || 0,
					'menu-item-position': position
				}));

				// Must be done in the end
				position = position + 1;
				prevItemId = itemData['menu-item-object-id'];
			});

			Upfront.Util.post({
				action: 'upfront_update_menu_items',
				data: {
					items: changedItems,
					menuId: this.menuId
				}
			})..fail(
					function(response) {
						Upfront.Util.log('Failed saving menu items.');
					}
				);
		},

		save_fields: function() {
		}
	});

	return MenuStructureModule;
});
})(jQuery);
