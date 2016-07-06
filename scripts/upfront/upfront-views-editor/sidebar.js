(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel',
        'scripts/upfront/upfront-views-editor/sidebar/draggable-element',
        'scripts/upfront/upfront-views-editor/commands',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-profile',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panels',
        'scripts/upfront/upfront-views-editor/sidebar/commands/sidebar-commands-primary-post-type',
        'scripts/upfront/upfront-views-editor/breakpoint',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-responsive-section-typography',
        'scripts/upfront/upfront-views-editor/sidebar/commands/sidebar-commands-primary-layout'
    ], function (
        SidebarPanel,
        DraggableElement,
        Commands,
        SidebarProfile,
        SidebarPanels,
        SidebarCommands_PrimaryPostType,
        Breakpoint,
        SidebarPanel_Responsive_Settings_Section_Typography,
        SidebarCommands_PrimaryLayout
    ) {











        var SidebarCommands_AdditionalPostType = Commands.Commands.extend({
            "className": "sidebar-commands sidebar-commands-additional",
            initialize: function () {
                this.commands = _([]);
            },
            render: function () {

            }

        });

        var SidebarCommands_Control = Commands.Commands.extend({
            className: function() {
                var className = "sidebar-commands sidebar-commands-control";
                if (Upfront.Application.get_current() === Upfront.Settings.Application.MODE.THEME) {
                    className += ' sidebar-commands-theme';
                }
                return className;
            },
            initialize: function () {
                var MODE = Upfront.Settings.Application.MODE;
                var current_app = Upfront.Application.get_current();

                if (Upfront.Application.user_can_modify_layout()) {
                    if ( current_app !== MODE.THEME ) {
                        this.commands = _([
                            new Commands.Command_Undo({"model": this.model}),
                            new Commands.Command_Redo({"model": this.model})
                        ]);
                        if (Upfront.Application.user_can("RESPONSIVE_MODE") && current_app !== MODE.THEME) {
                            this.commands.push(
                                new Commands.Command_StartResponsiveMode({model: this.model})
                            );
                        }
                        this.commands.push(new Commands.Command_ToggleGrid({"model": this.model}));
                    } else {
                        this.commands = _([
                            new Commands.Command_ToggleGrid({"model": this.model})
                        ]);
                    }
                } else {
                    this.commands = _([]);
                }

                if (Upfront.Application.user_can("RESPONSIVE_MODE") && current_app === MODE.THEME) {
                    this.commands.push(
                        new Commands.Command_CreateResponsiveLayouts({model: this.model})
                    );
                }
                if ( current_app == MODE.THEME ) {
                    this.commands.push(new Commands.Command_ExportLayout({"model": this.model}));
                }

                this.commands.push(new Commands.Command_Trash({"model": this.model}));

                if (!Upfront.Settings.Application.NO_SAVE && current_app !== MODE.THEME && Upfront.Application.user_can_modify_layout()) {
                    this.commands.push(new Commands.Command_SaveLayout({"model": this.model}));
                } else if (current_app !== MODE.THEME && Upfront.Settings.Application.PERMS.REVISIONS) {
                    this.commands.push(new Commands.Command_PreviewLayout({"model": this.model}));
                }
                // Dev feature only
                if ( Upfront.Settings.Debug.dev ) {
                    if (!Upfront.Settings.Application.NO_SAVE && current_app !== MODE.THEME) {
                        this.commands.push(new Commands.Command_ResetEverything({"model": this.model}));
                    }
                    //if (current_app !== MODE.THEME) this.commands.push(new Commands.Command_ToggleMode({"model": this.model}));
                    if (!Upfront.Settings.Application.DEBUG && current_app !== MODE.THEME && !Upfront.Settings.Application.NO_SAVE) {
                        this.commands.push(new Commands.Command_PublishLayout({"model": this.model}));
                    }
                }
            }
        });

        var SidebarCommands_Header = Commands.Commands.extend({
            className: "sidebar-commands sidebar-commands-header",
            initialize: function () {
                this.commands = _([
                    new Commands.Command_Logo({"model": this.model})
                ]);
                //if ( !Upfront.Settings.Application.NO_SAVE ) this.commands.push(new Command_Exit({"model": this.model}));
                this.commands.push(new Commands.Command_Exit({"model": this.model})); // *Always* show exit
            }
        });

        /* Responsive */
        var SidebarPanel_ResponsiveSettings = Backbone.View.extend({
            tagName: 'li',
            className: 'sidebar-panel sidebar-panel-settings expanded',
            template: '<div class="sidebar-panel-content"></div>',
            initialize: function() {
                this.collection = Breakpoint.storage.get_breakpoints();
                this.listenTo(this.collection, 'change:active', this.render);
                this.global_option = true;
            },
            render: function() {
                var breakpoint_model = Breakpoint.storage.get_breakpoints().get_active();

                if(breakpoint_model.get('default'))
                    this.model.attributes.id = 'default';

                var typography_section = new SidebarPanel_Responsive_Settings_Section_Typography({
                    "model": breakpoint_model.get('default') ? this.model : breakpoint_model // If default, use layout model instead
                });

                typography_section.render();

                this.$el.html(this.template);
                this.$el.find('.sidebar-panel-content').html(typography_section.el);
            }
        });

        var SidebarCommands_Responsive = Backbone.View.extend({
            tagName: 'ul',
            className: 'sidebar-commands sidebar-commands-responsive',
            initialize: function () {
                this.views = [
                    new Commands.Command_BreakpointDropdown(),
                    new Commands.Command_AddCustomBreakpoint()
                ];

                this.views.push(new SidebarPanel_ResponsiveSettings({"model": this.model}));

            },
            render: function() {
                if (!Upfront.Application.user_can_modify_layout()) return false;

                _.each(this.views, function(view) {
                    view.render();
                    if ( typeof view.global_option !== "undefined" && view.global_option ) {
                        if (Upfront.Settings.Application.PERMS.OPTIONS) {
                            this.$el.append(view.el);
                        }
                    } else {
                        this.$el.append(view.el);
                    }
                }, this);

                return this;
            },
            destroy: function() {
                this.remove();
                _.each(this.views, function(view) {
                    view.remove();
                });
            }
        });

        var SidebarCommands_ResponsiveControl = Commands.Commands.extend({
            "className": "sidebar-commands sidebar-commands-responsive-control sidebar-commands-control",
            initialize: function () {
                if (Upfront.Application.user_can_modify_layout()) {
                    this.commands = _([
                        new Commands.Command_ResponsiveUndo({"model": this.model}),
                        new Commands.Command_ResponsiveRedo({"model": this.model}),
                        new Commands.Command_ToggleGrid({"model": this.model}),
                        new Commands.Command_SaveLayout(),
                        new Commands.Command_StopResponsiveMode()
                    ]);
                } else {
                    this.commands = _([
                        new Commands.Command_StopResponsiveMode()
                    ]);
                }
            },
            render: function () {
                this.$el.find("li").remove();
                this.commands.each(this.add_command, this);
            }
        });
        /* End Responsive */



        /*var SidebarEditorMode = Backbone.View.extend({
         "className": "sidebar-editor-mode",
         events: {
         "click .switch-mode-simple": "switch_simple",
         "click .switch-mode-advanced": "switch_advanced"
         },
         render: function () {
         this.$el.html(
         '<div class="sidebar-editor-mode-label">Editor mode:</div>' +
         '<div class="switch-mode-ui">' +
         '<span class="switch-mode switch-mode-simple">simple <i class="upfront-icon upfront-icon-simple"></i></span>' +
         '<span class="switch-slider"><span class="knob"></span></span>' +
         '<span class="switch-mode switch-mode-advanced">advanced <i class="upfront-icon upfront-icon-advanced"></i></span>' +
         '</div>'
         );
         this.switch_simple();
         },
         switch_simple: function () {
         this.$el.find('.switch-mode-simple').addClass('active');
         this.$el.find('.switch-mode-advanced').removeClass('active');
         this.$el.find('.switch-slider').removeClass('switch-slider-full');
         },
         switch_advanced: function () {
         this.$el.find('.switch-mode-advanced').addClass('active');
         this.$el.find('.switch-mode-simple').removeClass('active');
         this.$el.find('.switch-slider').addClass('switch-slider-full');
         }
         });*/

        var Sidebar = Backbone.View.extend({
            "tagName": "div",
            visible: 1,
            events: {
                'click #sidebar-ui-toggler-handle': 'toggleSidebar'
            },
            initialize: function () {
                var is_theme = Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME;
                //this.editor_mode = new SidebarEditorMode({"model": this.model});
                this.sidebar_profile = new SidebarProfile({"model": this.model});
                this.sidebar_commands = {
                    header: new SidebarCommands_Header({"model": this.model}),
                    primary: is_theme ? new SidebarCommands_PrimaryLayout({"model": this.model}) : new SidebarCommands_PrimaryPostType({"model": this.model}), // DEPRECATED
                    additional: is_theme ? false : new SidebarCommands_AdditionalPostType({"model": this.model}), // DEPRECATED
                    control: new SidebarCommands_Control({"model": this.model}),
                    responsive: new SidebarCommands_Responsive({"model": this.model})
                };
                this.sidebar_panels = new SidebarPanels({"model": this.model});

                this.fetch_current_user();

                if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT ){
                    Upfront.Events.on('upfront:element:edit:start', this.preventUsage, this);
                    Upfront.Events.on('upfront:element:edit:stop', this.allowUsage, this);
                }
                Upfront.Events.on("application:mode:after_switch", this.render, this);
                Upfront.Events.on("application:user:fetch", this.render, this); // Re-build when we're ready
            },
            preventUsage: function(type) {
                var preventUsageText = l10n.not_available_in_text_edit;
                if (type === 'media-upload') {
                    preventUsageText = l10n.not_available_in_media_upload;
                }
                if (type === 'write') {
                    this.writingIsOn = true;
                    preventUsageText = l10n.publish_first_nag;
                }
                if (!this.prevented_usage_type) this.prevented_usage_type = type; // don't stack up on prevented types, keep the original
                $('#preventUsageOverlay span').html(preventUsageText);
                $('#preventUsageOverlay').show();
            },
            allowUsage: function(type) {
                if (this.writingIsOn && type !== 'write') {
                    this.preventUsage('write');
                    return;
                }
                this.prevented_usage_type = false;
                this.writingIsOn = false;
                $('#preventUsageOverlay').hide();
            },
            render: function () {
                var current_app = Upfront.Application.get_current();
                var is_responsive_app = current_app === Upfront.Settings.Application.MODE.RESPONSIVE;
                var output = $('<div id="sidebar-ui-wrapper" class="upfront-ui"></div>');
                if ( current_app == Upfront.Settings.Application.MODE.THEME ) {
                    output.addClass('create-theme-sidebar');
                }

                // Header
                this.sidebar_commands.header.render();
                output.append(this.sidebar_commands.header.el);

                // Editor Mode
                //this.editor_mode.render();
                //this.$el.append(this.editor_mode.el);

                if ( current_app !== Upfront.Settings.Application.MODE.THEME && !is_responsive_app) {
                    // Profile
                    this.sidebar_profile.render();
                    output.append(this.sidebar_profile.el);
                }

                // Primary commands
                if ( !is_responsive_app ) {
                    this.sidebar_commands.primary.render();
                    output.append(this.sidebar_commands.primary.el);
                }

                if ( this.sidebar_commands.additional && !is_responsive_app ) {
                    // Additional commands
                    this.sidebar_commands.additional.render();
                    output.append(this.sidebar_commands.additional.el);
                }

                // Responsive
                if ( is_responsive_app ) {
                    this.sidebar_commands.responsive.render();
                    output.append(this.sidebar_commands.responsive.el);
                }

                if ( current_app !== Upfront.Settings.Application.MODE.CONTENT && !is_responsive_app ) {
                    // Sidebar panels
                    this.sidebar_panels.render();
                    output.append(this.sidebar_panels.el);
                    // Control
                    this.sidebar_commands.control.render();
                    output.append(this.sidebar_commands.control.el);

                    output.append('<div id="preventUsageOverlay"><span></span></div>');
                } else if (is_responsive_app) {
                    // Responsvie Control
                    var responsive_controls = new SidebarCommands_ResponsiveControl({"model": this.model});
                    responsive_controls.render();
                    output.append(responsive_controls.el);
                }

                this.$el.html(output);

                Upfront.Events.trigger('sidebar:rendered');
            },
            get_panel: function ( panel ) {
                if ( ! this.sidebar_panels.panels[panel] )
                    return false;
                return this.sidebar_panels.panels[panel];
            },
            get_commands: function ( commands ) {
                if ( ! this.sidebar_commands[commands] )
                    return false;
                return this.sidebar_commands[commands];
            },
            to_content_editor: function () {
                /*
                 var panel = this.sidebar_panels.panels.posts,
                 post_model = Upfront.data.currentPost
                 ;
                 if(!panel.commands){
                 panel.commands = _([
                 new Command_PopupStatus({"model": post_model}),
                 new Command_PopupVisibility({"model": post_model}),
                 new Command_PopupSchedule({model: post_model}),

                 new Command_PopupTax({"model": this.model}),
                 new Command_PopupSlug({"model": this.model}),
                 //new Command_PopupMeta({"model": this.model}),
                 new Command_SaveDraft({"model": this.model}),
                 new Command_SavePublish({"model": this.model}),
                 new Command_Trash({"model": this.model})
                 ]);
                 panel.render();
                 }
                 else
                 panel.show();

                 panel.$el.find(".sidebar-panel-title").trigger("click");
                 */
                //console.log("to_content_editor got called");
            },
            from_content_editor: function () {
                /*
                 var panel = this.sidebar_panels.panels.posts;
                 //panel.commands = _([]);
                 panel.hide();//render();
                 $(".sidebar-panel-title.upfront-icon.upfront-icon-panel-elements").trigger("click");
                 */
                //console.log("from_content_editor got called")
            },
            fetch_current_user: function() {
                var user = Upfront.data.currentUser;

                if(!user){
                    user = new Upfront.Models.User();
                    Upfront.data.loading.currentUser = user.fetch().done(function(){
                        Upfront.data.currentUser = user;
                        Upfront.Events.trigger("application:user:fetch");
                    });
                }
            },
            addCollapsibleEvents: function(){
                var me = this;
                this.$el.append('<div id="sidebar-ui-toggler"><div id="sidebar-ui-toggler-handle" class="sidebar-ui-hide"></div></div>');
                $('body').on('mousemove', function(e){
                    if(me.visible * 300 + 100 > e.pageX){
                        if(!me.collapsibleHint){
                            $('#sidebar-ui-toggler').fadeIn();
                            me.collapsibleHint = true;
                        }
                    }
                    else {
                        if(me.collapsibleHint){
                            $('#sidebar-ui-toggler').fadeOut();
                            me.collapsibleHint = false;
                        }
                    }
                });

                this.resizeCollapseHandle();
                $(window).on('resize', function(){
                    me.resizeCollapseHandle();
                });
            },

            resizeCollapseHandle: function(){
                var height = $(window).height();
                this.$('#sidebar-ui-toggler').height(height);
            },

            toggleSidebar: function(instant){
                var me = this,
                    margined_css = {marginLeft: "260px"};
                unmargined_css = {marginLeft: "0px"};
                _margin = Upfront.Util.isRTL() ? "marginRight" : "marginLeft";

                if(!this.visible){
                    if( Upfront.Util.isRTL())
                        margined_css = { marginRight: "260px" };

                    $('#sidebar-ui').removeClass('collapsed').stop().animate({width: '260px'}, 300);
                    //Remove collapsed class always after region editor is closed
                    $('#element-settings-sidebar').removeClass('collapsed');

                    //Bring back element-settings only if it was opened before
                    if($('#element-settings-sidebar').contents().length !== 0) {
                        $('#element-settings-sidebar').removeClass('collapsed').stop().animate({width: '260px'}, 300);
                    }

                    $('#page').stop().animate(margined_css, 300, function(){ Upfront.Events.trigger('sidebar:toggle:done', me.visible); });

                    this.$('#sidebar-ui-toggler-handle').removeClass().addClass('sidebar-ui-hide');
                    this.visible = 1;
                }
                else {
                    $('#sidebar-ui, #element-settings-sidebar').stop().animate({width: '0px'}, 300, function(){
                        $('#sidebar-ui, #element-settings-sidebar').addClass('collapsed');
                    });
                    if( Upfront.Util.isRTL())
                        unmargined_css = { marginRight: "0px" };

                    $('#page').stop().animate(unmargined_css, 300, function(){ Upfront.Events.trigger('sidebar:toggle:done', me.visible); });

                    this.$('#sidebar-ui-toggler-handle').removeClass().addClass('sidebar-ui-show');
                    this.visible = 0;
                }
                Upfront.Events.trigger('sidebar:toggle', this.visible);
            }

        });

        return {
            "Sidebar": Sidebar,
            "Panel": SidebarPanel,
            "Element": DraggableElement
        };
    });
}(jQuery));