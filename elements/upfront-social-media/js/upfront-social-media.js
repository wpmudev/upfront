(function ($) {


    define([
            'text!elements/upfront-social-media/tpl/social-back.html'
        ], function(backTpl) {

    var l10n = Upfront.Settings.l10n.social_element;
    var GlobalSettingsPanel = Backbone.View.extend({
        popup: false,
        deferred: false,
        model: false,
        tpl: _.template($(backTpl).find('#global-tpl').html()),

        events: {
            'click .use': 'store',
            'click li': 'revealUrl',
            'change input[name=services]': 'toggleService',
            //'click .usocial-global-triangle': 'revealUrl',
            'change .usocial_post_location': 'changePostLocation',
            'change input[name=after_title_align]': 'changeAlign',
            'change input[name=after_content_align]': 'changeAlign'
        },

        popupFunc: function(){
            return this.open();
        },

        isOpen: function(){
            return $('.upfront-global-social-settings').length;
        },

        open: function(){
            var me = this,
                bindEvents = false
            ;

            console.log('Global social settings');

            this.popup = Upfront.Popup.open(function(){});
            this.deferred = $.Deferred();
            this.setElement($('#upfront-popup'));

            settings = _.clone(Upfront.data.usocial.globals ? Upfront.data.usocial.globals : Upfront.data.usocial.global_defaults);
            settings.l10n = l10n.template;

            this.$('#upfront-popup-top').html('<ul class="upfront-tabs">' +
                    '<li class="active upfront-social-popup-hd">' + l10n.global_settings + '</li>' +
                    '</ul>'
            );

            this.$('#upfront-popup-bottom')
                .html('<div class="use_selection_container"><a href="#use" class="use">' + l10n.ok + '</a></div>');

            this.$('#upfront-popup-content').html(this.tpl(settings));

            this.setDraggableUp();

            return this.deferred.promise();
        },
        setDraggableUp: function(){
            this.$('ul').sortable({
                handle: '.upfront-field-icon-social-sort'
            });
        },
        store: function(e){
            e.preventDefault();
            var me = this,
                setData = {
                    inpost: this.$('input[name="inpost"]:checked').length ? ['yes'] : [],
                    after_title: this.$('input[name="after_title"]:checked').length ? ['yes'] : [],
                    after_title_align: this.$('input[name="after_title_align"]:checked').val(),
                    after_content: this.$('input[name="after_content"]:checked').length ? ['yes'] : [],
                    after_content_align: this.$('input[name="after_content_align"]:checked').val(),
                    counter_style: this.$('input[name="counter_style"]:checked').val()
                },
                services = [],
                setDataProperties = false
            ;

            this.$('.social_media_services_list').find('input[type=checkbox]').each(function(idx, cb){
                var $cb = $(cb),
                    service = {
                        id: $cb.val(),
                        active: $cb.is(':checked'),
                        meta: Upfront.data.usocial.global_defaults.services[$cb.val()].meta
                    }
                ;

                service.name = Upfront.data.usocial.global_defaults.services[service.id].name;
                service.url = me.$('input[name="' + service.id + '-url"]').val();

                services.push(service);
            });

            setData.services = services;

            setDataProperties = this.arrayToProperties(setData);

            var loading = new Upfront.Views.Editor.Loading({
                loading: l10n.saving,
                fixed: false
            });

            loading.render();
            this.$('#upfront-popup-content').css('position', 'relative').append(loading.$el);
            Upfront.Util.post({"action": "usocial_save_globals", "data": JSON.stringify(setDataProperties)})
                .success(function (ret) {
                    loading.cancel();
                    Upfront.Popup.close();
                    Upfront.Views.Editor.notify(l10n.updated);
                    Upfront.data.usocial.globals = setData;
                    me.deferred.resolve(setData);
                })
                .error(function (ret) {
                    Upfront.Util.log("Error Saving settings");
                })
            ;
        },

        revealUrl: function(e){
            //e.preventDefault();
            var li = $(e.target).hasClass('usocial-global-triangle') ? $(e.target).closest('li') : $(e.target),
                open = li.parent().find('.open')
            ;
            open.removeClass('open').find('.upfront-field-wrap-text').slideUp('fast');
            if(open[0] != li[0])
                li.addClass('open').find('.upfront-field-wrap-text').slideDown('fast');
        },

        toggleService: function(e){
            e.preventDefault();
            var check = $(e.target),
                li = $(e.target).closest('li');
                input = li.find('input[type=text]')
            ;

            if(check.is(':checked') && !input.val() && !input.is(':visible')){
                e.target = li[0];
                this.revealUrl(e);
                input.focus();
            }
        },

        changePostLocation: function(e){
            var check = $(e.target),
                checked = check.is(':checked'),
                wrapper = check.closest('.usocial-global-add-post')
            ;

            if(checked){
                check.parent().addClass('upfront-field-multiple-selected');
                wrapper.find('.usocial-global-align')
                    .addClass('align-active')
                    .find('input[type=radio]')
                        .attr('disabled', false)
                ;
            }
            else {
                check.parent().removeClass('upfront-field-multiple-selected');
                wrapper.find('.usocial-global-align')
                    .removeClass('align-active')
                    .find('input[type=radio]')
                        .attr('disabled', true)
                ;
            }
        },

        changeAlign: function(e){
            var check = $(e.target),
                checked = check.is(':checked')
            ;

            if(checked){
                check.closest('.upfront-field-wrap')
                    .find('.usocial-global-align-label')
                        .text(l10n.aligned + ' ' + check.val())
                ;
            }
        },

        arrayToProperties: function(arr){
            var props = [];
            _.each(arr, function(value, name){
                props.push({name: name, value: value});
            });
            return props;
        }
    });

    //Upfront.data.social.panel = new SocialMediaGlobalSettingsPanel();
    Upfront.data.social.panel = new GlobalSettingsPanel();

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
            var properties = _.clone(this.getDefaults());//Upfront.data.usocial.defaults);
            properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
            this.init_properties(properties);
        },

        /**
         * Create the defaults from the global settings.
         */
        getDefaults: function() {
            var globals = Upfront.data.usocial.globals,
                defaults = Upfront.data.usocial.defaults,
                order = [],
                active = [],
                urls = {}
            ;

            if(!globals){
                return defaults;
            }

            _.each(globals.services, function(service){
                order.push(service.id);
                if(service.active)
                    active.push(service.id);

                urls[service.id] = service.url;
            });

            //Button type services
            var bs = _.clone(globals.services);

            bs.push({id: 'linked-in', name: 'Linked in', active: false, url: '', meta:{}});
            bs.push({id: 'pinterest', name: 'Pinterest', active: false, url: '', meta:{}});
            bs.push({id: 'youtube', name: 'Youtube', active: false, url: '', meta:{}});

            return _.extend({}, defaults, {
                services: globals.services,
                button_services: bs,
                counter_options: globals.counter_style
            });
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */
    var SocialMediaView = Upfront.Views.ObjectView.extend({
        settings: false,
        counts: false,
        initialize: function(){
            if(! (this.model instanceof SocialMediaModel)){
                this.model = new SocialMediaModel({properties: this.model.get('properties')});
            }
            Upfront.Views.ObjectView.prototype.initialize.call(this);
            Upfront.Events.on("entity:drag_stop", this.dragStop, this);
        },

        dragStop: function(view, model){
            var me = this;
            if(this.parent_module_view == view && !Upfront.data.usocial.globals && !Upfront.data.social.panel.isOpen()){
                Upfront.data.social.panel.open().done(function(globals){
                    var defaults = me.model.getDefaults();
                    _.each(defaults, function(value, key){
                        me.model.set_property(key, value, true);
                    });
                    me.model.trigger('change');
                });
                console.log('No globals');
            }
        },

        property: function(name, value) {
            if(typeof value != "undefined")
                return this.model.set_property(name, value);
            return this.model.get_property_value_by_name(name);
        },

        buttons: function() {
            var services = this.property('button_services'),
                buttonStyle = this.property('button_style'),
                buttonSize = this.property('button_size'),
                markup = ''
            ;

            if(!services.length)
                return '<span class="upfront-general-notice">' + l10n.add_some_services + '</span>';

            _.each(services, function(s){
                var alert = s.url ? '' : '<span class="alert-url">!</span>';
                if(s.active)
                    markup += '<div class="upfront-' + s.id + '-link-box upfront-social-icon upfront-'+buttonStyle+' usocial-button-'+buttonSize+'">' +
                            '<a class="usocial-button '+ s.id +'-link" href="'+ s.url +'"></a>'+ alert +
                            '</div>';
            });

            return markup;
        },

        fans: function(){
            var me = this,
                services = this.property('services'),
                markup = '',
                buttonStyle = this.property('button_style'),
                buttonSize = this.property('button_size'),
                words = {
                    'facebook': l10n.fans,
                    'twitter': l10n.followers,
                    'google': l10n.subscribers
                }
            ;

            _(services).each( function( s ) {
              if(s.active){
                var alert = s.url ? '' : '<span class="alert-url">!</span>',
                    count = me.getCount(s)
                ;

                markup += '<div data-id="upfront-icon-' + s.id + '" class="ufront-' + s.id + '-count-box upfront-social-icon usocial_count_wrapper">' +
                            '<a class="upfront-fan-counts ' + s.id + '-count" href="'+ s.url +'">'+
                            alert +
                            ' <span class="upfront-fan-count"><strong class="usocial_count">'+ count +'</strong> ' + words[s.id] + '</span></a>' +
                            '</div>';
              }
            });

            if(!markup)
                return '<span class="upfront-general-notice">' + l10n.add_some_services + '</span>';

            this.refreshCount();

            return markup;
        },

        getCount: function(service){
            var me = this,
                s = service.id,
                count = false,
                fetchCount = false,
                id = this.property('element_id')
            ;

            if(typeof usocial == 'undefined' || !usocial.counts || !usocial.counts[id] || !usocial.counts[id][service.id])
                fetchCount = true;

            if(!fetchCount)
                return usocial.counts[id][service.id];

            if(!this.counts)
                this.refreshCount();
            else
                this.counts.done(function(response){
                    var count = response.data[s];
                    me.$el.find('div[data-id="upfront-icon-'+ s +'"]').find('strong.usocial_count').html(count);
                });

            return 'Loading';
        },

        refreshCount: function(){
            var me = this;
            this.counts = Upfront.Util.post({
                    action: "usocial_get_counts",
                    element_id: this.property('element_id'),
                    services: me.property('services')
                })
                .done(function(response){
                    _.each(response.data, function(count, s){
                        me.$el.find('div[data-id="upfront-icon-'+ s +'"]').find('strong.usocial_count').html(count);
                    });
                })
            ;
        },

        rawUrlEncode: function (str) {
            str = (str + '').toString();
            return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
                replace(/\)/g, '%29').replace(/\*/g, '%2A');
        },

        likes: function(){
            var counterOptions = this.property('counter_options'),
                services = this.property('services'),
                me = this,
                markup = ''
            ;

            if(services.length){
                var hor = counterOptions == 'horizontal',
                    data = {
                        url: this.rawUrlEncode(location.href),
                        style: counterOptions,
                        width: hor ? 90 : 70,
                        height: hor ? 20 : 60,
                        size: hor ? 'medium' : 'tall',
                        layout: hor ? 'button_count' : 'box_count',
                        text: document.title ? document.title : l10n.awesome_stuff,
                        l10n: l10n.template
                    },
                    tpls = {
                        facebook: 'fb_like-tpl',
                        twitter: 'tweet-tpl',
                        google:'plusone-tpl'
                    }
                ;
                _.each(services, function(s){
                    if(s.active){
                        var tpl = _.template($(backTpl).find('#' + tpls[s.id]).html());
                        markup += tpl(data);
                    }
                });
            }

            return markup ? markup : '<span class="upfront-general-notice">' + l10n.select_some + '</span>';
        },

        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        get_content_markup: function () {
            if(!Upfront.data.usocial.globals) {
                return '<span class="upfront-general-notice">' + l10n.no_global_settings_nag + '</span>';
						}

            var me = this,
                layoutStyle = this.property("social_type"),
                markup = ''
            ;

            switch (layoutStyle)
            {
                case 'likes':
                    markup = me.likes();
                    break;
                case 'fans':
                    markup = me.fans();
                    break;
                case 'buttons':
                    markup = me.buttons();
                    break;
            }

            this.$el.html(markup);
            return markup;
        }
    });
    /**
     * Sidebar element class - this let you inject element into
     * sidebar elements panel and allow drag and drop element adding
     * @type {Upfront.Views.Editor.Sidebar.Element}
     */
    var SocialMediaElement = Upfront.Views.Editor.Sidebar.Element.extend({
        priority: 60,
        draggable: false,
        render: function () {
            this.$el.addClass('upfront-icon-element upfront-icon-element-social');
            this.$el.html(l10n.element_name);
        },
        add_element: function () {
            var object = new SocialMediaModel(),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c8 upfront-social-media_module"},
                        {"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(60)}
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
                        '<div class="upfront-settings-item-title"><span>' + this.get_title() + '</span></div>' +
                        '<div class="upfront-settings-item-content">' +
                        '<span class="social-toggle">' + l10n.drag_reorder + '</span>' +
                        '<span class="social-sort"></span>' +
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

    var SocialSorter = Upfront.Views.Editor.Field.Field.extend({
        className: '',
        tpl: _.template($(backTpl).find('#service-tpl').html()),
        variableTpl: _.template($(backTpl).find('#add-service-tpl').html()),
        events: {
            'click .usocial-global-triangle': 'toggleService',
            'click .usocial-select': 'showServiceList',
            'blur .usocial-select': 'hideServiceList',
            'click .upfront-field-select-option': 'selectService',
            'click .usocial-add': 'addService',
            'change input[type=checkbox]': 'changeService',
            'blur input.usocial_text': 'updateServiceMeta'
        },

        initialize: function(options){
            var me = this;
            me.options = options;
            SocialSorter.__super__.initialize.apply(this, arguments);
            //Upfront.Events.on("social:sorting:fields:save", this.save_c_fields, this);
            this.$el.on('click', function(e){
                me.hideServiceList(e);
            });
        },

        render: function(){
            var me = this,
                nonActive = [],
                services = this.prop(this.options.prop)
            ;
            this.$el.html('<ul class="upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes social_media_services_list"></ul>');
            _.each(services, function(service){
                if(!me.options.variable || service.active){
                    me.$('ul').append(me.tpl({
                        service: service,
                        expandable: me.options.expandable,
                        meta: me.options.meta,
                        l10n: l10n.template
                    }));
                }

                if(!service.active)
                    nonActive.push(service);
            });

            this.initSortable();

            if(this.options.variable){
                this.$el.append(this.variableTpl({services: nonActive, l10n: l10n.template}));
            }

            this.trigger('rendered');
        },

        toggleService: function(e){
            var meta = $(e.target).siblings('.upfront-field-wrap-text');
            if(meta.is(':visible'))
                meta.slideUp('fast');
            else
                meta.slideDown('fast');
        },

        showServiceList: function(e){
            console.log('Show');
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).removeClass('usocial-select-closed').focus();
        },

        hideServiceList: function(e){
            this.$('.usocial-select').addClass('usocial-select-closed');
        },

        selectService: function(e){
            if(!this.$('.usocial-select').hasClass('usocial-select-closed')){
                e.preventDefault();
                e.stopPropagation();
                var option = $(e.currentTarget).detach();
                this.$('.usocial-select-list').prepend(option);
                this.$('.usocial-select').addClass('usocial-select-closed');
            }
        },

        addService: function(e) {
            e.preventDefault();
            var serviceToAdd = this.$('.usocial-select-list').find('input').first().val(),
                all = this.prop(this.options.prop),
                serviceData = {}
            ;

            _.each(all, function(service){
                if(service.id == serviceToAdd){
                    service.active = true;
                    serviceData = service;
                }
            });
            //Update services
            this.prop(this.options.prop, all, true);
            //Animate all
            var $service = $(this.tpl({service: serviceData, expandable: this.options.expandable, l10n: l10n.template}))
                            .hide()
                            .find('.upfront-field-wrap-text')
                                .show().end()
            ;
            this.$('.social_media_services_list').append($service);
            $service.slideDown('fast').find('input[type=text]').focus();

            this.$('.usocial-select-list').find('li').first().remove();
        },

        changeService: function(e){
            var check = $(e.target),
                currentService = check.val(),
                services = this.prop(this.options.prop)
            ;

            _.each(services, function(s){
                if(s.id == currentService)
                    s.active = check.is(':checked');
            });

            this.prop(this.options.prop, services, false);

            if(check.is(':checked') && this.options.expandable){
                var input = check.parent().find('input[type=text]');
                if(! input.val()){
                    check.siblings('.upfront-field-wrap-text').slideDown();
                    input.focus();
                }
            }

            this.model.trigger('change');
        },

        initSortable: function(){
            var me = this;
            this.$('ul').sortable({
                start: function( event, ui ) {
                },
                stop: function( event, ui ) {
                },
                update: function(event, ui) {
                    me.updateOrder();
                }
            });
        },

        updateOrder: function(){
            this.save(true);
        },

        updateServiceMeta: function(e){
            var input = $(e.target),
                type = input.data('field'),
                value = input.val(),
                service = this.serv(input.data('service'))
            ;

            if(!value)
                input.closest('li').find('input[type=checkbox]').attr('checked', false);

            if(!service)
                return console.log('Unknown service couldn\'t be saved');

            if(type == 'url')
                service.url = value;
            else {
                var meta = service.meta;
                for(var m in meta){
                    if(meta[m].id == type)
                        meta[m].value = value;
                }
                service.meta = meta;
            }

            this.serv(input.data('service'), service, false);
        },
        /*
        Called when the save button is pressed and the SocialSorter is visible
         */
        save: function(onlyOrder){
            var me = this,
                services = this.prop(this.options.prop),
                hash = {},
                order = this.$('.ui-sortable').find('input[type=checkbox]'),
                added = [],
                newServices = []
            ;
            _.each(services, function(s){
                hash[s.id] = s;
            });

            if(typeof onlyOrder == 'undefined')
                onlyOrder = false;

            order.each(function(idx, input){
                var $input = $(input),
                    service = hash[$input.val()]
                ;
                if(service){
                    if(!onlyOrder){
                        service.active = $input.is(':checked');
                        if(me.options.expandable){
                            var wrap = $input.closest('li');
                            service.url = wrap.find('input[name=' + service.id + '_url]').val();
                            if(service.meta.length){
                                _.each(service.meta, function(m){
                                    m.value = wrap.find('input[name=' + m.id + ']' ).val();
                                });
                            }
                        }
                    }
                    newServices.push(service);
                    added.push(service.id);
                }
            });

            _.each(services,function(s){
                if(added.indexOf(s.id) == -1)
                    newServices.push(s);
            });

            this.prop(this.options.prop, newServices, false);
        },
        /*
        Shorcut to get/update a service
         */
        serv: function(id, value, silent){
            var services = this.prop(this.options.prop);
            if(typeof value == 'undefined'){
                for(var srv in services){
                    if(services[srv].id == id)
                        return services[srv];
                }
                return false;
            }

            var added = false;
            for(var s in services){
                if(services[s].id == id){
                    services[s] = value;
                    added = true;
                }
            }
            if(!added)
                services.push(value);

            if(typeof silent == 'undefined')
                silent = true;

            this.prop(this.options.prop, services, silent);
        },

        /*
        Shorcut to set and get model's properties.
        */
        prop: function(name, value, silent) {
            if(typeof value != "undefined"){
                if(typeof silent == "undefined")
                    silent = true;
                return this.model.set_property(name, value, silent);
            }
            return this.model.get_property_value_by_name(name);
        }
    });

    var SocialSettings = Upfront.Views.Editor.Settings.Settings.extend({
        panel: false,
        servicesItems: [],
        events: {
            'change input[type=radio]': 'changeRadio'
        },
        initialize: function(opts){
            this.options = opts;
            this.panel = new Upfront.Views.Editor.Settings.Panel({
                model: this.model,
                label: l10n.opts.layout_label,
                title: l10n.opts.layout_title,
                tabbed: true,
                settings: [
                    new Upfront.Views.Editor.Settings.ItemTabbed({
                        model: this.model,
                        title: l10n.opts.action,
                        radio: true,
                        icon: "social-like",
                        property: 'social_type', // property value must be the same between radio tab
                        value: 'likes', // value means the value stored to property when this tab is selected
                        is_default: true, // set this tab as default (required)
                        settings: this.getLikesSettings()
                    }),
                    new Upfront.Views.Editor.Settings.ItemTabbed({
                        model: this.model,
                        title: l10n.opts.counts,
                        radio: true,
                        icon: "social-count",
                        property: 'social_type',
                        value: 'fans',
                        settings: this.getFansSettings()
                    }),
                    new Upfront.Views.Editor.Settings.ItemTabbed({
                        model: this.model,
                        title: l10n.opts.cta,
                        radio: true,
                        icon: "social-button",
                        property: 'social_type',
                        value: 'buttons',
                        settings: this.getButtonsSettings()
                    })
                ]
            });
            this.panels = _([
				new Upfront.Views.Editor.Settings.Panel({
                        model: this.model,
                        label: l10n.opts.general_label,
                        title: l10n.opts.general_title,
                        settings: []
						}),
				this.panel
			]);
            this.panel.on('upfront:settings:panel:saved', this.saveServices, this);
        },

        getLikesSettings: function(){
            var services = new SocialSorter({
                model: this.model,
                prop: 'services',
                expandable: false
            });

            this.servicesItems.push(services);

            return [
                new Upfront.Views.Editor.Settings.Item({
                    model: this.model,
                    title: l10n.opts.counter,
                    fields: [
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'counter_options',
                            layout: "horizontal-inline",
                            label: "",
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
                    title: l10n.opts.services,
                    fields: [services]
                }),
                this.getGlobalsButton()
            ];
        },
        getFansSettings: function(){
            var services =  new SocialSorter({
                model: this.model,
                prop: 'services',
                meta: true,
                expandable: true
            });

            this.servicesItems.push(services);
            return [
                new SocialServicesItem({
                    className: 'upfront-social-services-item',
                    model: this.model,
                    title: l10n.opts.services,
                    fields: [services]
                }),
                this.getGlobalsButton()
            ];
        },
        getButtonsSettings: function(){
            var services = new SocialSorter({
                model: this.model,
                prop: 'button_services',
                expandable: true,
                variable: true
            });

            this.servicesItems.push(services);
            return [
                new Upfront.Views.Editor.Settings.Item({

                    model: this.model,
                    title: l10n.opts.button_size,
                    fields: [
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'button_size',
                            layout: "vertical",
                            label: "",
                            values: [
                                { label: l10n.opts.small, value: 'small' },
                                { label: l10n.opts.medium, value: 'medium' },
                                { label: l10n.opts.large, value: 'large' }
                            ]
                        })
                    ]
                }),
                new Upfront.Views.Editor.Settings.Item({
                    model: this.model,
                    title: l10n.opts.button_style,
                    fields: [
                        new Upfront.Views.Editor.Field.Radios({
                            model: this.model,
                            property: 'button_style',
                            layout: "horizontal-inline",
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
                    title: l10n.opts.services,
                    fields: [services]
                }),
                this.getGlobalsButton()
            ];
        },

        getGlobalsButton: function() {
            return new Upfront.Views.Editor.Settings.Item({
                className: 'upfront-social-back',
                group: false,
                fields: [
                    new Field_Button({
                        model: this.model,
                        info: l10n.opts.back_to,
                        label: l10n.global_settings,
                        on_click: function(e){
                            e.preventDefault();
                            Upfront.Events.trigger("entity:settings:deactivate");
                            Upfront.data.social.panel.popupFunc();
                        }
                    })
                ]
            });
        },

        changeRadio: function(e) {
            var input = $(e.target),
                name = input.attr('name'),
                value = this.$el.find('input[name=' + name + ']:checked').val()
            ;

            this.model.set_property(name, value);
        },

        get_title: function () {
            return l10n.opts.social_settings;
        },

        render: function() {
            var me = this;
            if(!Upfront.data.usocial.globals)
                Upfront.data.social.panel.open().done(function(globals){
                    _.each(globals, function(val, name){
                        me.model.set_property(name, val, true);
                    });
                    me.model.trigger('change');
                });
            else
                this.constructor.__super__.render.call(this);
        },

        saveServices: function(){
            console.log('Saving services');
            _.each(this.servicesItems, function(s){
                if(s.$el.is(':visible'))
                    s.save();
            });
            this.model.trigger('change');
        }
    });

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

    //Upfront.Application.LayoutEditor.add_object("SocialMedia", { Removing social element for now
    //    "Model": SocialMediaModel,
    //    "View": SocialMediaView,
    //    "Element": SocialMediaElement,
    //    "Settings": SocialSettings,
	// cssSelectors: {
			// '.upfront-object-content': {label: l10n.css.container_label, info: l10n.css.container_info},
			// '.upfront-social-icon ': {label: l10n.css.box_label, info: l10n.box_info},
			// '.upfront-linked-in-link-box': {label: l10n.css.linked_label, info: l10n.css.linked_info},
			// '.upfront-twitter-link-box, .ufront-twitter-count-box, .upfront-social-icon-twitter': {label: l10n.css.twitter_label, info: l10n.css.twitter_info},
			// '.upfront-google-link-box, .ufront-google-count-box, .upfront-social-icon-google': {label: l10n.css.google_label, info: l10n.css.google_info},
			// '.upfront-facebook-link-box, .ufront-facebook-count-box, .upfront-social-icon-facebook': {label: l10n.css.fb_label, info: l10n.css.fb_info},
			// '.upfront-pinterest-link-box': {label: l10n.css.pin_label, info: l10n.css.pin_info},
			// '.upfront-youtube-link-box': {label: l10n.css.yt_label, info: l10n.css.yt_info},
	// },
		// cssSelectorsId: Upfront.data.usocial.defaults.type
		///*,
    //    'anchor': {
    //      is_target: false
    //    }*/
    //});

    Upfront.Models.SocialMediaModel = SocialMediaModel;
    Upfront.Views.SocialMediaView = SocialMediaView;

    }); //End require

})(jQuery);
