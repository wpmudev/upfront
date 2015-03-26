define(function() {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var MenuItemView = Backbone.View.extend({
		tagName: 'li',
		contextmenuContext: [],
		removeContexts: true,
		events: {
			'click i.delete_menu_item' : 'deleteMenuItem',
			'click i.navigation-add-item': 'addMenuItem',
			"contextmenu a.menu_item": "on_context_menu",
			'click i.visit_link': 'visitLink',
			'click a.redactor_act': 'onOpenPanelClick',
			'click .upfront-save_settings': 'onOpenPanelClick',
			'click > .open-item-controls': 'onOpenItemControlsClick'
		},
		initialize: function(options) {
			this.parent_view = options.parent_view;
			this.newitem = options.newitem;
			var me = this;
			_.bindAll(this, 'render');

			var ContextMenuList = Upfront.Views.ContextMenuList.extend({
				initialize: function(opts) {
					this.options = opts;
					this.for_view = this.options.for_view;
					this.menuitems = _([
						new Upfront.Views.ContextMenuItem({
							get_label: function() {
								var linktype = me.guessLinkType();
								if(linktype == 'lightbox')
									return 'Open Lightbox';
								else if(linktype == 'anchor')
									return 'Scroll to Anchor';
								else if(linktype == 'entry')
									return 'Visit Post/Page';
								else
									return 'Visit Link';
							},
							action: function() {
								me.visitLink();
							}
						}),
						new Upfront.Views.ContextMenuItem({
							get_label: function() {
								return l10n.edit_url;
							},
							action: function() {
				 				me.removeContexts = false;
							 	me.parent_view.editMenuItem(me.$el.find('a.menu_item'));
							}
						}),
						new Upfront.Views.ContextMenuItem({
							get_label: function() {
								return l10n.create_dropdown;
							},
							action: function() {
								me.removeContexts = false;
								me.createDropDown(me.event);
							}
						})
					]);
				}
			});

			this.ContextMenu = Upfront.Views.ContextMenu.extend({
				initialize: function(opts) {
					this.options = opts;
					this.for_view = this.options.for_view;
					
					this.menulists = _([
						new ContextMenuList({for_view: this.for_view})
					]);

				}
			});

			Upfront.Events.on("entity:contextmenu:deactivate", this.remove_context_menu, this);
		},

		loadContexts: function(element) {
			if(this.contextmenuContext.length > 10) return;

			var menu = element.parent().parent('ul');

			if(menu.length > 0 && menu.hasClass('sub-menu')) {
				menu.addClass('time_being_display');
				this.contextmenuContext.push(menu);
				this.loadContexts(menu);
			}
		},
		on_context_menu: function(e) {
			e.stopPropagation();
			if(this.parent_view.$el.find('ul.menu').hasClass('edit_mode')) return;

			this.closeTooltip();
			e.preventDefault();

			if($(e.target).closest('ul').hasClass('sub-menu')) {
				this.contextmenuContext.push($(e.target).closest('ul').addClass('time_being_display'));
				this.loadContexts($(e.target).closest('ul'));
			}

			this.event = e;
			context_menu_view = new this.ContextMenu({
				model: this.model,
				for_view: this,
				el: $(Upfront.Settings.LayoutEditor.Selectors.contextmenu)
			});
			this.context_menu_view = context_menu_view;
			context_menu_view.render();

		},
		remove_context_menu: function(e) {
			if (!this.context_menu_view) return false;

			if(this.contextmenuContext.length > 0) {
				if(this.removeContexts) for(var i = 0; i < 	this.contextmenuContext.length; i++) {
					this.contextmenuContext[i].removeClass('time_being_display');
				}
				this.contextmenuContext = [];
				this.removeContexts = true;
			}

			$(Upfront.Settings.LayoutEditor.Selectors.contextmenu).html('').hide();
			this.context_menu_view = false;
		},

		onOpenPanelClick: function(event) {
			event.preventDefault();
			this.toggleLinkPanel();
		},

		toggleLinkPanel: function() {
			var me = this;
			if (this.$el.hasClass('ui-sortable-handle')) {
				this.$el.removeClass('ui-sortable-handle');
				this.$el.addClass('stayOpen');
				this.$el.parents('.menu').sortable('disable');
				this.$el.find('.linkingPanelGoesHere').show();
			} else {
				this.$el.addClass('ui-sortable-handle');
				this.$el.removeClass('stayOpen');
				this.$el.parents('.menu').sortable('enable');
				this.$el.find('.linkingPanelGoesHere').hide();
				// Model linkType won't set on time if this is not delayed
				setTimeout(function() {
					me.render();
				}, 100);
			}
		},

		render: function (event) {
			var me = this;
			var content = '<a class="menu_item';

			if(me.newitem) content = content + ' new_menu_item menu_item_placeholder';

			content = content+'" >'+this.model['menu-item-title']+'</a><i class="delete_menu_item">x</i><span class="open-item-controls"></span>';
			$(this.el).html(content);
			this.createInlineControlPanel();

			$(this.el).data('backboneview', me).addClass('menu-item');
			if(me.newitem) $(this.el).addClass('new_menu_item');

			if (this.linkPanelOpen) {
				this.onOpenItemControlsClick();
				this.$el.find('.upfront-icon-region-link').click();
			}

			return this;
		},

		onOpenItemControlsClick: function() {
			this.$el.toggleClass('controls-visible');
			if (this.$el.hasClass('controls-visible')) {
				this.controlsVisible = true;
				this.$el.siblings().removeClass('controls-visible');
				this.$el.parents('.menu').sortable('disable');
			} else {
				this.controlsVisible = false;
				if (this.$el.parents('.menu').find('.controls-visible').length === 0) {
					this.$el.parents('.menu').sortable('enable');
				}
			}
		},

		getTextByLinkType: function(linktype) {
			switch(linktype) {
				case 'unlink':
					return 'Not Linked';
				case 'lightbox':
					return 'Open Lightbox';
				case 'anchor':
					return 'Scroll to Anchor';
				case 'entry':
					return 'Go To Post / Page';
				case 'external':
					return 'Open Ext. Link';
				case 'email':
						return 'Send Email';
			};
		},

		createInlineControlPanel: function() {
			var panel = new Upfront.Views.Editor.InlinePanels.ControlPanel();

			panel.items = _([
				this.createLinkControl(),
				this.createControl('visit-link-' + this.guessLinkType(), this.getTextByLinkType(this.guessLinkType()), 'visitLink'),
			]);

			var imageControlsTpl = '<div class="uimage-controls image-element-controls upfront-ui"></div>';
			this.$el.append(imageControlsTpl);
			panel.render();
			this.$el.find('.uimage-controls').append(panel.el);
			panel.delegateEvents();
		},
			createControl: function(icon, tooltip, click){
				var me = this,
					control = new Upfront.Views.Editor.InlinePanels.Control({
						label: tooltip
					});
				control.icon = icon;
				control.tooltip = tooltip;
				if (click) {
					this.listenTo(control, 'click', function(e){
						me[click](e);
					});
				}

				return control;
			},

			createLinkControl: function(){
				var me = this,
					control = new Upfront.Views.Editor.InlinePanels.DialogControl(),
					linkPanel;

				control.view = linkPanel = new Upfront.Views.Editor.LinkPanel({
					linkUrl: this.model['menu-item-url'],
					linkTarget: this.model['menu-item-target'],
					linkType: this.guessLinkType(),
					button: false
				});

				this.listenTo(control, 'panel:ok', function() {
					control.close();
				});

				this.listenTo(control, 'panel:open', function() {
					me.linkPanelOpen = true;
				});

				me.listenTo(control, 'panel:close', function() {
					me.linkPanelOpen = false;
				});

				me.listenTo(linkPanel, 'change', function(data) {
					me.linkType = data.type;
					me.model['menu-item-url'] = data.url;
					me.model['menu-item-target'] = data.target;
					me.saveLink();
				});

				control.icon = 'link';
				control.tooltip = 'link';
				control.id = 'link';

				return control;
			},

		updateLinkType: function() {
			this.$el.find('.upfront-inline-panel-item:nth-child(2) i').attr('class', 'upfront-icon upfront-icon-region-visit-link-'+ this.guessLinkType());
			this.$el.find('.upfront-inline-panel-item:nth-child(2) span').text(this.getTextByLinkType(this.linkType));
		},
		guessLinkType: function(){
			var url = this.model['menu-item-url'];
			if (this.linkType) {
				return this.linkType;
			}

			if(!$.trim(url) || $.trim(url) == '#' || $.trim(url) == '') {
				return 'unlink';
			}
			if(url.length && url[0] == '#') {
				return url.indexOf('#ltb-') > -1 ? 'lightbox' : 'anchor';
			}
			if(url.substring(0, location.origin.length) == location.origin) {
				return 'entry';
			}
			if (url.match(/^mailto/)) {
				return 'email';
			}

			return 'external';
		},
		visitLink: function() {
			var me = this;
			var linktype = me.guessLinkType();
			if(linktype == 'lightbox') {
				var regions = Upfront.Application.layout.get('regions');
				region = regions ? regions.get_by_name(me.getUrlanchor(me.model['menu-item-url'])) : false;
				if(region){
					//hide other lightboxes
					_.each(regions.models, function(model) {
						if(model.attributes.sub == 'lightbox')
							Upfront.data.region_views[model.cid].hide();
					});
					var regionview = Upfront.data.region_views[region.cid];
					regionview.show();
				}
			}
			else if(linktype == 'anchor') {
				var anchors = me.parent_view.get_anchors();
				$('html,body').animate({scrollTop: $('#'+me.getUrlanchor(me.model['menu-item-url'])).offset().top},'slow');
			}
			else if(linktype == 'entry')
				window.location.href = me.model['menu-item-url'].replace('&editmode=true', '').replace('editmode=true', '')+((me.model['menu-item-url'].indexOf('?')>0)?'&editmode=true':'?editmode=true');
			else {
				window.open(me.model['menu-item-url']);
			}
		},
		createDropDown: function(e) {
			var placeholder = $('<ul>').addClass('sub-menu').addClass('time_being_display');
			$(e.target).closest('li').append(placeholder);
			this.parent_view.addMenuItem(placeholder);
		},

		addMenuItem: function(e) {
			e.preventDefault();
			e.stopPropagation();
			this.parent_view.addMenuItem(e);
		},

		deleteMenuItem: function(e) {
			var me = this;
			var parentlist = me.$el.parent('ul');
			var newitemicon = me.$el.parent('ul').find('i.navigation-add-item');
			var removeparent = false;
			var parentview = this.parent_view;

			if(me.$el.siblings().length < 1) {
				removeparent = true;
			}

			var neworder = parentview.new_menu_order(me.model['menu-item-db-id']);
			this.closeTooltip();
			me.$el.remove();

			if(removeparent) parentlist.remove();

			parentlist.children('li:last').append(newitemicon);

			if(typeof me.model['menu-item-db-id'] != 'undefined') {
				Upfront.Util.post({"action": "upfront_new_delete_menu_item", "menu_item_id": me.model['menu-item-db-id'], "new_menu_order" : neworder})
					.success(function (ret) {
						parentview.render();
					})
					.error(function (ret) {
						Upfront.Util.log("Error Deleting Menu Item");
					})
				;
			}

		},

		editMenuItem: function(e){
			var target = typeof e.target == 'undefined' ? e : e.target,
				linkType = 'external',
				link = {url: this.model['menu-item-url']}
			;

			if(this.model['menu-item-type'] == 'post_type') linkType = 'entry';
			else if(link.url.indexOf('#') > -1 && this.getCleanurl(link.url) == this.getCleanurl()) {
				linkType = link.url.indexOf('#ltb-') > -1 ? 'lightbox' : 'anchor';
			}

			link.type = linkType;

			this.linkPanel.model.set(link);
			this.linkPanel.render();

			this.openTooltip(this.linkPanel.el, $(target));

			this.linkPanel.delegateEvents();
		},

		getCleanurl: function(url) {
			//this one removes any existing # anchor postfix from the url
			var urlParts;
			if(!url){
				url = location.href;
			}

			if(url.indexOf('?dev=true') != -1) url = url.replace('?dev=true', '');

			if(url.indexOf('#') == -1) return url;

			urlParts = url.split('#');

			if(urlParts[0].trim() != '')
				return urlParts[0];
			else
				return location.href.replace('?dev=true', '');
		},

		getUrlanchor: function(url) {
			// this does almost the opposite of the above function

			if(typeof(url) == 'undefined') var url = $(location).attr('href');

			if(url.indexOf('#') >=0) {
				var tempurl = url.split('#');
				return tempurl[1];
			} else return false;
		},

		saveLink: function(remove, keep) {
			var me = this;

			if(typeof(remove) != 'undefined' && remove) {
				me.deleteMenuItem();
				return;
			}

			me.$el.find('a.new_menu_item').removeClass('new_menu_item');
			me.$el.removeClass('new_menu_item');

			me.parent_view.$el.find('ul.time_being_display').removeClass('time_being_display');

			var menu_item = ($(this.el).children('a.menu_item').length > 0) ? $(this.el).children('a.menu_item'):$(this.el).children('div').children('a.menu_item');

			if(!menu_item.hasClass('menu_item_placeholder') && menu_item.next('a.ueditor-placeholder').length < 1) this.model['menu-item-title'] = menu_item.text();
			else this.model['menu-item-title'] = '';

			if($(this.el).children('div.redactor_box').length > 0) menu_item.blur();

			if(me.model['menu-item-title'].trim() == '') {
				if(typeof(keep) != 'undefined' && keep) {
					var title_text = menu_item.next('a.ueditor-placeholder').text() || (menu_item.is("a.menu_item_placeholder") ? menu_item.text() : '');
					me.model['menu-item-title'] = title_text;
				}
				else {
					me.deleteMenuItem();
					return;
				}
			}

			var postdata = {
				'action': "upfront_new_update_menu_item",
				'menu': me.parent_view.model.get_property_value_by_name('menu_id') ,
				'menu-item': this.model
			}

			if(typeof this.model['menu-item-db-id'] != 'undefined'){
				postdata['menu-item-id'] = me.model['menu-item-db-id'];
			}

			this.updateLinkType();

			Upfront.Util.post(postdata)
				.success(function (ret) {
					me.model['menu-item-db-id'] = ret.data;
				})
				.error(function (ret) {
					Upfront.Util.log("Error updating menu item");
				})
			;

		},
		openTooltip: function(content, element){
			var tooltip = $('#unewnavigation-tooltip'),
				elementPosition = element.offset(),
				tooltipPosition = {
					top: elementPosition.top + element.outerHeight() + 11,
					left: elementPosition.left - 98 + Math.floor(element.outerWidth() / 2)
				},
				tooltipClass = 'unewnavigation-tooltip-bottom',
				me = this
			;
			if(!tooltip.length){
				tooltip = $('<div id="unewnavigation-tooltip" class="upfront-ui"></div>');
				$('body').append(tooltip);
			}
			tooltip.hide().html(content);
			elementPosition.right = elementPosition.left + element.width();
			if(elementPosition.left - 280 < 0){
				tooltipPosition.left = elementPosition.left + element.width() + 20;
				tooltipClass = 'unewnavigation-tooltip-bottom';
			}
			tooltip
				.css(tooltipPosition)
				.addClass(tooltipClass)
				.show()
				.on('click', function(e){
					e.stopPropagation();
				})
				.on('closed', function(e){
					me.$el.removeClass('tooltip-open');
				})
			;

			this.$el.addClass('tooltip-open');

			val = $('#unewnavigation-tooltip').find('input[name=unavigation-link-type]:checked').val();
			if( val == 'anchor') {
				this.addAnchorsselect();
			}
			if( val == 'lightbox') {
				this.addLightboxselect();
			}
			Upfront.Events.trigger("entity:settings:deactivate");
		},

		closeTooltip: function(){
			var tooltip = $('#unewnavigation-tooltip');
			tooltip.hide().trigger('closed');
			setTimeout(function(){
				tooltip.remove();
			}, 100);
		},
	});

	return MenuItemView;
});