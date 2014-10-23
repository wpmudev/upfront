(function ($) {
define([], function(){//editorTpl) {

var l10n = Upfront.Settings.l10n.newnavigation_element;

//var $editorTpl = $(editorTpl);


/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var UnewnavigationModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.unewnavigation.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);

	}
});


var MenuItemView = Backbone.View.extend({
	tagName: 'li',
	contextmenuContext: [],
	removeContexts: true,
	events: {
		'click i.delete_menu_item' : 'deleteMenuItem',
		'click i.edit_link' : 'editLink',
		'click i.navigation-add-item': 'addMenuItem',
		"contextmenu a.menu_item": "on_context_menu",
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
							return l10n.visit_url;
						},
						action: function() {
							if(me.model['menu-item-url'].indexOf('#') > -1 && me.getCleanurl(me.model['menu-item-url']) == me.getCleanurl()) {
								if(me.model['menu-item-url'].indexOf('#ltb-') > -1)	 {
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
								} else {
									var anchors = me.parent_view.get_anchors();
									$('html,body').animate({scrollTop: $('#'+me.getUrlanchor(me.model['menu-item-url'])).offset().top},'slow');
								}
							} else if(me.model['menu-item-target'] == '') {
								window.location.href = me.model['menu-item-url'];
							} else window.open(me.model['menu-item-url']);
						}
					}),
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return l10n.edit_url;
						},
						action: function() {
							if($(me.event.target).hasClass('ueditor-placeholder'))
								$(me.event.target).siblings('a.menu_item').addClass('new_menu_item');
							else
								$(me.event.target).addClass('new_menu_item');

			 				me.removeContexts = false;
						 	me.parent_view.editMenuItem(me.$el.find('a.new_menu_item'));
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
				//this.constructor.__super__.initialize.apply(this, arguments);
				this.menulists = _([
					new ContextMenuList({for_view: this.for_view})
				]);

			}
		});

		Upfront.Events.on("entity:contextmenu:deactivate", this.remove_context_menu, this);

		this.createLinkPanel();
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
	render: function (event) {
		var me = this;
		var content = '<a class="menu_item';

		if(me.newitem) content = content + ' new_menu_item menu_item_placeholder';

		content = content+'" >'+this.model['menu-item-title']+'</a><i class="edit_link">o</i><i class="delete_menu_item">x</i>';
		$(this.el).html(content);
		$(this.el).data('backboneview', me).addClass('menu-item');
		if(me.newitem) $(this.el).addClass('new_menu_item');

		return this;
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
	editLink: function(e) {
		this.$el.find('a.menu_item').addClass('new_menu_item');
		this.parent_view.editMenuItem(this.$el.find('a.new_menu_item'));
	},
	createLinkPanel: function(){
		var linkPanel = new Upfront.Views.Editor.LinkPanel({
			theme: 'light',
			button: true
		});

		this.listenTo(linkPanel, 'link:ok', function(link){
			var itemType = 'custom';

			console.log('link ok');
			this.model['menu-item-url'] = link.url;

			if(link.type == 'entry'){
				itemType = 'post_type';
				if(this.postSelected && this.postSelected.get('permalink') == link.url){
					this.model['menu-item-object'] =  this.postSelected.get('post_type');
					this.model['menu-item-object-id'] =  this.postSelected.get('ID');
				}
			}

			this.model['menu-item-type'] = itemType;

			this.saveLink(false, (this.model['menu-item-url'].trim().replace('http://') != ''));
			this.closeTooltip();
		});

		this.listenTo(linkPanel, 'link:postselected', function(link, post){
			this.postSelected = post;
		});

		this.linkPanel = linkPanel;
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
				me.model['menu-item-title'] = menu_item.next('a.ueditor-placeholder').text();
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
		tooltip.hide().html(content);//tooltip.hide().html(content);
		elementPosition.right = elementPosition.left + element.width();
		if(elementPosition.left - 280 < 0){
			tooltipPosition.left = elementPosition.left + element.width() + 20;
			tooltipClass = 'unewnavigation-tooltip-bottom';
		}
		//console.log('oopening tooltip');
		tooltip
			.css(tooltipPosition)
			.addClass(tooltipClass)
			.show()
			.on('click', function(e){
				console.log("click ok");
				e.stopPropagation();
			})
			.on('blur', function(e){
				console.log(e);
				//me.closeTooltip();
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

var CurrentMenuItemData = Backbone.Model.extend({
	defaults: {
		'id':  false,
		'name':  false,
		'url':  false,
		'model_true':  true,
		"menu_id":     false,
		"menuList":    false
	}
});
var currentMenuItemData = new CurrentMenuItemData();


/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var singleclickcount = 0;
var UnewnavigationView = Upfront.Views.ObjectView.extend({
	elementSize: {width: 0, height: 0},
	roll_responsive_settings: true,
	cssSelectors: {
		"div[data-style='horizontal'] ul.menu, div[data-style='vertical'] ul.menu": {label: l10n.css.bar_label, info: l10n.css.bar_info},
		"div[data-style='horizontal'] ul.menu > li.menu-item > a, div[data-style='vertical'] ul.menu > li.menu-item > a": {label: l10n.css.item_label, info: l10n.css.item_info},
		"div[data-style='horizontal'] ul.menu > li.menu-item:hover > a, div[data-style='vertical'] ul.menu > li.menu-item:hover > a": {label: l10n.css.hover_label, info: l10n.css.hover_info},
		"div[data-style='horizontal'] ul.sub-menu > li.menu-item > a, div[data-style='vertical'] ul.sub-menu > li.menu-item > a": {label: l10n.css.subitem_label, info: l10n.css.subitem_info},
		"div[data-style='horizontal'] ul.sub-menu > li.menu-item:hover > a, div[data-style='vertical'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.subitem_hover_label, info: l10n.css.subitem_hover_info},


		"div[data-style='burger'] ul.menu": {label: l10n.css.responsive_bar_label, info: l10n.css.bar_info},
		"div.responsive_nav_toggler": {label: l10n.css.responsive_trigger, info: l10n.css.hover_info},
		"div.responsive_nav_toggler > div": {label: l10n.css.responsive_trigger_bars, info: l10n.css.hover_info},
		" div[data-style='burger'] ul.menu > li.menu-item > a": {label: l10n.css.responsive_item_label, info: l10n.css.item_info},
		"div[data-style='burger'] ul.menu > li.menu-item:hover > a": {label: l10n.css.responsive_hover_label, info: l10n.css.hover_info},
		"div[data-style='burger'] ul.sub-menu > li.menu-item > a": {label: l10n.css.responsive_subitem_label, info: l10n.css.subitem_info},
		"div[data-style='burger'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.responsive_subitem_hover_label, info: l10n.css.subitem_hover_info}
	},

	initialize: function(options){
		var me = this;

		this.editmode = false;

		this.property('initialized', false);
		if(!(this.model instanceof UnewnavigationModel)){
			this.model = new UnewnavigationModel({properties: this.model.get('properties')});
		}
		Upfront.Views.ObjectView.prototype.initialize.call(this);

		this.events = _.extend({}, this.events, {
			'click a.menu_item' : 'exitEditMode',
			'dblclick a.menu_item' : 'editMenuItem',
			'click a.newnavigation-add-item': 'addPrimaryMenuItem',

		});

		// get all menus
		this.getMenus();
		var menu_id = this.model.get_property_value_by_name('menu_id');
		currentMenuItemData.set({model_true:false, menu_id: menu_id});
		//check auto add on initialize
		//this.auto_add_pages();
		//set data on initialize
		if(menu_id) Upfront.data.navigation.get_this_menu_items = Upfront.Util.post({"action": "upfront_new_load_menu_items", "data": currentMenuItemData.get('menu_id')});

		// call this function on allow_new_pages change
		if (!!this.model.get_property_by_name('allow_new_pages')) {
			this.model.get_property_by_name('allow_new_pages').on('change', this.update_auto_add_pages, this);
		}

		this.property('menu_items', false);

		this.on('deactivated', this.onDeactivate, this);
		this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", function(current, previous) {
			me.render();
			$.event.trigger({
				type: "changed_breakpoint",
				selector: ".upfront-output-unewnavigation",
				width: current.width
			});
		});
		this.listenTo(Upfront.Events, "entity:removed:before", this.on_removal);

	},
	on_removal: function() {
		var tooltip = $('#unewnavigation-tooltip');
		tooltip.hide().trigger('closed');
		setTimeout(function(){
			tooltip.remove();
		}, 100);
	},
	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [];
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				module.get("objects").each(function (object) {
					var anchor = object.get_property_value_by_name("anchor");
					if (anchor && anchor.length) anchors[anchor] = object;
				});
			});
		});
		return anchors;
	},
	exitEditMode: function(e) {
		var me = this;
		var thelink = $(e.target).closest('li').data('backboneview');

		if(!$(e.target).hasClass('ueditable')) {
			var editablefound = false;
			this.$el.find('a.ueditable').each(function() {
				try {
					$(this).data('ueditor').stop();
				} catch (err) { }
				editablefound = true;
			});
			if(editablefound) return;
		}

		if($(e.target).closest('.redactor_box').length > 0) {
			return;
		}

		singleclickcount++;
		if(singleclickcount == 1) {
			setTimeout(function(){
				if(singleclickcount == 1) {
					var menu_item_clean = thelink.model['menu-item-url'];
					if (!menu_item_clean.match(/^#[a-zA-Z0-9_-]+/)) {
						menu_item_clean = thelink.getCleanurl(thelink.model['menu-item-url']);
					}

					if((thelink.model['menu-item-url'].indexOf('#') > -1 && thelink.getCleanurl() == menu_item_clean) || thelink.model['menu-item-url'].match(/^#/)) {
						if(thelink.model['menu-item-url'].indexOf('#ltb-') > -1) {
							var regions = Upfront.Application.layout.get('regions');
							region = regions ? regions.get_by_name(thelink.getUrlanchor(thelink.model['menu-item-url'])) : false;
							if(region){
								//hide other lightboxes
								_.each(regions.models, function(model) {
									if(model.attributes.sub == 'lightbox')
										Upfront.data.region_views[model.cid].hide();
								});

								var regionview = Upfront.data.region_views[region.cid];
								regionview.show();
							}
						} else {
							var anchors = me.get_anchors();
							$('html,body').animate({scrollTop: $('#'+thelink.getUrlanchor(thelink.model['menu-item-url'])).offset().top},'slow');
						}
					} else if(thelink.model['menu-item-target'] == '') {
						window.location.href = thelink.model['menu-item-url'];
					} else window.open(thelink.model['menu-item-url']);
				}
				singleclickcount = 0;
			}, 400);
		}
	},
	editMenuItem: function(e) {
		this.editModeOn(e);
		var me = this;
		var target;
		if(typeof e.target == 'undefined' || e.target.trim == '') target = $(e);
		else target = $(e.target);

		if(target.hasClass('ueditor-placeholder'))
			target = target.siblings('a.menu_item');

		target.closest('li').addClass('edit_mode');
		if(!target.data('ueditor')) {
			target.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				focus: true,
				tabFocus: false,
				airButtons: false,
				allowedTags: ['h5'],
				placeholder: 'Link Name'
			}).on('start', function(e) {
				target.focus();
			}).on('keydown', function(e){
				if (e.which == 8) {
					setTimeout(function() {
						//console.log($(target).text());
						if(target.text() == '' && !target.hasClass('menu_item_placeholder')) {
							var e = jQuery.Event("keydown");
							e.which = 8;
							target.trigger(e);
						}
					}, 100);
				}
				else if (e.which == 27) {
					if(target.hasClass('new_menu_item')) {
						target.closest('li').data('backboneview').closeTooltip();
						target.closest('li').data('backboneview').saveLink(true);
					}
				}
				else if (e.which == 9) {
					e.preventDefault();
					if(!target.hasClass('new_menu_item')) {
					target.blur();
					target.closest('ul').children('li:last').children('i.navigation-add-item').trigger('click');}
				}
				else if(e.which == 13) {
					e.preventDefault();
					target.blur();

				}
				if(target.text().trim() != '') target.removeClass('menu_item_placeholder');
				else target.addClass('menu_item_placeholder');
			}).on('blur', function() {
				target.data('ueditor').stop();
				target.closest('li').removeClass('edit_mode');
				if(!target.hasClass('new_menu_item')) {
					target.closest('li').data('backboneview').saveLink();
				}
			}).on('stop', function() {
				me.editModeOff();
			});
		} else {
			target.data('ueditor').start();
			target.focus();
		}


		var currentcontext = target.closest('ul');


		while(currentcontext.length > 0 && currentcontext.hasClass('sub-menu')) {
			currentcontext.addClass('time_being_display');
			currentcontext = currentcontext.parent().parent('ul');
		}
		if(target.hasClass('new_menu_item') ) {
			if($('div#unewnavigation-tooltip').length <1 || $('div#unewnavigation-tooltip').css('display') == 'none') {
				_.delay(function(self) {
					var view = target.closest('li').data('backboneview');
					if (view && view.editMenuItem) view.editMenuItem(e);
				}, 30, this);
			}
		}
	},
	editModeOn: function(e) {
		this.$el.find('.upfront-object-content ul').each(function() {
			if($(this).hasClass('ui-sortable')) $(this).sortable('disable');
		});
	},
	editModeOff: function() {
		this.$el.find('.upfront-object-content ul').each(function() {
			if($(this).hasClass('ui-sortable')) $(this).sortable('enable');
		});
	},
	onDeactivate: function() {
		this.$el.find('li.edit_mode a.menu_item').blur();
		this.editModeOff();
		this.$el.find('.time_being_display').removeClass('time_being_display');
	},
	property: function(name, value, silent) {
		if(typeof value != "undefined") return this.model.set_property(name, value, silent);
		return this.model.get_property_value_by_name(name);
	},
	update_auto_add_pages: function(){
		var menu_id = this.model.get_property_value_by_name('menu_id'),
			allow_new_pages = this.property('allow_new_pages'),
			nav_menu_option = Upfront.data.navigation.auto_add['auto_add'],
			key
		;

		if(!menu_id) return false;

		menu_id = parseInt(this.model.get_property_value_by_name('menu_id'), 10);

		if ( !nav_menu_option ) nav_menu_option = [];
		if ( allow_new_pages[0] == ['yes'] ) {
			if ( nav_menu_option.indexOf(menu_id) == -1 ) nav_menu_option.push(menu_id);
		} else {
			if ( -1 !== ( key = nav_menu_option.indexOf(menu_id) ) ) nav_menu_option.splice(key, 1);
		}

		if(!Upfront.data.navigation.auto_add){
			Upfront.data.navigation.auto_add = {0:false, auto_add:[]};
		}else{
			Upfront.data.navigation.auto_add['auto_add'] = nav_menu_option;
		}

		Upfront.Util.post({"action": "upfront_new_update_auto_add_pages", "nav_menu_option": JSON.stringify(Upfront.data.navigation.auto_add)})
			.error(function(res){
				Upfront.Util.log("Cannot update auto add pages!");
			})
		;
	},
	auto_add_pages: function(){
		var menu_id = parseInt(this.model.get_property_value_by_name('menu_id'),10);
		// checking auto add option for current menu
		if ( !Upfront.data.navigation.auto_add['auto_add']  ) {
			this.model.set_property(
				'allow_new_pages',
				['no'],
				true
			);
		} else if ( -1 !== Upfront.data.navigation.auto_add['auto_add'].indexOf(menu_id) ) {
			this.model.set_property(
				'allow_new_pages',
				['yes'],
				true
			);
		} else {
			this.model.set_property(
				'allow_new_pages',
				['no'],
				true
			);
		}
	},
	getMenus: function(){
		var me = this;
		// Ajax call for Menu list
		Upfront.Util.post({"action": "upfront_new_load_menu_list"})
			.success(function (ret) {
				me.existingMenus = ret.data;
				var values = _.map(ret.data, function (each, index) {
					return  {label: each.name, value: each.term_id};
				});
				currentMenuItemData.set({menuList: values});
				if(!me.property('menu_id')) me.display_menu_list();
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu list");
			})
		;
	},
	display_menu_list: function () {
		var me = this;
		me.$el.find('div.upfront-object-content').html('');

		var menuItems = new Upfront.Views.Editor.Field.Select({
			model: me.model,
			label: "",
			className: "existing_menu_list",
			values: [{label:'Choose existing menu', value: 0}].concat(currentMenuItemData.get('menuList'))
		});

		menuItems.render();

		me.$el.find('div.upfront-object-content').append(menuItems.el).append('<span> or </span>');

		var newMenuName = new Upfront.Views.Editor.Field.Text({
			model: me.model,
			label: l10n.new_menu_name,
			className: "new_menu_name",
			compact: true
		});

		newMenuName.render();

		me.$el.find('div.upfront-object-content').append(newMenuName.el);

		var newMenuButton = new Upfront.Views.Editor.Field.Button({
			model: me.model,
			label: l10n.create_new,
			className: "new_menu_button",
			compact: true
		});

		newMenuButton.render();
		me.$el.find('div.upfront-object-content').append(newMenuButton.el);

		me.$el.find('div.upfront-object-content > div.new_menu_name').on('mouseover', function() {
			me.$el.parent().parent().parent().draggable('disable');
		}).on('keydown', function(e) {if(e.which == 13) me.$el.find('div.upfront-object-content > div.new_menu_button > input').trigger('click');});

		me.$el.find('div.upfront-object-content > div.new_menu_name').on('mouseout', function() {
			me.$el.parent().parent().parent().draggable('enable');
		});

		me.$el.find('div.upfront-object-content > div.existing_menu_list').on('mouseover', function() {
			me.$el.parent().parent().parent().draggable('disable');
		});

		me.$el.find('div.upfront-object-content > div.existing_menu_list').on('mouseout', function() {
			me.$el.parent().parent().parent().draggable('enable');
		});

		me.$el.find('div.upfront-object-content > div.new_menu_button > input').on('click', function() {
			if(me.$el.find('div.upfront-object-content > div.new_menu_name input').val()!='') {
				me.create_new_menu(me.$el.find('div.upfront-object-content > div.new_menu_name input').val());
			}
		});

		me.$el.find('div.upfront-object-content > div.existing_menu_list input').on('change', function() {
			me.$el.parent().parent().parent().draggable('enable');
			if(me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val() != 0) {
				if(!me.property('initialized')) me.property('initialized', true, true);
				var id = me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val();
				me.property('menu_id', id);
				me.property('menu_slug', _.findWhere(me.existingMenus, {term_id: id}).slug, true);
			}
		});
	},
	create_new_menu: function(MenuName) {
		var me = this;
		// Ajax call for creating menu
		var newMenu = Upfront.Util.post({"action": "upfront_new_create_menu", "menu_name": MenuName})
			.success(function (ret) {
				me.property('menu_slug', ret.data.slug, true);
				me.property('menu_id', ret.data.id);
				me.getMenus();
			})
			.error(function (ret) {
				Upfront.Util.log("Error creating menu");
			})
		;
	},
	get_content_markup: function () {

		var menu_id = this.model.get_property_value_by_name('menu_id'),
			me = this
		;
		var menu_slug =  this.model.get_property_value_by_name('menu_slug');


		if ( !menu_id ) {
			if(typeof(menu_slug != 'undefined') && menu_slug != '') this.set_menu_id_from_slug(menu_slug);
			return "";
		}

		Upfront.Util.post({"action": "upfront_new_load_menu_array", "data": menu_id})
			.success(function (ret) {
				if(!ret.data){
					me.$el.find('.upfront-object-content').html('Please add menu items');
					return;
				}
				me.property('menu_items', ret.data, true);
				me.generate_menu();
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu");
			})
		;
		return 'Loading';
	},
	set_menu_id_from_slug: function(slug) {
		var me = this;
		Upfront.Util.post({"action": "upfront_new_menu_from_slug", "data": slug})
			.success(function (ret) {
				me.property('menu_id', ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu from slug");
			})
		;
	},
	onElementResize: function() {
		if(this.property('burger_menu') === false || (typeof(this.property('burger_menu')) == 'object' && this.property('burger_menu').length == 0)) {
			if($('.upfront-resize').width() < 360) {
				this.property('menu_style', 'vertical');
			} else if($('.upfront-resize').width() > 460) {
				this.property('menu_style', 'horizontal');
			}
		}

		if($('.upfront-resize').height() < 80) {
			this.$el.closest('div.upfront-module').addClass('newnavigation_squished');
		}
		else {
			this.$el.closest('div.upfront-module').removeClass('newnavigation_squished');
		}
	},
	on_render: function() {
		var me = this;
		//Bind resizing events
		if(typeof(me.parent_module_view) != 'undefined') {
			if(!me.parent_module_view.$el.data('resizeHandling')){
				me.parent_module_view.$el
					.on('resizestop', $.proxy(me.onElementResize, me))
					.data('resizeHandling', true)
				;
			}
		}


		if(!this.property('menu_id')) {
			this.display_menu_list();
		}

		var menuStyle = this.property("menu_style"),
			menuAliment = this.property("menu_alignment"),
			allowSubNav = this.property("allow_sub_nav"),
			$upfrontObjectContent
		;

		$upfrontObjectContent = this.$el.find('.upfront-object-content');
		if(this.$el.find('a.newnavigation-add-item').length < 1) {
			$('<b class="upfront-entity_meta newnavigation_add add_item upfront-ui"><a href="#" class="upfront-icon-button newnavigation-add-item add-item"></a></b>').insertBefore($upfrontObjectContent);
		}
		if(me.roll_responsive_settings) {
			me.roll_responsive_settings = false;
			setTimeout(function() {
				var model_breakpoint = me.model.get_property_value_by_name('breakpoint');
				if(model_breakpoint) {
					var enabled_breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();

					for(key in enabled_breakpoints) {
						if(typeof(model_breakpoint[enabled_breakpoints[key].id]) != 'undefined') {
							model_breakpoint[enabled_breakpoints[key].id].width = enabled_breakpoints[key].attributes.width;
						}
					}

					//manually add values for desktop
					var default_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default();
					var is_burger_menu = me.property('burger_menu');
					model_breakpoint[default_breakpoint.attributes.id] = {};
					model_breakpoint[default_breakpoint.attributes.id].burger_menu = ( is_burger_menu instanceof Array ) ? is_burger_menu[0] : is_burger_menu;
					model_breakpoint[default_breakpoint.attributes.id].burger_alignment = me.property('burger_alignment');
					model_breakpoint[default_breakpoint.attributes.id].burger_over = me.property('burger_over');
					model_breakpoint[default_breakpoint.attributes.id].width = default_breakpoint.attributes.width;


					$upfrontObjectContent.attr('data-breakpoints',	JSON.stringify(model_breakpoint));

					var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint, width;
					if(!breakpoint) {
						width = default_breakpoint.attributes.width;
					} else width = breakpoint.width;
					// To roll responsive nav settings into action
					$.event.trigger({
						type: "changed_breakpoint",
						selector: ".upfront-output-unewnavigation",
						width: width
					});
				}
				me.roll_responsive_settings = true;
			}, 300);
		}
		$upfrontObjectContent.attr('data-aliment',(menuAliment ? menuAliment : 'left'));
		$upfrontObjectContent.attr('data-style',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-stylebk',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav.length !== 0 && allowSubNav[0] == 'yes' ? allowSubNav[0] : 'no'));

		//Work around for having the region container have a higher z-index if it contains the nav, so that the dropdowns, if overlapping to the following regions should not loose "hover" when the mouse travels down to the next region.
		var region_container = this.$el.closest('.upfront-region-container');
		if(region_container.css('z-index') == 'auto' || parseInt(region_container.css('z-index')) < 11) {
			region_container.css('z-index', 11);
		}

		setTimeout(function() {
			if(me.$el.height() < 80) {
				me.$el.addClass('newnavigation_squished');
			}
			else {
				me.$el.removeClass('newnavigation_squished');
			}
		}, 200);

	},
	toggle_responsive_nav: function(e) {
		if($(this).parent().find('ul.menu').css('display') == 'none') {
			$(this).parent().find('ul.menu').show();
		} else {
			$(this).parent().find('ul.menu').hide();
			$(this).parent().find('ul.sub-menu').css('display', '');
		}
	},
	generate_menu: function() {
		var me = this;
		var menu_id = this.model.get_property_value_by_name('menu_id');
		if(!menu_id) return;

		this.$el.find('.upfront-object-content').html('');
		if(this.property('menu_items').length > 0) {
			this.$el.find('.upfront-object-content').append(this.renderMenu(this.property('menu_items'), 'menu'));
		} else {
			//	this.$el.find('.upfront-object-content').append(this.renderMenu([me.menuItemTemplate()], 'menu'));
			//	me.$el.find('ul.menu li.menu-item').addClass('new_menu_item').find('a.menu_item').addClass('new_menu_item').addClass('menu_item_placeholder')
			//	me.editMenuItem(this.$el.find('a.new_menu_item'));
			this.$el.find('.upfront-object-content').append(this.renderMenu(this.property('menu_items'), 'menu'));
			//*	this.$el.find('ul.menu').append(this.renderMenuItem(this.menuItemTemplate(), true));
			setTimeout(function() {
				me.$el.find('a.newnavigation-add-item').trigger('click');
			}, 200);
		}



		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;

		if(!breakpoint || breakpoint.default) {
			if(this.model.get_property_value_by_name('burger_menu') == 'yes') {
				this.$el.find('.upfront-object-content').prepend($('<div>').addClass("responsive_nav_toggler").append('<div></div><div></div><div></div>').bind('click', me.toggle_responsive_nav));
				this.$el.find('ul.menu').hide();
			}
		} else {
			model_breakpoint = this.model.get_property_value_by_name('breakpoint')
			breakpoint_data = model_breakpoint[breakpoint.id];
			if(breakpoint_data && breakpoint_data.burger_menu == 'yes') {
				this.$el.find('.upfront-object-content').prepend($('<div>').addClass("responsive_nav_toggler").append('<div></div><div></div><div></div>').bind('click', me.toggle_responsive_nav));
				this.$el.find('ul.menu').hide();
			}
		}
		this.makeSortable();
		console.log('happened?');
	},
	makeSortable: function() {
		var me = this;
		this.$el.find('.upfront-object-content ul').each(function() {
			if(!$(this).hasClass('ui-sortable')) {
				$(this).sortable({
					start: function ( event, ui ) {
						ui.item.find('i.navigation-add-item').css('display', 'none');
					},
					stop: function( event, ui ) {
						ui.item.find('i.navigation-add-item').css('display', 'block');
						ui.item.parent('ul').children('li:last').append(ui.item.parent('ul').children('li').children('i.navigation-add-item'));
						me.saveMenuOrder();
					}
				});
			}
		});
	},
	saveMenuOrder: function() {
		var me = this;
		Upfront.Util.post({"action": "upfront_new_update_menu_order", "menu_items": me.new_menu_order()})
			.success(function (ret) {
				//console.log('cool');
				//me.property('menu_items', false);
				//Upfront.Events.trigger("entity:object:render_navigation");
				//Upfront.Events.trigger("navigation:get:this:menu:items");
			})
			.error(function (ret) {
				Upfront.Util.log("Error updating menu");
			})
		;
	},
	new_menu_order: function(removed) {
		var i = 0;

		var new_menu_order = new Array();
		this.$el.find('.upfront-object-content ul li').each(function() {
			if($(this).parent().parent('li').length > 0) {
				$(this).data('backboneview').model['menu-item-parent-id'] = $(this).parent().parent('li').data('backboneview').model['menu-item-db-id'];
			} else {
				$(this).data('backboneview').model['menu-item-parent-id'] = 0;
			}

			new_menu_order[i] = {};

			if(typeof(removed) != 'undefined') {
				if($(this).data('backboneview').model['menu-item-parent-id'] == parseInt(removed)) {
					$(this).data('backboneview').model['menu-item-parent-id'] = 0;
				}
			}

			if(typeof(removed) == 'undefined' || $(this).data('backboneview').model['menu-item-db-id'] != removed) {
				new_menu_order[i]['menu-item-db-id'] =  $(this).data('backboneview').model['menu-item-db-id'];
				new_menu_order[i]['menu-item-parent-id'] = $(this).data('backboneview').model['menu-item-parent-id'];

				$(this).data('backboneview').model['menu-item-position'] = i;
				i++;
			}
		});
		return new_menu_order;
	},
	renderMenu: function(list, classname){
		var $dom = $('<ul>').addClass(classname);
		if(classname=='menu') $dom.addClass('drag_mode');
		list.forEach( function(model){
			//if(model['menu-item-title'].trim() == '') model['menu-item-title'] = l10n.link_name;
			$dom.append(this.renderMenuItem(model));
			if(!(typeof model.sub === 'undefined')) {
				$dom.find(':last').parent().addClass('parent').append(this.renderMenu(model.sub, 'sub-menu'));
			}
		}, this);
		$dom.children('li:last').append('<i class="navigation-add-item"></i>')
		return $dom;
	},

	renderMenuItem: function (model, newitem){
		var me = this;
		if(typeof newitem == 'undefined') newitem = false;

		var view = new MenuItemView({model: model, parent_view: me, newitem: newitem});
		return view.render().el;
	},
	menuItemTemplate: function() {
		return {
			"menu-item-parent-id": "0",
			"menu-item-target": "",
			"menu-item-title": "",
			"menu-item-type": "custom",
			"menu-item-url": "#"
		};
	},
	addPrimaryMenuItem : function(e) {
		
		e.preventDefault();
		if(this.$el.find('ul.menu > li > i.navigation-add-item').length > 0) {
			
			this.$el.find('ul.menu > li > i.navigation-add-item').trigger('click');
		}
		else { 
		//	this.$el.find('ul.menu').append(this.renderMenuItem(this.menuItemTemplate(), true));
			this.addMenuItem(e);
		}
	},
	addMenuItem : function(e) {

		var me = this;
		var menuItemId = false;
		var menu_id = this.model.get_property_value_by_name('menu_id');

		me.$el.find('a.new_menu_item').removeClass('new_menu_item');

		var menu_item = this.menuItemTemplate();
		var newmenuitem;

		if(typeof e.target == 'undefined' && e.parent('li').length > 0) {
			menu_item["menu-item-parent-id"] = e.parent('li').data('backboneview').model["menu-item-db-id"];
			e.append(this.renderMenuItem(menu_item, true));
			e.children('li:last').append('<i class="navigation-add-item"></i>');
		} else {
			if($(e.target).parent('li').parent('ul').parent('li').length > 0) {
				menu_item["menu-item-parent-id"] = $(e.target).parent('li').parent('ul').parent('li').data('backboneview').model["menu-item-db-id"];
				$(e.target).parent('li').parent('ul').addClass('time_being_display');
			}
			if($(e.target).parent('li').length == 0) {
				$(e.target).closest('div.upfront-navigation').find('ul.menu').append(this.renderMenuItem(menu_item, true));
			}
			else {
				$(e.target).parent('li').parent('ul').append(this.renderMenuItem(menu_item, true));
				$(e.target).parent('li').next('li').append(e.target);
			}
		}
		me.editMenuItem(me.$el.find('a.new_menu_item').removeClass('new_menu_item')); //linkPanel does not popup on new menu creation because of this class being removed
	}

});

/**
 * Sidebar element class - this let you inject element into
 * sidebar elements panel and allow drag and drop element adding
 * @type {Upfront.Views.Editor.Sidebar.Element}
 */
var UnewnavigationElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 200,
	/**
	 * Set up element appearance that will be displayed on sidebar panel.
	 */
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-nav');
		this.$el.html(l10n.element_name);
	},

	/**
	 * This will be called by editor to request module instantiation, set
	 * the default module appearance here
	 */
	add_element: function () {
		var object = new UnewnavigationModel(), // Instantiate the model
			// Since newnavigation entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the newnavigation entity in
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c24 upfront-newnavigation_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(75)}
				],
				"objects": [
					object // The anonymous module will contain our newnavigation object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

		var Menu_Panel = Upfront.Views.Editor.Settings.Panel.extend({
			className: 'upfront-settings_panel_wrap menu-settings',
			save_settings: function(){
				Menu_Panel.__super__.save_settings.apply(this, arguments);
				this.model.set_property('menu_items', false, true);
			},
			on_save: function() {
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				var current_set_value = this.settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').val();
				var current_set_alignment = this.settings._wrapped[1].fields._wrapped[0].$el.find('input:checked').val();
				var current_set_over = this.settings._wrapped[1].fields._wrapped[1].$el.find('input:checked').val();

				model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});

				if ( breakpoint && !breakpoint.default ){
					if ( !_.isObject(model_breakpoint[breakpoint.id]) ) model_breakpoint[breakpoint.id] = {};
					breakpoint_data = model_breakpoint[breakpoint.id];
					breakpoint_data.burger_menu = current_set_value || '';
					breakpoint_data.burger_alignment = current_set_alignment;
					breakpoint_data.burger_over = current_set_over;

					if(this.model.get_property_value_by_name('burger_menu') == 'yes') {
						this.settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
					} else {
						this.settings._wrapped[0].fields._wrapped[1].$el.find('input').removeAttr("checked");
					}

					this.settings._wrapped[1].fields._wrapped[0].$el.find('input').removeAttr("checked");
					this.settings._wrapped[1].fields._wrapped[0].$el.find('input[value="'+this.model.get_property_value_by_name('burger_alignment')+'"]').attr("checked", 'checked');

					this.settings._wrapped[1].fields._wrapped[1].$el.find('input').removeAttr("checked");
					this.settings._wrapped[1].fields._wrapped[1].$el.find('input[value="'+this.model.get_property_value_by_name('burger_over')+'"]').attr("checked", 'checked');
				}

				//force breakpoints lower in hierarchy to use burger menu if the level above is using it
				if(typeof(breakpoint) == 'undefined') {
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default();
				}

				if(current_set_value == 'yes') {
					var enabled_breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
					var check = false;
					_.each(enabled_breakpoints, function(bpoint) {
						if(check) {
							if ( !_.isObject(model_breakpoint[bpoint.attributes.id]) ) model_breakpoint[bpoint.attributes.id] = {};
							breakpoint_data = model_breakpoint[bpoint.attributes.id];
							breakpoint_data.burger_menu = current_set_value;
						}
						if(breakpoint.id == bpoint.attributes.id) check = true;
					});
				}
				this.model.set_property('breakpoint', model_breakpoint);
				return this.constructor.__super__.on_save.call(this);
			},
		});

		var Text_Field = Upfront.Views.Editor.Field.Text.extend({
			renameMenu: function() {
				var $input = this.$el.find('input');
				var me = this;
				console.log(currentMenuItemData.get('name'));
				// Ajax call for creating menu
				if($input.val().trim() == '' || $input.val().trim == currentMenuItemData.get('name')) return;
				var renameMenu = Upfront.Util.post({"action": "upfront_new_rename_menu", "new_menu_name": $input.val(), "menu_id": me.model.get_property_value_by_name('menu_id')})
					.success(function (ret) {
						me.getMenus();
					})
					.error(function (ret) {
						// Upfront.Util.log("Error creating menu");
					})
				;
			},
			getMenus: function(){
				var me = this;
				// Ajax call for Menu list
				Upfront.Util.post({"action": "upfront_new_load_menu_list"})
					.success(function (ret) {
						var values = _.map(ret.data, function (each) {
							return  {label: each.name, value: each.term_id};
						});
						currentMenuItemData.set({menuList: values});
						me.trigger('panel:set');
					})
					.error(function (ret) {
						Upfront.Util.log("Error loading menu list");
					})
				;
			}
		});

		var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
			/**
			 * Bootstrap the object - populate the internal
			 * panels array with the panel instances we'll be showing.
			 */
			render: function() {
				this.constructor.__super__.render.call(this);

				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
				if ( breakpoint && !breakpoint.default ){
					model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});
					breakpoint_data = model_breakpoint[breakpoint.id];
					if(typeof(breakpoint_data) != 'undefined' && breakpoint_data.burger_menu == 'yes') {
						this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
					} else {
						this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').removeAttr("checked");
					}

					if(typeof(breakpoint_data) != 'undefined') {
						if(breakpoint_data.burger_alignment) {
							this.panels._wrapped[0].settings._wrapped[1].fields._wrapped[0].$el.find('input').removeAttr("checked");
							this.panels._wrapped[0].settings._wrapped[1].fields._wrapped[0].$el.find('input[value="'+breakpoint_data.burger_alignment+'"]').attr("checked", 'checked');
						}

						if(breakpoint_data.burger_over) {
							this.panels._wrapped[0].settings._wrapped[1].fields._wrapped[1].$el.find('input').removeAttr("checked");
							this.panels._wrapped[0].settings._wrapped[1].fields._wrapped[1].$el.find('input[value="'+breakpoint_data.burger_over+'"]').attr("checked", 'checked');
						}
					}
				}

				// if any of items higher in hierarchy has burger menu on, then hide the option to select/deselect burger menu
				if(typeof(breakpoint) == 'undefined') breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default();

				var enabled_breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
				var check = false;
				for(var i = enabled_breakpoints.length-1; i >= 0; i--) {
					if(check) {
						console.log(enabled_breakpoints[i].id);
						breakpoint_data = model_breakpoint[enabled_breakpoints[i].id];

						if((enabled_breakpoints[i].id == 'desktop' && this.model.get_property_value_by_name('burger_menu') == 'yes') || (breakpoint_data && breakpoint_data.burger_menu == 'yes')) {

							this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.css('display', 'none');

							// extra care to ensure that the newly enabled items obey the hierarchy

							if ( !_.isObject(model_breakpoint[breakpoint.id]) )
								model_breakpoint[breakpoint.id] = {};

							breakpoint_data = model_breakpoint[breakpoint.id];

							if(!breakpoint_data.burger_menu || breakpoint_data.burger_menu != 'yes') {
								breakpoint_data.burger_menu = 'yes';
								this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
								this.model.set_property('breakpoint', model_breakpoint);
							}
						}
					}
					if(breakpoint.id == enabled_breakpoints[i].id)
						check = true;
				}

				// this is to turn on the display for revealed menu alignment settings in case the option is selected
				if(this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').length > 0)
					this.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'block');
				else
					this.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'none');
			},
			initialize: function (opts) {
				var me = this;
				this.has_tabs = false;
				this.options= opts;
				this.panels = _([
					// Menu
					new Menu_Panel({
						model: this.model,
						label: l10n.mnu.label,
						title: l10n.mnu.title,
						settings: [
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: l10n.mnu.load,
								fields: [
									new Upfront.Views.Editor.Field.Select({
										model: this.model,
										property: 'menu_id',
										label: "",
										values: currentMenuItemData.get('menuList')
									}),
									new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'burger_menu',
										label: "",
										values: [
											{ label: l10n.mnu.use + " <i class='upfront-field-icon upfront-field-icon-burger-trigger'></i> " + l10n.mnu.btn, value: 'yes' }
										],
										change: function() {
											var value = this.get_value();
											if(value[0] == 'yes')
												me.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'block');
											else
												me.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'none');
										}
									})
								]
							}),
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: l10n.mnu.appearance,
								fields: [
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'burger_alignment',
										default_value: 'left',
										label: "",
										layout: "vertical",
										values: [
											{ label: l10n.mnu.left, value: 'left', icon: 'burger-left'},
											{ label: l10n.mnu.right, value: 'right', icon: 'burger-right'},
											{ label: l10n.mnu.top, value: 'top', icon: 'burger-top'},
											{ label: l10n.mnu.whole, value: 'whole', icon: 'burger-whole'}
										]
									}),
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'burger_over',
										default_value: 'over',
										label: "",
										layout: "vertical",
										values: [
											{ label: l10n.mnu.over, value: 'over' },
											{ label: l10n.mnu.push, value: 'pushes' }
										]
									})
								]
							}),
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: l10n.mnu.aligh,
								fields: [
									new Upfront.Views.Editor.Field.Radios({
										model: this.model,
										property: 'menu_alignment',
										default_value: 'left',
										label: "",
										layout: "vertical",
										values: [
											{ label: l10n.mnu.left, value: 'left', icon: 'navigation-left' },
											{ label: l10n.mnu.center, value: 'center', icon: 'navigation-center' },
											{ label: l10n.mnu.right, value: 'right', icon: 'navigation-right' }
										]
									})
								]
							}),
							new Upfront.Views.Editor.Settings.Item({
								model: this.model,
								title: l10n.mnu.behavior,
								fields: [
									new Upfront.Views.Editor.Field.Checkboxes({
											model: this.model,
											property: 'allow_new_pages',
											label: "",
											values: [
													{ label: l10n.mnu.auto_add, value: 'yes' }
											]
									}),
									new Upfront.Views.Editor.Field.Checkboxes({
											model: this.model,
											property: 'is_floating',
											label: "",
											values: [
													{ label: l10n.mnu.float, value: 'yes' }
											]
									})
								]
							})
						]
					}).on('upfront:settings:panel:saved', this.onSaveSettings, this)
				]);
			},
			onSaveSettings: function() {
				this.model.get_property_by_name('allow_new_pages').trigger('change');
				//console.log(_.findWhere(this.for_view.existingMenus, {term_id: this.model.get_property_value_by_name('menu_id')}).slug);
				// Update slug because it's depending on id and has to be updated properly
				var themenu = _.findWhere(this.for_view.existingMenus, {term_id: this.model.get_property_value_by_name('menu_id')});
				if(themenu)
					this.model.set_property('menu_slug', themenu.slug, true);
			},
			/**
			 * Get the title (goes into settings title area)
			 * @return {string} Title
			 */
			get_title: function () {
					return l10n.settings;
			}
		});


// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("Unewnavigation", {
	"Model": UnewnavigationModel,
	"View": UnewnavigationView,
	"Element": UnewnavigationElement,
		"Settings": NavigationSettings
});
Upfront.Models.UnewnavigationModel = UnewnavigationModel;
Upfront.Views.UnewnavigationView = UnewnavigationView;


});
})(jQuery);
