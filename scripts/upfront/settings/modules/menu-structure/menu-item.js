define([
	'scripts/upfront/settings/modules/menu-structure/menu-item-editor',
	'text!scripts/upfront/settings/modules/menu-structure/menu-item.tpl'
], function(MenuItemEditor, tpl) {
	var MenuItem = Backbone.View.extend({
		className: 'menu-structure-module-item',

		events: {
			'click .menu-item-header': 'toggleEditor',
			'click .menu-item-delete': 'deleteItem'
		},

		initialize: function(options) {
			this.options = options || {};
			this.subViews = [];
			this.depth = this.options.depth || 0;
			this.parent_view = options.parent_view;
			var sub = this.model.get('sub');

			if (sub) {
				_.each(sub, function(itemOptions) {
					this.subViews.unshift(
						new MenuItem({
							model: new Backbone.Model(itemOptions),
							depth: this.depth + 1,
							menuId: this.options.menuId
						})
					);
				}, this);
			}
		},

		render: function() {
			var me = this;
			this.$el.html(_.template(tpl, {
				title: this.model.get('menu-item-title'),
				type:  this.getLinkTypeLabel(Upfront.Util.guessLinkType(this.model.get('menu-item-url')))
			}));
			this.$el.data('menu-item-db-id', this.model.get('menu-item-db-id'));
			this.$el.data('menu-item-depth', this.depth);
			this.$el.addClass('menu-structure-item-depth-' + this.depth);

			var editor = new MenuItemEditor({
				model: this.model,
				menuId: this.options.menuId
			});
			this.$el.append(editor.render().el);
			this.listenTo(editor, 'change', function() {
				me.trigger('change', me.model.toJSON());
			});

			// Gotta let this.$el render to use $.after()
			setTimeout(function() {
				_.each(me.subViews, function(view) {
					me.$el.after(view.render().el);
				});
			}, 100);

			this.delegateEvents();

			return this;
		},

		toggleEditor: function() {
			this.$el.toggleClass('menu-item-expanded');
			this.$el.find('.menu-item-editor').toggle();
		},

		/**
		 * Determine proper link type select value/label based on link type. Used
		 * to populate link type select field.
		 */
		getLinkTypeLabel: function(type) {
			var contentL10n = Upfront.Settings.l10n.global.content;
			switch(type) {
				case 'unlink':
					return contentL10n.no_link ;
				case 'external':
					return contentL10n.url;
				case 'email':
					return contentL10n.email_address;
				case 'entry':
					return contentL10n.post_or_page;
				case 'anchor':
					return contentL10n.anchor;
				case 'image':
					return contentL10n.larger_image;
				case 'lightbox':
					return contentL10n.lightbox;
			}
		},

		deleteItem: function(e) {
			e.preventDefault();
			e.stopPropagation();

			if(typeof this.model.get('menu-item-db-id') != 'undefined') {
				Upfront.Util.post({"action": "upfront_new_delete_menu_item", "menu_item_id": this.model.get('menu-item-db-id')})
					.success(function (ret) {
						//Make sure deleted element is removed from the list
						Upfront.Events.trigger("menu_element:edit");
					})
					.error(function (ret) {
						Upfront.Util.log("Error Deleting Menu Item");
					})
				;
			}
		}
	});

	return MenuItem;
});
