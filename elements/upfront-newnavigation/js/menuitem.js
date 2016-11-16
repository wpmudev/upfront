define([
	"scripts/upfront/link-model"
], function(LinkModel) {
return (function ($) {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var MenuItemView = Backbone.View.extend({
		tagName: 'li',
		contextmenuContext: [],
		removeContexts: true,

		events: {
			'click i.delete_menu_item' : 'deleteMenuItem',
			'click i.navigation-add-item': 'addMenuItem',
			"contextmenu a.menu_item": "on_context_menu",
			"click a.menu_item": "on_click",
			"touchstart a.menu_item": "on_click",
			'click .sub-menu': 'onOpenPanelSubMenu',
			'click .upfront-save_settings': 'onOpenPanelSubMenu',
			'click .upfront-save_settings': 'processPanelsOnSave',
			'click > .open-item-controls': 'onOpenItemControlsClick',
			'mouseover': 'onItemOver',
			'mouseout': 'onItemOut'
		},

		initialize: function(options) {
			var me = this;

			// Ensure that there is a link property
			if (typeof options.model.link === 'undefined') {
				options.model.link = {
					'type': Upfront.Util.guessLinkType(this.model['menu-item-url']),
					'url': this.model['menu-item-url'],
					'target': this.model['menu-item-target']
				};
			}

			this.link = new LinkModel(this.model.link);

			this.parent_view = options.parent_view;
			this.newitem = options.newitem;
			this.level = options.level;
			_.bindAll(this, 'render');

			var ContextMenuList = Upfront.Views.ContextMenuList.extend({
				initialize: function(opts) {
					this.options = opts;
					this.for_view = this.options.for_view;
					this.menuitems = _([
						new Upfront.Views.ContextMenuItem({
							get_label: function() {
								var linktype = me.model.link.type;
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
								Upfront.Util.visitLink(me.model.link.url);
							}
						}),
						new Upfront.Views.ContextMenuItem({
							get_label: function() {
								return l10n.edit_url;
							},
							action: function() {
								me.removeContexts = false;
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

		on_click: function(e) {

			var linkitem = $(e.target).parent('li.menu-item');

			if(linkitem.hasClass('parent') && linkitem.closest('.upfront-output-unewnavigation').data('style') == 'burger') {
				e.stopPropagation();

				if(linkitem.hasClass('burger_sub_display'))
					linkitem.removeClass('burger_sub_display');
				else
					linkitem.addClass('burger_sub_display');

				var menu = linkitem.closest('ul.menu');
				var menucontainer = linkitem.closest('div.upfront-output-unewnavigation');

				if(menucontainer.data('burger_over') == 'pushes' && (menucontainer.data('burger_alignment') == 'top' || menucontainer.data('burger_alignment') == 'whole')) {

					$('section.upfront-layout').css('margin-top', menu.height());


					var topbar_height = $('div#upfront-ui-topbar').outerHeight();
					var ruler_height = $('.upfront-ruler-container').outerHeight();
					menu.offset({top:topbar_height+ruler_height, left:$('section.upfront-layout').offset().left});


				}
			}
		},

		on_context_menu: function(e) {
			if (Upfront.Settings.Application.no_context_menu) return;

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

		onOpenPanelSubMenuClick: function(event) {
			this.onOpenPanelSubMenu();
		},

		onOpenPanelSubMenu: function() {
			var me = this;
			if (this.$el.hasClass('ui-sortable-handle') && this.$el.children('ul').children('li').hasClass('controls-visible')) {
				this.$el.children('ul').sortable('disable');
			} else {
				this.$el.addClass('ui-sortable-handle');
			}
		},

		processPanelsOnSave: function() {
			this.parent_view.$el.find('ul.time_being_display').removeClass('time_being_display');
			this.$el.removeClass('controls-visible');
			this.setItemControlsState();
		},

		render: function (event) {
			var me = this,
				content = '<a class="menu_item uf-click-to-edit-text',
				menu_set_url = ( typeof this.model.link['url'] !== undefined )
					? this.model.link['url'].replace(Upfront.Settings.site_url, '').replace('/','')
					: '',
				current_url = Backbone.history.fragment
			;

			if(me.newitem) content = content + ' new_menu_item menu_item_placeholder';

			content = content+'" ><span class="menu_item-ueditor">'+this.model['menu-item-title']+'</span></a>';

			if(this.model.link['url'].indexOf('#ltb-') > -1 && !Upfront.Util.checkLightbox(this.model.link['url']))
					content = content + '<span class="missing-lightbox-warning"></span>';

			$(this.el).html(content).addClass('menu-item-depth-'+me.level);
			if ( menu_set_url === current_url ) $(this.el).addClass('current-menu-item');
			
			$(this.el).data('depth', me.level);
			this.createControlPanel();

			$(this.el).data('backboneview', me).addClass('menu-item');
			if(me.newitem) $(this.el).addClass('new_menu_item');

			return this;
		},

		onOpenItemControlsClick: function() {
			var parent = this.$el.parent('ul');
			if(typeof parent !== "undefined" && parent.hasClass('time_being_display')) {
				parent.removeClass('time_being_display');
			}
			this.setItemControlsState();
		},

		setItemControlsState: function() {
			if (this.$el.hasClass('controls-visible')) {
				this.controlsVisible = true;
				
				while(currentcontext.length > 0 && currentcontext.hasClass('sub-menu')) {
					currentcontext.addClass('time_being_display');
					currentcontext = currentcontext.parent().parent('ul');
				}
				
				// add class if last region to allocate clearance
				var $region = this.$el.closest('.upfront-region-container'),
					$lastRegion = $('.upfront-region-container').not(
					'.upfront-region-container-shadow').last()
				;
				if ( $lastRegion.get(0) == $region.get(0) ) $region.addClass('upfront-last-region-padding');
				

			} else {
				this.controlsVisible = false;
				// remove class that was previously added on last region
				this.$el.closest('.upfront-region-container').removeClass('upfront-last-region-padding');
			}
		},
		
		editLabel: function() {
			this.parent_view.model.trigger('menuitem:edit', this.$el.find('a'));
			Upfront.Events.trigger('upfront:hide:subControl');
		},
		
		createControlsEach: function() {
			var panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
				moreOptions = new Upfront.Views.Editor.InlinePanels.SubControl(),
				me = this
			;

			moreOptions.icon = 'more';
			moreOptions.inline = true;
			//moreOptions.tooltip = l10n.ctrl.caption_position;	
			moreOptions.sub_items = {};
			
			moreOptions.sub_items['edit'] = this.createControl('labelEdit', '', 'editLabel', 28, 28);
			
			moreOptions.sub_items['link'] = this.createLinkControl();

			moreOptions.sub_items['remove'] = this.createControl('remove', '', 'deleteMenuItem', 28, 28);

			panel.items.push(moreOptions);

			this.listenTo(moreOptions, 'panel:close', function(){
				me.$el.closest('.ui-sortable').sortable('enable');
				me.$el.removeClass('stayOpen');
			});
			
			this.listenTo(moreOptions, 'panel:open', function() {
				me.$el.closest('.ui-sortable').sortable('disable');
				me.$el.addClass('stayOpen controls-visible');
			});

			return panel;
		},
		
		createLinkControl: function(){
			var me = this,
				linkControl = new Upfront.Views.Editor.InlinePanels.LinkControl()
			;

			linkControl.view = linkPanel = new Upfront.Views.Editor.LinkPanel({
				model: this.link,
				button: false,
				icon: 'link',
				tooltip: 'link',
				id: 'link'
			});

			this.listenTo(this.link, 'change', function() {
				me.model.link = me.link.toJSON();
				me.model['menu-item-url'] = me.model.link.url;
				me.model['menu-item-target'] = me.model.link.target;
				me.saveLink();
			});
			
			/*
			this.listenTo(linkControl, 'panel:ok', function(){
				linkControl.close();
			});

			me.listenTo(linkControl, 'panel:open', function(){
				linkControl.$el
					.parents('.ugallery_item')
						.addClass('upfront-control-visible').end()
					.closest('.ugallery_link')
						.removeAttr('href') //Deactivate link when the panel is open
				;

				me.$el.closest('.ui-draggable').draggable('disable');
			});

			me.listenTo(linkControl, 'panel:ok', function(){
				linkControl.$el
					.parents('.ugallery_item')
						.removeClass('upfront-control-visible');

				setTimeout(function() {
					linkControl.$el.closest('.ugallery-controls').siblings('.ugallery_link')
						.attr('href', imageLink.get('url'))
						.attr('target', imageLink.get('target'))
						.attr('class', 'ugallery_link ugallery_link' + imageLink.get('type'));

						var $item = linkControl.$el.closest(".ugallery_item");


						me.add_controls_to_item( image, $item );
				}, 50);

				me.$el.closest('.ui-draggable').draggable('enable');
			});
			
			*/

			linkControl.icon = 'link';
			//linkControl.tooltip = l10n.ctrl.image_link;
			linkControl.id = 'link';

			//Set icon width & height
			linkControl.width = 28;
			linkControl.height = 28;
			
			this.$el.data('linkpanel', linkControl);

			return linkControl;
		},
		
		createControl: function(icon, tooltip, click_callback, width, height) {
			var me = this,
				item = new Upfront.Views.Editor.InlinePanels.Control();

			item.icon = icon;
			item.tooltip = tooltip;

			//Set icon width & height
			item.width = width;
			item.height = height;

			if(click_callback) {
				this.listenTo(item, 'click', function(e){
					me[click_callback](e);
				});
			}

			return item;
		},

		createControlPanel: function() {
			var controls = this.createControlsEach();
			controls.render();

			this.$el.append($('<div class="umenu-controls upfront-element-controls upfront-ui"></div>').append(controls.$el));

			return controls;
		},

		createDropDown: function(e) {
			var placeholder = $('<ul>').addClass('sub-menu').addClass('time_being_display');
			$(e.target).closest('li').append(placeholder);
			this.parent_view.addMenuItem(placeholder);
			this.parent_view.makeSortable();
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
				//console.log('ajax call to set delete menu item');
				Upfront.Util.post({"action": "upfront_new_delete_menu_item", "menu_item_id": me.model['menu-item-db-id'], "new_menu_order" : neworder})
					.success(function (ret) {
						if(me.$el.find('ul.sub-menu').length > 0)
							parentview.render();
					})
					.error(function (ret) {
						Upfront.Util.log("Error Deleting Menu Item");
					})
				;
			}

			setTimeout(function(){
				Upfront.Events.trigger("menu_element:edit");
			}, 100);
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

			if(urlParts[0].trim() !== '')
				return urlParts[0];
			else
				return location.href.replace('?dev=true', '');
		},

		saveLink: function(remove, keep) {
			var me = this;

			if(typeof(remove) != 'undefined' && remove) {
				me.deleteMenuItem();
				return;
			}

			me.$el.find('a.new_menu_item').removeClass('new_menu_item');
			me.$el.removeClass('new_menu_item');

			//me.parent_view.$el.find('ul.time_being_display').removeClass('time_being_display');

			var menu_item = ($(this.el).children('a.menu_item').length > 0) ?
				$(this.el).children('a.menu_item'):$(this.el).children('div').children('a.menu_item');

			if (!menu_item.hasClass('menu_item_placeholder') && menu_item.next('a.ueditor-placeholder').length < 1) {
				this.model['menu-item-title'] = menu_item.text();
			} else {
				this.model['menu-item-title'] = '';
			}

			if ($(this.el).children('div.redactor_box').length > 0) {
				menu_item.blur();
			}

			if (me.model['menu-item-title'].trim() === '') {
				if (typeof(keep) != 'undefined' && keep) {
					var title_text = menu_item.next('a.ueditor-placeholder').text() || (menu_item.is("a.menu_item_placeholder") ? menu_item.text() : '');
					me.model['menu-item-title'] = title_text;
				} else {
					me.deleteMenuItem();
					return;
				}
			}

			var postdata = {
				'action': "upfront_new_update_menu_item",
				'menu': me.parent_view.model.get_property_value_by_name('menu_id') ,
				'menu-item': this.model
			};

			if (typeof this.model['menu-item-db-id'] != 'undefined') {
				postdata['menu-item-id'] = me.model['menu-item-db-id'];
			}

			//console.log('ajax call to new update menu item');
			Upfront.Util.post(postdata)
				.success(function (ret) {
					me.model['menu-item-db-id'] = ret.data;
					//Triggering this event is causing nav to re-render and hide Link Panel
					//Upfront.Events.trigger("menu_element:edit");
				})
				.error(function (ret) {
					Upfront.Util.log("Error updating menu item");
				})
			;
		},

		openTooltip: function(content, element) {
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

		onItemOver: function(){
			this.$el.parents('.upfront-module').find('.upfront-resize-handle-s').addClass('active-menu-item');
		},

		onItemOut: function(){
			this.$el.parents('.upfront-module').find('.upfront-resize-handle-s').removeClass('active-menu-item');
		}
	});

	return MenuItemView;
})(jQuery);
});
