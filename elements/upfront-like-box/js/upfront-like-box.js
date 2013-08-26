(function ($) {
    /**
     * Define the model - initialize properties to their default values.
     * @type {Upfront.Models.ObjectModel}
     */

    var LikeBoxModel = Upfront.Models.ObjectModel.extend({
        /**
         * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
         * Used for setting up instance defaults, initialization and the like.
         */
        init: function () {
            this.init_property("type", "LikeBox");
            this.init_property("view_class", "LikeBoxView");

            this.init_property("element_id", Upfront.Util.get_unique_id("Like-box-object"));
            this.init_property("class", "c22 upfront-like-box");
            this.init_property("has_settings", 1);
            this.init_property("element_size", {width: 278, height: 270});
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */
    var LikeBoxView = Upfront.Views.ObjectView.extend({

        model: LikeBoxModel,
        elementSize: {width: 0, height: 0},
        initialize: function(){
            var me = this;
            Upfront.Views.ObjectView.prototype.initialize.call(this);
            Upfront.data.social.panel.model.get("properties").on("change", this.setUrl, this);
            Upfront.data.social.panel.model.get("properties").on("add", this.setUrl, this);
            Upfront.Events.on('entity:resize_stop', this.onElementResize, this);
        },
        setUrl: function(){
            this.property('facebook_url' , Upfront.data.social.panel.model.get_property_value_by_name('facebook_page_url'))
        },
        onElementResize: function(view, model){
            if(this.parent_module_view == view)
                this.setElementSize();
        },
        setElementSize: function(){
            var me = this,
                parent = this.parent_module_view.$('.upfront-editable_entity:first')
                ;
            if(parent.length && parent.height()){
                this.elementSize.height = parent.height();
                setTimeout(function(){
                    me.elementSize.width = parent.find('.upfront-object-content').width();
                    if(me.elementSize.width != 0){
                        me.property('element_size', {
                            width: me.elementSize.width,
                            height: me.elementSize.height
                        });
                    }
                }, 1000);
            }
        },
        property: function(name, value) {
            if(typeof value != "undefined")
                return this.model.set_property(name, value);
            return this.model.get_property_value_by_name(name);
        },
        events: function(){
            return _.extend({},Upfront.Views.ObjectView.prototype.events,{
                'click a.back_global_settings' : 'backToGlobalSettings'
            });
        },
        backToGlobalSettings: function(e){
            e.preventDefault();
            Upfront.data.social.panel.popupFunc();
        },
        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        get_content_markup: function () {
            var me = this,
            fbUrl = Upfront.data.social.panel.model.get_property_value_by_name('facebook_page_url');
            if(fbUrl){
                var pageName = Upfront.data.social.panel.getLastPartOfUrl(fbUrl);
                return '<iframe src="//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F'+ (pageName ? pageName : 'wpmudev' )+'&amp;width='+this.model.get_property_value_by_name('element_size').width+'&amp;height='+this.model.get_property_value_by_name('element_size').height+'&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:'+this.model.get_property_value_by_name('element_size').width+'px; float:left; height:'+this.model.get_property_value_by_name('element_size').height+'px;" allowTransparency="true"></iframe>'+ (!pageName ? '<span class="alert-url">!</span>' : '' );
            }else{
                return 'Whoops! it looks like you need to update your <a class="back_global_settings" href="#">global settings</a>';
            }

        }

    });

    /**
     * Sidebar element class - this let you inject element into
     * sidebar elements panel and allow drag and drop element adding
     * @type {Upfront.Views.Editor.Sidebar.Element}
     */
    var LikeBoxElement = Upfront.Views.Editor.Sidebar.Element.extend({
        priority: 70,
        render: function () {
            this.$el.addClass('upfront-icon-element upfront-icon-element-likebox');
            this.$el.html('Like Box');
        },
        add_element: function () {
            var object = new LikeBoxModel(),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c7 upfront-like-box_module"},
                        {"name": "has_settings", "value": 0}
                    ],
                    "objects": [
                        object // The anonymous module will contain our search object model
                    ]
                });
            // We instantiated the module, add it to the workspace
            this.add_module(module);
        }
    });


    // ----- Settings API -----
    // We'll be working from the bottom up here.
    // We will first define settings panels, and items for each panel.
    // Then we'll slot in the panels in a settings instance.

    /**
     * Layout Style settings - Facebook Page URL item
     * @type {Upfront.Views.Editor.Settings.Item}
     */

    var Field_Text = Upfront.Views.Editor.Field.Text.extend({
        events:{
            'change .upfront-field-text': 'updateFacebookPageUrl'
        },
        updateFacebookPageUrl: function(){
            var url = this.$el.find('input').val(),
            currentData = Upfront.data.social.panel.model.get('properties').toJSON();
            Upfront.data.social.panel.model.set_property('facebook_page_url',url)
            var setData = Upfront.data.social.panel.model.get('properties').toJSON();

            if(!_.isEqual(currentData, setData)){
                Upfront.Util.post({"action": "upfront_save_social_media_global_settings", "data": JSON.stringify(setData)})
                    .error(function (ret) {
                        Upfront.Util.log("Error Saving settings");
                    });
            }
        }
    });

    var Field_Button = Upfront.Views.Editor.Field.Field.extend({
        events: {
            'click a': 'buttonClicked'
        },
        render: function() {
            this.$el.html(this.get_field_html());
        },
        get_field_html: function() {
            return '<i class="upfront-field-icon upfront-field-icon-social-back"></i><span class="upfront-back-global-settings-info">' + this.options.info + ' <a href="#">' + this.options.label + '</a></span>';
        },
        buttonClicked: function(e) {
            if(this.options.on_click)
                this.options.on_click(e);
        },
        isProperty: false
    });

// --- Tie the settings together ---

    /**
     * Social Media settings hub, populated with the panels we'll be showing.
     * @type {Upfront.Views.Editor.Settings.Settings}
     */
    var LikeBoxSettings = Upfront.Views.Editor.Settings.Settings.extend({
        /**
         * Bootstrap the object - populate the internal
         * panels array with the panel instances we'll be showing.
         */
        initialize: function () {
            this.panels = _([
                new Upfront.Views.Editor.Settings.Panel({
                    model: this.model,
                    label: "Layout Style",
                    title: "Layout Style settings",
                    settings: [
                        new Upfront.Views.Editor.Settings.Item({
                            className: 'upfront-social-services-item',
                            model: this.model,
                            title: "Your Facebook Page URL",
                            fields: [
                                new Field_Text({
                                    model: this.model,
                                    property: 'facebook_url',
                                    default_value: Upfront.data.social.panel.model.get_property_value_by_name('facebook_page_url'),
                                    label: "https://www.facebook.com/YourPage",
                                    compact: true
                                })
                            ]
                        }),
                        new Upfront.Views.Editor.Settings.Item({
                            className: 'upfront-social-back',
                            group: false,
                            fields: [
                                new Field_Button({
                                    model: this.model,
                                    info: 'Back to your',
                                    label: 'global settings',
                                    on_click: function(e){
                                        e.preventDefault();
                                        Upfront.data.social.panel.popupFunc();
                                    }
                                })
                            ]
                        })
                    ]
                })
            ]);
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "LikeBox settings";
        }
    });



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

    Upfront.Application.LayoutEditor.add_object("LikeBox", {
        "Model": LikeBoxModel,
        "View": LikeBoxView,
        "Element": LikeBoxElement,
        "Settings": LikeBoxSettings
    });

    Upfront.Models.LikeBoxModel = LikeBoxModel;
    Upfront.Views.LikeBoxView = LikeBoxView;

})(jQuery);