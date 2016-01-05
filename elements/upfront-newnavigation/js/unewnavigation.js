(function ($) {
define([
	'elements/upfront-newnavigation/js/menuitem',
	'elements/upfront-newnavigation/js/model',
	'elements/upfront-newnavigation/js/element',
	'elements/upfront-newnavigation/js/settings',
	'text!elements/upfront-newnavigation/tpl/preset-style.html',
	'scripts/upfront/preset-settings/util',
	'elements/upfront-newnavigation/js/floating',
	'elements/upfront-newnavigation/js/menu-util'
], function(MenuItemView, UnewnavigationModel, UnewnavigationElement, NavigationSettings, settingsStyleTpl, PresetUtil, NavigationFloating, MenuUtil) {

var l10n = Upfront.Settings.l10n.newnavigation_element;

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var singleclickcount = 0;
var elementClasses = '';
var UnewnavigationView = Upfront.Views.ObjectView.extend({
	elementSize: {width: 0, height: 0},

	initialize: function(options){
		var me = this;

		//Get all element classes without preset
		this.elementClasses = this.$el.attr('class');

		if(!(this.model instanceof UnewnavigationModel)){
			this.model = new UnewnavigationModel({properties: this.model.get('properties')});
		}
		Upfront.Views.ObjectView.prototype.initialize.call(this);

		this.events = _.extend({}, this.events, {
			'click a.menu_item' : 'exitEditMode',
			'dblclick a.menu_item' : 'editMenuItem'/*,
			'click a.newnavigation-add-item': 'addPrimaryMenuItem'*/
		});

		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
		this.listenTo(Upfront.Events, "menu_element:delete", this.delete_menu, this);

		this.listenTo(this.model, "preset:updated", this.preset_updated);

		// get all menus
		var menu_id = this.model.get_property_value_by_name('menu_id');

		// call this function on allow_new_pages change
		if (!!this.model.get_property_by_name('allow_new_pages')) {
			this.model.get_property_by_name('allow_new_pages').on('change', this.update_auto_add_pages, this);
		}

		this.property('menu_items', false, true);

		this.on('deactivated', this.onDeactivate, this);
		this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", function(current, previous) {
			me.render();

			setTimeout( function() {
				me.activate_responsive_nav(me.$el.find(".upfront-output-unewnavigation"), current.width);
			}, 100);
		});

		this.listenTo(Upfront.Events, 'entity:drag_stop', this.onElementReposition);
	},

	on_element_resize: function (attr) {
		this.processFloatStatus();
	},

	get_preset_properties: function() {
		var preset = this.model.get_property_value_by_name("preset"),
			props = PresetUtil.getPresetProperties('nav', preset) || {};

		return props;
	},

	preset_updated: function() {
		this.render();
	},

	update_colors: function () {

		var props = this.get_preset_properties();

		if (_.size(props) <= 0) return false; // No properties, carry on

		PresetUtil.updatePresetStyle('nav', props, settingsStyleTpl);

	},

	onElementReposition: function() {
		this.processFloatStatus();
	},

	processFloatStatus: function() {
		if (this.floating_cache) this.floating_cache.destroy();
		$upfrontObjectContent = this.$el.find('.upfront-object-content');
		var isFloating = $upfrontObjectContent.data('isfloating');

		if(isFloating && isFloating == 'yes') {
			if (this.property('preset') && this.property('preset') !== 'default') {
				if (this.get_preset_properties().breakpoint[Upfront.Views.breakpoints_storage.get_breakpoints().get_active().id].menu_style === 'burger') {
					this.floating_cache = new  NavigationFloating($upfrontObjectContent.children('.responsive_nav_toggler'));
				} else {
					this.floating_cache = new  NavigationFloating($upfrontObjectContent);
				}
			} else {
				if(this.property('burger_menu') == 'yes')
					this.floating_cache = new  NavigationFloating($upfrontObjectContent.children('.responsive_nav_toggler'));
				else
					this.floating_cache = new  NavigationFloating($upfrontObjectContent);
			}
		}
	},
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
	onDeactivate: function(e) {

		//if($(e.target).closest('form').length > 0)
		//	return;

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
	display_menu_list: function () {
		var me = this,
			menuItemsValues = [{label:l10n.choose_existing_menu, value: 0}],
			menuList = MenuUtil.getSelectMenuOptions()
		;
		var clubbedvalues = [];
		if(typeof(menuList) != 'undefined'){

			clubbedvalues = menuItemsValues.concat(menuList);
		}


		me.$el.find('div.upfront-object-content').html('');

		var menuItems = new Upfront.Views.Editor.Field.Select({
			model: me.model,
			label: "",
			className: "existing_menu_list",
			values: clubbedvalues
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
				me.property('menu_id', id, true);
				me.property('menu_slug', MenuUtil.getMenuSlugById(id));
			}
		});
	},
	create_new_menu: function(MenuName) {
		var me = this;
		// Ajax call for creating menu
		var newMenu = Upfront.Util.post({"action": "upfront_new_create_menu", "menu_name": MenuName})
			.success(function (ret) {
				me.property('menu_slug', ret.data.slug, true);
				me.property('menu_id', ret.data.term_id);
				Upfront.Events.trigger("menu_element:menu_created", ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error creating menu");
			})
		;
	},
	delete_menu: function(menu_id) {
		var me = this;
		// Ajax call for delete menu by ID
		var newMenu = Upfront.Util.post({"action": "upfront_new_delete_menu", "menu_id": menu_id})
			.success(function (ret) {
				Upfront.Events.trigger("menu_element:menu_deleted", ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error deleting menu");
			})
		;
	},
	get_content_markup: function () {

		var menu_id = this.model.get_property_value_by_name('menu_id'),
			me = this
		;
		var menu_slug =  this.model.get_property_value_by_name('menu_slug');

		properties = this.get_preset_properties();

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

	on_render: function() {

		var me = this;

		var props = this.get_preset_properties();

		if(!this.property('menu_id')) {
			this.display_menu_list();
		}

		var menuStyle,
			allowSubNav = this.property("allow_sub_nav"),
			isFloating = this.property("is_floating"),
			$upfrontObjectContent
		;

		if (_.isUndefined(props.breakpoint)) {
			props.breakpoint = {
				desktop: {},
				tablet: {},
				mobile: {}
			};
		}
		if (_.isUndefined(props.breakpoint.desktop)) {
			props.breakpoint.desktop = {};
		}

		menuStyle = props.breakpoint.desktop.menu_style;
		menuStyle = menuStyle ? menuStyle : this.property('menu_style');

		if (!props.breakpoint.desktop.menu_alignment) {
			props.breakpoint.desktop.menu_alignment = this.property('menu_alignment');
		}

		$upfrontObjectContent = this.$el.find('.upfront-object-content');
		// if(this.$el.find('a.newnavigation-add-item').length < 1) {
		// 	$('<b class="upfront-entity_meta newnavigation_add add_item upfront-ui"><a href="#" class="upfront-icon-button newnavigation-add-item add-item"></a></b>').insertBefore($upfrontObjectContent);
		// }

		setTimeout(function() {
			var breakpointsData = me.model.get_property_value_by_name('breakpoint');
			var currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active();

			if (breakpointsData) {
				$upfrontObjectContent.attr('data-breakpoints', JSON.stringify(breakpointsData));
				if (me.property('preset') && me.property('preset') !== 'default') {
					$upfrontObjectContent.attr('data-breakpoints', JSON.stringify(props.breakpoint));
				}
				setTimeout( function() {
					me.activate_responsive_nav($upfrontObjectContent, currentBreakpoint.get('width'));
				}, 100);
			} else if (me.property('preset') && me.property('preset') !== 'default') {
				$upfrontObjectContent.attr('data-breakpoints', JSON.stringify(props.breakpoint));
				setTimeout( function() {
					me.activate_responsive_nav($upfrontObjectContent, currentBreakpoint.get('width'));
				}, 100);
			}

			//Make sure parent module have high z-index to prevent dropdown under elements
			me.$el.closest('.upfront-module').addClass('upfront-module-has-nav');

		}, 300);

		$upfrontObjectContent.attr('data-stylebk',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-style',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-alignment', props.breakpoint.desktop.menu_alignment);
		$upfrontObjectContent.attr('data-isfloating',(isFloating ? isFloating : 'no'));
		$upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav.length !== 0 && allowSubNav[0] == 'yes' ? allowSubNav[0] : 'no'));

		setTimeout(function() {
			if(me.$el.height() < 80) {
				me.$el.closest('div.upfront-module').addClass('newnavigation_squished');
			}
			else {
				me.$el.closest('div.upfront-module').removeClass('newnavigation_squished');
			}

		}, 200);

		this.$el.off('click', '.responsive_nav_toggler');
		this.$el.on('click', '.responsive_nav_toggler', function(event) {
			me.toggle_responsive_nav(event);
		});

		this.$el.find('.upfront-output-unewnavigation').addClass('upfront-navigation');
	},

	renderResponsiveNavigation: function(selector) {
		var me = this,
			regions_off = $('div.upfront-regions').offset(),
			regions_width = $('div.upfront-regions').outerWidth(),
			win_width = $(window).width(),
			sidebar_width = $('div#sidebar-ui').outerWidth(),
			topbar_height = $('div#upfront-ui-topbar').outerHeight(),
			ruler_height = $('.upfront-ruler-container').outerHeight(),
			allBreakpoints = Upfront.Views.breakpoints_storage.get_breakpoints(),
			currentBreakpoint = allBreakpoints.get_active(),
			breakpoints = this.get_preset_properties().breakpoint,
			breakpoint = breakpoints[currentBreakpoint.id],
			breakpointWidth = currentBreakpoint.get_property_value_by_name('width');
			currentwidth = typeof breakpointWidth !== 'undefined' ? parseInt(breakpointWidth, 10) : $(window).width();


		/** if breakpoint data is not available, use data from
			the wider breakpoint that has data available.
		**/
		if(!breakpoint || !breakpoint.menu_style) {
			var higherBPs = _.filter(allBreakpoints.models, function(breakpoint) {
				return breakpoint.get('width') > currentBreakpoint.get('width');
			});

			higherBPs = _.sortBy(higherBPs, function(item) {
				return item.get('width');
			});

			for(var i = 0; i < higherBPs.length; i++) {
				breakpoint = breakpoints[higherBPs[i].id];

				if(breakpoint) {
					break;
				}
			}

		}
		/** if breakpoint has menu_style set to burger, but no
			burger_alignment is defined, set it to default
		**/
		if(breakpoint && breakpoint.menu_style === 'burger' && !breakpoint.burger_alignment ) {
			breakpoint.burger_alignment= 'left';
		}

		if (breakpoint.menu_style === 'burger') {
			selector.addClass('triggered-menu');
			selector.attr('data-style', 'burger');
			selector.attr('data-burger_alignment', breakpoint.burger_alignment);
			selector.attr('data-burger_over', breakpoint.burger_over);
			selector.attr('data-alignment', breakpoint.menu_alignment);

			// Add responsive nav toggler
			if(!selector.find('div.responsive_nav_toggler').length)
				selector.prepend($('<div class="responsive_nav_toggler"><div></div><div></div><div></div></div>').data('view', me));

			// clone sub-menu's parent's link (if any) on top of the sub-menu's items, and make the parent clickable to toggle the appearance of sub-menu. Only on front end.
			selector.find('li.menu-item-has-children').each(function() {
				if(selector.children('a').length && selector.children('a').attr('href')) {
					var itemclone = selector.clone().removeClass('menu-item-has-children').addClass('active-clone').removeAttr('id');
					itemclone.children('ul').remove();
					selector.children('ul').prepend(itemclone);
					selector.children('a').removeAttr('href');
				}
			});


			if (selector.hasClass('upfront-output-unewnavigation')) {
				$('head').find('style#responsive_nav_sidebar_offset').remove();
				var responsive_css = 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][data-burger_alignment="whole"] ul.menu {left:'+parseInt(regions_off.left, 10)+'px !important;} ';
				responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][ data-burger_alignment="whole"] ul.menu {right: inherit; width:'+((parseInt(currentwidth) < parseInt(win_width-sidebar_width))?parseInt(currentwidth):parseInt(win_width-sidebar_width)) +'px !important; } ';
				responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="left"] ul.menu {left:'+parseInt(regions_off.left)+'px !important; right:inherit !important; width:'+(parseInt(30/100*regions_width)+40)+'px !important;} ';
				responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="right"] ul.menu {left:inherit !important; right:'+((parseInt((win_width-currentwidth-sidebar_width) / 2) > 0)?parseInt((win_width-currentwidth-sidebar_width) / 2 -(($(document).width() > (win_width+6))?30:0)):0)+'px !important; width:'+(parseInt(30/100*regions_width)+40)+'px !important; } ';
				responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"]:not([data-burger_over="pushes"]) ul.menu {top:'+(parseInt(topbar_height) + parseInt(ruler_height))+'px !important; } ';

				$('head').append($('<style id="responsive_nav_sidebar_offset">'+responsive_css+'</style>'));
			}
			//Z-index the container module to always be on top, in the layout edit mode
			selector.closest('div.upfront-newnavigation_module').css('z-index', 3);

			me.hideMenu(selector.find('ul.menu'));
		} else {
			selector.removeClass('triggered-menu');
			selector.attr('data-style', breakpoint.menu_style);
			selector.attr('data-alignment', breakpoint.menu_alignment);

			selector.removeAttr('data-burger_alignment');
			selector.removeAttr('data-burger_over');

			// Remove responsive nav toggler
			selector.find('div.responsive_nav_toggler').remove();
			me.showMenu(selector.find('ul.menu'));

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

		selector.attr('data-isfloating', breakpoint.is_floating);
		Upfront.Events.trigger('entity:object:refresh', this);
	},

	activate_responsive_nav: function(selector, bpwidth) {

		// If there is preset setup use new rendering
		
		/**
		 * Even the new Reesponsive Nav comes with 'default' presets
		 * so, it should be allowed to use the new rendering technique
		 */

		//if (this.property('preset') && this.property('preset') !== 'default') {
		if (this.property('preset')) {
			this.renderResponsiveNavigation(selector);
			return;
		}
		this.fallbackToOldResponsiveNav(selector, bpwidth);
	},

	/**
	 * DO NOT CHANGE ANYTHING IN THIS FUNCTION!!!
	 * This is just for compatibility with old settings.
	 * Changes for new settings rendering are to be done in
	 * renderResponsiveNavigation function.
	 */
	fallbackToOldResponsiveNav: function(selector, bpwidth) {
		var me = this;
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
			ruler_height = $('.upfront-ruler-container').outerHeight();

		for (var key in bparray) {
			if(parseInt(currentwidth) >= parseInt(bparray[key]['width'])) {

				if(bparray[key]['burger_menu'] == 'yes') {
					selector.addClass('triggered-menu');
					selector.attr('data-style', 'burger')
					selector.attr('data-burger_alignment', bparray[key]['burger_alignment']);
					selector.attr('data-burger_over', bparray[key]['burger_over']);
					selector.attr('data-alignment', ( bparray[key]['menu_alignment'] ?
							bparray[key]['menu_alignment'] : selector.data('alignmentbk') ));

					// Add responsive nav toggler
					if(!selector.find('div.responsive_nav_toggler').length)
						selector.prepend($('<div class="responsive_nav_toggler"><div></div><div></div><div></div></div>').data('view', me));

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
						var responsive_css = 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"][data-burger_over="over"] ul.menu, div.upfront-navigation div[data-style="burger"][data-burger_over="over"][data-burger_alignment="whole"] ul.menu {left:'+parseInt(regions_off.left)+'px !important;} ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][ data-burger_alignment="whole"] ul.menu {right: inherit; width:'+((parseInt(currentwidth) < parseInt(win_width-sidebar_width))?parseInt(currentwidth):parseInt(win_width-sidebar_width)) +'px !important; } ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="left"] ul.menu {left:'+parseInt(regions_off.left)+'px !important; right:inherit !important; width:'+(parseInt(30/100*regions_width)+40)+'px !important;} ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="right"] ul.menu {left:inherit !important; right:'+((parseInt((win_width-currentwidth-sidebar_width) / 2 - 30) > 0)?parseInt((win_width-currentwidth-sidebar_width) / 2 - 30):0)+'px !important; width:'+(parseInt(30/100*regions_width)+40)+'px !important; } ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][data-burger_over="over"] ul.menu {top:'+(parseInt(topbar_height) + parseInt(ruler_height))+'px !important; } ';

						$('head').append($('<style id="responsive_nav_sidebar_offset">'+responsive_css+'</style>'));
					}
					//Z-index the container module to always be on top, in the layout edit mode
					selector.closest('div.upfront-newnavigation_module').css('z-index', 3);

					me.hideMenu(selector.find('ul.menu'));
				}
				else {
					selector.removeClass('triggered-menu');
					selector.attr('data-style', bparray[key]['menu_style']);
					selector.attr('data-alignment', bparray[key]['menu_alignment']);


					selector.removeAttr('data-burger_alignment','');
					selector.removeAttr('data-burger_over', '');

					// Remove responsive nav toggler
					selector.find('div.responsive_nav_toggler').remove();
					me.showMenu(selector.find('ul.menu'));

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

				selector.attr('data-isfloating', bparray[key]['is_floating']);

			}
		}
		Upfront.Events.trigger('entity:object:refresh', this);
	},

	hideMenu: function(menu) {
		var $nav = this.$el.find('.upfront-output-unewnavigation');
		menu.hide();

		if (menu.siblings('.burger_overlay').length > 0) {
			var burger_overlay = menu.siblings('.burger_overlay');
			burger_overlay.hide();
		}
		if($nav.attr('data-burger_alignment') === 'top' || $nav.attr('data-burger_alignment') === 'whole') {
			$('section.upfront-layout').css('margin-top', 0);
		}
	},

	showMenu: function(menu) {
		if (menu.siblings('.burger_overlay').length > 0) {
			var burger_overlay = menu.siblings('.burger_overlay');

			burger_overlay.show();
		}

		menu.show();
	},

	toggle_responsive_nav: function(e) {
		var me = this;
		var region_container = this.$el.closest('.upfront-region-container');
		var $menu = this.$el.find('ul.menu');
		var $nav = this.$el.find('.upfront-output-unewnavigation');

		if ($menu.css('display') == 'none' && typeof(e) != 'undefined') {
			this.showMenu($menu);
			var offset = $menu.position();

			var close_icon = $('<i class="burger_nav_close"></i>');
			$menu.prepend($('<li>').addClass('wrap_burger_nav_close').append(close_icon));

			close_icon.bind('touchstart click', function() {
				$(e.target).closest('.responsive_nav_toggler').trigger('click');
				if ($nav.attr('data-burger_alignment') === 'top' || $nav.attr('data-burger_alignment') === 'whole') {
					$('section.upfront-layout').css('margin-top', 0);
				}
			});
			region_container.addClass('upfront-region-container-has-nav');

			if($nav.attr('data-burger_over') === 'pushes' && $nav.attr('data-burger_alignment') === 'top' || $nav.attr('data-burger_alignment') === 'whole') {
				$('section.upfront-layout').css('margin-top', $menu.height());

				var topbar_height = $('div#upfront-ui-topbar').outerHeight();
				var ruler_height = $('.upfront-ruler-container').outerHeight();
				$menu.offset({top:topbar_height+ruler_height, left:$('section.upfront-layout').offset().left});
			}
		} else {
			this.hideMenu($menu);
			this.$el.find('i.burger_nav_close').parent('li.wrap_burger_nav_close').remove();

			this.$el.find('ul.sub-menu').css('display', '');
			if(this.$el.find('ul.sub-menu').length < 1 )
				region_container.removeClass('upfront-region-container-has-nav');

			if($nav.attr('data-burger_over') === 'pushes') {
				$('section.upfront-layout').css('margin-top', '');
			}
		}
	},

	generate_menu: function() {
		var me = this;
		var menu_id = this.model.get_property_value_by_name('menu_id');
		if(!menu_id) return;
		var container = this.$el.find('.upfront-object-content');;


		this.$el.find('.upfront-object-content').html('');


		if(this.property('menu_items').length > 0) {
			var menu = this.renderMenu(this.property('menu_items'), 'menu');
			container.append(menu);
		}
		else
		{

			container.append(this.renderMenu(this.property('menu_items'), 'menu'));

			setTimeout(function() {
				// me.$el.find('a.newnavigation-add-item').trigger('click');
				me.$el.closest('.upfront-module').find('i.upfront-icon-region-add').trigger('click');
			}, 200);
		}

		var preset = this.model.get_property_value_by_name("preset");
		var presetProperties = this.get_preset_properties();

		setTimeout(function() {
			me.clearPresetClass(me.$el);
			me.$el.addClass(me.property('theme_style'));
			me.$el.addClass(preset);
		}, 50);

		//Work around for having the region container have a higher z-index if it contains the nav, so that the dropdowns, if overlapping to the following regions should not loose "hover" when the mouse travels down to the next region.

		var region_container = this.$el.closest('.upfront-region-container, .upfront-region-sub-container');
		if(this.$el.find('ul.sub-menu').length > 0 ) {
			region_container.addClass('upfront-region-container-has-nav');
		}
		else {
			region_container.removeClass('upfront-region-container-has-nav');
		}


		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;

		presetProperties.breakpoint = presetProperties.breakpoint || {desktop:{},tablet:{},mobile:{}};
		if (!breakpoint || breakpoint.default) {
			if (
				presetProperties.breakpoint.desktop.menu_style === 'burger'&&
				presetProperties.breakpoint.desktop.burger_over !== 'pushes' &&
				presetProperties.breakpoint.desktop.burger_alignment !== 'whole'
			) {
				this.$el.find('.upfront-object-content').append($('<div class="burger_overlay"></div>'));
			}
			if (presetProperties.breakpoint.desktop.menu_style === 'burger') {
				container.prepend($('<div>').addClass("responsive_nav_toggler").data('view', me).append('<div></div><div></div><div></div>'));
				me.hideMenu(this.$el.find('ul.menu'));
			}
		} else {
			breakpoint_data = presetProperties.breakpoint[breakpoint.id] || {};

			var menu_style = typeof breakpoint_data.menu_style === 'undefined' ? (this.model.get_breakpoint_property_value('burger_menu') === 'yes' ? 'burger' : '') : breakpoint_data.menu_style;
			var burger_over = typeof breakpoint_data.burger_over === 'undefined' ? this.model.get_breakpoint_property_value('burger_over') : breakpoint_data.burger_over;
			var burger_alignment = typeof breakpoint_data.burger_alignment === 'undefined' ? this.model.get_breakpoint_property_value('burger_alignment') : breakpoint_data.burger_alignment;
			if (
				menu_style === 'burger'&&
				burger_over !== 'pushes' &&
				burger_alignment !== 'whole'
			) {
				this.$el.find('.upfront-object-content').append($('<div class="burger_overlay"></div>'));
			}
			if(menu_style === 'burger') {
				container.prepend($('<div>').addClass("responsive_nav_toggler").data('view', me).append('<div></div><div></div><div></div>'));
				me.hideMenu(this.$el.find('ul.menu'));
			}
		}
		//clear any top margin applied to the layout for accomodating a burger menu when set to "push content"
		$('section.upfront-layout').css('margin-top', '');

		this.makeSortable();

		this.processFloatStatus();
	},
	clearPresetClass: function($el) {
		$el.removeClass();
		$el.addClass(this.elementClasses);
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
		Upfront.Util.post({"action": "upfront_new_update_menu_order", "menu_items": me.new_menu_order()})
			.success(function (ret) {
				Upfront.Events.trigger("menu_element:edit");
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
	renderMenu: function(list, classname, level){

		if(typeof(level) == 'undefined')
			level = 0;
		var me = this,
			$dom = $('<ul>').addClass(classname)
		;
		if(classname=='menu') $dom.addClass('drag_mode');
		_(list).each(function (model) {
			var $li = me.renderMenuItem(model, false, level);
			if($li && $li.length && !(typeof model.sub === 'undefined')) {
				if (model.sub && model.sub.length) $li.addClass('parent').append(me.renderMenu(model.sub, 'sub-menu', level+1));
			}
			$dom.append($li);
		});

		$dom.children('li:last').append('<i class="navigation-add-item"></i>');

		return $dom;
	},

	renderMenuItem: function (model, newitem, level){
		if(typeof(level) == 'undefined')
			level = 0;

		var me = this;

		if(typeof newitem == 'undefined') newitem = false;

		var view = new MenuItemView({model: model, parent_view: me, newitem: newitem, level: level});
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
		var parent_level = 0;
		var parent_level = 0;
		var menu_item = this.menuItemTemplate();
		var newmenuitem;

		if(typeof e.target == 'undefined' && e.parent('li').length > 0) {
			parent_level = e.parent('li').data('depth');
			menu_item["menu-item-parent-id"] = e.parent('li').data('backboneview').model["menu-item-db-id"];
			e.append(this.renderMenuItem(menu_item, true, parent_level+1));
			e.children('li:last').append('<i class="navigation-add-item"></i>');
		} else {
			if($(e.target).parent('li').parent('ul').parent('li').length > 0) {
				menu_item["menu-item-parent-id"] = $(e.target).parent('li').parent('ul').parent('li').data('backboneview').model["menu-item-db-id"];
				$(e.target).parent('li').parent('ul').addClass('time_being_display');
			}
			if($(e.target).parent('li').length == 0) {
				$(e.target).closest('div.upfront-module').find('ul.menu').append(this.renderMenuItem(menu_item, true));
			}
			else {
				$(e.target).parent('li').parent('ul').append(this.renderMenuItem(menu_item, true, 0));
				$(e.target).parent('li').next('li').append(e.target);
			}
		}
		me.editMenuItem(me.$el.find('a.new_menu_item').removeClass('new_menu_item')); //linkPanel does not popup on new menu creation because of this class being removed
	},

	getControlItems: function(){
		return _([
			this.createControl('add', l10n.add_item, 'addPrimaryMenuItem'),
			this.createPaddingControl(),
			this.createControl('settings', l10n.settings, 'on_settings_click')
		]);
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
		"[data-style='horizontal'] ul.menu, div[data-style='vertical'] ul.menu": {label: l10n.css.bar_label, info: l10n.css.bar_info},
		"[data-style='horizontal'] ul.menu > li.menu-item > a, div[data-style='vertical'] ul.menu > li.menu-item > a": {label: l10n.css.item_label, info: l10n.css.item_info},
		"[data-style='horizontal'] ul.menu > li.menu-item:hover > a, div[data-style='vertical'] ul.menu > li.menu-item:hover > a": {label: l10n.css.hover_label, info: l10n.css.hover_info},
		"[data-style='horizontal'] ul.sub-menu > li.menu-item > a, div[data-style='vertical'] ul.sub-menu > li.menu-item > a": {label: l10n.css.subitem_label, info: l10n.css.subitem_info},
		"[data-style='horizontal'] ul.sub-menu > li.menu-item:hover > a, div[data-style='vertical'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.subitem_hover_label, info: l10n.css.subitem_hover_info},


		"[data-style='burger'] ul.menu": {label: l10n.css.responsive_bar_label, info: l10n.css.bar_info},
		".upfront-output-unewnavigation .responsive_nav_toggler": {label: l10n.css.responsive_trigger, info: l10n.css.hover_info},
		".upfront-output-unewnavigation div.responsive_nav_toggler > div": {label: l10n.css.responsive_trigger_bars, info: l10n.css.hover_info},
		".upfront-output-unewnavigation i.burger_nav_close": {label: l10n.css.responsive_nav_close, info: l10n.css.close_info},
		"[data-style='burger'] ul.menu > li.menu-item > a": {label: l10n.css.responsive_item_label, info: l10n.css.item_info},
		"[data-style='burger'] ul.menu > li.menu-item:hover > a": {label: l10n.css.responsive_hover_label, info: l10n.css.hover_info},
		"[data-style='burger'] ul.sub-menu > li.menu-item > a": {label: l10n.css.responsive_subitem_label, info: l10n.css.subitem_info},
		"[data-style='burger'] ul.sub-menu > li.menu-item:hover > a": {label: l10n.css.responsive_subitem_hover_label, info: l10n.css.subitem_hover_info}
	},
	cssSelectorsId: Upfront.data.unewnavigation.defaults.type
});
Upfront.Models.UnewnavigationModel = UnewnavigationModel;
Upfront.Views.UnewnavigationView = UnewnavigationView;


});
})(jQuery);
