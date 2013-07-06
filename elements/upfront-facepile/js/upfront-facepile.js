(function ($) {
    Upfront.data.social.loading.then(function(){
        console.log('run ...');
    });
    /**
     * Define the model - initialize properties to their default values.
     * @type {Upfront.Models.ObjectModel}
     */

    var FacepileModel = Upfront.Models.ObjectModel.extend({
        /**
         * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
         * Used for setting up instance defaults, initialization and the like.
         */
        init: function () {
            this.init_property("type", "Facepile");
            this.init_property("view_class", "FacepileView");

            this.init_property("element_id", Upfront.Util.get_unique_id("Facepile-Object"));
            this.init_property("class", "c22 upfront-Facepile");
            this.init_property("has_settings", 1);
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */
    var FacepileView = Upfront.Views.ObjectView.extend({

        model: FacepileModel,

        initialize: function(){
            var me = this;
            Upfront.Views.ObjectView.prototype.initialize.call(this);
                Upfront.data.social.panel.model.get("properties").on("change", this.render, this);
                Upfront.data.social.panel.model.get("properties").on("add", this.render, this);
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
            var me = this;

                var fbUrl = Upfront.data.social.panel.model.get_property_value_by_name('facebook_page_url');

                if(fbUrl){
                    var pageName = Upfront.data.social.panel.getLastPartOfUrl(fbUrl);
                    var isShowCounts = me.model.get_property_value_by_name("is_show_counts");

                    return '<iframe src="//www.facebook.com/plugins/facepile.php?href=https%3A%2F%2Fwww.facebook.com%2F'+ (pageName == '0' || pageName == ''  ? '' : pageName )+'&amp;app_id&amp;action&amp;max_rows=3&amp;size=medium&amp;show_count='+(isShowCounts ? 'true':'false')+'&amp;width=256&amp;colorscheme=light" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:256px;" allowTransparency="true"></iframe>'+ (pageName == '0' || pageName == ''  ? '<span class="alert-url">!</span>' : '' )
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
    var FacepileElement = Upfront.Views.Editor.Sidebar.Element.extend({
        render: function () {
            //this.$el.addClass('upfront-icon-element upfront-facepile');
            this.$el.html('Facepile');
        },
        add_element: function () {
            var object = new FacepileModel(),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c6 upfront-facepile_module"},
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

    // --- Facepile settings ---

    /**
     * Facepile settings panel.
     * @type {Upfront.Views.Editor.Settings.Panel}
     */
    var facepileLayoutStyleSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
        /**
         * Initialize the view, and populate the internal
         * setting items array with Item instances.
         */
        initialize: function () {
            this.settings = _([
                new facepileLayoutStyleSetting_FbPageUrl({model: this.model}),
                new facepileLayoutStyleSetting_ShowCounts({model: this.model})
            ]);
        },
        /**
         * Get the label (what will be shown in the settings overview)
         * @return {string} Label.
         */
        get_label: function () {
            return "Layout Style";
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "Layout Style settings";
        }
    });

    /**
     * Layout Style settings - Facebook Page URL item
     * @type {Upfront.Views.Editor.Settings.Item}
     */
    var facepileLayoutStyleSetting_FbPageUrl = Upfront.Views.Editor.Settings.Item.extend({

        initialize: function(){
            Upfront.data.social.panel.model.get("properties").on("change", this.render, this);
            Upfront.data.social.panel.model.get("properties").on("add", this.render, this);
        },
        /**
         * Set up setting item Facebook Page Url options.
         */

        render: function () {
                var $urlMarkup;

            this.FacebookPageUrl = Upfront.data.social.panel.model.get_property_value_by_name('facebook_page_url');

            this.$editMarkup = '<span><a target="_blank" href="'+ this.FacebookPageUrl +'" >'+ this.FacebookPageUrl +'</a></span>' +
                ' <a href="#" class="edit_fb_page_url">Edit</a> ';

            this.$inputMarkup = '<input type="text" placeholder="https://www.facebook.com/YourPage" value="'+ (this.FacebookPageUrl ? this.FacebookPageUrl : '') +'" id="style_layput_type-fb-page-url">' +
                '<button class="save_fb_url">ok</button>';

            if(this.FacebookPageUrl){
                $urlMarkup = this.$editMarkup;
            }
            else
            {
                $urlMarkup = this.$inputMarkup;
            }

            this.$el.empty();
            // Wrap method accepts an object, with defined "title" and "markup" properties.
            // The "markup" one holds the actual Item markup.
            this.wrap({
                "title": "Your facebook page URL",
                "markup": '<div class="facepile_url_input_box">' +
                    $urlMarkup +
                    '</div>'
            });
        },

        events: {
            'click .save_fb_url': 'updateFacebookPageUrl',
            'click .edit_fb_page_url': 'editFacebookPageUrl'
        },

        updateFacebookPageUrl: function(){
            var $fbUrlDiv = this.$el.find('.facepile_url_input_box');
            var $url = $fbUrlDiv.find('#style_layput_type-fb-page-url').val();

            if($url !== ''){
                $fbUrlDiv.empty().append(this.$editMarkup).find('span a').text($url);
            }
            else{
                $fbUrlDiv.find('input').focus();
            }

            var currentData = Upfront.data.social.panel.model.get('properties').toJSON();

            Upfront.data.social.panel.model.set_property('facebook_page_url',$url)

            var setData = Upfront.data.social.panel.model.get('properties').toJSON();

            if(!_.isEqual(currentData, setData)){

                Upfront.Util.post({"action": "upfront_save_social_media_global_settings", "data": JSON.stringify(setData)})
                    .success(function (ret) {
                        //console.log(ret.data);
                    })
                    .error(function (ret) {
                        Upfront.Util.log("Error Saving settings");
                    });
            }

        },

        editFacebookPageUrl: function(e){
            e.preventDefault();
            this.$el.find('.facepile_url_input_box').empty().append(this.$inputMarkup);
        }

    });

    /**
     * Layout Style settings - Show counts item
     * @type {Upfront.Views.Editor.Settings.Item}
     */
    var facepileLayoutStyleSetting_ShowCounts = Upfront.Views.Editor.Settings.Item.extend({
        /**
         * Set up setting item Show Counts options.
         */
        render: function () {
            var isShowCounts = this.model.get_property_value_by_name("is_show_counts");
            // Wrap method accepts an object, with defined "title" and "markup" properties.
            // The "markup" one holds the actual Item markup.

            this.wrap({
                "title": "",
                "markup": '<input type="checkbox" id="style_layput_type-show-counts" name="show_counts" value="1" ' + (isShowCounts ? 'checked="checked"' : '') + ' /> Show counts'
            });
        },

        /**
         * Defines under which Property name the value will be saved.
         * @return {string} Property name
         */
        get_name: function () {
            return "is_show_counts";
        },
        /**
         * Extracts the finalized value from the setting markup.
         * @return {mixed} Value.
         */
        get_value: function () {
            Upfront.Events.trigger("re_render_facepile");
            var $ShowCounts = this.$el.find(':checkbox[name="show_counts"]:checked');
            return $ShowCounts.length ? parseInt($ShowCounts.val(), 10) : 0;
        }

    });

// --- Tie the settings together ---

    /**
     * Social Media settings hub, populated with the panels we'll be showing.
     * @type {Upfront.Views.Editor.Settings.Settings}
     */
    var FacepileSettings = Upfront.Views.Editor.Settings.Settings.extend({
        /**
         * Bootstrap the object - populate the internal
         * panels array with the panel instances we'll be showing.
         */
        initialize: function () {
            this.panels = _([
                new facepileLayoutStyleSettingsPanel({model: this.model})
            ]);
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "Facepile settings";
        }
    });



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

    Upfront.Application.LayoutEditor.add_object("Facepile", {
        "Model": FacepileModel,
        "View": FacepileView,
        "Element": FacepileElement,
        "Settings": FacepileSettings
    });

    Upfront.Models.FacepileModel = FacepileModel;
    Upfront.Views.FacepileView = FacepileView;

})(jQuery);