(function ($) {

    /**
     * Define the model - initialize properties to their default values.
     * @type {Upfront.Models.ObjectModel}
     */
    var SocialMediaModel = Upfront.Models.ObjectModel.extend({
        /**
         * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
         * Used for setting up instance defaults, initialization and the like.
         */
        init: function () {
            this.init_property("type", "SocialMediaModel");
            this.init_property("view_class", "SocialMediaView");

            this.init_property("element_id", Upfront.Util.get_unique_id("SocialMedia-Object"));
            this.init_property("class", "c22 upfront-Social-Media");
            this.init_property("has_settings", 1);
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */
    var SocialMediaView = Upfront.Views.ObjectView.extend({

        initialize:function(){
            var me = this;
        },

        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        model:SocialMediaModel,

        get_content_markup: function () {
            return 'Main View will goes here ......';
        }

    });

    /**
     * Sidebar element class - this let you inject element into
     * sidebar elements panel and allow drag and drop element adding
     * @type {Upfront.Views.Editor.Sidebar.Element}
     */
    var SocialMediaElement = Upfront.Views.Editor.Sidebar.Element.extend({
        render: function () {
            this.$el.addClass('upfront-icon-element upfront-icon-element-social');
            this.$el.html('Social Media');
        },
        add_element: function () {
            var object = new SocialMediaModel(),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c22"},
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

// --- Facebook settings ---

    /**
     * Facebook settings panel.
     * @type {Upfront.Views.Editor.Settings.Panel}
     */
    var socialFacebookSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
        /**
         * Initialize the view, and populate the internal
         * setting items array with Item instances.
         */
        initialize: function () {
            this.settings = _([
                new socialFacebookSettingLike({model: this.model}),
                new socialFacebookSettingFacepile({model: this.model})
            ]);
        },
        /**
         * Get the label (what will be shown in the settings overview)
         * @return {string} Label.
         */
        get_label: function () {
            return "Facebook";
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "Facebook settings";
        }
    });

    /**
     * Facebook settings - Like item
     * @type {Upfront.Views.Editor.Settings.Item}
     */
    var socialFacebookSettingLike = Upfront.Views.Editor.Settings.Item.extend({
        /**
         * Set up setting item appearance.
         */
        render: function () {
            var liked = this.model.get_property_value_by_name("is_liked");
            // Wrap method accepts an object, with defined "title" and "markup" properties.
            // The "markup" one holds the actual Item markup.
            this.wrap({
                "markup": '<input type="checkbox" id="facebook_type-like-button" name="like_button" value="1" ' + (liked ? 'checked="checked"' : '') + ' /> Like Button'
            });
        },
        /**
         * Defines under which Property name the value will be saved.
         * @return {string} Property name
         */
        get_name: function () {
            return "is_liked";
        },
        /**
         * Extracts the finalized value from the setting markup.
         * @return {mixed} Value.
         */
        get_value: function () {
            var $likeButton = this.$el.find('#facebook_type-like-button:checked');
            return $likeButton.length ? parseInt($likeButton.val(), 10) : 0;
        }
    });

    /**
     * Facebook settings - Facepile item
     * @type {Upfront.Views.Editor.Settings.Item}
     */
    var socialFacebookSettingFacepile = Upfront.Views.Editor.Settings.Item.extend({
        /**
         * Set up setting item appearance.
         */
        render: function () {
            var facepiled = this.model.get_property_value_by_name("is_facepiled");
            // Wrap method accepts an object, with defined "title" and "markup" properties.
            // The "markup" one holds the actual Item markup.
            this.wrap({
                "markup": '<input type="checkbox" id="facebook_type-facepile" name="facepile" value="1" ' + (facepiled ? 'checked="checked"' : '') + ' /> Facepile'
            });
        },
        /**
         * Defines under which Property name the value will be saved.
         * @return {string} Property name
         */
        get_name: function () {
            return "is_facepiled";
        },
        /**
         * Extracts the finalized value from the setting markup.
         * @return {mixed} Value.
         */
        get_value: function () {
            var $facepile = this.$el.find('#facebook_type-facepile:checked');
            return $facepile.length ? parseInt($facepile.val(), 10) : 0;
        }
    });

// --- Tie the settings together ---

    /**
     * Social Media settings hub, populated with the panels we'll be showing.
     * @type {Upfront.Views.Editor.Settings.Settings}
     */
    var SocialMediaSettings = Upfront.Views.Editor.Settings.Settings.extend({
        /**
         * Bootstrap the object - populate the internal
         * panels array with the panel instances we'll be showing.
         */
        initialize: function () {
            this.panels = _([
                new socialFacebookSettingsPanel({model: this.model}),
                new socialFacebookSettingFacepile({model: this.model})
            ]);
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "Social Media settings";
        }
    });



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

    Upfront.Application.LayoutEditor.add_object("SocialMedia", {
        "Model": SocialMediaModel,
        "View": SocialMediaView,
        "Element": SocialMediaElement,
        "Settings": SocialMediaSettings
    });

    Upfront.Models.SocialMediaModel = SocialMediaModel;
    Upfront.Views.SocialMediaView = SocialMediaView;

})(jQuery);