(function ($) {
define([
	'elements/upfront-newnavigation/js/menuitem',
	'elements/upfront-newnavigation/js/model',
	'elements/upfront-newnavigation/js/element',
	'elements/upfront-newnavigation/js/settings',
], function(MenuItemView, UnewnavigationModel, UnewnavigationElement, NavigationSettings) {

var l10n = Upfront.Settings.l10n.newnavigation_element;

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
Upfront.data.unewnavigation.currentMenuItemData = Upfront.data.unewnavigation.currentMenuItemData || new CurrentMenuItemData();


/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var singleclickcount = 0;
var UnewnavigationView = Upfront.Views.ObjectView.extend({
	elementSize: {width: 0, height: 0},
	roll_responsive_settings: true,

	initialize: function(options){
		var me = this;

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
		Upfront.data.unewnavigation.currentMenuItemData.set({model_true:false, menu_id: menu_id});

		// call this function on allow_new_pages change
		if (!!this.model.get_property_by_name('allow_new_pages')) {
			this.model.get_property_by_name('allow_new_pages').on('change', this.update_auto_add_pages, this);
		}

		this.property('menu_items', false, true);

		this.on('deactivated', this.onDeactivate, this);
		this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", function(current, previous) {

			me.render();

			me.activate_responsive_nav(me.$el.find(".upfront-output-unewnavigation"), current.width);

		});

		//this.listenTo(Upfront.Events, "entity:removed:before", this.on_removal);

		var breakpoint_data = me.model.get_property_value_by_name('breakpoint');

		//sanitize breakpoint data

		var new_breakpoint_data = {};

		var breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints();


		for(key in breakpoint_data) {
			if(typeof(breakpoints.get(key)) != 'undefined')
				new_breakpoint_data[key] = breakpoint_data[key];
		}

		this.model.set_property('breakpoint', new_breakpoint_data, true);

	},/*
	on_removal: function() {
		var tooltip = $('#unewnavigation-tooltip');
		tooltip.hide().trigger('closed');
		setTimeout(function(){
			tooltip.remove();
		}, 100);
	},*/
	exitEditMode: function(e) {
		var me = this;
		var thelink = $(e.target).closest('li').data('backboneview');

		if(!$(e.target).hasClass('ueditable')) {
			var editablefound = false;
			this.$el.find('a.ueditable').each(function() {
				try {
					$(this).data('ueditor').stop();
					$(this).closest('li').removeClass('edit_mode');
					$(this).closest('li').data('backboneview').model['being-edited'] = false;
				} catch (err) { }
				editablefound = true;
			});
			if(editablefound) return;
		}

		if($(e.target).closest('.redactor_box').length > 0) {
			return;
		}

		
	},
	editMenuItem: function(e) {

		this.editModeOn(e);
		var me = this;
		var target;
		if(typeof e.target == 'undefined' || e.target.trim == '') target = $(e);
		else target = $(e.target);

		if(target.closest('li').hasClass('edit_mode')) {
			return;
		}
		if(typeof e.target != 'undefined') {
			e.preventDefault();
			e.stopPropagation();
		}
		if(target.hasClass('ueditor-placeholder'))
			target = target.siblings('a.menu_item');

		target.closest('li').addClass('edit_mode');

		var ueditor = target.data('ueditor');
		ueditor = null;
		target.data('ueditor', '');

		if(!target.data('ueditor')) {
			target.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				focus: true,
				tabFocus: false,
				air: false,
				allowedTags: ['h5'],
				placeholder: 'Link Name',
				
			}).on('start', function(e) {
				target.focus();
			}).on('keydown', function(e){
				if (e.which == 8) {
					setTimeout(function() {
						
						if(target.text() == '' && !target.hasClass('menu_item_placeholder')) {
							var e = jQuery.Event("keydown");
							e.which = 8;
							target.trigger(e);
						}
					}, 100);
				}
				else if (e.which == 27) {
					if(target.hasClass('new_menu_item')) {
						//target.closest('li').data('backboneview').closeTooltip();
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
					
					target.closest('li').data('backboneview').model['being-edited'] = false;
					setTimeout(function() {target.blur();}, 100);
					
				}
				if(target.text().trim() != '') target.removeClass('menu_item_placeholder');
				else target.addClass('menu_item_placeholder');
			}).on('blur', function(e) {

					var being_edited = false;
					if(target.closest('li').data('backboneview').model['being-edited'])
						being_edited = target.closest('li').data('backboneview').model['being-edited'];




					if($(e.relatedTarget).closest('.redactor_toolbar').length > 0 || being_edited || ($('#upfront-popup').hasClass('upfront-postselector-popup') && $('#upfront-popup').css('display')== 'block')) {
						return;
					}

					target.data('ueditor').stop();

					target.closest('li').removeClass('edit_mode');
					if(!target.hasClass('new_menu_item')) {
						target.closest('li').data('backboneview').saveLink();
					}


			}).on('stop', function() {
				
				me.editModeOff();
			});

			target.data('ueditor').start();
			target.focus();
		} else {
			target.data('ueditor').start();
			target.focus();
		}

		var currentcontext = target.closest('ul');

		while(currentcontext.length > 0 && currentcontext.hasClass('sub-menu')) {
			currentcontext.addClass('time_being_display');
			currentcontext = currentcontext.parent().parent('ul');
		}
		/*if(target.hasClass('new_menu_item') ) {
			if($('div#unewnavigation-tooltip').length <1 || $('div#unewnavigation-tooltip').css('display') == 'none') {
				_.delay(function(self) {

					var view = target.closest('li').data('backboneview');
					if (view && view.editMenuItem) view.editMenuItem(e);
				}, 30, this);
			}
		}*/
	},
	editModeOn: function(e) {
		this.$el.find('.upfront-object-content ul').each(function() {
			if($(this).hasClass('ui-sortable')) $(this).sortable('disable');
		});
	},
	editModeOff: function() {
		var me = this;
		this.$el.find('.upfront-object-content ul').each(function() {
			if ($(this).hasClass('redactor-toolbar') || $(this).hasClass('upfront-field-select-options')) {
				return;
			}
			if(me.$el.find('li.menu-item.controls-visible').length < 1 )
				if($(this).hasClass('ui-sortable')) $(this).sortable('enable');
		});
	},
	onDeactivate: function() {
		if(this.$el.find('li.edit_mode').data('backboneview'))
			this.$el.find('li.edit_mode').data('backboneview').model['being-edited']= false;
		this.$el.find('li.edit_mode a.menu_item').blur();
		this.editModeOff();
		if(!$('#upfront-popup').hasClass('upfront-postselector-popup') || !$('#upfront-popup').css('display')== 'block')
			this.$el.find('.time_being_display').removeClass('time_being_display');

		var currentControlsItem = this.$el.find('li.controls-visible');
		if(currentControlsItem.length > 0) {
			currentControlsItem.removeClass('controls-visible');
			currentControlsItem.data('backboneview').setItemControlsState();
		}
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
		//console.log('ajax call to set auto add pages');
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
		//console.log('ajax call to get list of menus');
		Upfront.Util.post({"action": "upfront_new_load_menu_list"})
			.success(function (ret) {
				me.existingMenus = ret.data;
				var values = _.map(ret.data, function (each, index) {
					return  {label: each.name, value: each.term_id};
				});
				Upfront.data.unewnavigation.currentMenuItemData.set({menuList: values});
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
			values: [{label:'Choose existing menu', value: 0}].concat(Upfront.data.unewnavigation.currentMenuItemData.get('menuList'))
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

		me.$el.find('div.upfront-object-content > div.existing_menu_list > div').on('click', function() {
			me.parent_module_view.$el.parent().trigger('mouseup');
		});

		me.$el.find('div.upfront-object-content > div.new_menu_button > input').on('click', function() {
			if(me.$el.find('div.upfront-object-content > div.new_menu_name input').val()!='') {
				me.create_new_menu(me.$el.find('div.upfront-object-content > div.new_menu_name input').val());
			}
		});

		me.$el.find('div.upfront-object-content > div.existing_menu_list input').on('change', function() {
			me.$el.parent().parent().parent().draggable('enable');
			if(me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val() != 0) {
				var id = me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val();
				me.property('menu_id', id);
				me.property('menu_slug', _.findWhere(me.existingMenus, {term_id: id}).slug, true);
			}
		});
	},
	create_new_menu: function(MenuName) {
		var me = this;
		// Ajax call for creating menu
		//console.log('ajax call to create a menu');
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
		//console.log('ajax call to load menu data');
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
		//console.log('ajax call to set menu from slug');
		Upfront.Util.post({"action": "upfront_new_menu_from_slug", "data": slug})
			.success(function (ret) {
				me.property('menu_id', ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu from slug");
			})
		;
	},
	
	on_render: function() {

		var me = this;


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
					model_breakpoint[default_breakpoint.attributes.id].menu_style = me.property('menu_style');
					model_breakpoint[default_breakpoint.attributes.id].menu_alignment = me.property('menu_alignment');
					model_breakpoint[default_breakpoint.attributes.id].width = default_breakpoint.attributes.width;

					$upfrontObjectContent.attr('data-breakpoints',	JSON.stringify(model_breakpoint));

					var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint, width;
					if(!breakpoint) {
						width = default_breakpoint.attributes.width;
					} else width = breakpoint.width;
					// To roll responsive nav settings into action

					me.activate_responsive_nav($upfrontObjectContent, width);
					
				}
				me.roll_responsive_settings = true;
			}, 300);
		}
		$upfrontObjectContent.attr('data-aliment',(menuAliment ? menuAliment : 'left'));
		$upfrontObjectContent.attr('data-style',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-stylebk',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav.length !== 0 && allowSubNav[0] == 'yes' ? allowSubNav[0] : 'no'));


		setTimeout(function() {
			if(me.$el.height() < 80) {
				me.$el.closest('div.upfront-module').addClass('newnavigation_squished');
			}
			else {
				me.$el.closest('div.upfront-module').removeClass('newnavigation_squished');
			}
		}, 200);

	},
	activate_responsive_nav: function(selector, bpwidth) {

		var breakpoints = selector.data('breakpoints');

		var bparray = new Array();

		var currentwidth = (typeof(bpwidth) != 'undefined') ? parseInt(bpwidth):$(window).width();

		for (var key in breakpoints) {
			bparray.push(breakpoints[key])
		}

		bparray.sort(function(a, b) {
			return a.width - b.width;
		});

		var regions_off = $('div.upfront-regions').offset(),
			regions_width = $('div.upfront-regions').outerWidth(),
			win_width = $(window).width(),
			sidebar_width = $('div#sidebar-ui').outerWidth(),
			topbar_height = $('div#upfront-ui-topbar').outerHeight();

		for (var key in bparray) {
			if(parseInt(currentwidth) >= parseInt(bparray[key]['width'])) {

				if(bparray[key]['burger_menu'] == 'yes') {

					selector.attr('data-style', 'burger')
					selector.attr('data-burger_alignment', bparray[key]['burger_alignment']);
					selector.attr('data-burger_over', bparray[key]['burger_over']);

					// Add responsive nav toggler
					if(!selector.find('div.responsive_nav_toggler').length)
						selector.prepend($('<div class="responsive_nav_toggler"><div></div><div></div><div></div></div>'));

					// clone sub-menu's parent's link (if any) on top of the sub-menu's items, and make the parent clickable to toggle the appearance of sub-menu. Only on front end.
					selector.find('li.menu-item-has-children').each(function() {
						if(selector.children('a').length && selector.children('a').attr('href')) {
							var itemclone = selector.clone().removeClass('menu-item-has-children').addClass('active-clone').removeAttr('id');
							itemclone.children('ul').remove();
							selector.children('ul').prepend(itemclone);
							selector.children('a').removeAttr('href');
						}
					});

					

					if(selector.hasClass('upfront-output-unewnavigation')) {

						$('head').find('style#responsive_nav_sidebar_offset').remove();
						var responsive_css = 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][ data-burger_alignment="whole"] ul.menu {left:'+parseInt(regions_off.left)+'px !important; } ';

						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="left"] ul.menu {left:'+parseInt(regions_off.left)+'px !important; right:inherit !important; width:'+parseInt(30/100*regions_width)+'px !important;} ';

						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="right"] ul.menu {left:inherit !important; right:0 !important; width:'+parseInt(30/100*regions_width)+'px !important; } ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"] ul.menu {top:'+parseInt(topbar_height)+'px !important; } ';

						$('head').append($('<style id="responsive_nav_sidebar_offset">'+responsive_css+'</style>'));
					}
					//Z-index the container module to always be on top, in the layout edit mode
					selector.closest('div.upfront-newnavigation_module').css('z-index', 3);


					selector.find('ul.menu').hide();
				}
				else {
					//selector.attr('data-style', selector.data('stylebk'))
					selector.attr('data-style', bparray[key]['menu_style'])

					selector.removeAttr('data-burger_alignment','');
					selector.removeAttr('data-burger_over', '');

					// Remove responsive nav toggler
					selector.find('div.responsive_nav_toggler').remove();
					selector.find('ul.menu').show();

					//remove any sub-menu item's parent's clones
					selector.find('li.active-clone').each(function() {
						selector.parent().parent().children('a').attr('href', selector.children('a').attr('href'));
						selector.remove();
					});

					//remove any display:block|none specifications from the sub-menus
					selector.find('ul.menu, ul.sub-menu').each(function() {
						selector.css('display', '');
					});

					// remove any adjustments done because of the sidebar or the adminbar
					if($('div#wpadminbar').length) {
						selector.find('ul.menu').css('margin-top', '');
					}


					//remove the z-index from the container module
					selector.closest('div.upfront-newnavigation_module').css('z-index', '');
				}

			}
		}

	},
	toggle_responsive_nav: function(e) {
		var me = this;
		var region_container = $(this).closest('.upfront-region-container');
		if($(this).parent().find('ul.menu').css('display') == 'none') {
			$(this).parent().find('ul.menu').show();
			var offset = $(this).parent().find('ul.menu').position();
			
			var close_icon = $('<i class="burger_nav_close"></i>');
			$(this).parent().append(close_icon);
			close_icon.bind('touchstart click', function() {
				$(e.target).closest('.responsive_nav_toggler').trigger('click');
			});
			close_icon.css({position: 'fixed', left: offset.left+$(this).parent().find('ul.menu').width()-close_icon.width()-10, top: offset.top+10});
			region_container.addClass('upfront-region-container-has-nav');
		} else {
			$(this).parent().find('ul.menu').hide();
			

			$(this).parent().find('i.burger_nav_close').remove();

			$(this).parent().find('ul.sub-menu').css('display', '');
			if($(this).parent().find('ul.sub-menu').length < 1 )
				region_container.removeClass('upfront-region-container-has-nav');
		}
	},
	generate_menu: function() {
		var me = this;
		var menu_id = this.model.get_property_value_by_name('menu_id');
		if(!menu_id) return;

		this.$el.find('.upfront-object-content').html('');
		if(this.property('menu_items').length > 0) {
			var menu = this.renderMenu(this.property('menu_items'), 'menu');
			this.$el.find('.upfront-object-content').append(menu);
		} else {
			
			this.$el.find('.upfront-object-content').append(this.renderMenu(this.property('menu_items'), 'menu'));
			
			setTimeout(function() {
				me.$el.find('a.newnavigation-add-item').trigger('click');
			}, 200);
		}

		//Work around for having the region container have a higher z-index if it contains the nav, so that the dropdowns, if overlapping to the following regions should not loose "hover" when the mouse travels down to the next region.

		var region_container = this.$el.closest('.upfront-region-container, .upfront-region-sub-container');
		if(this.$el.find('ul.sub-menu').length > 0 ) {
			region_container.addClass('upfront-region-container-has-nav');
		}
		else {
			region_container.removeClass('upfront-region-container-has-nav');
		}


		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;

		if(!breakpoint || breakpoint.default) {
			if(this.model.get_property_value_by_name('burger_menu') == 'yes') {
				this.$el.find('.upfront-object-content').prepend($('<div>').addClass("responsive_nav_toggler").append('<div></div><div></div><div></div>').bind('click', me.toggle_responsive_nav));
				this.$el.find('ul.menu').hide();
			}
		} else {
			model_breakpoint = this.model.get_property_value_by_name('breakpoint');
			breakpoint_data = model_breakpoint[breakpoint.id];
			if(breakpoint_data && breakpoint_data.burger_menu == 'yes') {
				this.$el.find('.upfront-object-content').prepend($('<div>').addClass("responsive_nav_toggler").append('<div></div><div></div><div></div>').bind('click', me.toggle_responsive_nav));
				this.$el.find('ul.menu').hide();
			}
		}
		this.makeSortable();

	},
	makeSortable: function() {
		var me = this;
		this.$el.find('.upfront-object-content ul').each(function() {
			if ($(this).hasClass('redactor-toolbar') || $(this).hasClass('upfront-field-select-options')) {
				return;
			}
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
		//console.log('ajax call to save menu ordering');
		Upfront.Util.post({"action": "upfront_new_update_menu_order", "menu_items": me.new_menu_order()})
			.success(function (ret) {
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
			var bbview = $(this).data('backboneview');
			if (!(bbview && bbview.model)) return true;

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
		var me = this,
			$dom = $('<ul>').addClass(classname)
		;
		if(classname=='menu') $dom.addClass('drag_mode');
		_(list).each(function (model) {
			var $li = me.renderMenuItem(model);
			if($li && $li.length && !(typeof model.sub === 'undefined')) {
				if (model.sub && model.sub.length) $li.addClass('parent').append(me.renderMenu(model.sub, 'sub-menu'));
			}
			$dom.append($li);
		});
		$dom.find('li:last').append('<i class="navigation-add-item"></i>')
		return $dom;
	},

	renderMenuItem: function (model, newitem){
		var me = this;
		if(typeof newitem == 'undefined') newitem = false;

		var view = new MenuItemView({model: model, parent_view: me, newitem: newitem});
		return view.render().$el;
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



		

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

Upfront.Application.LayoutEditor.add_object("Unewnavigation", {
	"Model": UnewnavigationModel,
	"View": UnewnavigationView,
	"Element": UnewnavigationElement,
	"Settings": NavigationSettings,
	cssSelectors: {
		"div[data-style='horizontal'] ul.menu, div[data-style='vertical'] ul.menu": {label: l10n.css.bar_label, info: l10n.css.bar_info},
		"div[data-style='horizontal'] ul.menu > li.menu-item > a, div[data-style='vertical'] ul.menu > li.menu-item > a": {label: l10n.css.item_label, info: l10n.css.item_info},
		"div[data-style='horizontal'] ul.menu > li.menu-item:hover > a, div[data-style='vertical'] ul.menu > li.menu-item:hover > a": {label: l10n.css.hover_label, info: l10n.css.hover_info},
		"div[data-style='horizontal'] ul.sub-menu > li.menu-item > a, div[data-style='vertical'] ul.sub-menu > li.menu-item > a": {label: l10n.css.subitem_label, info: l10n.css.subitem_info},
		"div[data-style='horizontal'] ul.sub-menu > li.menu-item:hover > a, div[data-style='vertical'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.subitem_hover_label, info: l10n.css.subitem_hover_info},


		"div[data-style='burger'] ul.menu": {label: l10n.css.responsive_bar_label, info: l10n.css.bar_info},
		"div.responsive_nav_toggler": {label: l10n.css.responsive_trigger, info: l10n.css.hover_info},
		"div.responsive_nav_toggler > div": {label: l10n.css.responsive_trigger_bars, info: l10n.css.hover_info},
		"i.burger_nav_close": {label: l10n.css.responsive_nav_close, info: l10n.css.close_info},
		" div[data-style='burger'] ul.menu > li.menu-item > a": {label: l10n.css.responsive_item_label, info: l10n.css.item_info},
		"div[data-style='burger'] ul.menu > li.menu-item:hover > a": {label: l10n.css.responsive_hover_label, info: l10n.css.hover_info},
		"div[data-style='burger'] ul.sub-menu > li.menu-item > a": {label: l10n.css.responsive_subitem_label, info: l10n.css.subitem_info},
		"div[data-style='burger'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.responsive_subitem_hover_label, info: l10n.css.subitem_hover_info}
	},
	cssSelectorsId: Upfront.data.unewnavigation.defaults.type
});
Upfront.Models.UnewnavigationModel = UnewnavigationModel;
Upfront.Views.UnewnavigationView = UnewnavigationView;


});
})(jQuery);
