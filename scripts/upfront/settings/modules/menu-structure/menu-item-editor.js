define([
	'text!scripts/upfront/settings/modules/menu-structure/menu-item-editor.tpl'
], function(tpl) {
	var MenuItemEditor = Backbone.View.extend({
		className: 'menu-item-editor',
		render: function() {
			this.$el.html(_.template(tpl, {
				title: this.model.get('menu-item-title'),
				type:  Upfront.Util.guessLinkType(this.model.get('menu-item-url')),
				url: this.model.get('menu-item-url')
			}));

			this.renderTypeSelect();

			return this;
		},

		renderTypeSelect: function() {
			var me = this;

			var typeSelectValues = [];
			_.each(['external', 'entry', 'anchor', 'lightbox', 'email'], function(type) {
				typeSelectValues.push(this.getLinkTypeValue(type));
			}, this);

			this.typeSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: typeSelectValues,
				default_value: Upfront.Util.guessLinkType(this.model.get('menu-item-url')),
				change: function (value) {
					me.onTypeChange(value);
				}
			});

			this.typeSelect.render();
			this.$el.find('.item-links-to-label').after(this.typeSelect.el);
		},


		onTypeChange: function(value) {
			console.log('select value changed', value);
		},

		/**
		 * Determine proper link type select value/label based on link type. Used
		 * to populate link type select field.
		 */
		getLinkTypeValue: function(type) {
			var contentL10n = Upfront.Settings.l10n.global.content;
			switch(type) {
				case 'unlink':
					return { value: 'unlink', label: contentL10n.no_link };
				case 'external':
					return { value: 'external', label: contentL10n.url };
				case 'email':
					return { value: 'email', label: 'Email address' };
				case 'entry':
					return { value: 'entry', label: contentL10n.post_or_page };
				case 'anchor':
					return { value: 'anchor', label: contentL10n.anchor };
				case 'image':
					return { value: 'image', label: contentL10n.larger_image };
				case 'lightbox':
					return { value: 'lightbox', label: contentL10n.lightbox };
			}
		},
	});

	return MenuItemEditor;
});
