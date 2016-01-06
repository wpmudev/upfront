define([
	'scripts/upfront/settings/modules/menu-structure/menu-item-editor',
	'text!scripts/upfront/settings/modules/menu-structure/menu-item.tpl'
], function(MenuItemEditor, tpl) {
	var MenuItem = Backbone.View.extend({
		className: 'menu-structure-module-item',

		events: {
			'click .menu-item-header': 'toggleEditor'
		},

		initialize: function(options) {
			this.options = options || {};
			this.subViews = [];
			this.depth = this.options.depth || 0;
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
			this.$el.data('menu-item-object-id', this.model.get('menu-item-object-id'));
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
		}
	});

	return MenuItem;
});
