(function(){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/fields',
        'scripts/upfront/upfront-views-editor/commands/command',
        'scripts/upfront/upfront-views-editor/commands/command-cancel-post-layout',
        'scripts/upfront/upfront-views-editor/commands/command-delete',
        'scripts/upfront/upfront-views-editor/commands/command-edit-background-area',
        'scripts/upfront/upfront-views-editor/commands/command-general-edit-custom-css',
        'scripts/upfront/upfront-views-editor/commands/command-edit-custom-css',
        'scripts/upfront/upfront-views-editor/commands/command-edit-global-regions',
        'scripts/upfront/upfront-views-editor/commands/command-edit-layout-background',
        'scripts/upfront/upfront-views-editor/commands/command-edit-structure',
        'scripts/upfront/upfront-views-editor/commands/command-exit',
        'scripts/upfront/upfront-views-editor/commands/command-export-history',
        'scripts/upfront/upfront-views-editor/commands/command-export-layout',
        'scripts/upfront/upfront-views-editor/commands/command-go-to-type-preview-page',
        'scripts/upfront/upfront-views-editor/commands/command-load-layout',
        'scripts/upfront/upfront-views-editor/commands/command-logo',
        'scripts/upfront/upfront-views-editor/commands/command-merge',
        'scripts/upfront/upfront-views-editor/commands/command-new-page',
        'scripts/upfront/upfront-views-editor/commands/command-new-post',
        'scripts/upfront/upfront-views-editor/commands/command-open-font-manager',
        'scripts/upfront/upfront-views-editor/commands/command-preview-layout',
        'scripts/upfront/upfront-views-editor/commands/command-publish-layout',
        'scripts/upfront/upfront-views-editor/commands/command-redo',
        'scripts/upfront/upfront-views-editor/commands/command-reset-everything',
        'scripts/upfront/upfront-views-editor/commands/command-save-layout',
        'scripts/upfront/upfront-views-editor/commands/command-save-layout-as',
        'scripts/upfront/upfront-views-editor/commands/command-save-post-layout',
        'scripts/upfront/upfront-views-editor/commands/command-select',
        'scripts/upfront/upfront-views-editor/commands/command-toggle-grid',
        'scripts/upfront/upfront-views-editor/commands/command-toggle-mode',
        'scripts/upfront/upfront-views-editor/commands/command-toggle-mode-small',
        'scripts/upfront/upfront-views-editor/commands/command-trash',
        'scripts/upfront/upfront-views-editor/commands/command-undo',
        'scripts/upfront/upfront-views-editor/commands/responsive/command-create-responsive-layouts',
        'scripts/upfront/upfront-views-editor/commands/responsive/command-start-responsive-mode',
        'scripts/upfront/upfront-views-editor/commands/responsive/command-stop-responsive-mode',
        'scripts/upfront/upfront-views-editor/commands/responsive/command-responsive-redo',
        'scripts/upfront/upfront-views-editor/commands/responsive/command-responsive-undo',
        'scripts/upfront/upfront-views-editor/commands/breakpoint/command-add-custom-breakpoint',
        'scripts/upfront/upfront-views-editor/commands/breakpoint/command-breakpoint-dropdown',
        'scripts/upfront/upfront-views-editor/commands/command-open-media-gallery',
        'scripts/upfront/upfront-views-editor/commands/command-popup-list'
    ], function (
        Fields,
        Command,
        CommandCancelPostLayout,
        CommandDelete,
        CommandEditBackgroundArea,
        CommandGeneralEditCustomCss,
        CommandEditCustomCss,
        CommandEditGlobalRegions,
        CommandEditLayoutBackground,
        CommandEditStructure,
        CommandExit,
        CommandExportHistory,
        CommandExportLayout,
        CommandGoToTypePreviewPage,
        CommandLoadLayout,
        CommandLogo,
        CommandMerge,
        CommandNewPage,
        CommandNewPost,
        CommandOpenFontManager,
        CommandPreviewLayout,
        CommandPublishLayout,
        CommandRedo,
        CommandResetEverything,
        CommandSaveLayout,
        CommandSaveLayoutAs,
        CommandSavePostLayout,
        CommandSelect,
        CommandToggleGrid,
        CommandToggleMode,
        CommandToggleModeSmall,
        CommandTrash,
        CommandUndo,
        CommandCreateResponsiveLayouts,
        CommandStartResponsiveMode,
        CommandStopResponsiveMode,
        CommandResponsiveRedo,
        CommandResponsiveUndo,
        CommandAddCustomBreakpoint,
        CommandBreakpointDropdown,
        CommandOpenMediaGallery,
        CommandPopupList
    ) {


        /**
         * DEPRECATED
         */
        var Command_ThemesDropdown = Command.extend({
            className: 'themes-dropdown',
            enabled: true,
            events: {
                'click .upfront-field-select-value': 'openOptions',
                'mouseup .upfront-field-select': 'onMouseUp',
                'change .upfront-field-select-option input': 'onChange',
                'click .upfront-field-select-option label': 'onOptionClick'
            },
            initialize: function() {
                var themes = _.union([{label: l10n.choose_theme, value: ''}], _.map(Upfront.themeExporter.themes, function(theme) {
                    return {
                        label: theme.name,
                        value: theme.directory
                    };
                }));
                this.fields = [
                    new Fields.Select({
                        values: themes,
                        default_value: Upfront.themeExporter.currentTheme === 'upfront' ?
                            '' : Upfront.themeExporter.currentTheme,
                        change: function () {
                            if (this.get_value() === ''
                                || this.get_value() === Upfront.themeExporter.currentTheme) return;

                            Upfront.Events.trigger("builder:load_theme", this.get_value());
                        }
                    })
                ];
            },
            render: function () {
                this.fields[0].render();
                this.$el.append(this.fields[0].el);
            },
            // noop for preventing parent class rendering on click behaviour
            openOptions: function(e) {
                this.fields[0].openOptions(e);
            },
            onMouseUp: function(e) {
                this.fields[0].onMouseUp(e);
            },
            onChange: function(e) {
                this.fields[0].onChange(e);
            },
            onOptionClick: function(e) {
                this.fields[0].onOptionClick(e);
            }

        });

        /**
         * DEPRECATED
         */
        var Command_NewLayout = Command.extend({
            className: "command-new-layout",
            render: function () {
                this.$el.addClass('upfront-icon upfront-icon-layout');
                this.$el.html(l10n.new_layout);
                this.$el.prop("title", l10n.new_layout);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:create");
            }
        });

        /**
         * DEPRECATED
         */
        var Command_BrowseLayout = Command.extend({
            className: "command-browse-layout upfront-icon upfront-icon-browse-layouts",
            render: function () {
                this.$el.html(l10n.layouts);
                this.$el.prop("title", l10n.layouts);
            },
            on_click: function () {
                Upfront.Events.trigger("command:layout:browse");
            }
        });



        /* End responsive mode commands */

        var Commands = Backbone.View.extend({
            "tagName": "ul",

            initialize: function () {
                this.Commands = _([
                    new CommandNewPage({"model": this.model}),
                    new CommandNewPost({"model": this.model}),
                    new CommandSaveLayout({"model": this.model}),
                    new CommandSaveLayoutAs({"model": this.model}),
                    //new CommandLoadLayout({"model": this.model}),
                    new CommandUndo({"model": this.model}),
                    new CommandRedo({"model": this.model}),
                    new CommandDelete({"model": this.model}),
                    new CommandSelect({"model": this.model}),
                    new CommandToggleGrid({"model": this.model}),
                    new CommandResetEverything({"model": this.model})
                ]);
                if (Upfront.Settings.Debug.transients) this.commands.push(new CommandExportHistory({model: this.model}));
            },
            render: function () {
                this.$el.find("li").remove();
                this.commands.each(this.add_command, this);
            },

            add_command: function (command) {
                if (!command) return;
                command.remove();
                command.render();
                this.$el.append(command.el);
                command.bind("upfront:command:remove", this.remove_command, this);
                command.delegateEvents();
            },

            remove_command: function (to_remove) {
                var coms = this.commands.reject(function (com) {
                        com.remove();
                        return com.cid == to_remove.cid;
                    })
                    ;
                this.commands = _(coms);
                this.render();
            }
        });

        return {
            Command: Command,
            Commands: Commands,
            Command_CancelPostLayout: CommandCancelPostLayout,
            Command_Delete: CommandDelete,
            Command_EditBackgroundArea: CommandEditBackgroundArea,
            Command_GeneralEditCustomCss: CommandGeneralEditCustomCss,
            Command_EditCustomCss: CommandEditCustomCss,
            Command_EditGlobalRegions: CommandEditGlobalRegions,
            Command_EditLayoutBackground: CommandEditLayoutBackground,
            Command_EditStructure: CommandEditStructure,
            Command_Exit: CommandExit,
            Command_ExportHistory: CommandExportHistory,
            Command_ExportLayout: CommandExportLayout,
            Command_GoToTypePreviewPage: CommandGoToTypePreviewPage,
            Command_LoadLayout: CommandLoadLayout,
            Command_Logo: CommandLogo,
            Command_Merge: CommandMerge,
            Command_NewPage: CommandNewPage,
            Command_NewPost: CommandNewPost,
            Command_OpenFontManager: CommandOpenFontManager,
            Command_PreviewLayout: CommandPreviewLayout,
            Command_PublishLayout: CommandPublishLayout,
            Command_Redo: CommandRedo,
            Command_ResetEverything: CommandResetEverything,
            Command_SaveLayout: CommandSaveLayout,
            Command_SaveLayoutAs: CommandSaveLayoutAs,
            Command_SavePostLayout: CommandSavePostLayout,
            Command_Select: CommandSelect,
            Command_ToggleGrid: CommandToggleGrid,
            Command_ToggleMode: CommandToggleMode,
            Command_ToggleModeSmall: CommandToggleModeSmall,
            Command_Trash: CommandTrash,
            Command_Undo: CommandUndo,
            Command_CreateResponsiveLayouts: CommandCreateResponsiveLayouts,
            Command_StartResponsiveMode: CommandStartResponsiveMode,
            Command_StopResponsiveMode: CommandStopResponsiveMode,
            Command_ResponsiveRedo: CommandResponsiveRedo,
            Command_ResponsiveUndo: CommandResponsiveUndo,
            Command_AddCustomBreakpoint: CommandAddCustomBreakpoint,
            Command_BreakpointDropdown: CommandBreakpointDropdown,
            Command_OpenMediaGallery: CommandOpenMediaGallery,
            Command_PopupList: CommandPopupList,
            Command_ThemesDropdown: Command_ThemesDropdown,
            Command_BrowseLayout: Command_BrowseLayout,
            Command_NewLayout: Command_NewLayout
        };


    });
})();