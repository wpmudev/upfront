define([
	'text!scripts/upfront/settings/modules/menu-structure/menu-item-editor.tpl'
], function(tpl) {
	var getPostTypes = function(){
		var types = [];

		_.each(Upfront.data.ugallery.postTypes, function(type){
			if(type.name != 'attachment') {
				types.push({name: type.name, label: type.label});
			}
		});

		return types;
	};

	var MenuItemEditor = Backbone.View.extend({
		className: 'menu-item-editor',

		events: {
			'click .menu-item-entry-input': 'showPagePostSelector'
		},

		initialize: function(options) {
			this.options = options || {};
		},

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

		showPagePostSelector: function(event) {
			if (event) {
				event.preventDefault();
			}

			var me = this,
				selectorOptions = {
					postTypes: getPostTypes()
				};

			Upfront.Views.Editor.PostSelector.open(selectorOptions).done(
				function(post) {
					me.model.set({'menu-item-url' : post.get('permalink')});
					Upfront.Util.post({
						action: 'upfront_update_single_menu_item',
						menuId: me.options.menuId,
						menuItemData: me.model.toJSON()
					});
					me.render();
				}
			);
		},
	});

	return MenuItemEditor;
});
