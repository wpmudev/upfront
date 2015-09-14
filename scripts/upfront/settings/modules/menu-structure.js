(function ($) {
define([
	'elements/upfront-newnavigation/js/menu-util',
	'scripts/upfront/settings/modules/menu-structure/menu-item',
	'text!scripts/upfront/settings/modules/menu-structure/menu-structure.tpl'
], function(MenuUtil, MenuStructureItem, tpl) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var MenuStructureModule = Backbone.View.extend({
		className: 'settings_module menu_structure_module clearfix',
		handlesSaving: true,

		events: {
			'mouseenter .menu-item-header': 'enableSorting',
			'mouseleave .menu-item-header': 'disableSorting',
			'click .add-menu-item': 'addItem'
		},

		initialize: function(options) {
			var me = this;
			this.options = options || {};

			this.listenTo(this.model.get('properties'), 'change', function() {
				me.setup();
				me.render();
			});

			Upfront.Events.on('menu_element:edit', function(menuData) {
				me.setup();
				me.render();
			});

			this.setup();
		},

		setup: function() {
			var me = this;

			this.menuId = this.model.get_property_value_by_name('menu_id');
			this.menuItems = [];
			this.menuItemViews = [];
			this.menu = MenuUtil.getMenuById(this.menuId);

			if (this.menuId === false) return;

			Upfront.Util.post({"action": "upfront_new_load_menu_array", "data": this.menuId})
				.success(function (response) {
					me.menuItems = response.data || [];
					_.each(me.menuItems, function(itemOptions) {
						me.menuItemViews.push(new MenuStructureItem({
							model: new Backbone.Model(itemOptions),
							menuId: me.menuId
						}));
					});
					me.render();
				})
				.error(function (response) {
					Upfront.Util.log("Error loading menu items");
				})
			;
		},

		render: function() {
			var me = this,
				$body;

			this.$el.html(tpl);

			if (this.menuId === false) return;

			$body = this.$el.find('.menu-structure-body');

			_.each(this.menuItemViews, function(view) {
				$body.append(view.render().el);
			});
		},

		enableSorting: function(event) {
			// highlight all sortables
			var $items = this.$el.find('.menu-structure-module-item'),
				hoveredItem = $(event.target).parent(),
				addedChildren = false,
				me = this,
				hoveredItemDepth;

			// First add sortable class to all items
			$items.addClass('menu-structure-sortable-item');

			// Leave only items that are not children of current item sortable
			// Than make a group that is wrapped with sortable from hovered item
			// and its children.
			$items.each(function() {
				if (addedChildren) {
					return;
				}
				if (!_.isUndefined(hoveredItemDepth) && $(this).data('menuItemDepth') <= hoveredItemDepth) {
					addedChildren = true;
					return;
				}

				if (!_.isUndefined(hoveredItemDepth) && $(this).data('menuItemDepth') > hoveredItemDepth) {
					$(this).addClass('hovered-item-group-member');
					$(this).removeClass('menu-structure-sortable-item');
					return;
				}

				if (_.isUndefined(hoveredItemDepth) && $(this).is(hoveredItem)) {
					hoveredItemDepth = $(this).data('menuItemDepth');
					$(this).addClass('hovered-item-group-member');
					$(this).removeClass('menu-structure-sortable-item');
				}
			});
			this.$el.find('.hovered-item-group-member').wrapAll('<div class="menu-structure-sortable-item"></div>');

			this.$el.sortable({
				axis: "y",
				items: '.menu-structure-sortable-item',
				start: function(event, ui) {
					me.watchItemDepth(ui.item);
				},
				stop: function(event, ui) {
				me.stopWatchingItemDepth(ui.item);
					me.updateItemsPosition(ui.item);
				},
			});
		},

		disableSorting: function() {
			var $items = this.$el.find('.menu-structure-module-item'),
				$hoveredItems = this.$el.find('.hovered-item-group-member');

			$hoveredItems.unwrap();
			$hoveredItems.removeClass('hovered-item-group-member');
			$items.removeClass('menu-structure-sortable-item');
			this.$el.sortable('destroy');
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
			}).fail(
					function(response) {
						Upfront.Util.log('Failed saving menu items.');
					}
				);
		},

		addItem: function() {
			var me = this,
				newItem = {
					'menu-item-object': 'custom',
					'menu-item-parent-id': 0,
					'menu-item-position': 1,
					'menu-item-target': '',
					'menu-item-title': 'New Item',
					'menu-item-type': 'custom',
					'menu-item-url': ''
				};

			Upfront.Util.post({
				action: 'upfront_update_single_menu_item',
				menuId: this.menuId,
				menuItemData: newItem
			}).done(
					function(response) {
						newItem['menu-item-db-id'] = response.data.itemId;
						newItem['menu-item-object-id'] = response.data.itemId + '';
						me.menuItemViews.unshift(new MenuStructureItem({
							model: new Backbone.Model(newItem),
							menuId: me.menuId
						}));
						me.render();

						// Gotta do this to save item now with id to make it published
						Upfront.Util.post({
							action: 'upfront_update_single_menu_item',
							menuId: me.menuId,
							menuItemData: newItem
						});
					}
				).fail(
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
