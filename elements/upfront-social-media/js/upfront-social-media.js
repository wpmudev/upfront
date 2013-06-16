(function ($) {

    // Basic behavior/appearance dataset building block
    var SocialMediaGlobalProperty = Backbone.Model.extend({
        "defaults": {
            "name": "",
            "value": ""
        }
    });

        // Basic behavior/appearance dataset
    var SocialMediaGlobalProperties = Backbone.Collection.extend({
        "model": SocialMediaGlobalProperty
    });

    var SocialMediaGlobalObjectModel = Backbone.Model.extend({

        initialize: function(){
            var me = this;
            Upfront.Util.post({"action": "upfront_get_social_media_global_settings"})
                .success(function (ret) {
                    me.set({"properties": new SocialMediaGlobalProperties(JSON.parse(ret.data))})
                })
                .error(function (ret) {
                    Upfront.Util.log("Error loading settings");
                });
        },

        "defaults": {
            "properties":  ""
        },

        get_property_by_name: function (name) {
            var prop = this.get("properties").where({"name": name});
            return prop.length ? prop[0] : false;
        },
        get_property_value_by_name: function (name) {
            var prop = this.get_property_by_name(name);
            return prop && prop.get ? prop.get("value") : false;
        },
        add_property: function (name, value) {
            this.get("properties").add(new SocialMediaGlobalProperty({"name": name, "value": value}));
        },
        set_property: function (name, value) {
            if (!name) return false;
            var prop = this.get_property_by_name(name);
            if (!prop || !prop.set) return this.add_property(name, value);
            prop.set({"value": value});
        }
    });

    var SocialMediaGlobalSettingsPanel = Backbone.View.extend({

        model: new SocialMediaGlobalObjectModel(),

        locationPreview: function(location, locationAlignment, locationText, selector){

            if(location){

                switch (locationAlignment)
                {
                    case 0:
                        selector.text(locationText+' Left');
                        break;
                    case 1:
                        selector.text(locationText+' Center');
                        break;
                    case 2:
                        selector.text(locationText+' Right');
                        break;
                }
            }
            else{
                selector.text('');
            }

        },

        setLocationPreview: function(){
            var $TopAlignment = this.$popup.content.find('.top_location_preview'),
                locationTop = this.model.get_property_value_by_name('location_top'),
                locationTopAlignment = this.model.get_property_value_by_name('location_top_alignment'),
                $BottomAlignment = this.$popup.content.find('.bottom_location_preview'),
                locationBottom = this.model.get_property_value_by_name('location_bottom'),
                locationBottomAlignment = this.model.get_property_value_by_name('location_bottom_alignment');

            this.locationPreview(locationTop,locationTopAlignment,'Top',$TopAlignment);
            this.locationPreview(locationBottom,locationBottomAlignment,'Bottom',$BottomAlignment);
        },

        setCounterOptionPreview: function(){
            var counterOptions = this.model.get_property_value_by_name('counter_options'),
            $CounterOptions = this.$popup.content.find('.counter_options_preview');

            if(counterOptions !== ''){

                switch (counterOptions)
                {
                    case 0:
                        $CounterOptions.text('Like counter right');
                        break;
                    case 1:
                        $CounterOptions.text('Like counter top');
                        break;
                }
            }
            else{
                $CounterOptions.text('');
            }

        },

        $popup : {},
        popupFunc:function(){
            var me = this;
            popup = Upfront.Popup.open(function (data, $top, $bottom) {
                var $me = $(this),
                    $top,
                    $bottom;

                $top.empty().append('<div id="upfront-popup-top" class="upfront-popup-meta upfront-popup-social-media-meta">' +
                    '<span>FIRST SETUP PLEASE FILL UP YOUR SOCIAL MEDIA DETAILES </span><br>' +
                    '<b>GLOBAL SOCIAL SETTINGS</b>' +
                    '</div>');

                $me.empty()
                    .append('<p class="upfront-popup-placeholder">No such thing as <q>too many drinks</q>.</p>')
                ;

                me.$popup = {
                    "top": $top,
                    "content": $me,
                    "bottom": $bottom
                };

            });

            var postOptions = me.model.get_property_value_by_name('post_options'),
            locationTop = me.model.get_property_value_by_name('location_top'),
            locationTopAlignment = me.model.get_property_value_by_name('location_top_alignment'),
            locationBottom = me.model.get_property_value_by_name('location_bottom'),
            locationBottomAlignment = me.model.get_property_value_by_name('location_bottom_alignment'),
            counterOptions = me.model.get_property_value_by_name('counter_options'),
            facebookPageUrl = me.model.get_property_value_by_name('facebook_page_url'),
            twitterPageUrl = me.model.get_property_value_by_name('twitter_page_url'),
            googlePageUrl = me.model.get_property_value_by_name('google_page_url'),
            linkedinPageUrl = me.model.get_property_value_by_name('linkedin_page_url'),
            youtubePageUrl = me.model.get_property_value_by_name('youtube_page_url'),
            pintrestPageUrl = me.model.get_property_value_by_name('pintrest_page_url');


            me.$popup.content.html(

                '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Post options</div>' +
                    '<div class="upfront-settings-item-content">' +

                        '<input type="checkbox" id="social_media_global_settings-post-options" name="post-options" value="1" '+ ( postOptions ? 'checked="checked"' : '') + ' /> Add social buttons to all posts' +

                    '</div>' +
                '</div>'+


                '<div class="upfront-settings-item">' +
                    '<div class="upfront-settings-item-title">Locations</div>' +
                    '<div class="upfront-settings-item-content">' +

                    '<div class="location_top_box">' +
                        '<input type="checkbox" id="social_media_global_settings-location-top" name="location-top" value="1" '+ ( locationTop ? 'checked="checked"' : '') + ' /> Top' +

                        '<input type="radio" id="social_media_global_settings-top-left" name="location-top-alignment" value="0" ' + (!locationTopAlignment ? 'checked="checked"' : '') + ' /> Left' +
                        '<input type="radio" id="social_media_global_settings-top-center" name="location-top-alignment" value="1" ' + (locationTopAlignment == 1 ? 'checked="checked"' : '') + ' /> Center' +
                        '<input type="radio" id="social_media_global_settings-top-right" name="location-top-alignment" value="2" ' + (locationTopAlignment == 2 ? 'checked="checked"' : '') + ' /> Right' +
                    '</div>' +

                    '<div class="location_bottom_box">' +
                        '<input type="checkbox" id="social_media_global_settings-location-bottom" name="location-bottom" value="1" '+ ( locationBottom ? 'checked="checked"' : '') + ' /> Bottom' +

                        '<input type="radio" id="social_media_global_settings-bottom-left" name="location-bottom-alignment" value="0" ' + (!locationBottomAlignment ? 'checked="checked"' : '') + ' /> Left' +
                        '<input type="radio" id="social_media_global_settings-bottom-center" name="location-bottom-alignment" value="1" ' + (locationBottomAlignment == 1 ? 'checked="checked"' : '') + ' /> Center' +
                        '<input type="radio" id="social_media_global_settings-bottom-right" name="location-bottom-alignment" value="2" ' + (locationBottomAlignment == 2 ? 'checked="checked"' : '') + ' /> Right' +
                    '</div>' +
                    '<div class="top_location_preview"></div> ' +
                    '<div class="bottom_location_preview"></div> ' +

                    '</div>' +
                '</div>' +

            '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Button counter</div>' +
                '<div class="upfront-settings-item-content">' +

                    '<input type="radio" id="social_media_global_settings-counter-right" name="counter-options" value="0" ' + (!counterOptions ? 'checked="checked"' : '') + ' /> Counter right' +
                    '<input type="radio" id="social_media_global_settings-counter-top" name="counter-options" value="1" ' + (counterOptions == 1 ? 'checked="checked"' : '') + ' /> Counter top' +

                '</div>' +
                    '<div class="counter_options_preview"></div> ' +
            '</div>' +


            '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Global social media pages</div>' +
                '<div class="upfront-settings-item-content">' +

                'Facebook <input type="text" id="social_media_global_settings-facebook" name="facebook_page_url" value="' + (facebookPageUrl ? facebookPageUrl : '') + '" placeholder="https://www.facebook.com/yourpage" />' +
                    '<br> ' +
                'Twitter <input type="text" id="social_media_global_settings-twitter" name="twitter_page_url" value="' + (twitterPageUrl ? twitterPageUrl : '') + '" placeholder="https://www.twitter.com/yourpage" /> ' +
                    '<br> ' +
                'Google <input type="text" id="social_media_global_settings-google" name="google_page_url" value="' + (googlePageUrl ? googlePageUrl : '') + '" placeholder="https://www.google.com/yourpage" /> ' +
                    '<br> ' +

                (linkedinPageUrl ? 'LinkedIn <input type="text" id="social_media_global_settings-linkedin" name="linkedin_page_url" value="' + linkedinPageUrl + '" placeholder="https://www.linkedin.com/yourpage" /> <br>' : '') +
                (youtubePageUrl ? 'Youtube <input type="text" id="social_media_global_settings-youtube" name="youtube_page_url" value="' + youtubePageUrl + '" placeholder="https://www.youtube.com/yourpage" /> <br>' : '') +
                (pintrestPageUrl ? 'Pinterest <input type="text" id="social_media_global_settings-pintrest" name="pintrest_page_url" value="' + pintrestPageUrl + '" placeholder="https://www.pinterest.com/yourpage" /> <br>' : '') +

                    '<select id="select_page_url" name="select_page_url">' +
                       // '<option id="social_media_global_settings-facebook" data-name="facebook_page_url" data-placeholder="https://www.facebook.com/yourpage">Facebook</option>' +
                       // '<option id="social_media_global_settings-twitter" data-name="twitter_page_url" data-placeholder="https://www.twitter.com/yourpage">Twitter</option>' +
                       // '<option id="social_media_global_settings-google" data-name="google_page_url" data-placeholder="https://www.google.com/yourpage">Google</option>' +
                        '<option value="0">Other</option>' +
                        '<option id="social_media_global_settings-linkedin" data-name="linkedin_page_url" data-placeholder="https://www.linkedin.com/yourpage">LinkedIn</option>' +
                        '<option id="social_media_global_settings-pintrest" data-name="pintrest_page_url" data-placeholder="https://www.pintrest.com/yourpage">Pintrest</option>' +
                        '<option id="social_media_global_settings-youtube" data-name="youtube_page_url" data-placeholder="https://www.youtube.com/yourpage">Youtube</option>' +
                    '</select>' +
                    '<input class="blank_add_page_url_field" type="text" />' +
                    '<button class="add_page_url_button">Add</button>' +

                '</div>' +
            '</div>' +

                    '<div class="change_global_settings_from_sidebar">These global settings can be change from the <a href="#">upfront sidebar</a></div>'

            );

            me.$popup.bottom.html('<div id="upfront-popup-bottom" class="upfront-popup-meta upfront-popup-social-media-meta">' +
                '<button type="button" class="upfront-social-media-save_settings"><i class="icon-ok"></i> Save</button>' +
                '</div>');

            if(linkedinPageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-linkedin').remove();
            if(youtubePageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-youtube').remove();
            if(pintrestPageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-pintrest').remove();

            me.setLocationPreview();
            me.setCounterOptionPreview();
            me.clickOnSaveButton();
            me.clickOnAddPageButton();
            me.hideAddButton();
            me.changeGlobalSettingsFromSidebar();
        },

        clickOnSaveButton: function(){
            var me = this;
            this.$popup.bottom.find('.upfront-social-media-save_settings').on("click", function () {
                    me.on_save();
                    me.setLocationPreview();
                    me.setCounterOptionPreview();
                });
        },

        clickOnAddPageButton: function(){
            var me = this,
                $input,
                $select,
                $selectEle;

            me.$popup.content.find('#select_page_url').change(function() {

                me.$popup.content.find('.blank_add_page_url_field').val('');
                if($(this).val() == '0')
                return false;

                me.$popup.content.find('.blank_add_page_url_field')
                    .val(me.$popup.content.find('#select_page_url option:selected').text());
            });

            this.$popup.content.find('.add_page_url_button').on("click", function () {

                $input = me.$popup.content.find('.blank_add_page_url_field');
                $select = me.$popup.content.find('#select_page_url option:selected');
                $selectEle = me.$popup.content.find('#select_page_url');

                if($select.val() == '0' ){
                    $input.focus();
                    return false;
                }

                $selectEle
                    .before($select.val()+' <input type="text" id="'+$select.attr('id')+'" name="'+$select.attr('data-name')+'" value="" placeholder="'+$select.attr('data-placeholder')+'" /><br>');
                $select.remove();
                $input.val('');

                me.hideAddButton();
            });
        },

        hideAddButton: function(){
            if(this.$popup.content.find('#select_page_url option').length === 1){
                this.$popup.content.find('#select_page_url').hide();
                this.$popup.content.find('.blank_add_page_url_field').hide();
                this.$popup.content.find('.add_page_url_button').hide();
            }
        },

        changeGlobalSettingsFromSidebar: function(){
            this.$popup.content.find('.change_global_settings_from_sidebar a').on("click", function (e) {
                e.preventDefault();
                alert('Currently this option is not avalible');
            });
        },

        get_title: 'GLOBAL SOCIAL SETTINGS',
        get_label: '',

        on_save: function () {

            var currentData = this.model.get('properties').toJSON();

            var $PostOptions = this.$popup.content.find(':checkbox[name="post-options"]:checked');
            $PostOptions = $PostOptions.length ? parseInt($PostOptions.val(), 10) : 0;

            var $LocationTop = this.$popup.content.find(':checkbox[name="location-top"]:checked');
            $LocationTop = $LocationTop.length ? parseInt($LocationTop.val(), 10) : 0;

            var $LocationTopAlignment = this.$popup.content.find(':radio[name="location-top-alignment"]:checked');
            $LocationTopAlignment = $LocationTopAlignment.length ? parseInt($LocationTopAlignment.val(), 10) : 0;

            var $LocationBottom = this.$popup.content.find(':checkbox[name="location-bottom"]:checked');
            $LocationBottom = $LocationBottom.length ? parseInt($LocationBottom.val(), 10) : 0;

            var $LocationBottomAlignment = this.$popup.content.find(':radio[name="location-bottom-alignment"]:checked');
            $LocationBottomAlignment = $LocationBottomAlignment.length ? parseInt($LocationBottomAlignment.val(), 10) : 0;

            var $CounterOptions = this.$popup.content.find(':radio[name="counter-options"]:checked');
            $CounterOptions = $CounterOptions.length ? parseInt($CounterOptions.val(), 10) : 0;

            var $FacebookPageUrl = this.$popup.content.find('#social_media_global_settings-facebook');
            $FacebookPageUrl = $FacebookPageUrl.length ? $FacebookPageUrl.val() : 0;

            var $TwitterPageUrl = this.$popup.content.find('#social_media_global_settings-twitter');
            $TwitterPageUrl = $TwitterPageUrl.length ? $TwitterPageUrl.val() : 0;

            var $GooglePageUrl = this.$popup.content.find('#social_media_global_settings-google');
            $GooglePageUrl = $GooglePageUrl.length ? $GooglePageUrl.val() : 0;

            var $LinkedInPageUrl = this.$popup.content.find('input#social_media_global_settings-linkedin');
            $LinkedInPageUrl = $LinkedInPageUrl.length ? $LinkedInPageUrl.val() : 0;

            var $YouTubePageUrl = this.$popup.content.find('input#social_media_global_settings-youtube');
            $YouTubePageUrl = $YouTubePageUrl.length ? $YouTubePageUrl.val() : 0;

            var $PintrestPageUrl = this.$popup.content.find('input#social_media_global_settings-pintrest');
            $PintrestPageUrl = $PintrestPageUrl.length ? $PintrestPageUrl.val() : 0;


            this.model.set_property('post_options', $PostOptions );
            this.model.set_property('location_top', $LocationTop );
            this.model.set_property('location_top_alignment', $LocationTopAlignment );
            this.model.set_property('location_bottom', $LocationBottom );
            this.model.set_property('location_bottom_alignment', $LocationBottomAlignment );
            this.model.set_property('counter_options', $CounterOptions );
            this.model.set_property('facebook_page_url', $FacebookPageUrl );
            this.model.set_property('twitter_page_url', $TwitterPageUrl );
            this.model.set_property('google_page_url', $GooglePageUrl );
            this.model.set_property('linkedin_page_url', $LinkedInPageUrl );
            this.model.set_property('youtube_page_url', $YouTubePageUrl );
            this.model.set_property('pintrest_page_url', $PintrestPageUrl );

            var setData = this.model.get('properties').toJSON();

            if(!_.isEqual(currentData, setData)){

            Upfront.Util.post({"action": "upfront_save_social_media_global_settings", "data": JSON.stringify(setData)})
                .success(function (ret) {
                    //console.log(ret.data);
                })
                .error(function (ret) {
                    Upfront.Util.log("Error Saving settings");
                });
            }
        }

    });

    var socialMediaGlobalSettingsPanel = new SocialMediaGlobalSettingsPanel();

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

        initialize: function(){
            Upfront.Events.on("entity:drag_stop", this.dragStop, this);
            Upfront.Views.ObjectView.prototype.initialize.call(this);
        },

        showingDialog: false,

        dragStop: function(e1, e2){

        if(this.showingDialog) return;

            var type = e1.model.get('objects').models[0].get('properties').where({'name':'type'})[0].get('value');
            if(type !== 'SocialMediaModel') return;
            this.showingDialog = true;
            socialMediaGlobalSettingsPanel.popupFunc();
        },

        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        model:SocialMediaModel,

        get_content_markup: function () {

           // var counter = this.model.get_property_value_by_name("counter");
            //this.faceBookLike(document, 'script', 'facebook-jssdk');
            return 'Social Media';
        },

        on_render: function () {

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
                        {"name": "class", "value": "c6 upfront-social-media_module"},
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

// --- Like, Follow, +1 settings ---

    /**
     * Like, Follow, +1 settings panel.
     * @type {Upfront.Views.Editor.Settings.Panel}
     */
    var socialSocialSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
        /**
         * Initialize the view, and populate the internal
         * setting items array with Item instances.
         */
        initialize: function () {
            this.settings = _([
                new socialSocialSetting_CounterOptions({model: this.model})
            ]);
        },
        /**
         * Get the label (what will be shown in the settings overview)
         * @return {string} Label.
         */
        get_label: function () {
            return "Social";
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return "Social";
        }
    });

    /**
     * Like, Follow, +1 settings - Counter Options item
     * @type {Upfront.Views.Editor.Settings.Item}
     */
    var socialSocialSetting_CounterOptions = Upfront.Views.Editor.Settings.Item.extend({
        /**
         * Set up setting item counter options.
         */
        template: _.template('<!--menu content start-->' +
            '<div class="upfront_social_box">' +
        '<div class="upfront_social_tabs">' +
            '<ul>' +
                '<li><a class="tab_one" href="#">Like, Follow, +1 </a>' +
            '<br><input type="radio" id="social_type-social-layout-option-one" name="social_layout_option" value="0" {[ if (layoutStyle == 0) { ]}   {{checked="checked"}} {[ } ]} />' +
            '</li>' +
                '<li><a class="tab_two" href="#">Fan, Follower count</a>' +
            '<br><input type="radio" id="social_type-social-layout-option-two" name="social_layout_option" value="1" {[ if (layoutStyle == 1) { ]}   {{checked="checked"}} {[ } ]} />' +
            '</li>' +
                '<li><a class="tab_three" href="#">Call to action icon</a>' +
            '<br><input type="radio" id="social_type-social-layout-option-three" name="social_layout_option" value="2" {[ if (layoutStyle == 2) { ]}   {{checked="checked"}} {[ } ]} />' +
            '</li>' +
            '</ul>' +
        '</div>' +

        '<div class="upfront_tab_one_box">' +

            '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Counter options</div>' +
                '<div class="upfront-settings-item-content">' +

                    '<input type="radio" id="like_follow_p1_type-counter-right" name="counter_options" value="0" {[ if (!counterOptions) { ]}   {{checked="checked"}} {[ } ]} /> Counter right' +
                    '<br />' +
                    '<input type="radio" id="like_follow_p1_type-counter-top" name="counter_options" value="1" {[ if (counterOptions) { ]}   {{checked="checked"}} {[ } ]} /> Counter top' +

                '</div>' +
            '</div>' +

            '<div class="upfront-settings-item">' +
            '<div class="upfront-settings-item-title">Social media services</div>' +
            '<div class="upfront-settings-item-content">' +

            '<div class="ser_header">' +
            '<div class="hide">Hide/Show</div>' +
            '<span>sort</span>' +
            '</div>' +
            '<ul class="like_social_media_services_list"></ul>' +
            '<div class="back_global_settings">Back to your <a href="#">global settings</a></div> '+

            '</div>' +
            '</div>' +

        '</div>' +

            '<div class="upfront_tab_two_box">' +

                '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Social media services</div>' +
                '<div class="upfront-settings-item-content">' +

                '<div class="ser_header">' +
                '<div class="hide">Hide/Show</div>' +
                '<span>sort</span>' +
                '</div>' +
                '<ul class="fan_social_media_services_list"></ul>'+

                '</div>' +
                '</div>' +

            '</div>' +

            '<div class="upfront_tab_three_box">' +

                '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Button size</div>' +
                '<div class="upfront-settings-item-content">' +

                    '<input type="radio" id="call_to_action_icon_type-button-size-small" name="call_to_action_button_size" value="0" {[ if (!buttonSize) { ]}   {{checked="checked"}} {[ } ]} /> Small' +
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-size-medium" name="call_to_action_button_size" value="1" {[ if (buttonSize == 1) { ]}   {{checked="checked"}} {[ } ]} /> Medium' +
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-size-large" name="call_to_action_button_size" value="2" {[ if (buttonSize == 2) { ]}   {{checked="checked"}} {[ } ]} /> Large' +

                '</div>' +
                '</div>' +


                '<div class="upfront-settings-item">' +
                '<div class="upfront-settings-item-title">Button Style</div>' +
                '<div class="upfront-settings-item-content">' +

                    '<input type="radio" id="call_to_action_icon_type-button-style-1" name="call_to_action_button_style" value="0" {[ if (!buttonStyle) { ]}   {{checked="checked"}} {[ } ]} /> One' +
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-style-2" name="call_to_action_button_style" value="1" {[ if (buttonStyle == 1) { ]}   {{checked="checked"}} {[ } ]} /> Two' +
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-style-3" name="call_to_action_button_style" value="2" {[ if (buttonStyle == 2) { ]}   {{checked="checked"}} {[ } ]} /> Three'+
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-style-4" name="call_to_action_button_style" value="3" {[ if (buttonStyle == 3) { ]}   {{checked="checked"}} {[ } ]} /> Four'+
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-style-5" name="call_to_action_button_style" value="4" {[ if (buttonStyle == 4) { ]}   {{checked="checked"}} {[ } ]} /> Five'+
                    '<br />' +
                    '<input type="radio" id="call_to_action_icon_type-button-style-6" name="call_to_action_button_style" value="5" {[ if (buttonStyle == 5) { ]}   {{checked="checked"}} {[ } ]} /> Six' +

                '</div>' +
                '</div>' +


            '<div class="upfront-settings-item">' +
            '<div class="upfront-settings-item-title">Social media services</div>' +
            '<div class="upfront-settings-item-content">' +

            '<div class="ser_header">' +
            '<div class="hide">Hide/Show</div>' +
            '<span>sort</span>' +
            '</div>' +
            '<ul class="cal_to_action_social_media_services_list"></ul>'+

            '</div>' +
            '</div>' +




            '</div>' +
        '</div>' +
        '<!--menu content end-->'),

        render: function () {

            var panelSettings = $.parseJSON(this.model.get_property_value_by_name("social_media_panel_settings")),
                me = this,
                $tabA,
                pSettings,
                actMenu = 1;

            panelSettings = panelSettings !== null ? panelSettings : 0;

            if(panelSettings){
                pSettings = panelSettings;
            }else{
                pSettings = {
                    layoutStyle: 0,
                    buttonSize: 0,
                    buttonStyle: 0,
                    calToActionSocialMediaServices: 0,
                    counterOptions: 0,
                    fanSocialMediaServices: 0,
                    likeSocialMediaServices: 0
                }
            }

            // Here i Need to Create Tab menu inside panel so i can not use Warp method.
            this.$el.html(this.template(pSettings));

            $tabA = this.$el.find('.upfront_social_tabs a');
            switch (pSettings.layoutStyle)
            {
                case 0:
                    $($tabA[0]).addClass('act_tabs');
                    this.$el.find('.upfront_tab_one_box').show();
                    break;
                case 1:
                    $($tabA[1]).addClass('act_tabs');
                    this.$el.find('.upfront_tab_two_box').show();
                    break;
                case 2:
                    $($tabA[2]).addClass('act_tabs');
                    this.$el.find('.upfront_tab_three_box').show();
                    break;
            }

            if(!pSettings.calToActionSocialMediaServices){
                pSettings.calToActionSocialMediaServices  = [{id : 1 , value: 0, name: "Facebook"},{id: 2, value: 0, name : "Twitter"},{id: 3, value: 0, name: "Google+"}];
            }

            _.map(pSettings.calToActionSocialMediaServices, function(social) {
                me.$el.find('.cal_to_action_social_media_services_list').append('<li><input type="checkbox" data-id='+ social.id + ' name='+ social.name + ' value="1" ' + (social.value == 1 ? 'checked' : '') + ' /><span>'+ social.name + '</span></li>');
            });

            this.$el.find(".cal_to_action_social_media_services_list" ).sortable({
                placeholder: "ui-state-highlight"
            });


            if(!pSettings.likeSocialMediaServices){
                pSettings.likeSocialMediaServices  = [{id : 1 , value: 0, name: "Facebook"},{id: 2, value: 0, name : "Twitter"},{id: 3, value: 0, name: "Google+"}];
            }

            _.map(pSettings.likeSocialMediaServices, function(social) {
                me.$el.find('.like_social_media_services_list').append('<li><input type="checkbox" data-id='+ social.id + ' name='+ social.name + ' value="1" ' + (social.value == 1 ? 'checked' : '') + ' /><span>'+ social.name + '</span></li>');
            });

            this.$el.find(".like_social_media_services_list" ).sortable({
                placeholder: "ui-state-highlight"
            });

            if(!pSettings.fanSocialMediaServices){
                pSettings.fanSocialMediaServices  = [{id : 1 , value: 0, name: "Facebook"},{id: 2, value: 0, name : "Twitter"},{id: 3, value: 0, name: "Google+"}];
            }

            _.map(pSettings.fanSocialMediaServices, function(social) {
                me.$el.find('.fan_social_media_services_list').append('<li><input type="checkbox" data-id='+ social.id + ' name='+ social.name + ' value="1" ' + (social.value == 1 ? 'checked' : '') + ' /><span>'+ social.name + '</span></li>');
            });

            this.$el.find(".fan_social_media_services_list" ).sortable({
                placeholder: "ui-state-highlight"
            });

        },

        events:{
            'click .upfront_social_tabs a': 'tabMenu',
            'click .back_global_settings a' : 'backToGlobalSettings'
        },

        backToGlobalSettings: function(e){
            e.preventDefault();
            socialMediaGlobalSettingsPanel.popupFunc();
        },

        tabMenu: function(e){
            e.preventDefault();

            $(e.target).addClass('act_tabs');
            this.$el.find('.upfront_social_tabs a').not(e.target).removeClass('act_tabs');

            if($(e.target).hasClass('tab_one')){
                this.$el.find('.upfront_tab_two_box, .upfront_tab_three_box').hide();
                this.$el.find('.upfront_tab_one_box').show();
            }

            if($(e.target).hasClass('tab_two')){
                this.$el.find('.upfront_tab_one_box, .upfront_tab_three_box').hide();
                this.$el.find('.upfront_tab_two_box').show();
            }

            if($(e.target).hasClass('tab_three')){
                this.$el.find('.upfront_tab_one_box, .upfront_tab_two_box').hide();
                this.$el.find('.upfront_tab_three_box').show();
            }
            this.panel.trigger("upfront:settings:panel:refresh", this.panel);
        },

       /**
         * Defines under which Property name the value will be saved.
         * @return {string} Property name
         */
        get_name: function () {
            return "social_media_panel_settings";
        },
        /**
         * Extracts the finalized value from the setting markup.
         * @return {mixed} Value.
         */
        get_value: function () {

            var $LayoutStyle = this.$el.find(':radio[name="social_layout_option"]:checked');
            $LayoutStyle = $LayoutStyle.length ? parseInt($LayoutStyle.val(), 10) : 0;

            var $CounterOptions = this.$el.find(':radio[name="counter_options"]:checked');
            $CounterOptions = $CounterOptions.length ? parseInt($CounterOptions.val(), 10) : 0;

            var $ButtonSize = this.$el.find(':radio[name="call_to_action_button_size"]:checked');
            $ButtonSize = $ButtonSize.length ? parseInt($ButtonSize.val(), 10) : 0;

            var $ButtonStyle = this.$el.find(':radio[name="call_to_action_button_style"]:checked');
            $ButtonStyle = $ButtonStyle.length ? parseInt($ButtonStyle.val(), 10) : 0;

            var likeSocialItems = [],
                fanSocialItems = [],
                calToActionSocialItems = [];

            $('.like_social_media_services_list').find('li').each(function(i) {
                likeSocialItems[i] = {};
                likeSocialItems[i]['id'] = $(this).find('input').attr('data-id');
                likeSocialItems[i]['value'] = ($(this).find('input:checked').val() ? '1' : '0');
                likeSocialItems[i]['name'] = $(this).find('span').text();
            });

            $('.fan_social_media_services_list').find('li').each(function(i) {
                fanSocialItems[i] = {};
                fanSocialItems[i]['id'] = $(this).find('input').attr('data-id');
                fanSocialItems[i]['value'] = ($(this).find('input:checked').val() ? '1' : '0');
                fanSocialItems[i]['name'] = $(this).find('span').text();
            });

            $('.cal_to_action_social_media_services_list').find('li').each(function(i) {
                calToActionSocialItems[i] = {};
                calToActionSocialItems[i]['id'] = $(this).find('input').attr('data-id');
                calToActionSocialItems[i]['value'] = ($(this).find('input:checked').val() ? '1' : '0');
                calToActionSocialItems[i]['name'] = $(this).find('span').text();
            });


            var PanelSettings = JSON.stringify({
                "layoutStyle": $LayoutStyle,
                "counterOptions": $CounterOptions,
                "likeSocialMediaServices": likeSocialItems,
                "fanSocialMediaServices": fanSocialItems,
                "buttonSize": $ButtonSize,
                "buttonStyle": $ButtonStyle,
                "calToActionSocialMediaServices": calToActionSocialItems
            });

            return PanelSettings;
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
                new socialSocialSettingsPanel({model: this.model})
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
    Upfront.SocialMediaGlobalSettings = SocialMediaGlobalSettingsPanel;


})(jQuery);