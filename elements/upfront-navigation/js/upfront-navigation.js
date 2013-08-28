(function ($) {

    var _template_files = [
        "text!../elements/upfront-navigation/templates/navigation_contents.html",
        "text!../elements/upfront-navigation/templates/navigation_menuorder.html",
        "text!../elements/upfront-navigation/templates/navigation_contents_item_values.html",
        "text!../elements/upfront-navigation/templates/navigation_menuorder_list.html"
    ];

    define(_template_files, function () {
        // Auto-assign the template contents to internal variable
        var _template_args = arguments,
            _Upfront_Templates = {}
            ;
        _(_template_files).each(function (file, idx) {
            if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!..\/elements\/upfront-navigation\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
        });

        var NavigationModel = Upfront.Models.ObjectModel.extend({
            init: function () {
                this.init_property("type", "NavigationModel");
                this.init_property("view_class", "NavigationView");

                this.init_property("element_id", Upfront.Util.get_unique_id("nav"));
                this.init_property("class", "c22 upfront-navigation");
                this.init_property("has_settings", 1);
            }
        });

        var CurrentMenuItemData = Backbone.Model.extend();
        var currentMenuItemData = new CurrentMenuItemData();

        var NavigationView = Upfront.Views.ObjectView.extend({
            toolTip : _.template('<div class="nav_tooltip" style="display: none;"><a class="edit_url" href="#">edit URL</a><a class="visit_page" href="#">visit page</a></div>'),
            initialize:function(){
                var me = this;

                // Call the parent's initialization function
                Upfront.Views.ObjectView.prototype.initialize.call(this);
                this.getMenus();
                Upfront.Events.on("entity:object:render_navigation",this.renderTrigger, this );
                this.model.get("properties").on('all', this.update_model, this);
                this.model.get("properties").on('all', this.getMenus, this);
                this.update_model();
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
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu list");
                    });
            },
            events: function(){
                return _.extend({},Upfront.Views.ObjectView.prototype.events,{
                    "hover .upfront-object-content .menu-item > a": "onMenuItemHover",
                    "blur .upfront-object-content .menu-item > a": "changeMenuItemTitle"
                });
            },
            model:NavigationModel,
            property: function(name, value) {
                if(typeof value != "undefined")
                    return this.model.set_property(name, value);
                return this.model.get_property_value_by_name(name);
            },
            update_model:function(){
                currentMenuItemData.set({ add_new_page: this.model.get_property_value_by_name('allow_new_pages') });
            },
            get_content_markup: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;

                if ( !menu_id )
                    return "Please select menu on settings";
                Upfront.Util.post({"action": "upfront_load_menu_html", "data": menu_id})
                    .success(function (ret) {
                        if(!ret.data){
                            me.$el.find('.upfront-object-content').html('Please add menu items');
                            return;
                        }
                        me.$el.find('.upfront-object-content').html(ret.data);
                        me.toolTipAppend();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading';
            },
            toolTipAppend: function(){

                var $body = $('body'),
                    me = this;
                $body.find('.nav_tooltip').remove().end()
                    .append(this.toolTip);

                $body.find('.nav_tooltip').hover(function(){
                    $(this).show();

                },function(){
                    $(this).hide();

                });
                $body.find('.nav_tooltip').find('.visit_page').click(function(e){
                    e.preventDefault();
                    window.open(e.target.href)
                });
                $body.find('.nav_tooltip').find('.edit_url').click(function(e){
                    e.preventDefault();
                    Upfront.Events.trigger("entity:settings:activate", me);
                    Upfront.Events.trigger("entity:settings:panel:open");
                });
            },
            renderTrigger: function(){
              this.render();
            },
            changeMenuItemTitle: function(e){
                var $Ele = $(e.target),
                    $text = $Ele.html(),
                    parentId = e.target.parentElement.id,
                    listItemDBID = parentId.replace( /^\D+/g, '');

                if ( !listItemDBID )
                    return "Error Item id is missing";
                Upfront.Util.post({"action": "upfront_change_menu_label", "item_id": listItemDBID, "item_label": $text})
                    .success(function (ret) {
                        //console.log(ret.data)
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error changing menu item label");
                    });
            },
            onMenuItemHover: function(e) {
                var $Ele = $(e.target),
                    $text = $Ele.html(),
                    $url = $Ele.attr('href'),
                    parentId = e.target.parentElement.id,
                    listItemDBID = parentId.replace( /^\D+/g, ''),
                    $toolTip = $('.nav_tooltip');

                // add attribute on anchor tag
                $Ele.attr('contenteditable',true);
                // set current item data
                currentMenuItemData.set({ id: listItemDBID, name: $text, url: $url });

                // Prevent event from bubbling up to object handlers
                // while we're contenteditable=true
                $Ele.on('click mousedown mouseup', function (e) {
                    e.cancelBubble = true;
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                });

                if (e.type == "mouseenter") {
                    // hover on menu item
                    $toolTip.find('.visit_page').attr('href', e.target.href);
                    var x = $Ele.offset().left + ($Ele.outerWidth()/2) - ($toolTip.outerWidth()/2);
                    var y = $Ele.offset().top - ($toolTip.outerHeight());
                    $toolTip.css( { top: y, left: x, position: 'absolute' } )
                        .show();
                }
                else {
                    // hover-out on menu item
                    $toolTip.hide();
                    $Ele.removeAttr('contenteditable');
                }
            },
            on_render: function () {
                var menuStyle = this.property("menu_style"),
                    menuAliment = this.property("menu_alignment"),
                    allowSubNav = this.property("allow_sub_nav");

                $upfrontObjectContent = this.$el.find('.upfront-object-content');
                $upfrontObjectContent.attr('data-aliment',(menuAliment ? menuAliment : 'left'));
                $upfrontObjectContent.attr('data-style',(menuStyle ? menuStyle : 'horizontal'));
                $upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav ? allowSubNav[0] : 'no'));
            }

        });

        var Add_Custom_Link_Item = Upfront.Views.Editor.Settings.Item.extend({
            get_values: function(){
                var url = this.fields._wrapped[0].$el.find('input').val(),
                label = this.fields._wrapped[1].$el.find('input').val(),
                id = this.fields._wrapped[1].$el.find('input').attr('name');
                return [url, label, id];
            },
            reset_fields: function(data){
                if(data)
                    this.fields._wrapped[0].$el.find('input').val(data[0]).attr('name',data[2]),
                    this.fields._wrapped[1].$el.find('input').val(data[1]).attr('name',data[2]);
                else
                    this.fields._wrapped[0].$el.find('input').val('').attr('name',''),
                    this.fields._wrapped[1].$el.find('input').val('').attr('name','');
            }
        });

        var Single_checkBox = Upfront.Views.Editor.Field.Checkboxes.extend({
            className: 'upfront-field-wrap-multiple upfront-field-wrap-checkboxes',
            initialize: function(){
            },
            render: function () {
                var me = this;
                this.$el.html('');
                if ( this.label )
                    this.$el.append(this.get_label_html());
                this.$el.append(this.get_field_html());
                this.$el.on('change', '.upfront-field-multiple input', function(){
                    me.$el.find('.upfront-field-multiple').each(function(){
                        if ( $(this).find('input:checked').size() > 0 )
                            $(this).addClass('upfront-field-multiple-selected');
                        else
                            $(this).removeClass('upfront-field-multiple-selected');
                    });
                });

                this.trigger('rendered');
                return this;
            },
            get_field_html: function () {
                return this.get_values_html();
            },
            get_value_html: function (value, index) {
                var id = value.id;
                var classes = "upfront-field-multiple";
                var attr = {
                    'type': this.type,
                    'id': id,
                    'name': 'menu-item[-' + id + '][menu-item-object-id]',//this.get_field_name(),
                    'value': value.value,
                    'class': 'upfront-field-' + this.type
                };
                var allow_new_page = currentMenuItemData.get('add_new_page');
                //var saved_value = this.get_saved_value();
                if ( allow_new_page[0] !== 'yes'){
                    attr.disabled = 'disabled';
                    classes += ' upfront-field-multiple-disabled';
                }
                /*if ( this.multiple && _.contains(saved_value, value.value) )
                    attr.checked = 'checked';
                else if ( ! this.multiple && saved_value == value.value )
                    attr.checked = 'checked';*/
                if ( attr.checked )
                    classes += ' upfront-field-multiple-selected';
                return '<span class="' + classes + '"><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '"><span class="upfront-field-label-text">' + value.label + '</span></label></span>' +
                    '<input type="hidden" class="menu-item-db-id" name="menu-item[-' + id + '][menu-item-db-id]" value="0">' +
                    '<input type="hidden" class="menu-item-object" name="menu-item[-' + id + '][menu-item-object]" value="' + value.type + '">' +
                    '<input type="hidden" class="menu-item-parent-id" name="menu-item[-' + id + '][menu-item-parent-id]" value="0">' +
                    '<input type="hidden" class="menu-item-type" name="menu-item[-' + id + '][menu-item-type]" value="' + value.item_type + '">' +
                    '<input type="hidden" class="menu-item-title" name="menu-item[-' + id + '][menu-item-title]" value="' + value.label + '">' +
                    '<input type="hidden" class="menu-item-url" name="menu-item[-' + id + '][menu-item-url]" value="' + value.url + '">' +
                    '<input type="hidden" class="menu-item-target" name="menu-item[-' + id + '][menu-item-target]" value="">' +
                    '<input type="hidden" class="menu-item-attr_title" name="menu-item[-' + id + '][menu-item-attr_title]" value="">' +
                    '<input type="hidden" class="menu-item-classes" name="menu-item[-' + id + '][menu-item-classes]" value="">' +
                    '<input type="hidden" class="menu-item-xfn" name="menu-item[-' + id + '][menu-item-xfn]" value="">';
            },
            isProperty: false
        });

        var NavigationElement = Upfront.Views.Editor.Sidebar.Element.extend({
            priority: 50,
            render: function () {
                this.$el.addClass('upfront-icon-element upfront-icon-element-nav');
                this.$el.html('Navigation');
            },
            add_element: function () {
                var object = new NavigationModel({
                        "name": "",
                        "properties": [
                            {"name": "element_id", "value": Upfront.Util.get_unique_id("nav")}
                            //{"name": "class", "value": "c22"}
                        ]
                    }),
                    module = new Upfront.Models.Module({
                        "name": "",
                        "properties": [
                            {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                            {"name": "class", "value": "c6 upfront-navigation_module"},
                            {"name": "has_settings", "value": 0}
                        ],
                        "objects": [
                            object
                        ]
                    })
                    ;
                this.add_module(module);
            }
        });

        var Extended_Panel = Upfront.Views.Editor.Settings.Panel.extend({
            /**
             * on save create selected pages
             */
            initialize: function(options){
                var me = this;
                Extended_Panel.__super__.initialize.apply(this, arguments);
                Upfront.Events.on("entity:settings:panel:open",this.openPanel, this );
            },
            openPanel: function(){
                this.on_toggle();
                this.actCustomLink();
                this.settings._wrapped[2].reveal();
            },
            on_save: function(){
                Upfront.Events.trigger("navigation:create:pages");
                this.addCustomLink(this.settings._wrapped[2].settings._wrapped[0].get_values())
            },
            reset_fields: function(data){
                this.settings._wrapped[2].settings._wrapped[0].reset_fields(data);
            },
            addCustomLink: function(data){
                var itemId = data.length ? parseInt(data[2], 10) : 0;
                if ( '' == data[0] || 'http://' == data[0] || '' == data[1] )
                    return false;
                var addNewPage = currentMenuItemData.get('add_new_page');
                if ( addNewPage[0] !== 'yes')
                    return false;

                if(!itemId){
                    this.addItemToMenu({
                        '-1': {
                            'menu-item-type': 'custom',
                            'menu-item-url': data[0],
                            'menu-item-title': data[1]
                        }
                    });
                }else{
                    this.addItemToMenu({
                        'menu-item-db-id': itemId,
                        'menu-item-type': 'custom',
                        'menu-item-url': data[0],
                        'menu-item-title': data[1]
                    });
                }
            },
            addItemToMenu : function(menuItems){

                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this,
                    menuItemId = (menuItems["menu-item-db-id"] ? menuItems["menu-item-db-id"] : 0);
                if ( !menu_id )
                    return "Please select menu on settings";

                if(!menuItemId){
                    Upfront.Util.post({"action": "upfront_add_menu_item",'menu': menu_id, 'menu-item': menuItems})
                        .success(function (ret) {
                            me.update_post_status(ret);
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
                            //Reset custom link fields
                            me.reset_fields();
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error updating menu item");
                        });
                }

            },
            update_post_status: function(data){
                var me = this;
                if ( !data )
                    return false;
                Upfront.Util.post({"action": "upfront_update_post_status",'postIds': data})
                    .success(function (ret) {
                        Upfront.Events.trigger("entity:object:render_navigation");
                        Upfront.Events.trigger("navigation:get:this:menu:items");
                        Upfront.Events.trigger("navigation:render_menu_order");
                        //Reset custom link fields
                        me.reset_fields();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error updating status");
                    });

            },
            actCustomLink: function(){
                var id = currentMenuItemData.get('id'),
                    url = currentMenuItemData.get('url'),
                    label = currentMenuItemData.get('name');
                this.reset_fields([url, label, id])
            }

        });

        var Extended_Menu_Order_Panel = Upfront.Views.Editor.Settings.Panel.extend({
            /**
             * Initialize the view, and populate the internal
             * setting items array with Item instances.
             */
            initialize: function () {
                Extended_Menu_Order_Panel.__super__.initialize.apply(this, arguments);
                Upfront.Events.on("entity:settings:init:sort",this.showPanel, this );
                Upfront.Events.on("entity:settings:init:sort:after",this.hidePanel, this );
            },
            showPanel: function(){
                if(!this.is_active()){
                    this.$el.find(".upfront-settings_panel").show();
                }
            },
            hidePanel: function(){
                if(!this.is_active_tab()){
                    this.$el.find(".upfront-settings_panel").hide();
                }
            },
            is_active_tab: function () {
                return this.$el.find(".upfront-settings_label").hasClass('active');
            },
            /**
             * on save create selected pages
             */
            on_save: function(){
                Upfront.Events.trigger("navigation:save:re:ordered:menu");
            }
        });

        var Get_Items = Upfront.Views.Editor.Field.Field.extend({
            initialize: function(){
                Get_Items.__super__.initialize.apply(this, arguments);
                Upfront.Events.on("navigation:create:pages",this.createPages, this );
            },
            events: {
                'click li > div':'listToggle'
            },
            render: function() {
                this.$el.html(this.getAllItems());
            },
            getAllItems: function () {
                var me = this;
                Upfront.Util.post({"action": me.options.action})
                    .success(function (ret) {
                        me.$el.empty().append(new MenuView({collection: new MenuitemsCollection(ret.data)}).render().el);
                        me.$el.find('ul li:has(ul)').find('> div').removeClass('blank').addClass('plus');
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading Items");
                    });
                return 'Loading...';
            },
            listToggle: function(e){
                if($(e.target).hasClass('plus')){
                    $(e.target).removeClass('plus').addClass('minus');
                    $(e.target).parent('li').find('ul').show();
                }
                else
                {
                    $(e.target).removeClass('minus').addClass('plus');
                    $(e.target).parent('li').find('ul').hide();
                }
            },
            val: function(name, value) {
                if(typeof value != "undefined")
                    return this.model.set_property(name, value);
                return this.model.get_property_value_by_name(name);
            },
            createPages: function () {
                this.addSelectedToMenu(this.$el.find('ul'));
            },
            addSelectedToMenu : function(listBox) {
                var t = listBox, menuItems = {},
                    me = this,
                    checkboxes = t.find('input:checked'),
                    re = new RegExp('menu-item\\[(\[^\\]\]*)');

                // If no items are checked, bail.
                if ( !checkboxes.length)
                    return false;
                // Retrieve menu item data
                $(checkboxes).each(function(){
                    var t = $(this),
                        listItemDBIDMatch = re.exec( t.attr('name') ),
                        listItemDBID = 'undefined' == typeof listItemDBIDMatch[1] ? 0 : parseInt(listItemDBIDMatch[1], 10);
                    menuItems[listItemDBID] = me.getItemData( 'add-menu-item', listItemDBID, t.closest('li') );
                });
                me.addItemToMenu(menuItems);
                return menuItems;
            },
            getItemData : function( itemType, id, currentItem ) {
                itemType = itemType || 'menu-item';

                var itemData = {}, i, item,
                    fields = [
                        'menu-item-db-id',
                        'menu-item-object-id',
                        'menu-item-object',
                        'menu-item-parent-id',
                        'menu-item-position',
                        'menu-item-type',
                        'menu-item-title',
                        'menu-item-url',
                        'menu-item-description',
                        'menu-item-attr-title',
                        'menu-item-target',
                        'menu-item-classes',
                        'menu-item-xfn'
                    ];
                item = currentItem;

                if( !id && itemType == 'menu-item' ) {
                    id = item.find('.menu-item-data-db-id').val();
                }

                if( !id ) return itemData;

                item.find('input').each(function() {
                    var field;
                    i = fields.length;
                    while ( i-- ) {
                        if( itemType == 'menu-item' )
                            field = fields[i] + '[' + id + ']';
                        else if( itemType == 'add-menu-item' )
                            field = 'menu-item[' + id + '][' + fields[i] + ']';

                        if (
                            this.name &&
                                field == this.name
                            ) {
                            itemData[fields[i]] = this.value;
                        }
                    }
                });

                return itemData;
            },
            addItemToMenu : function(menuItems){
                var menu_id = this.val('menu_id'),
                    me = this,
                    menuItemId = (menuItems["menu-item-db-id"] ? menuItems["menu-item-db-id"] : 0);
                if ( !menu_id )
                    return "Please select menu on settings";
                if(!menuItemId){
                    Upfront.Util.post({"action": "upfront_add_menu_item",'menu': menu_id, 'menu-item': menuItems})
                        .success(function (ret) {
                            me.update_post_status(ret);
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error adding menu item");
                        });
                }else{
                    Upfront.Util.post({"action": "upfront_update_menu_item",'menu': menu_id, 'menu-item-id': menuItemId, 'menu-item': menuItems})
                        .success(function (ret) {
                            me.getThisMenuItems();
                            Upfront.Events.trigger("entity:object:render_navigation");
                            Upfront.Events.trigger("navigation:render_menu_order");
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error updating menu item");
                        });
                }
            },
            update_post_status: function(data){
                var me = this;
                if ( !data )
                    return false;
                Upfront.Util.post({"action": "upfront_update_post_status",'postIds': data})
                    .success(function (ret) {
                        Upfront.Events.trigger("navigation:get:this:menu:items");
                        Upfront.Events.trigger("navigation:render_get_all_items");
                        Upfront.Events.trigger("entity:object:render_navigation");
                        Upfront.Events.trigger("navigation:render_menu_order");
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error updating status");
                    });
            },
            isProperty: false
        });

        var This_Menu_Items = Upfront.Views.Editor.Field.Field.extend({
            events: {
                'click span':'deleteMenuItem'
            },
            initialize: function(){
                This_Menu_Items.__super__.initialize.apply(this, arguments);
                Upfront.Events.on("navigation:get:this:menu:items", this.getThisMenuItems, this );
            },
            render: function() {
                this.$el.html(this.getThisMenuItems());
            },
            getThisMenuItems: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";

                Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                    .success(function (ret) {
                        me.$el.empty();
                        // Deselect the items
                        me.$el.find('.upfront_menu_pages_box ul li :checked, .upfront_menu_categories_box ul li :checked').removeAttr('checked');
                        _.each(ret.data, function(item){
                            me.$el
                                .append('<span id="'+item.ID+'">'+item.title+'</span>');
                        });
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading...';
            },
            deleteMenuItem: function(e){
                var me = this;
                me.$el.find('.upfront_menu_pages_box .spinner, .upfront_menu_categories_box .spinner, .upfront_menu_customlink_box .spinner').show();
                Upfront.Util.post({"action": "upfront_delete_menu_item", "menu_item_id": e.target.id})
                    .success(function (ret) {
                        Upfront.Events.trigger("navigation:get:this:menu:items");
                        Upfront.Events.trigger("entity:object:render_navigation");
                        Upfront.Events.trigger("navigation:render_menu_order");
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error Deleting Menu Item");
                    });
            },
            isProperty: false
        });

        var Text_Field = Upfront.Views.Editor.Field.Text.extend({
            isProperty: false
        });

        var Menu_Order = Upfront.Views.Editor.Field.Field.extend({
            tagName: 'ul',
            className: 'upfront-field-wrap menu',
            id: 'menu-to-edit',
            options : {
                menuItemDepthPerLevel : 20, // Do not use directly. Use depthToPx and pxToDepth instead.
                globalMaxDepth : 4
            },
            menuList : undefined,	// Set in init.
            targetList : undefined, // Set in init.
            menusChanged : false,
            isRTL: !! ( 'undefined' != typeof isRtl && isRtl ),
            negateIfRTL: ( 'undefined' != typeof isRtl && isRtl ) ? -1 : 1,
            MenuOrderListTemplate: _.template(_Upfront_Templates["navigation_menuorder_list"]),
            initialize: function(){
                Menu_Order.__super__.initialize.apply(this, arguments);
                this.jQueryExtensions();
                Upfront.Events.on("navigation:save:re:ordered:menu", this.saveAllChanges, this );
                Upfront.Events.on("navigation:render_menu_order", this.MenuOrder, this );
            },
            render: function() {
                this.$el.html(this.MenuOrder());
            },
            registerChange : function() {
                this.menusChanged = true;
            },
            jQueryExtensions : function() {
                var me = this;
                // jQuery extensions
                $.fn.extend({
                    menuItemDepth : function() {
                        var margin = me.isRTL ? this.eq(0).css('margin-right') : this.eq(0).css('margin-left');
                        return me.pxToDepth( margin && -1 != margin.indexOf('px') ? margin.slice(0, -2) : 0 );
                    },
                    updateDepthClass : function(current, prev) {
                        return this.each(function(){
                            var t = $(this);
                            prev = prev || t.menuItemDepth();
                            $(this).removeClass('menu-item-depth-'+ prev )
                                .addClass('menu-item-depth-'+ current );
                        });
                    },
                    shiftDepthClass : function(change) {
                        return this.each(function(){
                            var t = $(this),
                                depth = t.menuItemDepth();
                            $(this).removeClass('menu-item-depth-'+ depth )
                                .addClass('menu-item-depth-'+ (depth + change) );
                        });
                    },
                    childMenuItems : function() {
                        var result = $();
                        this.each(function(){
                            var t = $(this), depth = t.menuItemDepth(), next = t.next();
                            while( next.length && next.menuItemDepth() > depth ) {
                                result = result.add( next );
                                next = next.next();
                            }
                        });
                        return result;
                    },
                    updateParentMenuItemDBId : function() {
                        return this.each(function(){
                            var item = $(this),
                                input = item.find('.menu-item-data-parent-id'),
                                depth = item.menuItemDepth(),
                                parent = item.prev();

                            if( depth == 0 ) { // Item is on the top level, has no parent
                                input.val(0);
                            } else { // Find the parent item, and retrieve its object id.
                                while( ! parent[0] || ! parent[0].className || -1 == parent[0].className.indexOf('menu-item') || ( parent.menuItemDepth() != depth - 1 ) )
                                    parent = parent.prev();
                                input.val( parent.find('.menu-item-data-db-id').val() );
                            }
                        });
                    }

                });
            },
            initSortables : function() {
                var currentDepth = 0, originalDepth, minDepth, maxDepth,
                    prev, next, prevBottom, nextThreshold, helperHeight, transport,
                    menuEdge = this.menuList.offset().left,
                    body = $('body'), maxChildDepth,
                    me = this,
                    menuMaxDepth = initialMenuMaxDepth();

                // Use the right edge if RTL.
                menuEdge += this.isRTL ? this.menuList.width() : 0;

                this.menuList.sortable({
                    handle: '.menu-item-handle',
                    placeholder: 'sortable-placeholder',
                    start: function(e, ui) {
                        var height, width, parent, children, tempHolder;

                        // handle placement for rtl orientation
                        if ( me.isRTL )
                            ui.item[0].style.right = 'auto';

                        transport = ui.item.children('.menu-item-transport');

                        // Set depths. currentDepth must be set before children are located.
                        originalDepth = ui.item.menuItemDepth();
                        updateCurrentDepth(ui, originalDepth);

                        // Attach child elements to parent
                        // Skip the placeholder
                        parent = ( ui.item.next()[0] == ui.placeholder[0] ) ? ui.item.next() : ui.item;
                        children = parent.childMenuItems();
                        transport.append( children );

                        // Update the height of the placeholder to match the moving item.
                        height = transport.outerHeight();
                        // If there are children, account for distance between top of children and parent
                        height += ( height > 0 ) ? (ui.placeholder.css('margin-top').slice(0, -2) * 1) : 0;
                        height += ui.helper.outerHeight();
                        helperHeight = height;
                        height -= 2; // Subtract 2 for borders
                        ui.placeholder.height(height);

                        // Update the width of the placeholder to match the moving item.
                        maxChildDepth = originalDepth;
                        children.each(function(){
                            var depth = $(this).menuItemDepth();
                            maxChildDepth = (depth > maxChildDepth) ? depth : maxChildDepth;
                        });
                        width = ui.helper.find('.menu-item-handle').outerWidth(); // Get original width
                        width += me.depthToPx(maxChildDepth - originalDepth); // Account for children
                        width -= 2; // Subtract 2 for borders
                        ui.placeholder.width(width);

                        // Update the list of menu items.
                        tempHolder = ui.placeholder.next();
                        tempHolder.css( 'margin-top', helperHeight + 'px' ); // Set the margin to absorb the placeholder
                        ui.placeholder.detach(); // detach or jQuery UI will think the placeholder is a menu item
                        $(this).sortable( "refresh" ); // The children aren't sortable. We should let jQ UI know.
                        ui.item.after( ui.placeholder ); // reattach the placeholder.
                        tempHolder.css('margin-top', 0); // reset the margin

                        // Now that the element is complete, we can update...
                        updateSharedVars(ui);
                    },
                    stop: function(e, ui) {
                        var children, depthChange = currentDepth - originalDepth;

                        // Return child elements to the list
                        children = transport.children().insertAfter(ui.item);

                        // Update depth classes
                        if( depthChange != 0 ) {
                            ui.item.updateDepthClass( currentDepth );
                            children.shiftDepthClass( depthChange );
                            updateMenuMaxDepth( depthChange );
                        }
                        // Register a change
                        me.registerChange();
                        // Update the item data.
                        ui.item.updateParentMenuItemDBId();

                        // address sortable's incorrectly-calculated top in opera
                        ui.item[0].style.top = 0;

                        // handle drop placement for rtl orientation
                        if ( me.isRTL ) {
                            ui.item[0].style.left = 'auto';
                            ui.item[0].style.right = 0;
                        }

                    },
                    change: function(e, ui) {
                        // Make sure the placeholder is inside the menu.
                        // Otherwise fix it, or we're in trouble.
                        if( ! ui.placeholder.parent().hasClass('menu') )
                            (prev.length) ? prev.after( ui.placeholder ) : me.menuList.prepend( ui.placeholder );

                        updateSharedVars(ui);
                    },
                    sort: function(e, ui) {
                        var offset = ui.helper.offset(),
                            edge = me.isRTL ? offset.left + ui.helper.width() : offset.left,
                            depth = me.negateIfRTL * me.pxToDepth( edge - menuEdge );
                        // Check and correct if depth is not within range.
                        // Also, if the dragged element is dragged upwards over
                        // an item, shift the placeholder to a child position.
                        if ( depth > maxDepth || offset.top < prevBottom ) depth = maxDepth;
                        else if ( depth < minDepth ) depth = minDepth;

                        if( depth != currentDepth )
                            updateCurrentDepth(ui, depth);

                        // If we overlap the next element, manually shift downwards
                        if( nextThreshold && offset.top + helperHeight > nextThreshold ) {
                            next.after( ui.placeholder );
                            updateSharedVars( ui );
                            $(this).sortable( "refreshPositions" );
                        }
                    }
                });

                function updateSharedVars(ui) {
                    var depth;

                    prev = ui.placeholder.prev();
                    next = ui.placeholder.next();

                    // Make sure we don't select the moving item.
                    if( prev[0] == ui.item[0] ) prev = prev.prev();
                    if( next[0] == ui.item[0] ) next = next.next();

                    prevBottom = (prev.length) ? prev.offset().top + prev.height() : 0;
                    nextThreshold = (next.length) ? next.offset().top + next.height() / 3 : 0;
                    minDepth = (next.length) ? next.menuItemDepth() : 0;

                    if( prev.length )
                        maxDepth = ( (depth = prev.menuItemDepth() + 1) > me.options.globalMaxDepth ) ? me.options.globalMaxDepth : depth;
                    else
                        maxDepth = 0;
                }

                function updateCurrentDepth(ui, depth) {
                    ui.placeholder.updateDepthClass( depth, currentDepth );
                    currentDepth = depth;
                }

                function initialMenuMaxDepth() {
                    if( ! body[0].className ) return 0;
                    var match = body[0].className.match(/menu-max-depth-(\d+)/);
                    return match && match[1] ? parseInt(match[1]) : 0;
                }

                function updateMenuMaxDepth( depthChange ) {
                    var depth, newDepth = menuMaxDepth;
                    if ( depthChange === 0 ) {
                        return;
                    } else if ( depthChange > 0 ) {
                        depth = maxChildDepth + depthChange;
                        if( depth > menuMaxDepth )
                            newDepth = depth;
                    } else if ( depthChange < 0 && maxChildDepth == menuMaxDepth ) {
                        while( ! $('.menu-item-depth-' + newDepth, me.menuList).length && newDepth > 0 )
                            newDepth--;
                    }
                    // Update the depth class.
                    body.removeClass( 'menu-max-depth-' + menuMaxDepth ).addClass( 'menu-max-depth-' + newDepth );
                    menuMaxDepth = newDepth;
                }
            },
            depthToPx : function(depth) {
                return depth * this.options.menuItemDepthPerLevel;
            },
            pxToDepth : function(px) {
                return Math.floor(px / this.options.menuItemDepthPerLevel);
            },
            getItemData : function( itemType, id, currentItem ) {
                itemType = itemType || 'menu-item';

                var itemData = {}, i, item,
                    fields = [
                        'menu-item-db-id',
                        'menu-item-parent-id'
                    ];
                item = currentItem;

                if( !id && itemType == 'menu-item' ) {
                    id = item.find('.menu-item-data-db-id').val();
                }

                if( !id ) return itemData;

                item.find('input').each(function() {
                    var field;
                    i = fields.length;
                    while ( i-- ) {
                        if( itemType == 'menu-item' )
                            field = fields[i] + '[' + id + ']';

                        if (
                            this.name &&
                                field == this.name
                            ) {
                            itemData[fields[i]] = this.value;
                        }
                    }
                });

                return itemData;
            },
            addSelectedToMenu : function(listBox) {
                var t = listBox, menuItems = {},
                    me = this,
                    Li = t.find('li');
                // If no items are checked, bail.
                if ( !Li.length )
                    return false;
                // Retrieve menu item data
                $(Li).each(function(index){
                    var t = $(this),
                        listItemDBID = t.find('.menu-item-data-db-id').val();
                    menuItems[index] = me.getItemData( 'menu-item', listItemDBID, t );
                });
                return menuItems;
            },
            update_menu_order: function () {
                var menuItems,
                    me = this;
                menuItems = this.addSelectedToMenu(this.$el);
                if ( !menuItems )
                    return false;
                Upfront.Util.post({"action": "upfront_update_menu_order", "menu_items": menuItems})
                    .success(function (ret) {
                        Upfront.Events.trigger("entity:object:render_navigation");
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error updating menu");
                    });
                return 'Loading';
            },
            iniSort: true,
            MenuOrder: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    depths = [],
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";

                Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                    .success(function (ret) {
                        var $ul = me.$el;
                        $ul.empty();
                        _.each(ret.data, function(item){
                            depths[item.ID] = (depths[item.menu_item_parent] || 0) + 1;
                            $ul.append(me.MenuOrderListTemplate({item: item, depth: depths[item.ID]-1 }));
                        });
                    })
                    .done(function(){
                        me.menuList = me.$el;
                        me.targetList = me.menuList;

                        if( me.menuList.length && me.iniSort ) {// If no menu, we're in the + tab.
                            Upfront.Events.trigger("entity:settings:init:sort");
                            me.initSortables();
                            Upfront.Events.trigger("entity:settings:init:sort:after");
                            me.iniSort = false;
                        }
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loding...';
            },
            saveAllChanges: function () {
                this.update_menu_order();
            },
            isProperty: false
        });

        // --- Tie the settings together ---

        /**
         * Navigation settings hub, populated with the panels we'll be showing.
         * @type {Upfront.Views.Editor.Settings.Settings}
         */
        var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
            /**
             * Bootstrap the object - populate the internal
             * panels array with the panel instances we'll be showing.
             */
            initialize: function () {
                this.panels = _([
                    // Menu
                    new Upfront.Views.Editor.Settings.Panel({
                        model: this.model,
                        label: "Menu",
                        title: "Menu settings",
                        settings: [
                            new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Select Menu",
                                fields: [
                                    new Upfront.Views.Editor.Field.Select({
                                        model: this.model,
                                        property: 'menu_id',
                                        label: "",
                                        values: currentMenuItemData.get('menuList')
                                    })
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.Item({
                                model: this.model,
                                title: "Create Menu",
                                fields: [
                                    new Upfront.Views.Editor.Field.Text({
                                        model: this.model,
                                        property: 'field_text2',
                                        label: "Example text input",
                                        compact: true
                                    }),
                                ]
                            }),
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
                                            { label: "Horizontal", value: 'horizontal' },
                                            { label: "Vertical", value: 'vertical' }
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
                                            { label: "Left", value: 'left' },
                                            { label: "Center", value: 'center' },
                                            { label: "Right", value: 'right' }
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
                                        default_value: ['yes'],
                                        label: "",
                                        values: [
                                            { label: "Add new Pages to this menu", value: 'yes' }
                                        ]
                                    })
                                ]
                            }),
                        ]
                    }),
                    // Contents
                    new Extended_Panel({
                        model: this.model,
                        label: "Contents",
                        title: "Contents settings",
                        tabbed: true,
                        settings: [
                            new Upfront.Views.Editor.Settings.ItemTabbed({
                                model: this.model,
                                title: "Pages",
                                settings: [
                                    new Upfront.Views.Editor.Settings.Item({
                                        className: 'upfront-nav-get-menu-items',
                                        model: this.model,
                                        title: "All Pages",
                                        fields: [
                                            new Get_Items({
                                                model: this.model,
                                                action: 'upfront_load_all_pages'
                                            })
                                        ]
                                    }),
                                    new Upfront.Views.Editor.Settings.Item({
                                        className: 'upfront-nav-this-menu-items',
                                        model: this.model,
                                        title: "This Menu Items",
                                        fields: [
                                            new This_Menu_Items({
                                                model: this.model
                                            })
                                        ]
                                    }),
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.ItemTabbed({
                                model: this.model,
                                title: "Categories",
                                settings: [
                                    new Upfront.Views.Editor.Settings.Item({
                                        className: 'upfront-nav-get-menu-items',
                                        model: this.model,
                                        title: "All Categories",
                                        fields: [
                                            new Get_Items({
                                                model: this.model,
                                                action: 'upfront_load_all_categories'
                                            })
                                        ]
                                    }),
                                    new Upfront.Views.Editor.Settings.Item({
                                        className: 'upfront-nav-this-menu-items',
                                        model: this.model,
                                        title: "This Menu Items",
                                        fields: [
                                            new This_Menu_Items({
                                                model: this.model
                                            })
                                        ]
                                    })
                                ]
                            }),
                            new Upfront.Views.Editor.Settings.ItemTabbed({
                                model: this.model,
                                title: "Custom Links",
                                settings: [
                                    new Add_Custom_Link_Item({
                                        model: this.model,
                                        title: "Add Custom Link",
                                        fields: [
                                            new Text_Field({
                                                model: this.model,
                                                label: "http://",
                                                compact: true
                                            }),
                                            new Text_Field({
                                                model: this.model,
                                                label: "Label",
                                                compact: true
                                            })
                                        ]
                                    }),
                                    new Upfront.Views.Editor.Settings.Item({
                                        className: 'upfront-nav-this-menu-items',
                                        model: this.model,
                                        title: "This Menu Items",
                                        fields: [
                                            new This_Menu_Items({
                                                model: this.model
                                            })
                                        ]
                                    })

                                ]
                            }),
                        ]
                    }),
                    // Menu Order
                    new Extended_Menu_Order_Panel({
                        model: this.model,
                        label: "Menu Order",
                        title: "Menu Order settings",
                        settings: [
                            new Upfront.Views.Editor.Settings.Item({
                                className: 'upfront-nav-menu-order',
                                model: this.model,
                                title: "Order of your menu items",
                                fields: [
                                    new Menu_Order({
                                        model: this.model
                                    })
                                ]
                            })
                        ]
                    }),
                    new NavigationMenuSettingsPanel({model: this.model})
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

        // ----- Settings API -----
        // We'll be working from the bottom up here.
        // We will first define settings panels, and items for each panel.
        // Then we'll slot in the panels in a settings instance.

        // --- Menu settings ---

        /**
         * Menu settings panel.
         * @type {Upfront.Views.Editor.Settings.Panel}
         */
        var NavigationMenuSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
            /**
             * Initialize the view, and populate the internal
             * setting items array with Item instances.
             */
            initialize: function () {
                this.settings = _([
                    new NavigationMenuSetting_Menu({model: this.model})
                ]);
            },
            /**
             * Get the label (what will be shown in the settings overview)
             * @return {string} Label.
             */
            get_label: function () {
                return "Menu";
            },
            /**
             * Get the title (goes into settings title area)
             * @return {string} Title
             */
            get_title: function () {
                return "Menu";
            }
        });

        // ----- Settings API -----
        // We'll be working from the bottom up here.
        // We will first define settings panels, and items for each panel.
        // Then we'll slot in the panels in a settings instance.

        // --- Menu Order settings ---

        /**
         * Menu Order settings panel.
         * @type {Upfront.Views.Editor.Settings.Panel}
         */

        var NavigationMenuSetting_Menu = Upfront.Views.Editor.Settings.Item.extend({
            className: 'upfront-navigation-settings-menu',
            events: {
              'click .add_new_menu': 'addNewMenu',
              'click .upfront_selected_pages_box span': 'deleteMenu'
            },
            render: function () {
               var me = this,
                    options
                    ;
                // Wrap method accepts an object, with defined "title" and "markup" properties.
                // The "markup" one holds the actual Item markup.
                me.wrap({
                    "title": "Select Menu",
                    "markup": '<select id="select_menu_id" name="select_menu_id"><option>Loading ...</option></select>'
                });

                me.wrap({
                    "title": "Create Menu",
                    "markup": '<input class="menu_name_input" type="text" /><button class="add_new_menu">Add New Menu</button>'
                });

                me.wrap({
                    "title": "All Menus",
                    "markup": '<div class="upfront_selected_pages_box"></div>'
                });

                this.getMenus();

            },
            getMenus: function(){
                var me = this,
                    value = this.model.get_property_value_by_name("menu_id");
                // Ajax call for Menu list
                Upfront.Util.post({"action": "upfront_load_menu_list"})
                    .success(function (ret) {
                        options = _.map(ret.data, function (each) {
                            return '<option value="' + each.term_id + '" ' + ( value && value == each.term_id ? 'selected' : '' ) + '>' + each.name + '</option>';
                        });
                        // find and append data
                        me.$el.find('#select_menu_id').empty().append(options);
                        // display all menus
                        spans = _.map(ret.data, function (each) {
                            return '<span id="' + each.term_id + '" >' + each.name + '</span>';
                        });
                        me.$el.find('.upfront_selected_pages_box').empty().append(spans);
                        me.panel.trigger("upfront:settings:panel:refresh", me.panel);

                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu list");
                    });
            },
            // add new menus on navigation
            addNewMenu: function(){
                var $input = this.$el.find('.menu_name_input');
                ($input.val() ? this.addNewMenuCall($input.val()) : $input.focus())
            },
            addNewMenuCall: function(MenuName){
                var me = this,
                    $input = this.$el.find('.menu_name_input').val('');
                $input.val('Loading ...')
                // Ajax call for creating menu
                var newMenu = Upfront.Util.post({"action": "upfront_create_menu", "menu_name": MenuName})
                    .success(function (ret) {
                        me.$el.find('.menu_name_input').val('');
                        me.getMenus();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error creating menu");
                    });
            },
            deleteMenu: function(e){
                var me = this;
                // Ajax call for deleting menu
                var newMenu = Upfront.Util.post({"action": "upfront_delete_menu", "menu_id": e.target.id})
                    .success(function (ret) {
                        me.getMenus();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error deleting menu");
                    });
            },
            get_name: function () {
                return "menu_id";
            },
            get_value: function () {
                var menu_id = this.$el.find('#select_menu_id').val();
                return menu_id;
            }

        });

        var MenuitemsCollection = Backbone.Collection.extend({
                //url : './api/menuitems',
                initialize: function(options){
                    this.bind('reset', this.relationships); //collection loads so calculate relationships
                },

                relationships: function(){
                    this.relations = _.groupBy(this.models, this.parent);
                },
                //return an array of root models
                root: function(){
                    if(!this.relations) this.relationships();
                    return this.relations[0];
                },
                //return an array of child models
                children: function(model){
                    if(!this.relations) this.relationships();
                    return (typeof this.relations[model.get('ID')] === 'undefined')? [] : this.relations[model.get('ID')];
                },
                //return parent_id or 0 if model.parent_id is undefined
                parent: function(model){
                    var parent_id = model.get('parent_id');
                    return (!parent_id)? 0: parent_id;
                }
        });

        var MenuView = Backbone.View.extend({

                initialize: function(options) {
                    if (!options.collection) throw 'no collection provided';
                    //listen on non-this events
                    _.bindAll(this, 'render');
                    this.collection.bind('reset', this.render); //collection loaded
                    Upfront.Events.on('navigation:render_get_all_items', this.render, this);
                },
                /***************************************
                 Render the view into the view's element
                 ****************************************/
                render: function (event){
                    //render list menu
                    this.$el.empty().append(this.renderMenu(this.collection.root()));
                    return this;
                },
                /**********************************************
                 Render list menu. Input is an array of models.
                 Output is DOM fragment.
                 **********************************************/
                renderMenu: function(list){
                    if(_.size(list) === 0) {return null;}
                    var $dom = $('<ul></ul>');
                    _.each(list, function(model){
                        $dom.append(this.renderMenuItem(model));
                        var kids = this.collection.children(model);
                        $dom.find('li:last').append(this.renderMenu(kids)); //recursive
                    }, this);
                    return $dom;
                },
                //	returns a DOM element fragment for a single menu item
                renderMenuItem: function (model){
                    var view = new MenuitemView({model: model});
                    return view.render().el;
                }
            });

        var MenuitemView = Backbone.View.extend({
                tagName: 'li',
                initialize: function(options) {
                    _.bindAll(this, 'render');
                    this.model.bind('change', this.render);
                },
                //render the view using a template
                render: function (event) {
                    var content = new Single_checkBox({
                        values: [
                            { id: this.model.get('ID'), label: this.model.get('name'), value: this.model.get('slug'), type: this.model.get('type'), item_type:  this.model.get('item_type'), url: this.model.get('url') }
                        ]
                    }).render().el;
                    $(this.el).html(content);
                    return this;
                }
        });

        Upfront.Application.LayoutEditor.add_object("Navigation", {
            "Model": NavigationModel,
            "View": NavigationView,
            "Element": NavigationElement,
            "Settings": NavigationSettings
        });
        Upfront.Models.NavigationModel = NavigationModel;
        Upfront.Views.NavigationView = NavigationView;

    });

})(jQuery);