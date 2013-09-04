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
            loading: false,
            initialize: function(){
                var me = this;
                Upfront.data.social.loading.success(function(response){
                    me.set({"properties": new SocialMediaGlobalProperties(JSON.parse(response.data))})
                })
            },

            "defaults": {
                "properties":  new SocialMediaGlobalProperties()
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

            $popup : {},
            popupFunc:function(){
                var me = this;
                popup = Upfront.Popup.open(function (data, $top, $bottom) {
                    var $me = $(this),
                        $top,
                        $bottom;

                    $top.empty().append('<ul class="upfront-tabs">' +
                        '<li class="active upfront-social-popup-hd">Global Social Settings</li>' +
                        '</ul>');

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
                    pintrestPageUrl = me.model.get_property_value_by_name('pintrest_page_url'),
                    isLiked = me.model.get_property_value_by_name('is_liked'),
                    isTweet = me.model.get_property_value_by_name('is_tweet'),
                    isGplus = me.model.get_property_value_by_name('is_gplus');

                me.$popup.content.html(
                    '<div class="upfront-global-social-settings">' +
                        '<fieldset>' +
                        '<legend>Post options:</legend>' +
                        '<div class="upfront-social-setting-box"> ' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-post-options" name="post-options" value="1" '+ ( postOptions ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-post-options">Add social buttons to all posts</label>' +
                        '</div>' +
                        '<div class="upfront-social-sub-title">Locations</div>' +
                        '<div class="upfront-social-setting-box location_top_box">' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-location-top" name="location-top" value="1" '+ ( locationTop ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-location-top">Top</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-top-left" name="location-top-alignment" value="0" ' + (!locationTopAlignment ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-top-left">Left</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-top-center" name="location-top-alignment" value="1" ' + (locationTopAlignment == 1 ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-top-center">Center</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-top-right" name="location-top-alignment" value="2" ' + (locationTopAlignment == 2 ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-top-right">Right</label>' +
                        '</div>' +
                        '<div class="upfront-social-setting-box location_bottom_box">' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-location-bottom" name="location-bottom" value="1" '+ ( locationBottom ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-location-bottom">Bottom</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-bottom-left" name="location-bottom-alignment" value="0" ' + (!locationBottomAlignment ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-bottom-left">Left</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-bottom-center" name="location-bottom-alignment" value="1" ' + (locationBottomAlignment == 1 ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-bottom-center">Center</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-bottom-right" name="location-bottom-alignment" value="2" ' + (locationBottomAlignment == 2 ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-bottom-right">Right</label>' +
                        '</div>' +
                        '</fieldset>' +
                        '<fieldset>' +
                        '<legend>Button Counter:</legend>' +
                        '<div class="upfront-social-setting-box button_counter_top_box"> ' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-counter-right" name="counter-options" value="0" ' + (!counterOptions ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-counter-right">Counter right</label>' +
                            '<input type="radio" class="upfront-radio" id="social_media_global_settings-counter-top" name="counter-options" value="1" ' + (counterOptions == 1 ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-counter-top">Counter top</label>' +
                        '</div>' +
                        '<div class="upfront-social-setting-box"> ' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-is-liked" name="is_liked" value="1" '+ ( isLiked ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-is-liked">Like</label>' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-is-tweet" name="is_tweet" value="1" '+ ( isTweet ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-is-tweet">Tweet</label>' +
                            '<input type="checkbox" class="upfront-checkbox" id="social_media_global_settings-is-gplus" name="is_gplus" value="1" '+ ( isGplus ? 'checked="checked"' : '') + ' />' +
                            '<label for="social_media_global_settings-is-gplus">Google +1</label>' +
                        '</div>' +
                        '</fieldset>' +

                        '<fieldset class="social-pages-link-box">' +
                        '<legend>Global Social Media Pages:</legend>' +
                        '<div class="upfront-social-setting-box"> ' +
                        '<div class="social-setting-title">Facebook</div>' +
                        '<input type="text" id="social_media_global_settings-facebook" name="facebook_page_url" value="' + (facebookPageUrl ? facebookPageUrl : '') + '" placeholder="https://www.facebook.com/yourpage" />' +
                        '</div> ' +
                        '<div class="upfront-social-setting-box"> ' +
                        '<div class="social-setting-title">Twitter</div>' +
                        '<input type="text" id="social_media_global_settings-twitter" name="twitter_page_url" value="' + (twitterPageUrl ? twitterPageUrl : '') + '" placeholder="https://www.twitter.com/yourpage" /> ' +
                        '</div> ' +
                        '<div class="upfront-social-setting-box"> ' +
                        '<div class="social-setting-title">Google</div>' +
                        '<input type="text" id="social_media_global_settings-google" name="google_page_url" value="' + (googlePageUrl ? googlePageUrl : '') + '" placeholder="https://www.google.com/yourpage" /> ' +
                        '</div> ' +

                        (linkedinPageUrl ? '<div class="upfront-social-setting-box"><div class="social-setting-title">LinkedIn</div><input type="text" id="social_media_global_settings-linkedin" name="linkedin_page_url" value="' + linkedinPageUrl + '" placeholder="https://www.linkedin.com/yourpage" /></div>' : '') +
                        (youtubePageUrl ? '<div class="upfront-social-setting-box"><div class="social-setting-title">Youtube</div><input type="text" id="social_media_global_settings-youtube" name="youtube_page_url" value="' + youtubePageUrl + '" placeholder="https://www.youtube.com/yourpage" /> </div>' : '') +
                        (pintrestPageUrl ? '<div class="upfront-social-setting-box"><div class="social-setting-title">Pinterest</div><input type="text" id="social_media_global_settings-pintrest" name="pintrest_page_url" value="' + pintrestPageUrl + '" placeholder="https://www.pinterest.com/yourpage" /> </div>' : '') +

                        '<div class="upfront-social-setting-box"> ' +
                        '<div class="social-setting-title">' +
                        '<select id="select_page_url" name="select_page_url">' +
                        '<option value="0">Other</option>' +
                        '<option id="social_media_global_settings-linkedin" data-name="linkedin_page_url" data-placeholder="https://www.linkedin.com/yourpage">LinkedIn</option>' +
                        '<option id="social_media_global_settings-pintrest" data-name="pintrest_page_url" data-placeholder="https://www.pintrest.com/yourpage">Pintrest</option>' +
                        '<option id="social_media_global_settings-youtube" data-name="youtube_page_url" data-placeholder="https://www.youtube.com/yourpage">Youtube</option>' +
                        '</select>' +
                        '</div>' +
                        '<input class="blank_add_page_url_field" placeholder="https://www" type="text" />' +
                        '<i class="icon-plus-sign add_page_url_button"></i>' +

                        '</div>' +
                        '</fieldset>' +
                    '</div>'
                );

                me.$popup.bottom.html('<button type="button" class="upfront-social-media-save_settings"><i class="icon-ok"></i>OK</button>');

                if(linkedinPageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-linkedin').remove();
                if(youtubePageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-youtube').remove();
                if(pintrestPageUrl) me.$popup.content.find('#select_page_url option#social_media_global_settings-pintrest').remove();

                me.clickOnSaveButton();
                me.clickOnCheckBoxes();
                me.clickOnAddPageButton();
                me.hideAddButton();
            },
            clickOnCheckBoxes: function(){
                this.toggleDisable('social_media_global_settings-location-top');
                this.toggleDisable('social_media_global_settings-location-bottom');
            },
            toggleDisable: function(selectorName){
                var me = this,
                    checkbox = this.$popup.content.find('#'+selectorName),
                    isChecked = checkbox.is(':checked');
                if(!isChecked)
                    checkbox.nextAll('input[type="radio"]').prop('disabled', true);

                checkbox.on("click", function () {
                    var checkbox = me.$popup.content.find('#'+selectorName),
                        isChecked = checkbox.is(':checked');
                    if(!isChecked)
                        checkbox.nextAll('input[type="radio"]').prop('disabled', true);
                    if(isChecked)
                        checkbox.nextAll('input[type="radio"]').prop('disabled', false);
                });
            },
            clickOnSaveButton: function(){
                var me = this;
                this.$popup.bottom.find('.upfront-social-media-save_settings').on("click", function () {
                    me.on_save();
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
                });

                this.$popup.content.find('.add_page_url_button').on("click", function () {

                    $input = me.$popup.content.find('.blank_add_page_url_field');
                    $select = me.$popup.content.find('#select_page_url option:selected');
                    $selectEle = me.$popup.content.find('#select_page_url').closest('.upfront-social-setting-box');

                    if($select.val() == '0' ){
                        $input.focus();
                        return false;
                    }

                    $selectEle
                        .before('<div class="upfront-social-setting-box"><div class="social-setting-title">'+$select.val()+'</div><input type="text" id="'+$select.attr('id')+'" name="'+$select.attr('data-name')+'" value="'+$input.val()+'" placeholder="'+$select.attr('data-placeholder')+'" /></div>');
                    $select.remove();
                    $input.val('');

                    me.hideAddButton();
                });
            },

            hideAddButton: function(){
                if(this.$popup.content.find('#select_page_url option').length === 1){
                    this.$popup.content.find('.add_page_url_button').closest('.upfront-social-setting-box').hide();
                }
            },

            get_title: 'GLOBAL SOCIAL SETTINGS',
            get_label: '',

            on_save: function () {

                var currentData = this.model.get('properties').toJSON();

                //TODO: Inject Social buttons to post top and bottom
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
                $FacebookPageUrl = $FacebookPageUrl.val() !== '' ? $FacebookPageUrl.val() : 0;

                var $TwitterPageUrl = this.$popup.content.find('#social_media_global_settings-twitter');
                $TwitterPageUrl = $TwitterPageUrl.val() !== '' ? $TwitterPageUrl.val() : 0;

                var $GooglePageUrl = this.$popup.content.find('#social_media_global_settings-google');
                $GooglePageUrl = $GooglePageUrl.val() !== '' ? $GooglePageUrl.val() : 0;

                var $LinkedInPageUrl = this.$popup.content.find('input#social_media_global_settings-linkedin');
                $LinkedInPageUrl = ($LinkedInPageUrl.length ? ($LinkedInPageUrl.val() !== '' ? $LinkedInPageUrl.val() : 0) : 0);

                var $YouTubePageUrl = this.$popup.content.find('input#social_media_global_settings-youtube');
                $YouTubePageUrl = ($YouTubePageUrl.length ? ($YouTubePageUrl.val() !== '' ? $YouTubePageUrl.val() : 0) : 0);

                var $PintrestPageUrl = this.$popup.content.find('input#social_media_global_settings-pintrest');
                $PintrestPageUrl = ($PintrestPageUrl.length ? ($PintrestPageUrl.val() !== '' ? $PintrestPageUrl.val() : 0) : 0);

                var $IsLiked = this.$popup.content.find('input#social_media_global_settings-is-liked:checked');
                $IsLiked = $IsLiked.length ? parseInt($IsLiked.val(), 10) : 0;

                var $IsTweet = this.$popup.content.find('input#social_media_global_settings-is-tweet:checked');
                $IsTweet = $IsTweet.length ? parseInt($IsTweet.val(), 10) : 0;

                var $IsGoogle = this.$popup.content.find('input#social_media_global_settings-is-gplus:checked');
                $IsGoogle = $IsGoogle.length ? parseInt($IsGoogle.val(), 10) : 0;

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
                this.model.set_property('is_liked', $IsLiked );
                this.model.set_property('is_tweet', $IsTweet );
                this.model.set_property('is_gplus', $IsGoogle );

                var setData = this.model.get('properties').toJSON();

                if(!_.isEqual(currentData, setData)){
                    Upfront.Popup.close();
                    Upfront.Util.post({"action": "upfront_save_social_media_global_settings", "data": JSON.stringify(setData)})
                        .success(function (ret) {
                            Upfront.Views.Editor.notify('Global Social Settings Updated!')
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error Saving settings");
                        });
                }
            },
            getLastPartOfUrl: function(url){
                var splitUrlArray = url.split('/'),
                    lastPart = splitUrlArray.pop();
                return lastPart;
            }

        });

        Upfront.data.social.panel = new SocialMediaGlobalSettingsPanel();



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
            this.init_property("popup_dialog", true);
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */

    var SocialMediaView = Upfront.Views.ObjectView.extend({
        settings: false,
        model:SocialMediaModel,
        initialize: function(){
            var me = this;
            Upfront.Views.ObjectView.prototype.initialize.call(this);
            Upfront.Events.on("entity:drag_stop", this.dragStop, this);
        },
        events: function(){
            return _.extend({},Upfront.Views.ObjectView.prototype.events,{
                "click input[name='social_button_layout_option']": "setSocialRadioTabbed"
            });
        },
        setSocialRadioTabbed: function(e){
            var  $social_radio_tabbed = $(e.target);
            this.property('social_radio_tabbed', $social_radio_tabbed.val());
        },
        dragStop: function(view, model){
            if(this.parent_module_view == view)
                this.openGlobalSettingsPopup();
        },
        openGlobalSettingsPopup: function(){
            if(this.model.get_property_value_by_name("popup_dialog")) {
                Upfront.data.social.panel.popupFunc();
                this.property('popup_dialog', false);
            };
        },
        property: function(name, value) {
            if(typeof value != "undefined")
                return this.model.set_property(name, value);
            return this.model.get_property_value_by_name(name);
        },
        global_property: function(name, value){
            if(typeof value != "undefined")
                return Upfront.data.social.panel.model.set_property(name, value);
            return Upfront.data.social.panel.model.get_property_value_by_name(name);
        },
        selectSocialButtonType: function(){
            var layoutStyle = this.property("social_radio_tabbed"),
                $buttonTypeEle =
                '<div class="upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios upfront-defaut-tabbed">' +
                        '<span class="upfront-field-multiple upfront-field-multiple-vertical">' +
                            '<input type="radio" id="'+this.cid+'-social_radio_tabbed-0" name="social_button_layout_option" value="like_tabbed" class="upfront-field-radio">' +
                            '<label for="'+this.cid+'-social_radio_tabbed-0"><span class="upfront-field-label-text">Like, Follow, +1</span></label>' +
                        '</span>' +
                        '<span class="upfront-field-multiple upfront-field-multiple-vertical">' +
                            '<input type="radio" id="'+this.cid+'-social_radio_tabbed-1" name="social_button_layout_option" value="count_tabbed" class="upfront-field-radio">' +
                            '<label for="vi'+this.cid+'-social_radio_tabbed-1"><span class="upfront-field-label-text">Fan, Follower count</span></label>' +
                        '</span>' +
                        '<span class="upfront-field-multiple upfront-field-multiple-vertical">' +
                            '<input type="radio" id="'+this.cid+'-social_radio_tabbed-2" name="social_button_layout_option" value="call_tabbed" class="upfront-field-radio">' +
                            '<label for="'+this.cid+'-social_radio_tabbed-2"><span class="upfront-field-label-text">Call to action icon</span></label>' +
                        '</span>' +
                '</div>';

            return $buttonTypeEle;
        },
        append_call_icon: function(iconClass,url){
            var buttonStyle = this.property('button_style'),
            buttonSize = this.property('button_size');
            return '<div class="upfront-'+iconClass+'-box upfront-social-icon upfront-'+buttonStyle+' upfront-button-size-'+buttonSize+'"><a class="upfront-call-to-action '+iconClass+'" href="'+ (url  ? url : '#' )+'"></a>'+ (!url ? '<span class="alert-url">!</span>':'' )+'</div>';
        },
        callToAction: function(){
            var $icons,
                me = this,
                buttonStyle = this.property('button_style'),
                calToActionSocialMediaServices = this.property('call_social_media_services'),
                iconClass;

            this.$el.find('.upfront-object-content').addClass('upfront-'+buttonStyle);
            $icons = $('<div class="upfront-call-to-action-box"></div>');
            $icons.empty();

            if(calToActionSocialMediaServices){
                _.each(calToActionSocialMediaServices, function(social) {
                    switch (social)
                    {
                        case 'facebook':
                            iconClass = 'facebook-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('facebook_page_url')));
                            break;
                        case 'twitter':
                            iconClass = 'twitter-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('twitter_page_url')));
                            break;
                        case 'google':
                            iconClass = 'gplus-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('google_page_url')));
                            break;
                        case 'linked-in':
                            iconClass = 'linkedin-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('linkedin_page_url')));
                            break;
                        case 'pinterest':
                            iconClass = 'pinterest-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('pintrest_page_url')));
                            break;
                        case 'youtube':
                            iconClass = 'youtube-link';
                            $icons.append(me.append_call_icon(iconClass,me.global_property('youtube_page_url')));
                            break;
                    }
                });

                if( !$.trim( $icons.html() ).length ) {
                    $icons.append('Please select Social Media Services ...!');
                }
            }
            else{
                $icons.append('Please select Social Media Services ...!');
            }
            $icons.wrap('<div />');
            return $icons.html();
        },
        append_count_icon: function(iconClass,social,url){
            var buttonStyle = this.property('button_style'),
                buttonSize = this.property('button_size');
            return '<div data-id="upfront-icon-'+social+'" class="ufront-'+iconClass+'-box upfront-social-icon"><a class="upfront-fan-counts '+iconClass+'" href="'+ (url ? url : '#' )+'"></a>'+ (!url ? '<span class="alert-url">!</span>':'' )+'</div>';
        },
        fanFollowerCount: function(){
            var $fanFollowerCount,
                me = this,
                countSocialMediaServices = this.property('count_social_media_services'),
                iconClass;

            $fanFollowerCount = $('<div class="upfront-fan-follow-count-box"></div>');
            $fanFollowerCount.empty();

            if(countSocialMediaServices){
                _.each(countSocialMediaServices, function(social) {
                    switch (social)
                    {
                        case 'facebook':
                            iconClass = 'facebook-count';
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.global_property('facebook_page_url')));
                            break;
                        case 'twitter':
                            iconClass = 'twitter-count';
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.global_property('twitter_page_url')));
                            break;
                        case 'google':
                            iconClass = 'gplus-count';
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.global_property('google_page_url')));
                            break;
                    }
                });

                if(me.global_property('facebook_page_url')){
                    var pageName = Upfront.data.social.panel.getLastPartOfUrl(me.global_property('facebook_page_url'));
                    $.getJSON('https://graph.facebook.com/'+pageName)
                        .done(function( data ) {
                            var likes;
                            if(data.likes){
                                likes = data.likes;
                            }
                            else{
                                likes = 'Error';
                            }
                            var countText = '<strong>'+data.likes+'</strong> Fans';
                            me.appendCounts('facebook', countText);
                        });
                }else{
                    var countText = 'Error FANS';
                    me.appendCounts('facebook', countText);
                }

                if(me.global_property('twitter_page_url')){
                    Upfront.Util.post({"action": "upfront_get_twitter_page_likes"})
                        .success(function (ret) {
                            var countText = '<strong>'+ret.data+'</strong> Followers';
                            me.appendCounts('twitter', countText);
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error loading Twitter Followers counts");
                        });
                }

                if(me.global_property('google_page_url')){
                    Upfront.Util.post({"action": "upfront_get_google_page_subscribers"})
                        .success(function (ret) {
                            var countText = '<strong>'+ret.data+'</strong> Subscribers';
                            me.appendCounts('google', countText);
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error loading Google subscribers counts");
                        });
                }

                if( !$.trim( $fanFollowerCount.html() ).length ) {
                    $fanFollowerCount.append('Please select Social Media Services ...!');
                }
            }
            else{
                $fanFollowerCount.append('Please select Social Media Services ...!');
            }

            return $fanFollowerCount.html();
        },

        appendCounts: function(id,countText){
            this.$el.find('div[data-id="upfront-icon-'+id+'"] .upfront-fan-count').remove();
            this.$el.find('div[data-id="upfront-icon-'+id+'"] a').append('<span class="upfront-fan-count"> '+countText+'</span>');
        },

        getShortContent: function(content,count){
            var content = '<div>'+content+'</div>',
                s = $(content).text(),
                smallContent = s.split(' ').slice(0,count).join(' ');
            return smallContent;
        },

        rawUrlEncode: function (str) {
            str = (str + '').toString();
            return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
                replace(/\)/g, '%29').replace(/\*/g, '%2A');
        },

        likeFollowPlusOne: function(){
            var $likeFollowPlusOne,
                counterOptions = this.property('counter_options'),
                likeSocialMediaServices = this.property('like_social_media_services'),
                me = this;
            $likeFollowPlusOne = $('<div class="upfront-like-follow-plus-one-box"></div>');
            $likeFollowPlusOne.empty();

            if(likeSocialMediaServices){

                var post = new Upfront.Models.Post({id: _upfront_post_data.post_id}).fetch();
                post.success(function(res){
                    var pageUrl = (!res.data.guid ? window.location.href : res.data.guid ),
                        pageContent = me.getShortContent(res.data.post_content,15)
                    me.$el.find('.upfront-object-content').empty();

                    _.each(likeSocialMediaServices, function(social) {
                        me.$el.find('.upfront-object-content').append('<div data-id="upfront-icon-'+social+'" class="upfront-social-icon">' +
                            (social == 'facebook' ? '<iframe src="//www.facebook.com/plugins/like.php?' +
                                'href='+me.rawUrlEncode(pageUrl)+'&amp;' +
                                'send=false&amp;' +
                                'layout='+(counterOptions == 'horizontal' ? 'button_count' : 'box_count')+'&amp;' +
                                'width=80&amp;' +
                                'show_faces=true&amp;' +
                                'font&amp;' +
                                'colorscheme=light&amp;' +
                                'action=like&amp;' +
                                'height='+(counterOptions == 'horizontal' ? '20' : '65')+'" ' +
                                'scrolling="no" frameborder="0" style="border:none; overflow:hidden; ' +
                                'width:'+(counterOptions == 'horizontal' ? '80' : '45')+'px; ' +
                                'height:'+(counterOptions == 'horizontal' ? '20' : '65')+'px;" ' +
                                'allowTransparency="true"></iframe>':'' )+

                            (social == 'twitter' ? '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="https://platform.twitter.com/widgets/tweet_button.html?' +
                                'text='+pageContent+'&amp;' +
                                'url='+me.rawUrlEncode(pageUrl)+'&amp;' +
                                'original_referer='+me.rawUrlEncode(pageUrl)+'&amp;' +
                                'count='+(counterOptions == 'horizontal' ? 'horizontal' : 'vertical')+'&amp;' +
                                'size=medium" style="' +
                                'width:'+(counterOptions == 'horizontal' ? '80' : '60')+'px; ' +
                                'height:'+(counterOptions == 'horizontal' ? '20' : '63')+'px;"></iframe>':'' )+

                            (social == 'google' ? '<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><div class="g-plusone" '+(counterOptions == 'horizontal' ? 'data-size="medium"' : 'data-size="tall"')+'></div>':'' )+

                            '</div>');
                    });

                    if( !$.trim( me.$el.find('.upfront-object-content').html() ).length ) {
                        me.$el.find('.upfront-object-content').append('Please select Social Media Services ...!');
                    }
                });
                $likeFollowPlusOne.append('Loading ...');
            }
            else{
                $likeFollowPlusOne.append('Please select Social Media Services ...!');
            }

            return $likeFollowPlusOne.html();
        },

        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        get_content_markup: function () {

            var me = this;
            var layoutStyle = this.property("social_radio_tabbed");

            switch (layoutStyle)
            {
                case false:
                    return me.selectSocialButtonType();
                    break;
                case 'like_tabbed':
                    return me.likeFollowPlusOne();
                    break;
                case 'count_tabbed':
                    return me.fanFollowerCount();
                    break;
                case 'call_tabbed':
                    return me.callToAction();
                    break;
            }
        }
    });
    /**
     * Sidebar element class - this let you inject element into
     * sidebar elements panel and allow drag and drop element adding
     * @type {Upfront.Views.Editor.Sidebar.Element}
     */
    var SocialMediaElement = Upfront.Views.Editor.Sidebar.Element.extend({
        priority: 60,
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
                        {"name": "class", "value": "c8 upfront-social-media_module"},
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

    var SocialServicesItem = Upfront.Views.Editor.Settings.Item.extend({
        events: function(){
        return _.extend({},SocialServicesItem.prototype.events,{
                "click .social-toggle": "social_toggle"
        });
        },
        social_toggle: function(){
            this.fields._wrapped[0].$el.toggle();
        },
        render: function () {
            if(this.group){
                this.$el.append(
                    '<div class="upfront-settings-item">' +
                        '<div class="upfront-settings-item-title">' + this.get_title() + '</div>' +
                        '<div class="upfront-settings-item-content">' +
                        '<span class="social-toggle">show/hide</span>' +
                        '<span class="social-sort">sort</span>' +
                        '</div>' +
                        '</div>'
                );
            }
            else
                this.$el.append('<div class="upfront-settings-item-content"></div>');

            $content = this.$el.find('.upfront-settings-item-content');
            this.fields.each(function(field){
                field.render();
                $content.append(field.el);
            });

            this.trigger('rendered');
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

    var SocialServicesSorting = Upfront.Views.Editor.Field.Checkboxes.extend({
        tagName: 'ul',
        className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes social_media_services_list',
        events: {
            'click a': 'buttonClicked'
        },
        type: 'checkbox',
        multiple: true,
        buttonClicked: function(e) {
            if(this.options.on_click)
                this.options.on_click(e);
        },
        initialize: function(options){
            var me = this;
            SocialServicesSorting.__super__.initialize.apply(this, arguments);
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
            this.$el.sortable({
                placeholder: "ui-state-highlight",
                update: function(event, ui) {
                    me.update_order();
                }
            });
            this.$el.before('<div>sdfsd</div>');
            this.trigger('rendered');
        },
        update_order: function(){
            var me = this,
                set_values;
            set_values = _.map(this.$el.find('.upfront-field-multiple'), function(item){
                var label = $(item).find('label').text(),
                    value = $(item).find('input').val();
                return {label: label, value: value};
            });
            this.model.set_property(this.options.sorted_label, set_values);
            this.model.set_property(this.property.id, this.get_value());
        },
        get_value_html: function (value, index) {
            var id = this.get_field_id() + '-' + index;
            var classes = "upfront-field-multiple";
            var attr = {
                'type': this.type,
                'id': id,
                'name': this.get_field_name(),
                'value': value.value,
                'class': 'upfront-field-' + this.type
            };
            var saved_value = this.get_saved_value();
            if ( this.options.layout )
                classes += ' upfront-field-multiple-'+this.options.layout;
            if ( value.disabled ){
                attr.disabled = 'disabled';
                classes += ' upfront-field-multiple-disabled';
            }
            if ( this.multiple && _.contains(saved_value, value.value) )
                attr.checked = 'checked';
            else if ( ! this.multiple && saved_value == value.value )
                attr.checked = 'checked';
            if ( attr.checked )
                classes += ' upfront-field-multiple-selected';
            return '<li class="' + classes + '"><i class="upfront-field-icon upfront-field-icon-social-sort"></i><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '"><span class="upfront-field-label-text">' + value.label + '</span></label></li>';
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
                // Radio tab with icon
                new Upfront.Views.Editor.Settings.Panel({
                    model: this.model,
                    label: "Layout Style",
                    title: "Layout Style settings",
                    tabbed: true,
                    settings: [
                        new Upfront.Views.Editor.Settings.ItemTabbed({
                            model: this.model,
                            title: "Like,<br> Follow, +1",
                            radio: true,
                            icon: "social-like",
                            property: 'social_radio_tabbed', // property value must be the same between radio tab
                            value: 'like_tabbed', // value means the value stored to property when this tab is selected
                            is_default: true, // set this tab as default (required)
                            settings: [
                                new Upfront.Views.Editor.Settings.Item({
                                    model: this.model,
                                    title: "Counter Options",
                                    fields: [
                                        new Upfront.Views.Editor.Field.Radios({
                                            model: this.model,
                                            property: 'counter_options',
                                            layout: "horizontal-inline",
                                            label: "",
                                            default_value: 'horizontal',
                                            values: [
                                                { label: "", value: 'horizontal', icon: 'social-count-horizontal' },
                                                { label: "", value: 'vertical', icon: 'social-count-vertical' }
                                            ]
                                        })
                                    ]
                                }),
                                new SocialServicesItem({
                                    className: 'upfront-social-services-item',
                                    model: this.model,
                                    title: "Social Media Services",
                                    fields: [
                                        new SocialServicesSorting({
                                            model: this.model,
                                            property: 'like_social_media_services',
                                            label: "",
                                            default_value: ["facebook", "twitter", "google"] ,
                                            sorted_label: 'like_sorted_values' ,
                                            values: this.model.get_property_value_by_name('like_sorted_values') ?
                                                this.model.get_property_value_by_name('like_sorted_values') :
                                            [
                                                { label: "Facebook", value: 'facebook' },
                                                { label: "Twitter", value: 'twitter' },
                                                { label: "Google +", value: 'google' }
                                            ]
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
                                                Upfront.Events.trigger("entity:settings:deactivate");
                                                Upfront.data.social.panel.popupFunc();
                                            }
                                        })
                                    ]
                                })
                            ]
                        }),
                        new Upfront.Views.Editor.Settings.ItemTabbed({
                            model: this.model,
                            title: "Fan, Follower count",
                            radio: true,
                            icon: "social-count",
                            property: 'social_radio_tabbed',
                            value: 'count_tabbed',
                            settings: [
                                new SocialServicesItem({
                                    className: 'upfront-social-services-item',
                                    model: this.model,
                                    title: "Social Media Services",
                                    fields: [
                                        new SocialServicesSorting({
                                            model: this.model,
                                            property: 'count_social_media_services',
                                            label: "",
                                            default_value: ["facebook", "twitter", "google"] ,
                                            sorted_label: 'count_sorted_values' ,
                                            values: this.model.get_property_value_by_name('count_sorted_values') ?
                                                this.model.get_property_value_by_name('count_sorted_values') :
                                                [
                                                    { label: "Facebook", value: 'facebook' },
                                                    { label: "Twitter", value: 'twitter' },
                                                    { label: "Google +", value: 'google' }
                                                ]
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
                        }),
                        new Upfront.Views.Editor.Settings.ItemTabbed({
                            model: this.model,
                            title: "Call to action icon",
                            radio: true,
                            icon: "social-button",
                            property: 'social_radio_tabbed',
                            value: 'call_tabbed',
                            settings: [
                                new Upfront.Views.Editor.Settings.Item({

                                    model: this.model,
                                    title: "Button Size",
                                    fields: [
                                        new Upfront.Views.Editor.Field.Radios({
                                            model: this.model,
                                            property: 'button_size',
                                            layout: "vertical",
                                            default_value: 'medium',
                                            label: "",
                                            values: [
                                                { label: "Small", value: 'small' },
                                                { label: "Medium", value: 'medium' },
                                                { label: "Large", value: 'large' }
                                            ]
                                        })
                                    ]
                                }),
                                new Upfront.Views.Editor.Settings.Item({
                                    model: this.model,
                                    title: "Button Style",
                                    fields: [
                                        new Upfront.Views.Editor.Field.Radios({
                                            model: this.model,
                                            property: 'button_style',
                                            layout: "horizontal-inline",
                                            default_value: 'button-style-2',
                                            label: "",
                                            values: [
                                                { label: "", value: 'button-style-1', icon: 'social-button-style-1' },
                                                { label: "", value: 'button-style-2', icon: 'social-button-style-2' },
                                                { label: "", value: 'button-style-3', icon: 'social-button-style-3' }
                                            ]
                                        })
                                    ]
                                }),
                                new SocialServicesItem({
                                    className: 'upfront-social-services-item',
                                    model: this.model,
                                    title: "Social Media Services",
                                    fields: [
                                        new SocialServicesSorting({
                                            model: this.model,
                                            property: 'call_social_media_services',
                                            label: "",
                                            default_value: ["facebook", "twitter", "google"] ,
                                            sorted_label: 'call_sorted_values' ,
                                            values: this.model.get_property_value_by_name('call_sorted_values') ?
                                                this.model.get_property_value_by_name('call_sorted_values') :
                                                [
                                                    { label: "Facebook", value: 'facebook' },
                                                    { label: "Twitter", value: 'twitter' },
                                                    { label: "Google +", value: 'google' },
                                                    { label: "Linked in", value: 'linked-in' },
                                                    { label: "Pinterest", value: 'pinterest' },
                                                    { label: "Youtube", value: 'youtube' }
                                                ]
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
                        }),
                    ]
                }),
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