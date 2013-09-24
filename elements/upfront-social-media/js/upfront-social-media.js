(function ($) {

    var GlobalSocialMediaModel = Upfront.Models.ObjectModel.extend({});

    var SocialMediaGlobalSettingsPanel = Backbone.View.extend({
        model: new GlobalSocialMediaModel({properties: JSON.parse(Upfront.data.social.settings)}),
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
            }, {width: 476});
            me.$popup.content.html(
                '<div class="upfront-global-social-settings"></div>'
            );
            me.settings = _([
                new Upfront.Views.Editor.Settings.Item({
                    model: this.model,
                    title: "Set up your Social accounts",
                    fields: [
                        new SocialServicesSorting({
                            model: this.model,
                            property: 'global_social_media_services',
                            label: "",
                            default_value: ["facebook", "twitter", "google"] ,
                            sorted_label: 'global_sorted_values' ,
                            values: this.model.get_property_value_by_name('global_sorted_values') ?
                                this.model.get_property_value_by_name('global_sorted_values') :
                                [
                                    { label: "Facebook", value: 'facebook' },
                                    { label: "Twitter", value: 'twitter' },
                                    { label: "Google +", value: 'google' }
                                ]
                        })
                    ]
                }),
                new Upfront.Views.Editor.Settings.Item({
                    model: this.model,
                    title: "In-post social media",
                    fields: [
                        new Upfront.Views.Editor.Field.Checkboxes({
                            model: this.model,
                            property: 'add_counter_all_posts',
                            label: "",
                            values: [
                                { label: "Add social media counters to all posts", value: 'yes' }
                            ]
                        }),
                        new Upfront.Views.Editor.Field.Checkboxes({
                            model: this.model,
                            property: 'after_post_title',
                            label: "",
                            values: [
                                { label: "After Post Title", value: 'yes' }
                            ]
                        }),
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'after_post_title_alignment',
                            label: "",
                            layout: "horizontal-inline",
                            values: [
                                { label: "", value: 'left' },
                                { label: "", value: 'center' },
                                { label: "", value: 'right' }
                            ]
                        }),
                        new Upfront.Views.Editor.Field.Checkboxes({
                            model: this.model,
                            property: 'after_post_content',
                            label: "",
                            values: [
                                { label: "After Post Content", value: 'yes' }
                            ]
                        }),
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'after_post_content_alignment',
                            label: "",
                            layout: "horizontal-inline",
                            values: [
                                { label: "", value: 'left' },
                                { label: "", value: 'center' },
                                { label: "", value: 'right' }
                            ]
                        }),
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'counter_options',
                            layout: "horizontal-inline",
                            label: "Social Counter style:",
                            default_value: 'horizontal',
                            values: [
                                { label: "", value: 'horizontal', icon: 'social-count-horizontal' },
                                { label: "", value: 'vertical', icon: 'social-count-vertical' }
                            ]
                        })
                    ]
                })
            ]);
            me.settings.each(function (setting) {
                if ( ! setting.panel )
                    setting.panel = me;
                setting.render();
                me.$popup.content.find('.upfront-global-social-settings').append(setting.el);
            });
            me.$popup.bottom.html('<button type="button" class="upfront-social-media-save_settings"><i class="icon-ok"></i>OK</button>');
            me.$popup.content.find('.upfront-global-social-settings > div:nth-child(2) .upfront-field-wrap:nth-child(1)').after('<div class="social-global-in-post">In-post location:</div>');
            me.$popup.content.find('.social-global-in-post').nextUntil().addClass('social-add-float-left');
            var inPostCheckboxes = me.$popup.content.find('input[name="after_post_title"], input[name="after_post_content"]'),
                inPostRadios = me.$popup.content.find('input[name="after_post_title_alignment"], input[name="after_post_content_alignment"]'),
                inPostRadiosTitle = me.$popup.content.find('input[name="after_post_title_alignment"]:checked'),
                inPostRadiosPost = me.$popup.content.find('input[name="after_post_content_alignment"]:checked');
            inPostCheckboxes.on( "change",{ me: me }, me.disableEnableAlignmentsCall );
            inPostRadios.on( "change",{ me: me }, me.changeLocation );

            me.checkDisableEnableAlignments(inPostCheckboxes);
            me.changeLocation(inPostRadiosTitle);
            me.changeLocation(inPostRadiosPost);
            me.clickOnSaveButton();
        },
        changeLocation: function(elements){
            if(!(elements instanceof $))
                elements = $(elements.target);
            if(!elements.is(':disabled'))
                elements.closest('.upfront-field-wrap').find('.social-alignment-detail').remove().end().append('<span class="social-alignment-detail">aligned '+elements.val()+'</span>');
        },
        disableEnableAlignmentsCall: function(e){
            e.data.me.checkDisableEnableAlignments($(e.target))
        },
        checkDisableEnableAlignments: function(elements){
            var me = this;
            if(elements[1]){
                $.each(elements, function(index, element){
                    me.toggleDisableEnableAlignments($(element));
                })
            }else{
                me.toggleDisableEnableAlignments(elements);
            }
        },
        toggleDisableEnableAlignments: function(element){
            var radio = element.closest('.upfront-field-wrap').next().find('input[type="radio"]'),
                property_name = radio.attr('name'),
                property_val = this.model.get_property_value_by_name(property_name);
            if(element.is(':checked')){
                radio.prop('disabled', false).parent().removeClass('upfront-field-multiple-disabled');
                if(property_val){
                    radio.each(function(){
                        if(property_val == $(this).val())
                            $(this).attr('checked','checked');
                    });
                }
                this.changeLocation(radio.filter(':checked'));
            }
            else{
                radio.prop('disabled', true).removeAttr('checked').parent().addClass('upfront-field-multiple-disabled');
                element.closest('.upfront-field-wrap').next().find('.social-alignment-detail').remove();
            }
        },
        clickOnSaveButton: function(){
            var me = this;
            this.$popup.bottom.find('.upfront-social-media-save_settings').on("click", function () {
                me.on_save();
            });
        },
        get_title: 'GLOBAL SOCIAL SETTINGS',
        get_label: '',
        on_save: function () {
            if (!this.settings) return false;
            var me = this,
                currentData = this.model.get('properties').toJSON();

            Upfront.Events.trigger("social:sorting:fields:save");
            this.settings.each(function (setting) {
                if ( (setting.fields || setting.settings).size() > 0 ) {
                    setting.save_fields();
                }
                else {
                    var value = me.model.get_property_value_by_name(setting.get_name());
                    if ( value != setting.get_value() )
                        me.model.set_property(
                            setting.get_name(),
                            setting.get_value()
                        );
                }
            });
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
                    '<div class="upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios upfront-default-tabbed">' +
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
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-facebook-url')));
                            break;
                        case 'twitter':
                            iconClass = 'twitter-link';
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-twitter-url')));
                            break;
                        case 'google':
                            iconClass = 'gplus-link';
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-google-url')));
                            break;
                        case 'linked-in':
                            iconClass = 'linkedin-link';
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-linked-in-url')));
                            break;
                        case 'pinterest':
                            iconClass = 'pinterest-link';
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-pinterest-url')));
                            break;
                        case 'youtube':
                            iconClass = 'youtube-link';
                            $icons.append(me.append_call_icon(iconClass,me.property('call_social_media_services-youtube-url')));
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
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.property('count_social_media_services-facebook-url')));
                            break;
                        case 'twitter':
                            iconClass = 'twitter-count';
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.property('count_social_media_services-twitter-url')));
                            break;
                        case 'google':
                            iconClass = 'gplus-count';
                            $fanFollowerCount.append(me.append_count_icon(iconClass,social,me.property('count_social_media_services-google-url')));
                            break;
                    }
                });

                if(me.property('count_social_media_services-facebook-url')){
                    var pageName = Upfront.data.social.panel.getLastPartOfUrl(me.property('count_social_media_services-facebook-url'));
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

                if(me.property('count_social_media_services-twitter-url')){
                    Upfront.Util.post({"action": "upfront_get_twitter_page_likes"})
                        .success(function (ret) {
                            var countText = '<strong>'+ret.data+'</strong> Followers';
                            me.appendCounts('twitter', countText);
                        })
                        .error(function (ret) {
                            Upfront.Util.log("Error loading Twitter Followers counts");
                        });
                }

                if(me.property('count_social_media_services-google-url')){
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
            this.$el.empty();
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

            var $content = this.$el.find('.upfront-settings-item-content');
            this.fields.each(function(field){
                field.render();
                $content.append(field.el);
            });
            var me = this;
            setTimeout(function(){
                var lis = $content.find('li');
                if(lis.length > 3){

                    var unsetValues = _.map(lis, function(li, key){
                        if(key > 2){
                            var input = $(li).find('input'),
                                value = input.val(),
                                label = input.next().find('span').text(),
                                property = input.attr('name'),
                                property_value = me.model.get_property_value_by_name(property);
                            if(!_.contains(property_value, value)){
                                input.parent().hide();
                                return { label: label, value: value };
                            }
                        }
                    });
                    unsetValues = _.without(unsetValues, undefined);
                    if(!unsetValues.length)
                        return false;
                    var Select = new Upfront.Views.Editor.Field.Select({
                        className: 'upfront-field-wrap upfront-field-wrap-select upfront-field-wrap-select-inline',
                        model: me.model,
                        property: 'select',
                        label: "",
                        values: unsetValues
                    });
                    var checkbox = new Upfront.Views.Editor.Field.Checkboxes({
                        className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes upfront-field-wrap-checkboxes-float',
                        model: me.model,
                        property: 'checkbox',
                        label: "",
                        values: [
                            { label: "", value: 'options1' }
                        ]
                    });
                    var textField = new Upfront.Views.Editor.Field.Text({
                        className: 'upfront-field-wrap upfront-field-wrap-text upfront-field-wrap-text-inline',
                        model: me.model,
                        property: 'text',
                        label: "link address",
                        compact: true
                    });
                    Select.render();
                    checkbox.render();
                    textField.render();
                    $content.append(checkbox.el)
                        .append(Select.el)
                            .append(textField.el)
                                .append('<i class="upfront-field-icon upfront-field-icon-social-add"></i>');
                    $content.find('.upfront-field-icon-social-add').on('click',{ me: me },me.add_social_network)

                }

            },105);
            this.trigger('rendered');
        },
        add_social_network: function(e){
            var currentEle = $(e.target),
                selectedOption = currentEle.prev().prev().find('.upfront-field-select-option-selected'),
                is_checked = currentEle.prev().prev().prev().find('input').is(":checked"),
                inputValue = currentEle.prev().find('input').val(),
                    selectedValue = selectedOption.find('input').val(),
                    $content = e.data.me.$el.find('.upfront-settings-item-content'),
                    nextTitle = selectedOption.next().find('label span').text();
                selectedOption.next().addClass('upfront-field-select-option-selected').end().remove();
                currentEle.prev().prev().find('.upfront-field-select-value').text(nextTitle);
                $content.find('li input[value="'+selectedValue+'"]').parent().show();
            if(is_checked){
                var values = e.data.me.model.get_property_value_by_name('call_social_media_services');
                values.push(selectedValue);
                e.data.me.model.set_property('call_social_media_services', values);
                $content.find('li input[value="'+selectedValue+'"]').attr('checked','checked').parent().addClass('upfront-field-multiple-selected');
            }
            if(inputValue){
                var url_value = e.data.me.model.get_property_value_by_name('call_social_media_services-'+selectedValue+'-url');
                e.data.me.model.set_property('call_social_media_services-'+selectedValue+'-url',inputValue);
                $content.find('li input[value="'+selectedValue+'"]').next().next().find('input').val(inputValue);
                currentEle.prev().find('input').val('');
            }
            var lis = currentEle.prev().prev().find('.upfront-field-select-options li');
            if(lis.length){
                var unsetValues = _.map(lis, function(li,index){
                    var label = $(li).find('label span').text(),
                        value = $(li).find('input').val();
                    return { label: label, value: value };
                });
                var Select = new Upfront.Views.Editor.Field.Select({
                    className: 'upfront-field-wrap upfront-field-wrap-select upfront-field-wrap-select-inline',
                    model: e.data.me.model,
                    property: 'select',
                    label: "",
                    values: unsetValues
                });
                Select.render();
                currentEle.prev().prev().replaceWith(Select.el);
            }
            if(!lis.length){
                currentEle.prev().prev().prev().remove();
                currentEle.prev().prev().remove();
                currentEle.prev().remove();
                currentEle.remove();
            }

            //alert($(e.target).prev().find('input').val());
            //e.data.me.render();
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
            'click .upfront-field-icon-social-down': 'showHide'
        },
        type: 'checkbox',
        multiple: true,
        showHide: function(e) {
            $(e.target).parent().find('.upfront-field-wrap-text').toggle();
        },
        initialize: function(options){
            var me = this;
            SocialServicesSorting.__super__.initialize.apply(this, arguments);
            Upfront.Events.on("social:sorting:fields:save", this.save_c_fields, this);
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
                start: function( event, ui ) {
                    ui.item.parent().find('.ui-state-highlight').height(ui.item.outerHeight());
                },
                stop: function( event, ui ) {
                    ui.item.parent().find('.ui-state-highlight').height('');
                },
                update: function(event, ui) {
                    me.update_order();
                }
            });
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
        global_property: function(name, value){
            if(typeof value != "undefined")
                return Upfront.data.social.panel.model.set_property(name, value);
            return Upfront.data.social.panel.model.get_property_value_by_name(name);
        },
        set_global_value_by_default: function(field,service){
            if(this.global_property('global_social_media_services-'+service+'-url')){
                field.property.set('value',this.global_property('global_social_media_services-'+service+'-url'));
                field.$el.find('input').val(this.global_property('global_social_media_services-'+service+'-url'));
            }
        },
        get_value_html: function (value, index) {
            var id = this.get_field_id() + '-' + index;
            var classes = "upfront-field-multiple";
            var me = this;
            var attr = {
                'type': this.type,
                'id': id,
                'name': this.get_field_name(),
                'value': value.value,
                'class': 'upfront-field-' + this.type
            };
            this.c_fields = _([
                new Text_Field({
                    model: this.model,
                    property: me.property.id+'-'+value.value+'-url',
                    label: 'link address',
                    compact: true
                }),
                new Text_Field({
                    model: this.model,
                    property: value.value+'-consumer-key',
                    label: 'Consumer key',
                    compact: true
                }),
                new Text_Field({
                    model: this.model,
                    property: value.value+'-consumer-secret',
                    label: 'Consumer secret',
                    compact: true
                })
            ]);

            me.c_fields.each(function(field, index, list){
                if(field.property){
                    field.render();
                    field.$el.hide();

                    if(index == 1 || index == 2)
                        if(me.property.id == 'count_social_media_services' && value.value == 'twitter'){
                            setTimeout(function(){
                                me.$el.find('#'+id).closest('li').append(field.el);
                            },100)
                        }

                    if(index == 0)
                        if(me.property.id == 'count_social_media_services' || me.property.id == 'call_social_media_services' || me.property.id == 'global_social_media_services' ){
                            setTimeout(function(){
                                me.$el.find('#'+id).closest('li').append(field.el);
                                if(!field.get_saved_value()){
                                    switch (field.property.id)
                                    {
                                        case 'count_social_media_services-facebook-url':
                                            me.set_global_value_by_default(field,'facebook');
                                            break;
                                        case 'count_social_media_services-twitter-url':
                                            me.set_global_value_by_default(field,'twitter');
                                            break;
                                        case 'count_social_media_services-google-url':
                                            me.set_global_value_by_default(field,'google');                                            ;
                                            break;
                                        case 'call_social_media_services-facebook-url':
                                            me.set_global_value_by_default(field,'facebook');
                                            break;
                                        case 'call_social_media_services-twitter-url':
                                            me.set_global_value_by_default(field,'twitter');
                                            break;
                                        case 'call_social_media_services-google-url':
                                            me.set_global_value_by_default(field,'google');                                            ;
                                            break;
                                    }
                                }
                            },100)
                        }
                }
            });


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
            return '<li class="' + classes + '">'+(me.property.id !== 'like_social_media_services' ? '<i class="upfront-field-icon upfront-field-icon-social-sort upfront-field-icon-social-down"></i>':'')+'<i class="upfront-field-icon upfront-field-icon-social-sort"></i><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '"><span class="upfront-field-label-text">' + value.label + '</span></label></li>';
        },
        save_c_fields: function () {
            var changed = _([]);
            var me = this;
            this.$el.find('input[type="text"]').each(function(index,data){
                var property = $(data).attr('name');
                var value = $(data).val();
                var saved_value = me.model.get_property_value_by_name(property);
                if(value !== saved_value){
                    me.model.set_property(property,value);
                }
            });
        }
    });

    var Text_Field =  Upfront.Views.Editor.Field.Text.extend({
    });

    var Extended_Panel = Upfront.Views.Editor.Settings.Panel.extend({
        initialize: function(options){
            Extended_Panel.__super__.initialize.apply(this, arguments);
            Upfront.Events.on("entity:settings:deactivate", this.close, this);
            this.on("upfront:settings:panel:saved",this.save_checkboxes, this );
        },
        close: function(){
            this.off("upfront:settings:panel:saved",this.save_checkboxes, this );
            Upfront.Events.off("entity:settings:deactivate", this.close, this);
        },
        save_checkboxes: function(){
            Upfront.Events.trigger("social:sorting:fields:save");
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
                new Extended_Panel({
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