(function ($) {
define([
	"text!scripts/upfront/templates/link-panel.html",
], function(linkPanelTpl) {

	var LinkModel = Backbone.Model.extend({
	});

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


	var LinkPanel = Backbone.View.extend({
		tpl: _.template(linkPanelTpl),

		defaultLinkTypes: {
			unlink: true,
			external: true,
			entry: true,
			anchor: true,
			image: false,
			lightbox: true,
			email: true
		},

		events: {
			'click .js-ulinkpanel-input-entry': 'openPostSelector',
			'keydown .js-ulinkpanel-lightbox-input': 'onLightboxNameInputChange',
			'blur .js-ulinkpanel-input-external': 'onUrlInputBlur',
			'click .js-ulinkpanel-ok': 'onOkClick'
		},

		className: 'ulinkpanel-dark',

		initialize: function(options) {
			// Make sure we have large image url if 'image' is one of link types
			if (options.linkTypes && options.linkTypes.image && options.linkTypes.image === true && _.isUndefined(options.imageUrl)) {
				throw 'Provide "imageUrl" if "linkTypes" option has { image: true } when initializing LinkPanel.';
			}

			var me = this;
			this.options = options || {};
			this.linkTypes = _.extend({}, this.defaultLinkTypes, options.linkTypes || {});
			this.theme = options.theme || 'dark';
			this.button = options.button || false;

			this.model = new LinkModel({
				type: options.linkType || 'unlink',
				url: options.linkUrl || '',
				target: options.linkTarget || '_self'
			});
			this.listenTo(this.model, 'change:url', function() {
				me.trigger('change', me.model.toJSON());
			});
			this.listenTo(this.model, 'change:target', function() {
				me.trigger('change:target', me.model.toJSON());
			});
			this.listenTo(this.model, 'change:type', this.handleTypeChange);
		},

		onOkClick: function() {
			this.trigger('change', this.model.toJSON());
		},

		handleTypeChange: function() {
			// First reset url property
			// We don't want funny results when changing from one type to another.
			this.model.set({'url': ''}, {silent: true});
			this.render();

			if (this.model.get('type') === 'entry') {
				this.openPostSelector();
			}
			if (this.model.get('type') === 'image') {
				this.model.set({'url': this.options.imageUrl});
			}
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

		/* Handle entry link type. (post or page) */
		/**
		 * Open post selector for entry type url and set link url when done.
		 */
		openPostSelector: function(event) {
			if (event) {
				event.preventDefault();
			}

			var me = this,
				selectorOptions = {
					postTypes: getPostTypes()
				};

			Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
				me.model.set({url: post.get('permalink')});
				me.render();
			});
		},

		/* Handle lightbox link type. */
		/**
		 * Check input for lightbox name for enter key.
		 */
		onLightboxNameInputChange: function(event) {
			if (event.which == 13) {
				event.preventDefault();
				this.createLightBox();
			}
		},

		createLightBox: function() {
			var name = $.trim(this.$('.js-ulinkpanel-lightbox-input').val());
			if (!name) {
				Upfront.Views.Editor.notify(l10n.ltbox_empty_name_nag, 'error');
				return false;
			}

			this.model.set({
				url: '#' + Upfront.Application.LayoutEditor.createLightboxRegion(name)
			});
			this.render();
		},

		/* Handle manually entered urls: external and email */
		onUrlInputBlur: function(event) {
			var userInput = $(event.currentTarget).val().trim();
			if (this.model.get('type') === 'external' && !userInput.match(/https?:\/\//)) {
				userInput = 'http://' + userInput;
			}
			if (this.model.get('type') === 'email' && !userInput.match(/^mailto:/)) {
				userInput = 'mailto:' + userInput;
			}

			this.model.set({'url': userInput});
			this.render();
		},

		/* Rendering stuff below */
		render: function() {
			var me = this;

			var tplData = {
				link: this.model.toJSON(),
				checked: 'checked="checked"',
				lightboxes: getLightBoxes(),
				button: this.button,
				type: this.model.get('type')
			};

			this.$el.html(this.tpl(tplData));

			this.renderTypeSelect();

			if (this.model.get('type') == 'anchor') {
				this.renderAnchorSelect();
			}

			if (this.model.get('type') == 'lightbox' && getLightBoxes()) {
				this.renderLightBoxesSelect();
			}

			if (_.contains(['external', 'entry'], this.model.get('type'))) {
				this.renderTargetRadio();
			}

			this.delegateEvents();
		},

		renderTypeSelect: function() {
			var me = this;

			var typeSelectValues = [];
			_.each(this.linkTypes, function(use, type) {
				if (!use) {
					return;
				}
				typeSelectValues.push(this.getLinkTypeValue(type));
			}, this);

			this.typeSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: typeSelectValues,
				default_value: this.model.get('type'),
				change: function () {
					me.model.set({'type': this.get_value()});
				}
			});

			this.typeSelect.render();
			this.$el.find('form').prepend(this.typeSelect.el);
		},

		renderTargetRadio: function() {
			var me = this;

			this.targetRadio = new Upfront.Views.Editor.Field.Radios({
				label: 'Target:',
				default_value: this.model.get('target') || '_self',
				layout: 'horizontal-inline',
				values: [
					{ label: 'blank', value: '_blank' },
					{ label: 'self', value: '_self' }
				],
				change: function () {
					me.model.set({'target': this.get_value()});
				}
			});

			this.targetRadio.render();
			this.$el.find('form').append(this.targetRadio.el);
		},

		renderAnchorSelect: function() {
			var model = this.model;

			var anchorValues = [{label: 'Choose Anchor...', value: ''}];
			_.each(getAnchors(), function(anchor) {
				anchorValues.push({label: anchor.label, value: anchor.id});
			});

			var anchorValue = this.model.get('url');
			anchorValue = anchorValue ? anchorValue : '';
			anchorValue = anchorValue.match(/^#/) ? anchorValue : '';

			this.anchorSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: anchorValues,
				default_value: anchorValue,
				change: function () {
					model.set({'url': this.get_value()});
				}
			});
			this.anchorSelect.render();
			this.$el.find('.anchor-selector').append(this.anchorSelect.el);
		},

		renderLightBoxesSelect: function() {
			var model = this.model;
			var lightboxValues = [{label: 'Choose Lightbox...', value: ''}];
			_.each(getLightBoxes() || [], function(lightbox) {
				lightboxValues.push({label: lightbox.label, value: lightbox.id});
			});

			var lightboxValue = this.model.get('url');
			lightboxValue = lightboxValue ? lightboxValue : '';
			lightboxValue = lightboxValue.match(/^#/) ? lightboxValue : '';

			this.lightboxSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: lightboxValues,
				default_value: lightboxValue,
				change: function () {
					model.set({'url': this.get_value()});
				}
			});
			this.lightboxSelect.render();
			this.$el.find('.lightbox-selector').append(this.lightboxSelect.el);
		},

		delegateEvents: function(events) {
			if (this.typeSelect) {
				this.typeSelect.delegateEvents();
			}
			if (this.anchorSelect) {
				this.anchorSelect.delegateEvents();
			}
			if (this.lightboxSelect) {
				this.lightboxSelect.delegateEvents();
			}
			Backbone.View.prototype.delegateEvents.call(this, events);
		}
	});

	return LinkPanel;

});
})(jQuery);
