(function ($) {
define([
	'elements/upfront-newnavigation/js/menu-util',
	'scripts/upfront/settings/modules/menu-structure/menu-item',
	'text!scripts/upfront/settings/modules/menu-structure/menu-structure.tpl'
], function(MenuUtil, MenuStructureItem, tpl) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var scrollDown = false;
	var MenuStructureModule = Backbone.View.extend({
		className: 'settings_module menu_structure_module clearfix',
		handlesSaving: true,

		events: {
			'mouseenter .menu-item-header': 'enableSorting',
			'mouseleave .menu-item-header': 'disableSortingOnHeaderLeave',
			'click .add-menu-item': 'addItem',
		},

		initialize: function(options) {
			var me = this;
			this.options = options || {};

			this.listenTo(this.model.get('properties'), 'change', function() {
				me.reloadItems();
			});

			Upfront.Events.on('menu_element:edit', function(menuData) {
				me.reloadItems();
			});

			this.setup();
		},
		
		reloadItems: function() {
			this.setup();
			this.render();
		},

		setup: function() {
			this.menuId = this.model.get_property_value_by_name('menu_id');
			this.menuItems = [];
			this.menuItemViews = [];
			this.menu = MenuUtil.getMenuById(this.menuId);

			if (this.menuId === false) return;

			this._load_items();
		},

		/**
		 * Check if we have a promise queued in
		 *
		 * @param {Object} args_obj The raw key used for promise - will be stringified before checking
		 *
		 * @return {Boolean}
		 */
		_has_promise: function (args_obj) {
			var key = JSON.stringify(args_obj);
			return !!(this._promises || {})[key];
		},

		/**
		 * Queue up a promise
		 *
		 * @param {Object} args_obj The raw key used for promise - will be stringified before checking
		 * @param {$.Deferred} promise Promise to queue up
		 */
		_add_promise: function (args_obj, promise) {
			var key = JSON.stringify(args_obj);
			this._promises = this._promises || {};
			this._promises[key] = promise;
			return true;
		},

		/**
		 * Drops a promise from the queue
		 *
		 * @param {Object} args_obj The raw key used for promise - will be stringified before checking
		 */
		_drop_promise: function (args_obj) {
			var key = JSON.stringify(args_obj);
			this._promises = this._promises || {};
			this._promises[key] = false;
			return true;
		},

		/**
		 * Loads the menu items.
		 *
		 * Also hooks up to promise response and sets up `this.menuItemViews` collection.
		 */
		_load_items: function () {
			var me = this,
				args = {
					action: "upfront_new_load_menu_array",
					"data": this.menuId + ''
				},
				promise
			;
			if (this._has_promise(args)) return true; // We're already waiting for this

			promise = Upfront.Util.post(_.extend({}, args));
			this._add_promise(args, promise); // So, stack up this promise

			promise
				.success(function (response) {
					me.menuItems = response.data || [];
					_.each(me.menuItems, function(itemOptions, index) {
						var menuStructureItem = new MenuStructureItem({
							model: new Backbone.Model(itemOptions),
							menuId: me.menuId
						});
						me.menuItemViews.push(menuStructureItem);
						me.listenTo(menuStructureItem, 'change', function(data) {
							me.menuItems[index] = data;
							me.model.trigger('change');
						});
					});
					me.model.set_property('menu_items', response.data, true);
					me.model.trigger('change'); // do not trigger change on this.model.get('properties') it will cause endless recursion
																			// this is needed for menu element to re-render on item position change
					me.render();
					me._drop_promise(args); // And pop it off the stack once we're done
				})
				.error(function (response) {
					Upfront.Util.log("Error loading menu items");
				})
			;
			return true;
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
			
			/**
			 * This will scroll the panel down to the position of the newly added menu item i.e., 
			 * at the bottom of the list
			 */
			 
			if(scrollDown) {

				// Scroll down to where the new menu item has been added.
				var menu_items_panel = me.$el.closest('.uf-settings-panel--expanded');
				var scroll_wrap = menu_items_panel.closest('#sidebar-scroll-wrapper');
				scroll_wrap.scrollTop(menu_items_panel.height()-175);
				scrollDown = false;

			}
		},

		enableSorting: function(event) {
			if (this.sortingInProggres === true) return;
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
					me.sortingInProggres = true;
					me.watchItemDepth(ui.item);
				},
				stop: function(event, ui) {
					me.stopWatchingItemDepth(ui.item);
					me.updateItemsPosition(ui.item);
					me.sortingInProggres = false;
				},
			});
		},

		// Disable on mouse header leave only if sorting is not in progress,
		// otherwise sortable with break.
		disableSortingOnHeaderLeave: function() {
			if (this.sortingInProggres === true) return;
			this.disableSorting();
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

				// Increase tolerance for movement
				if (Math.abs(mouseX - event.pageX) < 15) return;

				me.updateSortableDepth(mouseX, event.pageX, movedItem);

				mouseX = event.pageX;
			});
		},

		updateSortableDepth: function(oldX, newX, item) {
			var itemDepth = item.hasClass('menu-structure-module-item') ?
					item.data('menuItemDepth') : item.children().first().data('menu-item-depth'),
				prevDepth = item.prev().data('menu-item-depth'),
				nextDepth = item.nextAll().not('.ui-sortable-placeholder').first().data('menu-item-depth');

			// Decrease item depth
			if (oldX > newX) {
				this.decreaseGroupDepth(itemDepth, prevDepth, nextDepth, item);
			}
			// Increase item depth
			if (oldX < newX) {
				this.increaseGroupDepth(itemDepth, prevDepth, nextDepth, item);
			}
		},

		decreaseGroupDepth: function(itemDepth, prevDepth, nextDepth, item) {
			var me = this;

			if (
				(prevDepth < itemDepth && nextDepth < itemDepth) ||
				(prevDepth === itemDepth && nextDepth < itemDepth) ||
				_.isUndefined(nextDepth) || // This is the last item in menu, allow any decrease
				nextDepth < itemDepth // This is the last submenu item, allow any decrease
			){
				if (item.hasClass('menu-structure-module-item')) {
					if (item.data('menuItemDepth') === 0) return; // Do not allow decrease below 0
					this.decreaseItemDepth(item);
					return;
				}

				if (item.children().first().data('menuItemDepth') === 0) return; // Do not allow decrease below 0
				item.children().each(function() {
					me.decreaseItemDepth($(this));
				});
			}
		},

		increaseGroupDepth: function(itemDepth, prevDepth, nextDepth, item) {
			var me = this;

			if (
				(prevDepth >= itemDepth) ||
				(prevDepth === itemDepth && nextDepth < itemDepth)
			){
				if (item.hasClass('menu-structure-module-item')) {
					this.increaseItemDepth(item);
					return;
				}
				item.children().each(function() {
					me.increaseItemDepth($(this));
				});
			}
		},

		decreaseItemDepth: function(item) {
			item.removeClass('menu-structure-item-depth-' + item.data('menuItemDepth'));
			item.data('menu-item-depth', item.data('menuItemDepth') - 1);
			item.addClass('menu-structure-item-depth-' + item.data('menuItemDepth'));
		},

		increaseItemDepth: function(item) {
			item.removeClass('menu-structure-item-depth-' + item.data('menuItemDepth'));
			item.data('menuItemDepth', item.data('menuItemDepth') + 1);
			item.addClass('menu-structure-item-depth-' + item.data('menuItemDepth'));
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

		updateItemsPosition: function() {
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
			var depthChange;
			var i;
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
					// Drop levels if depth decreased
					depthChange = currentDepth - itemDepth;
					for (i = 0; i < depthChange; i++) {
						parentItem = _.initial(parentItem);
					}
					currentDepth = itemDepth;
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
				}
			).done(
				function() {
					me.setup();
				}
			).fail(
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
					//'menu-item-position': -1,
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

						// Gotta do this to save item now with id to make it published
						Upfront.Util.post({
							action: 'upfront_update_single_menu_item',
							menuId: me.menuId,
							menuItemData: newItem
						}).done(function() {
							me.model.get_property_value_by_name('menu_items').unshift(newItem);
							me.model.get('properties').trigger('change');

							/**
							 * This will flag the settings panel to scroll down 
							 * to the position of the newly added menu item i.e., 
							 * at the bottom of the list
							 */
							scrollDown = true;
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
