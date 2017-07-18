(function ($) {
define([
	'text!scripts/upfront/settings/modules/menu-structure/menu-item-editor.tpl'
], function(tpl) {
	var getLightBoxes = function() {
		var lightboxes = [],
			regions = Upfront.Application.layout.get('regions');

		_.each(regions.models, function(model) {
			if(model.attributes.sub == 'lightbox') {
				lightboxes.push({id: '#' + model.get('name'), label: model.get('title')});
			}
		});

		return lightboxes;
	};

	var getAnchors = function() {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [],
			find;

		find = function (modules) {
			modules.each(function(module) {
				var group_anchor = module.get_property_value_by_name("anchor");
				if (group_anchor && group_anchor.length) {
					anchors.push({id: '#' + group_anchor, label: group_anchor});
				}
				if (module.get("objects")) {
					module.get("objects").each(function (object) {
						var anchor = object.get_property_value_by_name("anchor");
						if (anchor && anchor.length) {
							anchors.push({id: '#' + anchor, label: anchor});
						}
					});
				} else if ( module.get("modules") ) {
					find(module.get("modules"));
				}
			});
		};

		regions.each(function(r) {
			find(r.get("modules"));
		});

		return anchors;
	};

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
			'click .menu-item-entry-input': 'showPagePostSelector',
			'keydown .menu-item-lightbox-input': 'onLightboxNameInputChange',
			'keydown .menu-item-external-input': 'onUrlNameKeydown',
			'change .menu-item-external-input': 'onUrlNameChange',
			'keydown .menu-item-email-input': 'onEmailNameKeydown',
			'change .menu-item-email-input': 'onEmailNameChange',
			'keydown .menu-item-title': 'onItemNameKeydown',
			'change .menu-item-title': 'onItemNameChange',
			'click .link-panel-lightbox-trigger': 'visit_lightbox'
		},

		initialize: function(options) {
			this.options = options || {};
			this.type = Upfront.Util.guessLinkType(this.model.get('menu-item-url'));
		},

		render: function() {
			var url = this.model.get('menu-item-url');
			var lightbox = url.match(/^#ltb-/) !== null ? url : false
			this.$el.html(_.template(tpl, {
				title: this.model.get('menu-item-title'),
				type:  this.type,
				lightboxes: getLightBoxes(),
				url: url,
				lightbox: lightbox
			}));

			this.renderTypeSelect();

			if (this.type === 'anchor') {
				this.renderAnchorSelect();
			}

			if (this.type === 'lightbox' && getLightBoxes()) {
				this.renderLightBoxesSelect();
			}

			if (this.type !== 'anchor' && this.type !== 'anchor') {
				this.renderLinkTargetSelect();
			}

			return this;
		},

		renderTypeSelect: function() {
			var me = this;

			var typeSelectValues = [];
			_.each(['unlink', 'external', 'entry', 'anchor', 'lightbox', 'email'], function(t) {
				typeSelectValues.push(this.getLinkTypeValue(t));
			}, this);

			this.typeSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: typeSelectValues,
				default_value: this.type || 'external',
				change: function (value) {
					me.onTypeChange(value);
				}
			});

			this.typeSelect.render();
			this.$el.find('.item-links-to-label').after(this.typeSelect.el);
		},

		renderLinkTargetSelect: function() {
			var me = this;

			var targetSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: [
					{ value: '', label: 'Same Browser Tab' },
					{ value: '_blank', label: 'New Browser Tab' }
				],
				default_value: this.model.get('menu-item-target'),
				change: function (value) {
					me.onTargetChange(value);
				}
			});

			targetSelect.render();
			this.$el.find('.menu-item-target-label').after(targetSelect.el);
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
					return { value: 'email', label: contentL10n.email_address };
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
					me.model.set({'menu-item-object': post.get('post_type') });
					me.model.set({'menu-item-object-id': post.get('ID') });
					me.saveItem();
					me.render();
				}
			);
		},

		saveItem: function() {
			var me = this;
			Upfront.Util.post({
				action: 'upfront_update_single_menu_item',
				menuId: this.options.menuId,
				menuItemData: this.model.toJSON()
			}).done( function() {
				me.trigger('change');
			});
		},

		onTypeChange: function(value) {
			// First reset, we don't want funny results when changing from one type to another.
			this.model.set({'menu-item-url': ''});
			this.model.set({'menu-item-object': '' });
			this.model.set({'menu-item-object-id': 0 });

			this.type = value;
			this.render();

			if (this.type === 'entry') {
				this.model.set({ 'menu-item-type': 'post_type' });
				this.showPagePostSelector();
			} else if (this.type === 'unlink') {
				this.model.set({ 'menu-item-type': 'custom' });
				this.saveItem();
			} else {
				this.model.set({ 'menu-item-type': 'custom' });
			}

			this.$el.parent().find('.menu-item-type').first().text(this.getLinkTypeLabel(value));
		},

		onTargetChange: function(value) {
			this.model.set({'menu-item-target': value});
			this.saveItem();
		},

		renderAnchorSelect: function() {
			var me = this;

			var anchorValues = [{label: 'Choose Anchor...', value: ''}];
			_.each(getAnchors(), function(anchor) {
				anchorValues.push({label: anchor.label, value: anchor.id});
			});

			var anchorValue = this.model.get('menu-item-url');
			anchorValue = anchorValue ? anchorValue : '';
			anchorValue = anchorValue.match(/^#/) ? anchorValue : '';

			this.anchorSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: anchorValues,
				default_value: anchorValue,
				change: function () {
					me.model.set({'menu-item-url': this.get_value()});
					me.saveItem();
				}
			});
			this.anchorSelect.render();
			this.$el.find('.anchor-selector').append(this.anchorSelect.el);
		},

		renderLightBoxesSelect: function() {
			var me = this;

			var lightboxValues = [{label: 'Choose Lightbox...', value: ''}];
			_.each(getLightBoxes() || [], function(lightbox) {
				lightboxValues.push({label: lightbox.label, value: lightbox.id});
			});

			var lightboxValue = this.model.get('menu-item-url');
			lightboxValue = lightboxValue ? lightboxValue : '';
			lightboxValue = lightboxValue.match(/^#/) ? lightboxValue : '';

			this.lightboxSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: lightboxValues,
				default_value: lightboxValue,
				change: function (value) {
					me.model.set({'menu-item-url': value});
					me.$el.find('.link-panel-lightbox-trigger').data('lightbox', value);
					me.saveItem();
				}
			});
			this.lightboxSelect.render();
			this.$el.find('.lightbox-selector').append(this.lightboxSelect.el);
		},

		onLightboxNameInputChange: function(event) {
			if (event.which == 13) {
				event.preventDefault();
				this.createLightBox();
			}
		},

		createLightBox: function() {
			var name = $.trim(this.$('.menu-item-lightbox-input').val());
			if (!name) {
				Upfront.Views.Editor.notify(l10n.ltbox_empty_name_nag, 'error');
				return false;
			}

			this.model.set({
				'menu-item-url': '#' + Upfront.Application.LayoutEditor.createLightboxRegion(name)
			});
			this.saveItem();
			this.render();
		},

		onUrlNameKeydown: function(event) {
			if (event.which == 13) {
				event.preventDefault();
				this.onUrlNameChange();
			}
		},

		onUrlNameChange: function() {
			this.model.set({
				'menu-item-url': $.trim(this.$el.find('.menu-item-external-input').val())
			});
			this.saveItem();
		},

		onEmailNameKeydown: function(event) {
			if (event.which == 13) {
				event.preventDefault();
				this.onEmailNameChange();
			}
		},

		onEmailNameChange: function() {
			this.model.set({
				'menu-item-url': 'mailto:' + $.trim(this.$el.find('.menu-item-email-input').val())
			});
			this.saveItem();
		},

		onItemNameKeydown: function(event) {
			if (event.which == 13) {
				event.preventDefault();
				this.onItemNameChange();
			}
		},

		onItemNameChange: function() {
			var newTitle = $.trim(this.$el.find('.menu-item-title').val());
			this.model.set({
				'menu-item-title': newTitle
			});
			this.$el.parent().find('.menu-item-title').first().text(newTitle);
			this.saveItem();
		},

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

		visit_lightbox: function(e) {
			e.preventDefault();
			var url = $(e.target).data('lightbox');

			// if there is no url defined, no point going forward
			if(!url || url==='')
				return;

			var regions = Upfront.Application.layout.get('regions');
			region = regions ? regions.get_by_name(this.getUrlanchor(url)) : false;
			if (region) {
				//hide other lightboxes
				_.each(regions.models, function(model) {
					if(model.attributes.sub == 'lightbox')
						Upfront.data.region_views[model.cid].hide();
				});
				var regionview = Upfront.data.region_views[region.cid];
				regionview.show();
			}
		},
		getUrlanchor: function(url) {
			if(typeof(url) == 'undefined') url = $(location).attr('href');

			if(url.indexOf('#') >=0) {
				var tempurl = url.split('#');
				return tempurl[1];
			} else return false;
		}
	});

	return MenuItemEditor;
});
})(jQuery);
