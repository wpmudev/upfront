(function ($) {

    var _template_files = [
        "text!upfront/templates/navigation_contents.html",
        "text!upfront/templates/navigation_menuorder.html"
    ];

    define(_template_files, function () {
        // Auto-assign the template contents to internal variable
        var _template_args = arguments,
            _Upfront_Templates = {}
            ;
        _(_template_files).each(function (file, idx) {
            if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
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

                //var layout_setting = this.$el.find('input[name="menu-style"]:checked').val();
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

            //define this.el, the wrapper element
            //el: $('#menu'),  //used in cases where the view wrapper already exists in the DOM
            tagName: 'li',
            //id: '',
            //className: 'menuitem',

            // Cache the template function for a single item.
            template: _.template('<div class="blank"></div><input type="checkbox" id="{{ slug }}" class="regular-checkbox" value="{{ ID }}" /><label for="{{ slug }}"></label><span>{{ name }}</span>'),

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

        },

        navContentsTemplate: _.template(_Upfront_Templates["navigation_contents"]),

        getThisMenuItems: function () {
            var menu_id = this.model.get_property_value_by_name('menu_id'),
                me = this;
            if ( !menu_id )
                return "Please select menu on settings";
            Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                .success(function (ret) {
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
            'click .add_custom_link':'addCustomLink'
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
            this.$el.find('.upfront_customlink_area input[name="url"]').val();
            this.$el.find('.upfront_customlink_area input[name="label"]').val();
        },

        get_name: function () {
            return "contents_setting";
        }

    });


        var NavigationMenuSettingMenuOrder = Upfront.Views.Editor.Settings.Item.extend({

            navMenuOrderTemplate: _.template(_Upfront_Templates["navigation_menuorder"]),
            MenuOrderListTemplate: _.template('<li><dl><dt><span class="page_title">{{ title }}</span><span class="type">page</span></dt></dl></li>'),

            MenuOrder: function () {
                var menu_id = this.model.get_property_value_by_name('menu_id'),
                    me = this;
                if ( !menu_id )
                    return "Please select menu on settings";
                Upfront.Util.post({"action": "upfront_load_menu_items", "data": menu_id})
                    .success(function (ret) {
                        _.each(ret.data, function(item){
                            me.$el.find('#menu-to-edit')
                                .append(me.MenuOrderListTemplate(item));
                        });
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error loading menu");
                    });
                return 'Loading';
            },

            render: function () {

                this.$el.html(this.navMenuOrderTemplate());
                this.MenuOrder();

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