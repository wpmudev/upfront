(function ($) {
define([
	"scripts/upfront/link-model",
	"text!scripts/upfront/templates/link-panel.html",
	"scripts/upfront/inline-panels/inline-tooltip"
], function(LinkModel, linkPanelTpl, InlineTooltip) {

	var getAnchors = function() {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [{id: '#page', label: Upfront.Settings.l10n.global.views.back_to_top}],
			find;

		find = function (modules) {
			modules.each(function(module) {
				var group_anchor = module.get_property_value_by_name("anchor");
				if (group_anchor && group_anchor.length) {
					anchors.push({id: '#' + group_anchor, label: group_anchor});
				}
				if (module.get("objects") && (module.get("objects") || {}).each) {
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
			var regionTitle = r.attributes.title;
			var id = '#upfront-region-container-' + r.attributes.name;
			// Add Anchors for each region.
			anchors.push({id: id, label: regionTitle})
			// Get Modules.
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
			regions = (Upfront.Application.layout || {}).get ? Upfront.Application.layout.get('regions') : []
		;

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
			email: true,
			phone: true,
			homepage: true
		},

		events: {
			'click .js-ulinkpanel-input-entry': 'openPostSelector',
			'keydown .js-ulinkpanel-lightbox-input': 'onLightboxNameInputChange',
			'click .upfront-apply': 'saveControls',
			'blur .js-ulinkpanel-input-external': 'onUrlInputBlur',
			//'click .js-ulinkpanel-ok': 'onOkClick',
			'click .upfront-save_settings': 'onOkClick',
			'keydown .js-ulinkpanel-input-url.js-ulinkpanel-input-external': 'onExternalUrlKeydown',
			'click .link-panel-lightbox-trigger': 'visit_lightbox'
		},

		className: 'ulinkpanel-dark upfront-panels-shadow',

		visit_lightbox: function(e) {
			e.preventDefault();
			var url = $(e.target).attr('href');

			// if there is no url defined, no point going forward
			if(!url || url==='')
				return;

			var regions = Upfront.Application.layout.get('regions');
			region = regions ? regions.get_by_name(this.getUrlanchor(url)) : false;
			if(region){
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
		},
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
			this.title = options.title || Upfront.Settings.l10n.global.content.links_to;

			if (typeof options.model === 'undefined') {
				// Make sure app does not fail if there is no model.
				Upfront.Util.log('There was no link model, use new linking.');
				return;
			}

			// Rewrite anchor url to new style (to include full url)
			var pageUrl = this.get_mapped_url();

			if (this.model.get('type') === 'anchor' && this.model.get('url').match(/^#/) !== null) {
				this.model.set({'url' : pageUrl + this.model.get('url')}, {silent:true});
			}

			this.listenTo(this.model, 'change:type', this.handleTypeChange);
		},

		get_mapped_url: function() {
			// Example: http://mysite.com
			var home_url = Upfront.mainData.site || document.location.origin;
			// Example: http://mynetwork.com/site2
			var site_url = Upfront.mainData.siteUrl || document.location.origin;
			// Example: site2
			var site_path = site_url.split('/')[3];
			var location_path = document.location.pathname;
			// If site url is mapped different than home url and has a site path, correct this.
			if (
				home_url !== site_url
				&& site_path && site_path !== ''
				&& location_path.search(site_path) > -1
			) {
				// Strip out the site URL from pathname.
				var new_location = location_path.split('/');
				new_location.shift();
				new_location.shift();
				location_path = '/' + new_location.join('/');
			}
			// If URL has edit in it, use relative Anchor.
			if (location_path.search('edit') > -1) {
				return '';
			}
			return home_url + location_path;
		},

		onOkClick: function() {
			if (this.model.get('type') === 'lightbox' && this.$el.find('.js-ulinkpanel-lightbox-input').val() !== '') {
				this.createLightBox();
			} else {
				this.close();
				this.model.trigger("change");
			}
			//this.trigger('change', this.model);
		},

		/**
		 * Let's make sure we're handling the Enter key the same as OK click
		 * in external URL field edits
		 *
		 * @param {Object} e Event
		 *
		 * @return {Boolean}
		 */
		onExternalUrlKeydown: function (e) {
			if (13 !== e.which) return true;

			if (e.preventDefault) e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();

			this.onOkClick(e); // Take care of the regular flow
			this.trigger("url:changed"); // Take care of inline dialog
			Upfront.Events.trigger("tooltip:close"); // Close tooltip

			return false;
		},

		close: function() {
			this.trigger('linkpanel:close');
		},

		handleTypeChange: function() {
			if (this.model.get('type') === 'homepage') {
				this.model.set({'url': Upfront.mainData.site}, {silent: true});
			} else {
				// Reset url property
				// We don't want funny results when changing from one type to another.
				this.model.set({'url': ''}, {silent: true});
			}
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
				case 'homepage':
					return { value: 'homepage', label: contentL10n.homepage, icon: 'link-homepage', tooltip: contentL10n.homepage };
				case 'unlink':
					return { value: 'unlink', label: contentL10n.no_link, icon: 'link-unlink', tooltip: contentL10n.unlink };
				case 'external':
					return { value: 'external', label: contentL10n.url, icon: 'link-external', tooltip: contentL10n.external };
				case 'email':
					return { value: 'email', label: contentL10n.email, icon: 'link-email', tooltip: contentL10n.email };
				case 'phone':
					return { value: 'phone', label: contentL10n.phone, icon: 'link-phone', tooltip: contentL10n.phone };
				case 'entry':
					return { value: 'entry', label: contentL10n.post_or_page, icon: 'link-entry', tooltip: contentL10n.post_or_page };
				case 'anchor':
					return { value: 'anchor', label: contentL10n.anchor, icon: 'link-anchor', tooltip: contentL10n.anchor };
				case 'image':
					return { value: 'image', label: contentL10n.larger_image, icon: 'link-image', tooltip: contentL10n.larger_image };
				case 'lightbox':
					return { value: 'lightbox', label: contentL10n.lightbox, icon: 'link-lightbox', tooltip: contentL10n.lightbox };
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

			this.trigger('linkpanel:update:wrapper');

			var me = this,
				selectorOptions = {
					postTypes: getPostTypes()
				};

			Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
				me.model.set({title: post.get('post_title'), url: post.get('permalink'), object: post.get('post_type'), object_id: post.get('ID')});
				me.render();
			});
		},

		/* Handle lightbox link type. */
		/**
		 * Check input for lightbox name for enter key.
		 */
		onLightboxNameInputChange: function(event) {
			if (event.which === 13) {
				event.preventDefault();
				this.createLightBox();
				this.saveControls();
				Upfront.Events.trigger("tooltip:close"); // Close tooltip
			}
		},

		createLightBox: function() {
			var name = $.trim(this.$('.js-ulinkpanel-lightbox-input').val());
			if (!name) {
				Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.views.ltbox_empty_name_nag, 'error');
				return false;
			}

			this.model.set({
				url: '#' + Upfront.Application.LayoutEditor.getLightboxSafeName(name)
			});

			Upfront.Application.LayoutEditor.createLightboxRegion(name);
			// this is required to send a 'dontflag' to the editor,
			// because the lightbox is created
			// after the link is saved in the text.
			// triggering the change again will refresh the editor's state
			// and get rid of missing link flag
			this.model.trigger("change", true);
			this.render();
		},

		/* Handle manually entered urls: external and email */
		onUrlInputBlur: function(event) {
			var userInput = $(event.currentTarget).val().trim();
			if (this.model.get('type') === 'external' && !userInput.match(/https?:\/\//) && !_.isEmpty( userInput ) ) {
				userInput = 'http://' + userInput;
			}
			if (this.model.get('type') === 'email' && !userInput.match(/^mailto:/)) {
				userInput = 'mailto:' + userInput;
			}
			if (this.model.get('type') === 'phone' && !userInput.match(/^tel:/)) {
				userInput = 'tel:' + userInput;
				this.model.set({'target': "_self"});
			}
			this.model.set({'url': userInput});
			this.render();
		},

		/* Rendering stuff below */
		render: function() {

			var me = this;

			if (!this.model) {
			this.$el.html('Error occurred, link panel switch to new style.');
				return;
			}
			
			if (!this.model.get('url') && (!this.model.get('type') || this.model.get('type') === "unlink")) {
				// If not URL set type to external
				this.model.set({'type': 'external'}, {silent: true});
			}
			
			var linkModel = this.model,
				linkTitle = linkModel.get('title'),
				linkUrl = linkModel.get('url');
			
			if(typeof linkTitle !== "undefined" && linkTitle.length > 25) {
				linkModel.set('title', linkTitle.substr(0, 25) + '...');
			}
			
			if(typeof linkUrl !== "undefined" && linkUrl.length > 25) {
				linkModel.set('url', linkUrl.substr(0, 25) + '...');
			}
			
			var tplData = {
				title: this.title,
				link: linkModel.toJSON(),
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

			if (this.model.get('type') == 'lightbox') {
				if (getLightBoxes().length) {
					this.renderLightBoxesSelect();
					this.$el.find('.js-ulinkpanel-new-lightbox').hide();
				} else {
					this.$el.find('.js-ulinkpanel-new-lightbox').show();
				}
			}

			if (_.contains(['external'], this.model.get('type'))) {
				this.renderTargetRadio();
			}
			
			this.updateWrapperSize();

			this.delegateEvents();
			
			this.renderTooltips();
		},
		
		saveControls: function () {
			this.$el.find('.lightbox-selector').show();
			this.$el.find('.js-ulinkpanel-new-lightbox').hide();
		},

		newLightbox: function () {
			this.$el.find('.lightbox-selector').hide();
			this.$el.find('.js-ulinkpanel-new-lightbox').show();
		},
		
		updateWrapperSize: function () {
			var totalWidth = 0;

			this.$el.children().each(function(i, element) {
				var elementWidth = 0;
				if($(element).hasClass('upfront-field-post-pages')) {
					elementWidth = parseInt($(element).find('.js-ulinkpanel-input-entry').width());
				} else {
					elementWidth = $(element).hasClass('upfront-settings-link-target') ? 0 : parseInt($(element).width());
				}

				totalWidth = totalWidth + elementWidth;
			});
			
			this.$el.css('width', totalWidth + 10);

			this.$el.closest('.ulinkpanel-dark').css('width', totalWidth + 10);

			// If redactor link update the container width
			this.$el.closest('.redactor_air').css('width', totalWidth + 10);
		},
		
		getTooltipSelect: function(panel) {
			var me = this,
				select = Upfront.Views.Editor.Field.Select.extend({
					className: 'upfront-field-wrap upfront-field-wrap-select',
					render: function() {
						select.__super__.render.apply(this, arguments);
						
						var self = this;
						
						_.each(this.options.values, function(value) {
							var element = element = self.$el.find('[value="'+value.value+'"]').parent();
							me.addTooltip(element, value.tooltip ? value.tooltip : value.label, panel);
						});
					},
					openOptions: function(e) {
						if(e)
							e.stopPropagation();

						if(this.$el.find('.upfront-field-select').hasClass('upfront-field-select-expanded')) {
							$('.upfront-field-select-expanded').removeClass('upfront-field-select-expanded');
							return;
						}
						
						$('.upfront-field-select-expanded').removeClass('upfront-field-select-expanded');
						this.$el.find('.upfront-field-select').css('min-width', '').css('min-width', this.$el.find('.upfront-field-select').width());
						this.$el.find('.upfront-field-select').addClass('upfront-field-select-expanded');

						// Make sure all select options are visible in scroll panel i.e. scroll scroll panel as needed
						var me = this;
						_.delay(function() { // Delay because opening animation causes wrong outerHeight results
							var in_sidebar = me.$el.parents('#sidebar-ui').length,
								in_settings = me.$el.parents('#element-settings-sidebar').length,
								settingsTitleHeight = 46;

							// Apply if select field is in sidebar or settings sidebar
							if(in_sidebar == 1 || in_settings == 1) {
								var select_dropdown = me.$el.find('.upfront-field-select-options'),
									select = select_dropdown.parent(),
									dropDownTop = select.offset().top - $('#element-settings-sidebar').offset().top;
								dropDownTop = dropDownTop + settingsTitleHeight;

								select_dropdown.css("width", select.width() + 3);
								select_dropdown.css('top', dropDownTop + "px");
								if( Upfront.Util.isRTL() )
									select_dropdown.css('right',  ( $(window).width() - select.offset().left - select.width() ) + "px");
								else
									select_dropdown.css('left',  select.offset().left + "px");
								select_dropdown.css('display', 'block');
							}
						}, 10);

						$('.sidebar-panel-content, #sidebar-scroll-wrapper').on('scroll', this, this.on_scroll);

						this.trigger('focus');
					},
				})
			;
			
			return select;
		},

		renderTypeSelect: function() {
			var me = this;

			var typeSelectValues = [];
			_.each(this.linkTypes, function(use, type) {
				if (!use) {
					return;
				}
				
				if(!me.model.get('url') && type === "unlink") {
					return;
				}

				typeSelectValues.push(this.getLinkTypeValue(type));
			}, this);
			
			var tooltipSelect = this.getTooltipSelect('side');

			this.typeSelect = new tooltipSelect({
				label: '',
				className: 'upfront-link-select',
				values: typeSelectValues,
				default_value: this.model.get('type'),
				change: function () {
					me.model.set({'type': this.get_value()});
					Upfront.Events.trigger("tooltip:close");
				}
			});

			this.typeSelect.render();
			this.$el.find('.upfront-settings-link-select').prepend(this.typeSelect.el);
		},
		
		renderTooltips: function() {
			this.$el.find('.upfront-link-back, .js-ulinkpanel-input-external, .js-ulinkpanel-input-url, .ulinkpanel-entry-browse, .js-ulinkpanel-input-phone, .upfront-home-link, .js-ulinkpanel-input-url, .anchor-selector, .js-ulinkpanel-input-email, .upfront-create-new-lightbox').utooltip({
				fromTitle: true
			});
			
			var linkType = this.model.get('type'),
				linkTitle = this.getLinkTypeValue(linkType)
			
			this.$el.find('.upfront-link-select .upfront-field-select').utooltip({
				fromTitle: false,
				content: linkTitle.tooltip
			});
			
			var targetType = this.model.get('target'),
				targetContent
			if(targetType === '_blank') {
				targetContent = Upfront.Settings.l10n.global.content.blank_label;
			} else {
				targetContent = Upfront.Settings.l10n.global.content.self_label
			}
			
			this.$el.find('.uf-link-target-select .upfront-field-select').utooltip({
				fromTitle: false,
				content: targetContent
			});
		},
		
		addTooltip: function(element, content, panel) {
			$(element).utooltip({
				fromTitle: false,
				content: content,
				panel: panel
			});
		},

		renderTargetRadio: function() {
			var me = this,
				tooltipSelect = this.getTooltipSelect('normal');

			this.targetRadio = new tooltipSelect({
				label: '',
				className: 'uf-link-target-select',
				default_value: this.model.get('target') || '_self',
				values: [
					{ label: Upfront.Settings.l10n.global.content.blank, value: '_blank', tooltip: Upfront.Settings.l10n.global.content.blank_label },
					{ label: Upfront.Settings.l10n.global.content.self, value: '_self', tooltip: Upfront.Settings.l10n.global.content.self_label }
				],
				change: function () {
					me.model.set({'target': this.get_value()});
				}
			});

			this.targetRadio.render();
			this.$el.find('.upfront-settings-link-target').append(this.targetRadio.el);
		},

		renderAnchorSelect: function() {
			var model = this.model,
				pageUrl = this.get_mapped_url();

			var anchorValues = [{label: 'Choose Anchor...', value: ''}];
			_.each(getAnchors(), function(anchor) {
				anchorValues.push({label: anchor.label, value: pageUrl + anchor.id});
			});

			var anchorValue = this.model.get('url');
			anchorValue = anchorValue ? anchorValue : '';
			anchorValue = anchorValue.indexOf('#') !== -1 ? anchorValue : '';

			this.anchorSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: anchorValues,
				default_value: anchorValue,
				change: function () {
					var url = this.get_value();
					// Quick fix for exporter url ending up in local site menus until we solve
					// mapping anchors to pages. This will allow user to create links to anchors
					// on specific pages when using editor, but builder for now does not have
					// proper support for that.
					// Use case that we have to cover is in menu that is present on all pages
					// make link to anchor on homepage or other specific page.
					if (document.location.pathname.match(/^\/create_new\//) !== null) {
						url = '#' + url.split('#')[1];
					}
					model.set({'url': url});
				}
			});
			this.anchorSelect.render();
			this.$el.find('.anchor-selector').append(this.anchorSelect.el);
		},

		renderLightBoxesSelect: function() {
			var model = this.model,
				me = this,
				lightboxValues = []
			;
			
			_.each(getLightBoxes() || [], function(lightbox) {
				lightboxValues.push({label: lightbox.label, value: lightbox.id});
			});

			var lightboxValue = this.model.get('url');
			lightboxValue = lightboxValue ? lightboxValue : '';
			lightboxValue = lightboxValue.match(/^#/) ? lightboxValue : '';

			this.lightboxSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				className: 'upfront-lightbox-select',
				values: lightboxValues,
				default_value: lightboxValue,
				change: function () {
					model.set({'url': this.get_value()});
					$('.link-panel-lightbox-trigger').attr('href', this.get_value());
				}
			});
			this.lightboxSelect.render();
			this.$el.find('.lightbox-selector').append(this.lightboxSelect.el);
			this.$el.find('.upfront-lightbox-select ul').prepend('<li class="upfront-field-select-option upfront-create-new-lightbox" title="'+ Upfront.Settings.l10n.global.content.create_lightbox +'"><label>' + Upfront.Settings.l10n.global.content.new_lightbox + '</label></li>')
			
			if(lightboxValues.length > 4) {
				this.$el.find('.upfront-lightbox-select ul').addClass('upfront-field-select-options-scrollbar');
			}
			
			this.$el.find('.upfront-create-new-lightbox').on("click", function(e) {
				me.newLightbox();
			});
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
