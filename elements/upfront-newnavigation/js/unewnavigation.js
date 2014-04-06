(function ($) {

	define([
		'text!elements/upfront-newnavigation/tpl/link_editor.html'
	], function(editorTpl) {

var $editorTpl = $(editorTpl);


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
	linkTpl: _.template($editorTpl.find('#link-tpl').html()),	
	events: {
     //'click a.menu_item' : 'editMenuItem',
	 'click i.delete_menu_item' : 'deleteMenuItem',
	 'click i.navigation-add-item': 'addMenuItem',
     //'dblclick a.menu_item' : 'editMenuItem',
	 "contextmenu a.menu_item": "on_context_menu",

    },
	initialize: function(options) {
		this.parent_view = options.parent_view;
		this.newitem = options.newitem;
		var me = this;
		_.bindAll(this, 'render'); 
		
		var ContextMenuList = Upfront.Views.ContextMenuList.extend({
			initialize: function() {

				this.menuitems = _([
				  new Upfront.Views.ContextMenuItem({
					  get_label: function() {
						 return "Visit URL";
					  },
					  action: function() {
						  
						  
						if(me.model['menu-item-url'].indexOf('#') > -1 && me.getCleanurl(me.model['menu-item-url']) == me.getCleanurl()) {
							//console.log($(thelink.model['menu-item-url']).length);
							//if(thelink.getCleanurl(thelink.model['menu-item-url']) == thelink.getCleanurl()) {
							var anchors = me.parent_view.get_anchors();
							$('html,body').animate({scrollTop: $('#'+me.getUrlanchor(me.model['menu-item-url'])).offset().top},'slow');
						}
						else if(me.model['menu-item-target'] == '')
							window.location.href = me.model['menu-item-url'];
						else
							window.open(me.model['menu-item-url']);
						  
						  /*
						  
						  if(me.model['menu-item-type'] == 'custom') {
		  						if(me.model['menu-item-url'].indexOf('#') == 0) {
									window.location.href = window.location.href.replace(me.model['menu-item-url'], '')+me.model['menu-item-url'];
								}
								else
								  window.open(me.model['menu-item-url']);
						  }
						  else
							  window.location.href = me.model['menu-item-url'];
						  */
					  }
				  }),
				  new Upfront.Views.ContextMenuItem({
					  get_label: function() {
						 return "Edit URL";
					  },
					  action: function() {
						 $(me.event.target).addClass('new_menu_item');
						 me.parent_view.editMenuItem(me.$el.find('a.new_menu_item'));
						 //$(me.event.target).trigger('click');
						 //me.editMenuItem(me.event);  
					  }
				  }),
				  new Upfront.Views.ContextMenuItem({
					  get_label: function() {
						 return "Create Drop-Down";
					  },
					  action: function() {
						 me.createDropDown(me.event);
						  
					  }
				  })
				]);		
			}
		});	
		
		this.ContextMenu = Upfront.Views.ContextMenu.extend({
			initialize: function() {
				this.constructor.__super__.initialize.apply(this, arguments);
				this.menulists = _([
				  new ContextMenuList()
				]);	
				
			}
		});
		
		Upfront.Events.on("entity:contextmenu:deactivate", this.remove_context_menu, this);
		
	},
	on_context_menu: function(e) {
		
		e.stopPropagation();
		if(this.parent_view.$el.find('ul.menu').hasClass('edit_mode'))
			return;
			
		this.closeTooltip();
		e.preventDefault();
		this.event = e;
		//Upfront.Events.trigger("entity:contextmenu:activate", this);
		context_menu_view = new this.ContextMenu({
				model: this.model,
				el: $(Upfront.Settings.LayoutEditor.Selectors.contextmenu)
			})
		;
		
		context_menu_view.for_view = this;
		this.context_menu_view = context_menu_view;
		context_menu_view.render();

	},
	remove_context_menu: function(e) {
		if (!this.context_menu_view) return false;
		$(Upfront.Settings.LayoutEditor.Selectors.contextmenu).html('').hide();
		this.context_menu_view = false;
		
	},
	render: function (event) {
		var me = this;
		var content = '<a class="menu_item';

		if(me.newitem)
			content = content + ' new_menu_item menu_item_placeholder';
			
		content = content+'" >'+this.model['menu-item-title']+'</a><i class="delete_menu_item">x</i>';
		$(this.el).html(content);
//		$(this.el).data('id', this.model['menu-item-db-id']);
//		$(this.el).data('parent', this.model['menu-item-parent-id']);
		$(this.el).data('backboneview', me).addClass('menu-item');
		if(me.newitem)
			$(this.el).addClass('new_menu_item');

		
		return this;
	},
	createDropDown: function(e) {
		var placeholder = $('<ul>').addClass('sub-menu').addClass('time_being_display');
		$(e.target).closest('li').append(placeholder);
		this.parent_view.addMenuItem(placeholder)	
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

		if(me.$el.siblings().length < 1) {
			removeparent = true;
		}
			
		me.$el.remove();
	
		if(removeparent)
			parentlist.remove();

		parentlist.children('li:last').append(newitemicon);

		if(typeof me.model['menu-item-db-id'] != 'undefined') {		
			Upfront.Util.post({"action": "upfront_delete_menu_item", "menu_item_id": me.model['menu-item-db-id'], "new_menu_order" : me.parent_view.new_menu_order()})
				.success(function (ret) {
					//Upfront.Events.trigger("navigation:get:this:menu:items");
					//Upfront.Events.trigger("entity:object:render_navigation");
					//Upfront.Events.trigger("navigation:render_menu_order");
				})
				.error(function (ret) {
					Upfront.Util.log("Error Deleting Menu Item");
				});
		}

	},
	editMenuItem: function(e) {
		//if(!this.parent_view.editmode)
			//return;
		//e.preventDefault();

		var target;
		if(typeof e.target == 'undefined')
			target = e;
		else
			target = e.target;

		//e.stopPropagation();

		var me = this,
			//tplOptions = this.extract_properties(),
			contents
		;
		
		//tplOptions.checked = 'checked="checked"';
		
		
		var is_anchor = false;
		
		if(me.model['menu-item-url'].indexOf('#') > -1 && me.getCleanurl(me.model['menu-item-url']) == me.getCleanurl()) {
				is_anchor = true;
		}
		

		contents = $('<div/>').append(this.linkTpl({'menu_item_type': me.model['menu-item-type'], 'menu_item_url': me.model['menu-item-url'], 'is_anchor': is_anchor}))
			.on('change', 'input[name=unavigation-link-type]', function(ev){
				me.linkChanged(ev);
			})
			.on('change', 'input[name=unavigation-link-url]', function(ev){
				me.linkChanged(ev);
			})
			.on('click', 'button.upfront-save_settings', function(e){

				me.model['menu-item-type'] =  $('#unewnavigation-tooltip').find('input[name=unavigation-link-type]:checked').val();
				
				if(me.model['menu-item-type'] == 'anchor')
					me.model['menu-item-type'] = 'custom';
					
				
				//me.model['menu-item-url'] = $('#unewnavigation-tooltip').find('input[name=unavigation-link-url]').val();


				if(me.$el.children('div').length > 0) {
					if(me.$el.children('div').children('a.menu_item').data('redactor')) {
						me.$el.children('div').children('a.menu_item').removeClass('ueditable').data('redactor').destroy();
					}
				}

				me.parent_view.makeSortable();
				me.parent_view.editModeOff();

				me.saveLink(e);
				me.closeTooltip();
			})
			.on('click', '.unewnavigation-change-link-post', function(ev){
				me.linkChanged(ev);
			})
		;
		//contents=$('<div/>').append('<div>Hello World</div>');

		this.openTooltip(contents, $(target));

		//Upfront.Events.trigger("entity:contextmenu:deactivate", this);
	},
	linkChanged: function(e){
		var me = this,
			val = $('#unewnavigation-tooltip').find('input[name=unavigation-link-type]:checked').val()
		;

		if(val == 'post_type'){
			this.removeAnchorsselect();
			if(val == 'post_type' || e.type != 'change'){
				var selectorOptions = {
						postTypes: this.postTypes()
					}
				;

	
				Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
					//console.log(post);
					var permalink = post.get('permalink');
					me.model['menu-item-type'] =  'post_type';
					me.model['menu-item-object'] =  post.get('post_type');
					me.model['menu-item-object-id'] =  post.get('ID');
					me.model['menu-item-url'] = permalink;
					me.model['menu-item-target'] = '';
					$('#unewnavigation-tooltip').find('input[name=unavigation-link-url]').val(permalink);
					//me.saveLink();
					
				});
			}
		}
		else if( val == 'custom' ) {
				this.removeAnchorsselect();
				me.model['menu-item-type'] =  'custom';
				me.model['menu-item-target'] = '_blank';
				me.model['menu-item-url'] = $('#unewnavigation-tooltip').find('input[name=unavigation-link-url]').val();
		}
		else if( val == 'anchor' ) {
				this.addAnchorsselect();
		}

		


	},
	addAnchorsselect: function() {
		var me = this;
		var anchorsselect = new Upfront.Views.Editor.Settings.Anchor.LabeledTrigger({
                                        model: this.parent_view.model,
                                        title: "Anchor link"
                                    });
		anchorsselect.render();
		
		if(me.model['menu-item-url'].indexOf('#') > -1) {
			
			anchorsselect.$el.find('li.upfront-field-select-option').removeClass('upfront-field-select-option-selected');
			anchorsselect.$el.find('div.upfront-field-wrap-select div.upfront-field-select-value span').html(me.getUrlanchor(me.model['menu-item-url']));
			anchorsselect.$el.find('div.upfront-field-wrap-select input[value="'+me.getUrlanchor(me.model['menu-item-url'])+'"]').parent().addClass('upfront-field-select-option-selected');
		}
		
		anchorsselect.$el.find('div.upfront-field-wrap-select').insertAfter($('input#unavigation-link-type-3').next('label'));
		
		//$('<br /><label id="label-anchors-select">Select Anchor </label>').insertBefore($('div.upfront-field-wrap-select'));
		
		$('div.upfront-field-wrap-select input').on('change', function() {
			//$('#unewnavigation-tooltip').find('input[name=unavigation-link-url]').val('#'+$(this).val());
			me.model['menu-item-type'] =  'custom';
			me.model['menu-item-target'] = '';
			me.model['menu-item-url'] = me.getCleanurl()+'#'+$(this).val();
			
		});
	},
	getCleanurl: function(url) {
		//this one removes any existing # anchor postfix from the url

		if(typeof(url) == 'undefined')
			var url = $(location).attr('href');
		
		if(url.indexOf('#') >=0) {
			var tempurl = url.split('#');
			return tempurl[0];
		}
		else
			return url;
		
	},
	getUrlanchor: function(url) {
		// this does almost the opposite of the above function
		
		if(typeof(url) == 'undefined')
			var url = $(location).attr('href');
		
		if(url.indexOf('#') >=0) {
			var tempurl = url.split('#');
			return tempurl[1];
		}
		else
			return false;
	},
	removeAnchorsselect: function() {
//		$('label#label-anchors-select').prev('br').remove();
	//	$('label#label-anchors-select').remove();
		$('div.upfront-field-wrap-select').remove();
	},
	saveLink: function(e) {


		var me = this;
		//if( typeof me.$el.find('a.new_menu_item').data('redactor') != 'undefined')
			//me.$el.find('a.new_menu_item').data('ueditor').stop();
			
		me.$el.find('a.new_menu_item').removeClass('new_menu_item');
		me.$el.removeClass('new_menu_item');


		//me.parent_view.editModeOff();
		if(me.$el.parent('ul').hasClass('time_being_display'))
			me.$el.parent('ul').removeClass('time_being_display')
			
		this.model['menu-item-title'] = $(this.el).children('a.menu_item').text();
		


		var postdata = {"action": "upfront_update_menu_item",'menu': me.parent_view.model.get_property_value_by_name('menu_id') , 'menu-item': this.model}

		
		if(typeof this.model['menu-item-db-id'] != 'undefined'){
			
			postdata['menu-item-id'] = me.model['menu-item-db-id'];
			
		}	
		
		Upfront.Util.post(postdata)
			.success(function (ret) {
				//console.log('success');
				
				me.model['menu-item-db-id'] = ret.data;

				//Upfront.Events.trigger("entity:object:render_navigation");
				//Upfront.Events.trigger("navigation:get:this:menu:items");
				//Upfront.Events.trigger("navigation:render_menu_order");
			})
			.error(function (ret) {
				Upfront.Util.log("Error updating menu item");
			});

	},
	openTooltip: function(content, element){

		var tooltip = $('#unewnavigation-tooltip'),
			elementPosition = element.offset(),
			tooltipPosition = {
				top: elementPosition.top + element.outerHeight(),
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

		Upfront.Events.trigger("entity:settings:deactivate");
	},

	closeTooltip: function(){
		var tooltip = $('#unewnavigation-tooltip');
		tooltip.hide().trigger('closed');
		setTimeout(function(){
			tooltip.remove();
		}, 100);
	},
	postTypes: function(){
		var types = [];
		_.each(Upfront.data.ugallery.postTypes, function(type){
			if(type.name != 'attachment')
				types.push({name: type.name, label: type.label});
		});
		return types;
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
	initialize: function(options){
		var me = this;

		this.editmode = false;
		
		this.property('initialized', false);
		if(! (this.model instanceof UnewnavigationModel)){
			this.model = new UnewnavigationModel({properties: this.model.get('properties')});
		}
        Upfront.Views.ObjectView.prototype.initialize.call(this);

		this.events = _.extend({}, this.events, {
		  //'click ul.menu.drag_mode a.menu_item' : 'editMenuItem',
		  'click a.menu_item' : 'exitEditMode',
		  'dblclick a.menu_item' : 'editMenuItem',
		  //'click ul.menu.edit_mode a.menu_item.edit_disable' : 'dbleditMenuItem',		  
		  //'dblclick ul.menu.drag_mode a.menu_item': 'editMenuItem',
		 // 'dblclick ul.menu.edit_mode a.menu_item': 'editMenuItem',
		  
          //'click ul.i.navigation-add-item': 'addMenuItem',
		  
		  //'dblclick ul.menu.drag_mode a.menu_item': 'editModeOn',
		  //'click ul.menu.drag_mode a.menu_item': 'preventClick'
		});

//		this.constructor.__super__.initialize.call(this, [options]);




		if(currentMenuItemData.get('model_true')){
			// get all menus
			this.getMenus();
			var menu_id = this.model.get_property_value_by_name('menu_id');
			currentMenuItemData.set({model_true:false, menu_id: menu_id});
			//check auto add on initialize
			//this.auto_add_pages();
			//set data on initialize
			if(menu_id)
				Upfront.data.navigation.get_this_menu_items = Upfront.Util.post({"action": "upfront_load_menu_items", "data": currentMenuItemData.get('menu_id')});
			//Upfront.data.navigation.get_all_pages = Upfront.Util.post({"action": 'upfront_load_all_pages'});
			//Upfront.data.navigation.get_all_categories = Upfront.Util.post({"action": 'upfront_load_all_categories'});
			// re render navigation when this event trigger
			//Upfront.Events.on("entity:object:render_navigation",this.renderTrigger, this );
			// call this function on Menu id change
			//if (!!this.model.get_property_by_name('menu_id')) this.model.get_property_by_name('menu_id').on('change', this.auto_add_pages, this);
			// call this function on allow_new_pages change
			//if (!!this.model.get_property_by_name('allow_new_pages')) this.model.get_property_by_name('allow_new_pages').on('change', this.update_auto_add_pages, this);

			this.property('menu_items', false);
			
			//this.model.get("properties").on('all', this.update_model, this);
			//this.model.get("properties").on('all', this.getMenus, this);



		}
		this.on('deactivated', this.onDeactivate, this)
		
		
	},
	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [];
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				module.get("objects").each(function (object) {
					var anchor = object.get_property_value_by_name("anchor");
					if (anchor && anchor.length) 
						anchors[anchor] = object;
				});
			});
		});
		return anchors;
	},
	exitEditMode: function(e) {
		var me = this;
		var thelink = $(e.target).closest('li').data('backboneview');
		if(!$(e.target).hasClass('ueditable'))
			this.$el.find('a.ueditable').each(function() {
				$(this).data('ueditor').stop();
			});
		console.log(thelink.model['menu-item-target']);
		singleclickcount++;
		if(singleclickcount == 1) {
			setTimeout(function(){
			  if(singleclickcount == 1) {
				  
					//if(thelink.model['menu-item-type'] == 'custom') {
						if(thelink.model['menu-item-url'].indexOf('#') > -1 && thelink.getCleanurl(thelink.model['menu-item-url']) == thelink.getCleanurl()) {
							//console.log($(thelink.model['menu-item-url']).length);
							//if(thelink.getCleanurl(thelink.model['menu-item-url']) == thelink.getCleanurl()) {
							var anchors = me.get_anchors();
							$('html,body').animate({scrollTop: $('#'+thelink.getUrlanchor(thelink.model['menu-item-url'])).offset().top},'slow');
						}
						else if(thelink.model['menu-item-target'] == '')
							window.location.href = thelink.model['menu-item-url'];
						else
							window.open(thelink.model['menu-item-url']);
					//}
					//else
						//window.location.href = thelink.model['menu-item-url'];
			  }
			  singleclickcount = 0;
			}, 300);	
			
		}
		
		
	},
	editMenuItem: function(e) {

		//e.preventDefault();
		this.editModeOn(e);
		var me = this;
		var target;
		if(typeof e.target == 'undefined' || e.target.trim == '')
			target = e;
		else
			target = e.target;

		//console.log(target);
		
		//if(typeof $(target).data('redactor') != 'undefined')
			//return;
			
		/*me.$el.find('a.menu_item').each(function() {
			if(typeof $(this).data('redactor') != 'undefined')
				$(this).data('ueditor').stop();
		});*/
		$(target).closest('li').addClass('edit_mode');
		if(!$(target).data('ueditor'))
			$(target).ueditor({
				linebreaks: true,
				disableLineBreak: true,
				//autostart: true,
				focus: true,
				tabFocus: false,
				airButtons: false,
				allowedTags: ['h5'],
				placeholder: 'Link Name'
			}).on('start', function(e) {
				$(target).focus();
			}).on('keydown', function(e){
				
				if (e.which == 9) {
					e.preventDefault();
					if(!$(target).hasClass('new_menu_item')) {
						$(target).blur();
						
						//if($(target).closest('li').is(':last-child')) {
							$(target).closest('ul').children('li:last').children('i.navigation-add-item').trigger('click');}
						//else {
							//me.editModeOn($(target).closest('li').next('li').children('a.menu_item'));
						//}
					//}
					//e.preventDefault();
					//return;	
					}
				if($(target).text().trim() != '')	
					$(target).removeClass('menu_item_placeholder');
				else
					$(target).addClass('menu_item_placeholder');
			}).on('blur', function() {
				$(target).data('ueditor').stop();
				$(target).closest('li').removeClass('edit_mode');
				//console.log('blurred');
				if(!$(target).hasClass('new_menu_item'))	
					$(target).closest('li').data('backboneview').saveLink();
			}).on('stop', function() {
				me.editModeOff();
			});
		else {
			$(target).data('ueditor').start();
				$(target).focus();
		}
			/*.on('start', function(){
				console.log('wtf');
				$(e.target).closest('li').data('backboneview').editMenuItem(e);
			})*/
			//.on('stop', function(){
				//Upfront.Events.trigger('upfront:element:edit:stop');
			//});
		
		/*return;

		if(typeof $(e.target).attr('contenteditable') == 'undefined') {
			this.$el.find('a.menu_item').removeAttr('contenteditable');
			$(e.target).attr('contenteditable', true);
			//_.delay(function(self) {
	
	  			//$(e.target).trigger('click');
				this.editMenuItem(e);
			//}, 50, this);
			

		}
		else {*/
			//e.preventDefault();
			//e.stopPropagation();
//			if(!$(e.target).closest('li').hasClass('tooltip-open')) {
			if($(target).hasClass('new_menu_item') ) {
				_.delay(function(self) {
		
					$(target).closest('li').data('backboneview').editMenuItem(e);
			
				}, 30, this);
			}
	//		}
	//	}
		
	},
	editModeOn: function(e) {

		//if(!this.editmode || !this.$el.find('ul.menu').hasClass('edit_mode')) {
		//	this.editmode = true;
		//	this.$el.find('ul.menu').addClass('edit_mode').removeClass('drag_mode');
//			this.$el.find('ul.menu a.menu_item').attr('contenteditable', true);
			this.$el.find('.upfront-object-content ul').each(function() {
				if($(this).hasClass('ui-sortable'))
					$(this).sortable('disable');
			});
		//}
		
	//	var target;
	//	if(typeof e.target == 'undefined')
		//	target = e;
		//else
		//	target = e.target;

		//this.editMenuItem(target);
	},
	editModeOff: function() {
		//if(this.editmode) {
		//	this.editmode = false;
			//this.$el.find('ul.menu').removeClass('edit_mode').addClass('drag_mode');
			//this.$el.find('ul.menu a.menu_item').removeAttr('contenteditable');
			if(this.$el.find('.upfront-object-content ul.menu').hasClass('ui-sortable'))
				this.$el.find('.upfront-object-content ul').sortable('enable');
		//}
	},
	onDeactivate: function() {
		this.editModeOff();
		this.$el.find('.time_being_display').removeClass('time_being_display');		
	},
	property: function(name, value, silent) {
		if(typeof value != "undefined")
			return this.model.set_property(name, value, silent);
		return this.model.get_property_value_by_name(name);
	},
	/*update_auto_add_pages: function(){
		var menu_id = this.model.get_property_value_by_name('menu_id'),
			allow_new_pages = this.property('allow_new_pages'),
			nav_menu_option = Upfront.data.navigation.auto_add['auto_add'],
			key;

		if(!menu_id)
		  return false;

		menu_id = parseInt(this.model.get_property_value_by_name('menu_id'), 10);

		if ( !nav_menu_option )
			nav_menu_option = [];
		if ( allow_new_pages[0] == ['yes'] ) {
			if ( nav_menu_option.indexOf(menu_id) == -1 )
				nav_menu_option.push(menu_id);
		} else {
			if ( -1 !== ( key = nav_menu_option.indexOf(menu_id) ) )
				nav_menu_option.splice(key, 1);
		}

		if(!Upfront.data.navigation.auto_add){
			Upfront.data.navigation.auto_add = {0:false, auto_add:[]};
		}else{
			Upfront.data.navigation.auto_add['auto_add'] = nav_menu_option;
		}

		Upfront.Util.post({"action": "upfront_update_auto_add_pages", "nav_menu_option": JSON.stringify(Upfront.data.navigation.auto_add)})
			.error(function(res){
				Upfront.Util.log("Cannot update auto add pages!");
			});
	},
	auto_add_pages: function(){
		var menu_id =
			parseInt(this.model.get_property_value_by_name('menu_id'),10);
		// checking auto add option for current menu
		if ( !Upfront.data.navigation.auto_add['auto_add']  )
			this.model.set_property(
				'allow_new_pages',
				['no'],
				true
			);
		else if ( -1 !== Upfront.data.navigation.auto_add['auto_add'].indexOf(menu_id) )
			this.model.set_property(
				'allow_new_pages',
				['yes'],
				true
			);
		else
			this.model.set_property(
				'allow_new_pages',
				['no'],
				true
			);
	},*/
	getMenus: function(){
		var me = this;

		// Ajax call for Menu list
		Upfront.Util.post({"action": "upfront_load_menu_list"})
			.success(function (ret) {
				var values = _.map(ret.data, function (each, index) {
					/*if(ret.data.length && index == 0){
						var menu_id = me.property('menu_id');
						if(!menu_id)
							me.property('menu_id',each.term_id)
					}*/
					return  {label: each.name, value: each.term_id};
				});
				currentMenuItemData.set({menuList: values});
				
				if(!me.property('menu_id'))
					me.display_menu_list();
				
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu list");
			});
	},
	display_menu_list: function () {

		var me = this;
		me.$el.find('div.upfront-object-content').html('');
		
		var menuItems =	new Upfront.Views.Editor.Field.Select({
			model: me.model,
			label: "",
			className: "existing_menu_list",
			/*change: function() {
				if(!me.property('initialized'))	{
					//me.property('initialized', true, true);
				}
				else
					me.property('menu_id', this.get_value());
			},*/
			values: [{label:'Choose existing menu', value: 0}].concat(currentMenuItemData.get('menuList'))
		})

		menuItems.render();
		
		me.$el.find('div.upfront-object-content').append(menuItems.el).append('<span> or </span>');
		/*
		
		me.$el.find('div.upfront-object-content').on('mouseover', function() {
			//me.$el.parent().parent().parent().draggable('disable');
		});
		
		me.$el.find('div.upfront-object-content').on('mouseout', function() {
			//me.$el.parent().parent().parent().draggable('enable');
		});
		*/
		
		var newMenuName =  new Upfront.Views.Editor.Field.Text({
									model: me.model,
									label: "New Menu Name",
									className: "new_menu_name",
									compact: true
								});
							
		newMenuName.render();
		
		me.$el.find('div.upfront-object-content').append(newMenuName.el);	
		
		var newMenuButton =  new Upfront.Views.Editor.Field.Button({
									model: me.model,
									label: "Create New",
									className: "new_menu_button",
									compact: true
								});
							
		newMenuButton.render();
		me.$el.find('div.upfront-object-content').append(newMenuButton.el);
		

		
		
		me.$el.find('div.upfront-object-content > div.existing_menu_list').on('mouseover', function() {
			me.$el.parent().parent().parent().draggable('disable');
		});
		
		me.$el.find('div.upfront-object-content > div.existing_menu_list').on('mouseout', function() {
			me.$el.parent().parent().parent().draggable('enable');
		});	
		
		me.$el.find('div.upfront-object-content > div.new_menu_button > input').on('click', function() {
			if(me.$el.find('div.upfront-object-content > div.new_menu_name input').val()!='')
				me.create_new_menu(me.$el.find('div.upfront-object-content > div.new_menu_name input').val());
		});	


		
		me.$el.find('div.upfront-object-content > div.existing_menu_list input').on('change', function() {
			
			me.$el.parent().parent().parent().draggable('enable');
			
			
			if(me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val() != 0) {
				if(!me.property('initialized'))
						me.property('initialized', true, true);
	
						me.property('menu_id', me.$el.find('div.upfront-object-content > div.existing_menu_list input:checked').val());
			}
		});	

	},
	create_new_menu: function(MenuName) {

		var me = this;
		// Ajax call for creating menu
		var newMenu = Upfront.Util.post({"action": "upfront_create_menu", "menu_name": MenuName})
			.success(function (ret) {
				me.property('menu_id', ret.data);
				me.getMenus();
			})
			.error(function (ret) {
				Upfront.Util.log("Error creating menu");
			});

	},
	get_content_markup: function () {

		/*if(!this.property('element_size')) {
			this.setElementSize();
			this.property('element_size', this.elementSize);
		}*/

		var menu_id = this.model.get_property_value_by_name('menu_id'),
			me = this;

		if ( !menu_id )
			return "";

		//if(!this.property('menu_items') || this.property('menu_items').length == 0) {
			Upfront.Util.post({"action": "upfront_load_menu_array", "data": menu_id})
				.success(function (ret) {
					
					if(!ret.data){
						me.$el.find('.upfront-object-content').html('Please add menu items');
						return;
					}
					me.property('menu_items', ret.data);

					me.generate_menu();
				})
				.error(function (ret) {
					Upfront.Util.log("Error loading menu");
				});
		//}
		
		return 'Loading';
	},
	/*setElementSize: function(ui){
		var me = this,
			parent = this.parent_module_view.$('.upfront-editable_entity:first'),
			resizer = ui ? $('.upfront-resize') : parent
		;

		me.elementSize = {
			width: resizer.width() - 32,
			height: resizer.height() - 30
		};

	},*/
	onElementResize: function() {

		if($('.upfront-resize').width() < 360) {
			this.property('menu_style', 'vertical');
		}
		else if($('.upfront-resize').width() > 460) {
			this.property('menu_style', 'horizontal');
		}
	},
	on_render: function() {


		var me = this;
		//Bind resizing events
		if(typeof(me.parent_module_view) != 'undefined') {
			if(!me.parent_module_view.$el.data('resizeHandling')){
				me.parent_module_view.$el
					//.on('resizestart', $.proxy(me.onElementResizeStart, me))
					//.on('resize', $.proxy(me.onElementResizing, me))
					.on('resizestop', $.proxy(me.onElementResize, me))
					.data('resizeHandling', true)
				;
			}
		}

		
		if(!this.property('menu_id')) {
			this.display_menu_list();	
		}
/*		else {
			
			if(this.property('menu_items'))
				this.generate_menu();
		}*/


		
		
		var menuStyle = this.property("menu_style"),
		menuAliment = this.property("menu_alignment"),
		allowSubNav = this.property("allow_sub_nav"),
		$upfrontObjectContent;

		$upfrontObjectContent = this.$el.find('.upfront-object-content');
		$upfrontObjectContent.attr('data-aliment',(menuAliment ? menuAliment : 'left'));
		$upfrontObjectContent.attr('data-style',(menuStyle ? menuStyle : 'horizontal'));
		$upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav.length !== 0 && allowSubNav[0] == 'yes' ? allowSubNav[0] : 'no'));
		
	},
	generate_menu: function() {
		var me = this;
		var menu_id = this.model.get_property_value_by_name('menu_id');

		
		if(!menu_id)
			return;
						
		this.$el.find('.upfront-object-content').html('');
		if(this.property('menu_items').length > 0)
			this.$el.find('.upfront-object-content').append(this.renderMenu(this.property('menu_items'), 'menu'));
		else {
			this.$el.find('.upfront-object-content').append(this.renderMenu([me.menuItemTemplate()], 'menu'));
			me.$el.find('ul.menu li.menu-item').addClass('new_menu_item').find('a.menu_item').addClass('new_menu_item').addClass('menu_item_placeholder')

			me.editMenuItem(this.$el.find('a.new_menu_item'));

		}
		
		
		//this.$el.find('.upfront-object-content').append('<i class="navigation-add-item">+</i>');
		//me.toolTipAppend();
		// add attribute on anchor tag
		//if(this.editmode)
			//this.$el.find('.upfront-object-content a').attr('contenteditable',true);
		//else {
			//this.$el.find('.upfront-object-content a').attr('contenteditable',false);
	
			this.makeSortable();
		//}

		//me.changeMenuItemTitle();
	},
	makeSortable: function() {
//return;
		//console.log('making sortable');
		var me = this;
		this.$el.find('.upfront-object-content ul').sortable({
			//connectWith:'ul',
			start: function ( event, ui ) {
				ui.item.find('i.navigation-add-item').css('display', 'none');
			},
			stop: function( event, ui ) {
				ui.item.find('i.navigation-add-item').css('display', 'block');
				//if(ui.item.find('i.navigation-add-item').length > 0)
				//if(ui.sender != null) 
					//ui.sender.children('li:last').append(ui.item.find('i.navigation-add-item'));
				//else
					ui.item.parent('ul').children('li:last').append(ui.item.parent('ul').children('li').children('i.navigation-add-item'));
					
				me.saveMenuOrder();
			}
		});
	},
	saveMenuOrder: function() {
		var me = this;
		
		
		Upfront.Util.post({"action": "upfront_update_menu_order", "menu_items": me.new_menu_order()})
			.success(function (ret) {
				//console.log('cool');
//				me.property('menu_items', false);
				//Upfront.Events.trigger("entity:object:render_navigation");
				//Upfront.Events.trigger("navigation:get:this:menu:items");
			})
			.error(function (ret) {
				Upfront.Util.log("Error updating menu");
			});
	},
	new_menu_order: function() {
		var i = 0;
		
		var new_menu_order = new Array();
		this.$el.find('.upfront-object-content ul li').each(function() {
			if($(this).parent().parent('li').length > 0)
				$(this).data('backboneview').model['menu-item-parent-id'] = $(this).parent().parent('li').data('backboneview').model['menu-item-db-id'];
			else
				$(this).data('backboneview').model['menu-item-parent-id'] = 0;
				
			new_menu_order[i] = {'menu-item-db-id': $(this).data('backboneview').model['menu-item-db-id'], 'menu-item-parent-id': $(this).data('backboneview').model['menu-item-parent-id']};
			
			$(this).data('backboneview').model['menu-item-position'] = i;
			i++;
		});
		return new_menu_order;
	},
	renderMenu : function(list, classname){
	
		var $dom = $('<ul>').addClass(classname);
		if(classname=='menu')
			$dom.addClass('drag_mode');
		list.forEach( function(model){
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
		if(typeof newitem == 'undefined')
			newitem = false;
		var view = new MenuItemView({model: model, parent_view: me, newitem: newitem});
		return view.render().el;
	},
	menuItemTemplate: function() {
		return {
							"menu-item-parent-id": "0",
							"menu-item-target": "",
							"menu-item-title": "",
							"menu-item-type": "custom",
							"menu-item-url": "http://#"
                        };
	},
	addMenuItem : function(e){

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
			
		}
			
		else {
			 if($(e.target).parent('li').parent('ul').parent('li').length > 0) {
				menu_item["menu-item-parent-id"] = $(e.target).parent('li').parent('ul').parent('li').data('backboneview').model["menu-item-db-id"];
				$(e.target).parent('li').parent('ul').addClass('time_being_display');
			}
			
			$(e.target).parent('li').parent('ul').append(this.renderMenuItem(menu_item, true));
			$(e.target).parent('li').next('li').append(e.target);
		}
		
		//this.makeSortable();
	
		
   		  me.editMenuItem(me.$el.find('a.new_menu_item'));	
		//_.delay(function(self) {
	//console.log(me.$el.find('a.new_menu_item'));
	      //me.editMenuItem(me.$el.find('a.new_menu_item'));
	
       // }, 10, this);
		//me.property('menu_items', me.property('menu_items').concat(menu_items));
		/*					
		if(!menuItemId){
			Upfront.Util.post({"action": "upfront_add_menu_item",'menu': menu_id, 'menu-item': menu_items})
				.success(function (ret) {
					
					


					//me.update_post_status(ret);
				})
				.error(function (ret) {
					Upfront.Util.log("Error adding menu item");
				});
		}else{
			Upfront.Util.post({"action": "upfront_update_menu_item",'menu': menu_id, 'menu-item-id': menuItemId, 'menu-item': menuItems})
				.success(function (ret) {
					Upfront.Events.trigger("entity:object:render_navigation");
					Upfront.Events.trigger("navigation:get:this:menu:items");
					Upfront.Events.trigger("navigation:render_menu_order");
				})
				.error(function (ret) {
					Upfront.Util.log("Error updating menu item");
				});
		}*/
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
		this.$el.addClass('upfront-icon-element upfront-icon-element-newnavigation');
		this.$el.html('New Navigation');
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
			save_settings: function(){
				Menu_Panel.__super__.save_settings.apply(this, arguments);
				this.model.set_property('menu_items', false, true);
				//this.settings._wrapped[0].fields._wrapped[0].renameMenu();
			}
		});



        var Text_Field = Upfront.Views.Editor.Field.Text.extend({
            // add new menus on navigation
        
			/*renameMenu: function() {
				var $input = this.$el.find('input');
                $input.val() ? this.renameMenuCall($input.val()) : this.model.set_property('create_menu','',true);				
			},*/
			renameMenu: function() {
				var $input = this.$el.find('input');
                var me = this;
                // Ajax call for creating menu
                var renameMenu = Upfront.Util.post({"action": "upfront_rename_menu", "new_menu_name": $input.val(), "menu_id": currentMenuItemData.get('menu_id')})
                    .success(function (ret) {
						me.getMenus();
                        //me.model.set_property('create_menu','',true)
                       // me.getMenus();
                    })
                    .error(function (ret) {
                       // Upfront.Util.log("Error creating menu");
                    });	
			},
            getMenus: function(){
                var me = this;
                // Ajax call for Menu list
                Upfront.Util.post({"action": "upfront_load_menu_list"})
                    .success(function (ret) {
                        var values = _.map(ret.data, function (each) {
                            return  {label: each.name, value: each.term_id};
                        });
                        currentMenuItemData.set({menuList: values});
                        me.trigger('panel:set');
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu list");
                    });
            }
        });

        var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
            /**
             * Bootstrap the object - populate the internal
             * panels array with the panel instances we'll be showing.
             */
            initialize: function () {
                this.panels = _([
                    // Menu
                    new Menu_Panel({
                        model: this.model,
                        label: "Menu",
                        title: "Menu settings",
                        settings: [
							new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "This Menu",
                                fields: [
                                    new Text_Field({
                                        model: this.model,
                                        property: 'menu_name',
                                        label: "Menu Name",
										value: "Menu dfdf Name",
                                        compact: true
                                    })
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Use different menu",
                                fields: [
                                    new Upfront.Views.Editor.Field.Select({
                                        model: this.model,
                                        property: 'menu_id',
                                        label: "",
                                        values: currentMenuItemData.get('menuList')
                                    })
                                ]
                            })
                        ]
                    }),
                    
					// Layout
					
                    new Upfront.Views.Editor.Settings.Panel({
                        model: this.model,
                        label: "Layout",
                        title: "Layout settings",
                        settings: [
							new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Menu Style",
                                fields: [
                                    new Upfront.Views.Editor.Field.Radios({
                                        model: this.model,
                                        property: 'menu_style',
                                        default_value: 'horizontal',
                                        label: "",
                                        layout: "vertical",
                                        values: [
                                            { label: "Horizontal", value: 'horizontal', icon: 'navigation-horizontal' },
                                            { label: "Vertical", value: 'vertical', icon: 'navigation-vertical' }
                                        ]
                                    })
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Menu Alignment",
                                fields: [
                                    new Upfront.Views.Editor.Field.Radios({
                                        model: this.model,
                                        property: 'menu_alignment',
                                        default_value: 'left',
                                        label: "",
                                        layout: "vertical",
                                        values: [
                                            { label: "Left", value: 'left', icon: 'navigation-left' },
                                            { label: "Center", value: 'center', icon: 'navigation-center' },
                                            { label: "Right", value: 'right', icon: 'navigation-right' }
                                        ]
                                    })
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Misc. Settings",
                                fields: [
                                    new Upfront.Views.Editor.Field.Checkboxes({
                                        model: this.model,
                                        property: 'allow_sub_nav',
                                        label: "",
                                        default_value: ['no'],
                                        values: [
                                            { label: "Allow subnavigation on hover", value: 'yes' }
                                        ]
                                    }),
                                    new Upfront.Views.Editor.Field.Checkboxes({
                                        model: this.model,
                                        property: 'allow_new_pages',
                                        label: "",
                                        values: [
                                            { label: "Add new Pages to this menu", value: 'yes' }
                                        ]
                                    }),
                                    new Upfront.Views.Editor.Field.Checkboxes({
                                        model: this.model,
                                        property: 'is_floating',
                                        label: "",
                                        values: [
                                            { label: "Allow floating...", value: 'yes' }
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    
                ]);
            },
            /**
             * Get the title (goes into settings title area)
             * @return {string} Title
             */
            get_title: function () {
                return "Navigation settings";
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
