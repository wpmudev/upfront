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

        var NavigationView = Upfront.Views.ObjectView.extend({
            model:NavigationModel,
            get_content_markup: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";
                Upfront.Util.post({"action": "upfront_load_menu_html", "data": menu_id})
                    .success(function (ret) {
                        me.$el.find('.upfront-object-content').html(ret.data);
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading';
            },
            on_render: function () {

                var layout_settings = this.model.get_property_value_by_name("layout_setting"),
                    parsedSetting = $.parseJSON(layout_settings),
                    menuStyle, menuAliment, allowSubNav, addNewPage;

                if (parsedSetting == null) {
                        menuStyle = false,
                        menuAliment = false,
                        allowSubNav = false,
                        addNewPage = true;
                }
                else {
                        menuStyle = parsedSetting.style,
                        menuAliment = parsedSetting.aliment,
                        allowSubNav = parsedSetting.subNavigation,
                        addNewPage = parsedSetting.newPage;
                }

                $upfrontObjectContent = this.$el.find('.upfront-object-content');
                $upfrontObjectContent.attr('data-aliment',(menuAliment == false ? 'left' : menuAliment));
                $upfrontObjectContent.attr('data-style',(menuStyle == false ? 'horizontal' : menuStyle));
                $upfrontObjectContent.attr('data-allow-sub-nav',(allowSubNav == false ? false : allowSubNav));
            }
        });

        var NavigationElement = Upfront.Views.Editor.Sidebar.Element.extend({
            render: function () {
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
                            {"name": "class", "value": "c22"},
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

        var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
            initialize: function () {
                this.panels = _([
                    // layout tab
                    new NavigationMenuSettingsPanel({
                        model: this.model,
                        settings: [
                            new NavigationMenuSetting_Layout({model: this.model})
                        ],
                        label: "Layout",
                        title: "Layout"
                    }),
                    // Contents tab
                    new NavigationMenuSettingsPanel({
                        model: this.model,
                        settings: [
                            new NavigationMenuSettingContents({model: this.model})
                        ],
                        label: "Contents",
                        title: "Contents"
                    }),
                    // Menu order tab
                    new NavigationMenuSettingsPanel({
                        model: this.model,
                        settings: [
                            new NavigationMenuSettingMenuOrder({model: this.model})
                        ],
                        label: "Menu order",
                        title: "Menu order"
                    }),
                    // menu tab
                    new NavigationMenuSettingsPanel({
                        model: this.model,
                        settings: [
                            new NavigationMenuSetting_Menu({model: this.model})
                        ],
                        label: "Menu",
                        title: "Menu"
                    })
                ]);
            },
            get_title: function () {
                return "Navigation settings";
            }
        });


        var NavigationMenuSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
            initialize: function (options) {
                this.settings = _(options.settings);
                this.label = options.label;
                this.title = options.title;
            },
            get_label: function () {
                return this.label;
            },
            get_title: function () {
                return this.title;
            }
        });


        var NavigationMenuSetting_Menu = Upfront.Views.Editor.Settings.Item.extend({

            render: function () {
                var value = this.model.get_property_value_by_name("menu_id"),
                    me = this
                    ;
                // Wrap method accepts an object, with defined "title" and "markup" properties.
                // The "markup" one holds the actual Item markup.
                Upfront.Util.post({"action": "upfront_load_menu_list"})
                    .success(function (ret) {
                        options = _.map(ret.data, function (each) {
                            return '<option value="' + each.term_id + '" ' + (value && value==each.term_id ? 'selected' : '') + '>' + each.name + '</option>';
                        });
                        me.wrap({
                            "title": "Select Menu",
                            "markup": '<select id="select_menu_id" name="select_menu_id">' + options + '</select>'
                        });
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu list");
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

        var   NavigationMenuSetting_Layout = Upfront.Views.Editor.Settings.Item.extend({

            render: function () {

                var layout_settings = this.model.get_property_value_by_name("layout_setting"),
                    parsedSetting = $.parseJSON(layout_settings),
                    menuStyle, menuAliment, allowSubNav, addNewPage;

                if (parsedSetting == null) {
                    menuStyle = false,
                        menuAliment = false,
                        allowSubNav = false,
                        addNewPage = true;
                }
                else {
                    menuStyle = parsedSetting.style,
                        menuAliment = parsedSetting.aliment,
                        allowSubNav = parsedSetting.subNavigation,
                        addNewPage = parsedSetting.newPage;
                }

                this.wrap({
                    "title": "Menu Style:",
                    /* TODO : i should have used template */
                    "markup": '<div class="horizontal"><div class="horizontal_label"><div class="horizontal_style"><div class="horizontal_style_bar act_green"></div><div class="horizontal_style_bar act_green"></div><div class="horizontal_style_bar act_green"></div></div><label for="horizontal">horizontal</label></div><input type="radio" id="horizontal" value="horizontal" name="menu-style" class="regular-radio" ' + (menuStyle == 'horizontal' ? 'checked' : '') + ( menuStyle == false ? 'checked' : '') + ' ><label for="horizontal" /></label></div><div class="vertical"><div class="vertical_label"><div class="vertical_style"><div class="vertical_style_bar de_act_blue"></div><div class="vertical_style_bar de_act_blue"></div><div class="vertical_style_bar de_act_blue"></div></div><label for="vertical">Vertical</label></div><input type="radio" id="vertical" value="vertical" name="menu-style" class="regular-radio" ' + (menuStyle == 'vertical' ? 'checked' : '') + ' /><label for="vertical"></label></div>'
                });
                this.wrap({
                    "title": "Menu Alignment:",
                    /* TODO : i should have used template */
                    "markup": '<div class="alignment_left"><div class="alignment_left_label"><div class="alignment_left_style"><div class="alignment_left_style_bar act_green"></div><div class="alignment_left_style_bar act_green"></div><div class="alignment_left_style_bar act_green"></div></div><label for="alignment_left">Left</label></div><input type="radio" id="left" name="menu-alignment" class="regular-radio" value="left" ' + (menuAliment == 'left' ? 'checked' : '') + ( menuAliment == false ? 'checked' : '') + ' /><label for="left"></label></div><div class="alignment_center"><div class="alignment_center_label"><div class="alignment_center_style"><div class="alignment_center_style_bar de_act_blue"></div><div class="alignment_center_style_bar de_act_blue"></div><div class="alignment_center_style_bar de_act_blue"></div></div><label for="alignment_center">Center</label></div><input type="radio" id="center" name="menu-alignment" class="regular-radio" value="center" ' + (menuAliment == 'center' ? 'checked' : '') + ' /><label for="center"></label></div><div class="alignment_right"><div class="alignment_right_label"><div class="alignment_right_style"><div class="alignment_right_style_bar de_act_blue"></div><div class="alignment_right_style_bar de_act_blue"></div><div class="alignment_right_style_bar de_act_blue"></div></div><label for="alignment_right">Right</label></div><input type="radio" id="right" name="menu-alignment" class="regular-radio" value="right" ' + (menuAliment == 'right' ? 'checked' : '') + ' /><label for="right"></label></div>'
                });
                this.wrap({
                    "title": "Misc. Settings:",
                    "markup": '<div class="misc_option_box"><div class="misc_option"><input type="checkbox" id="allow_sub_nav" class="regular-checkbox" ' + ( allowSubNav == true ? 'checked' : '' ) + ' /><label for="allow_sub_nav"></label><label class="label">Allow subnavigation on hover</label></div><div class="misc_option"><input type="checkbox" id="add_new_page" class="regular-checkbox" ' + ( addNewPage == true ? 'checked' : '' ) + ' /><label for="add_new_page"></label><label class="label">Add new Pages to this menu</label></div></div>'
                });

            },
            get_name: function () {
                return "layout_setting";
            },
            get_value: function () {

                var layout_setting = JSON.stringify({
                    "style": this.$el.find('input[name="menu-style"]:checked').val(),
                    "aliment": this.$el.find('input[name="menu-alignment"]:checked').val(),
                    "subNavigation": this.$el.find('#allow_sub_nav').is(':checked'),
                    "newPage": this.$el.find('#add_new_page').is(':checked')
                })
                return layout_setting;
            },
            events: {
                'click input': 'EleClicked'
            },
            EleClicked: function (e) {
                // console.log(e.target.id);
            }

        });

        MenuitemsCollection = Backbone.Collection.extend({
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

        MenuView = Backbone.View.extend({

            initialize: function(options) {

                if (!options.collection) throw 'no collection provided';

                //listen on non-this events
                _.bindAll(this, 'render');
                this.collection.bind('reset', this.render); //collection loaded
            },
            /***************************************
             Render the view into the view's element
             ****************************************/
            render: function (event){

                //render list menu
                this.$el.append(this.renderMenu(this.collection.root()));
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

        MenuitemView = Backbone.View.extend({

            tagName: 'li',

            // Cache the template function for a single item.
            template: _.template(_Upfront_Templates["navigation_contents_item_values"]),

            initialize: function(options) {
                _.bindAll(this, 'render');
                this.model.bind('change', this.render);
            },
            //render the view using a template
            render: function (event) {
                var content = this.template(this.model.toJSON());
                $(this.el).html(content);
                return this;
            }
        });


        var NavigationMenuSettingContents = Upfront.Views.Editor.Settings.Item.extend({

            initialize: function(){
                this.model.get("properties").on("change", this.render, this);
            },

            navContentsTemplate: _.template(_Upfront_Templates["navigation_contents"]),

            addSelectedToMenu : function(listBox) {

                    var t = listBox, menuItems = {},
                        me = this,
                        checkboxes = t.find('ul li input:checked'),
                        re = new RegExp('menu-item\\[(\[^\\]\]*)');

                    // If no items are checked, bail.
                    if ( !checkboxes.length )
                        return false;

                    me.$el.find('.upfront_menu_pages_box .spinner, .upfront_menu_categories_box .spinner').show();

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

            update_post_status: function(data){

                var me = this;

                if ( !data )
                    return false;

                Upfront.Util.post({"action": "upfront_update_post_status",'postIds': data})
                    .success(function (ret) {
                        console.log(ret.data);
                        me.getThisMenuItems();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error updating status");
                    });

            },
            addItemToMenu : function(menuItems){

                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";

                    Upfront.Util.post({"action": "upfront_add_menu_item",'menu': menu_id, 'menu-item': menuItems})
                        .success(function (ret) {
                            console.log(ret.data);
                            me.update_post_status(ret);
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error loading menu");
                        });
                return 'Loading';

            },

            getThisMenuItems: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";

                Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                    .success(function (ret) {

                        me.$el.find('.upfront_selected_pages_box').empty();

                        // Deselect the items
                        me.$el.find('.upfront_menu_pages_box ul li :checked, .upfront_menu_categories_box ul li :checked').removeAttr('checked');
                        //Reset custom link fields
                        me.$el.find('.upfront_customlink_area input[name="label"]').val('').blur();
                        me.$el.find('.upfront_customlink_area input[name="url"]').val('');

                        //Remove the ajax spinner
                        me.$el.find('.upfront_customlink_area .spinner, .upfront_menu_pages_box .spinner, .upfront_menu_categories_box .spinner, .upfront_menu_customlink_box .spinner').hide();

                        _.each(ret.data, function(item){
                            me.$el.find('.upfront_selected_pages_box')
                                .append('<span id="'+item.ID+'">'+item.title+'</span>');
                        });
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading';
            },

            getAllPages: function () {
                var me = this;

                Upfront.Util.post({"action": "upfront_load_all_pages"})
                    .success(function (ret) {

                        var menuitemsCollection = new MenuitemsCollection(ret.data);
                        var menuView = new MenuView({collection: menuitemsCollection});

                        $pagesBox = me.$el.find('.upfront_page_scroll_box');
                        $pagesBox.append(menuView.render().el);
                        $pagesBox.find('ul li:has(ul)').find('> div').removeClass('blank').addClass('plus');
                        //console.log(me.renderMenu(ret.data));
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading Pages");
                    });
                return 'Loading';
            },

            getAllCategories: function () {
                var me = this;

                Upfront.Util.post({"action": "upfront_load_all_categories"})
                    .success(function (ret) {

                        var menuitemsCollection = new MenuitemsCollection(ret.data);
                        var menuView = new MenuView({collection: menuitemsCollection});

                        $categoriesBox = me.$el.find('.upfront_categories_scroll_box');
                        $categoriesBox.append(menuView.render().el);
                        $categoriesBox.find('ul li:has(ul)').find('> div').removeClass('blank').addClass('plus');
                        //console.log(me.renderMenu(ret.data));
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading Categories");
                    });
                return 'Loading';
            },

            render: function () {

                this.$el.html(this.navContentsTemplate());
                this.$el.find('.upfront_menu_categories_box').hide();
                this.$el.find('.upfront_menu_customlink_box').hide();
                this.getAllPages();
                this.getThisMenuItems();
                this.getAllCategories();
            },

            events:{
                'click .upfront_menu_contents_tabs a':'menuContentTab',
                'click .upfront_page_scroll_box li > div':'pagesListToggle',
                'click .upfront_categories_scroll_box li > div':'pagesListToggle',
                'click .add_custom_link':'addCustomLink',
                'click .upfront_selected_pages_box span':'deleteMenuItem'
            },

            menuContentTab: function(e){
                e.preventDefault();
                $(e.target).addClass('act_tabs');
                this.$el.find('.upfront_menu_contents_tabs a').not(e.target).removeClass('act_tabs');

                if($(e.target).hasClass('tab-pages')){
                    this.$el.find('.upfront_menu_categories_box, .upfront_menu_customlink_box').hide();
                    this.$el.find('.upfront_menu_pages_box').show();
                }

                if($(e.target).hasClass('tab-categories')){
                    this.$el.find('.upfront_menu_pages_box, .upfront_menu_customlink_box').hide();
                    this.$el.find('.upfront_menu_categories_box').show();
                }

                if($(e.target).hasClass('tab-customlinks')){
                    this.$el.find('.upfront_menu_pages_box, .upfront_menu_categories_box').hide();
                    this.$el.find('.upfront_menu_customlink_box').show();
                }
            },

            pagesListToggle: function(e){

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

            addCustomLink: function(){

                var url = this.$el.find('.upfront_customlink_area input[name="url"]').val(),
                    label = this.$el.find('.upfront_customlink_area input[name="label"]').val();

                if ( '' == url || 'http://' == url || '' == label )
                    return false;

                // Show the ajax spinner
                this.$el.find('.upfront_customlink_area .spinner').show();

                this.addItemToMenu({
                    '-1': {
                        'menu-item-type': 'custom',
                        'menu-item-url': url,
                        'menu-item-title': label
                    }
                });

            },

            deleteMenuItem: function(e){

                var me = this;
                me.$el.find('.upfront_menu_pages_box .spinner, .upfront_menu_categories_box .spinner, .upfront_menu_customlink_box .spinner').show();
                Upfront.Util.post({"action": "upfront_delete_menu_item", "menu_item_id": e.target.id})
                    .success(function (ret) {
                        me.getThisMenuItems()
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error Deleting Menu Item");
                    });
                return 'Loading';
            },

            get_name: function () {
                return "contents_setting";
            },

            get_value: function () {

                console.log(this.addSelectedToMenu(this.$el.find('.upfront_page_scroll_box, .upfront_categories_scroll_box')));
                var contents_setting = JSON.stringify({
                    "meniItems": ''
                });
                return contents_setting;
            }

        });


        var NavigationMenuSettingMenuOrder = Upfront.Views.Editor.Settings.Item.extend({

            navMenuOrderTemplate: _.template(_Upfront_Templates["navigation_menuorder"]),
            MenuOrderListTemplate: _.template(_Upfront_Templates["navigation_menuorder_list"]),

            options : {
                menuItemDepthPerLevel : 20, // Do not use directly. Use depthToPx and pxToDepth instead.
                globalMaxDepth : 4
            },

            menuList : undefined,	// Set in init.
            targetList : undefined, // Set in init.
            menusChanged : false,
            isRTL: !! ( 'undefined' != typeof isRtl && isRtl ),
            negateIfRTL: ( 'undefined' != typeof isRtl && isRtl ) ? -1 : 1,

            initialize: function(){
                this.model.get("properties").on("change", this.render, this);
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

            MenuOrder: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    depths = [],
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";
                Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                    .success(function (ret) {
                        _.each(ret.data, function(item){
                            depths[item.ID] = (depths[item.menu_item_parent] || 0) + 1;
                            me.$el.find('#menu-to-edit')
                                .append(me.MenuOrderListTemplate({item: item, depth: depths[item.ID]-1 }));

                        });


                        me.menuList = me.$el.find('#menu-to-edit');
                        me.targetList = me.menuList;
                        me.jQueryExtensions();

                        if( me.menuList.length ) // If no menu, we're in the + tab.
                            me.initSortables();

                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading';
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

                me.$el.find('.upfront_menu_order_box .spinner').show();

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
                menuItems = this.addSelectedToMenu(this.$el.find('#menu-to-edit'));

                if ( !menuItems )
                    return false;

                Upfront.Util.post({"action": "upfront_update_menu_order", "menu_items": menuItems})
                    .success(function (ret) {
                        me.$el.find('.upfront_menu_order_box .spinner').hide();
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error updating menu");
                    });
                return 'Loading';
            },

            render: function () {

                this.$el.html(this.navMenuOrderTemplate());
                this.MenuOrder();

            },

            get_name: function () {
                return "menu_order";
            },

            get_value: function () {
                this.update_menu_order();
                var menu_order = '';
                return menu_order;
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

        return {};
    });

})(jQuery);