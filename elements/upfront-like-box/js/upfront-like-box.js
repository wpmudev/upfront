(function ($) {
  define(function() {

    var l10n = Upfront.Settings.l10n.like_box_element;

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
            var properties = _.clone(Upfront.data.ulikebox.defaults);
            properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
            this.init_properties(properties);
        }
    });

    /**
     * View instance - what the element looks like.
     * @type {Upfront.Views.ObjectView}
     */
    var LikeBoxView = Upfront.Views.ObjectView.extend({

        model: LikeBoxModel,
        elementSize: {width: 0, height: 0},

        initialize: function(options){
            if(! (this.model instanceof LikeBoxModel)){
                this.model = new LikeBoxModel({properties: this.model.get('properties')});
            }

            this.constructor.__super__.initialize.call(this, [options]);

            this.listenTo(Upfront.Events, 'entity:resize_start', this.hideFrame);
            this.listenTo(Upfront.Events, 'entity:resize_stop', this.onElementResize);

        },

        setUrl: function(){
            this.property('facebook_url' , Upfront.data.social.panel.model.get_property_value_by_name('global_social_media_services-facebook-url'));
        },
		hideFrame: function(view, model) {
			this.$el.find('iframe').css('display', 'none');
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
                //setTimeout(function(){
                    var size = me.get_element_size_px(false);

                    if(size.col != 0){
                        me.property('element_size', {
                            width: size.col,
                            height: size.row,
                        });
                    }
                //}, 1000);
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

        getGlobalFBUrl: function(){
            if(!Upfront.data.usocial.globals)
                return false;
            var services = Upfront.data.usocial.globals.services,
                url = false;

            _(services).each( function( s ) {
                if(s.id == 'facebook')
                    url = s.url;
            });

            return url;
        },

        /**
         * Element contents markup.
         * @return {string} Markup to be shown.
         */
        get_content_markup: function () {
            var me = this,

			fbUrl = this.model.get_property_value_by_name('facebook_url');

			if(!fbUrl || fbUrl=='')
            	fbUrl = this.getGlobalFBUrl();

            if(fbUrl){
                var pageName = _.last(fbUrl.split('/'));
				var wide = 	this.model.get_property_value_by_name('element_size').width-22;
				if(wide%53 > 0)
					wide = parseInt(wide/53)*53+22;
				else
					wide = this.model.get_property_value_by_name('element_size').width;

				console.log(wide);

                return '<iframe src="//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F'+ (pageName ? pageName : 'wpmudev' )+'&amp;width='+wide+'&amp;height='+this.model.get_property_value_by_name('element_size').height+'&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false" scrolling="no" frameborder="0" style="border:none; overflow:hidden; float:left; width:'+wide+'px; height:'+this.model.get_property_value_by_name('element_size').height+'px;"" allowTransparency="true"></iframe>'+ (!pageName ? '<span class="alert-url">!</span>' : '' );
            }else{
                return '<span class="upfront-general-notice">' + l10n.you_need_to_set_url + ' <a class="back_global_settings" href="#">' + l10n.global_social_settings + '</a>.</span>';
            }
        },

        on_render: function(){
            var parent = this.parent_module_view;

            //Prevent iframe hijacking of events when dragging
            if(!parent.$el.data('dragHandler')){
                parent.$el.on('dragstart', this.coverIframe);
                parent.$el.data('dragHandler', true);
            }
        },

        //Prevent iframe hijacking of events when dragging
        coverIframe: function(e, ui){
            ui.helper.append('<div class="upfront-iframe-draggable" style="width:100%;height:100%;position:absolute;top:0;left:0:z-index:1"></div>');
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
            this.$el.html(l10n.element_name);
        },
        add_element: function () {
            var object = new LikeBoxModel(),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c7 upfront-like-box_module"},
                        {"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(90)}
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

    var Field_Text = Upfront.Views.Editor.Field.Text.extend({});

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
		 getGlobalFBUrl: function(){
            if(!Upfront.data.usocial.globals)
                return false;
            var services = Upfront.data.usocial.globals.services,
                url = false;

            _(services).each( function( s ) {
                if(s.id == 'facebook')
                    url = s.url;
            });

            return url;
        },

        initialize: function (opts) {
            this.options = opts;
            this.panel = new Upfront.Views.Editor.Settings.Panel({

                    model: this.model,
                    label: l10n.opts.style_label,
                    title: l10n.opts.style_title,
                    settings: [
                        new Upfront.Views.Editor.Settings.Item({
                            className: 'upfront-social-services-item',
                            model: this.model,
                            title: l10n.opts.page_url,
                            fields: [
                                new Field_Text({
                                    model: this.model,
                                    property: 'facebook_url',
                                    default_value: this.getGlobalFBUrl(),
                                    label: l10n.opts.url_sample,
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
                                    info: l10n.opts.back_to,
                                    label: l10n.opts.global_settings,
                                    on_click: function(e){
                                        e.preventDefault();
			                            Upfront.Events.trigger("entity:settings:deactivate");
										Upfront.data.social.panel.popupFunc();
                                    }
                                })
                            ]
                        }),

                    ]
                });
			this.panels = _([this.panel]);
        },
        /**
         * Get the title (goes into settings title area)
         * @return {string} Title
         */
        get_title: function () {
            return l10n.settings;
        }
    });



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

    Upfront.Application.LayoutEditor.add_object("LikeBox", {
			"Model": LikeBoxModel,
			"View": LikeBoxView,
			"Element": LikeBoxElement,
			"Settings": LikeBoxSettings,
			cssSelectors: {
				'iframe': {label: l10n.container_label, info: l10n.container_info}
			},
			cssSelectorsId: Upfront.data.ulikebox.defaults.type
    });

    Upfront.Models.LikeBoxModel = LikeBoxModel;
    Upfront.Views.LikeBoxView = LikeBoxView;

  });

})(jQuery);
