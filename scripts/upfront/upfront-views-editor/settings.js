(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/settings/settings-item",
        "scripts/upfront/upfront-views-editor/settings/settings-panel",
        "scripts/upfront/upfront-views-editor/settings/settings-item-tabbed",
        "scripts/upfront/upfront-views-editor/settings/settings-anchor-trigger",
        "scripts/upfront/upfront-views-editor/settings/settings-labeled-anchor-trigger",
        "scripts/upfront/upfront-views-editor/settings/settings-lightbox-trigger",
        "scripts/upfront/upfront-views-editor/settings/settings-labeled-lightbox-trigger"
    ], function ( SettingsItem, SettingsPanel, SettingsItemTabbed, Settings_AnchorTrigger, Settings_LabeledAnchorTrigger, Settings_LightboxTrigger, Settings_LabeledLightboxTrigger ) {

        var Settings = Backbone.View.extend({
            has_tabs: true,

            initialize: function(opts) {
                this.options = opts;
                this.panels = _([]);
            },
            get_title: function () {
                return l10n.settings;
            },

            render: function () {
                var me = this,
                    $view = me.for_view.$el.hasClass('upfront-editable_entity') ? me.for_view.$el : me.for_view.$el.find(".upfront-editable_entity:first"),
                    view_pos = $view.offset(),
                    view_outer_width = $view.outerWidth(),
                    view_pos_right = view_pos.left + view_outer_width,
                    $button = ($view.hasClass('upfront-object') ? $view.closest('.upfront-module') : $view).find("> .upfront-element-controls .upfront-icon-region-settings"),
                    button_pos = $button.offset(),
                    button_pos_right = button_pos.left + $button.outerWidth(),
                    $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
                    main_pos = $main.offset(),
                    main_pos_right = main_pos.left + $main.outerWidth()
                    ;
                me.$el
                    .empty()
                    .show()
                    .html(
                        '<div class="upfront-settings_title">' + this.get_title() + '</div>'
                    )
                ;

                /*
                 * This event is broadcast so that other plugins can register their
                 * own Upfront element for the CSS Editor before the settings panel
                 * is displayed.
                 *
                 * Example:
                 * Upfront.Events.on( 'settings:prepare', function() {
                 *   args = {label: 'My Element', id: 'my_element'};
                 *   Upfront.Application.cssEditor.elementTypes['ElementModel'] = args;
                 * });
                 */
                Upfront.Events.trigger("settings:prepare");

                me.panels.each(function (panel) {
                    panel.render();

                    me.listenTo(panel, "upfront:settings:panel:toggle", me.toggle_panel);
                    me.listenTo(panel, "upfront:settings:panel:close", me.close_panel);
                    me.listenTo(panel, "upfront:settings:panel:refresh", me.refresh_panel);

                    panel.parent_view = me;
                    me.$el.append(panel.el);
                });

                this.toggle_panel(this.panels.first());

                var label_width = this.panels.first().$el.find('.upfront-settings_label').outerWidth(),
                    panel_width = this.panels.first().$el.find('.upfront-settings_panel').outerWidth();

                // This will remove tabs from left side if element settings have specified so.
                // Default is to show tabs.
                if (!this.has_tabs) {
                    label_width = 0;
                    this.$el.addClass('settings-no-tabs');
                }

                this.$el
                    .css({
                        "position": "absolute",
                        "z-index": 10000000
                    })
                    .offset({
                        "top": view_pos.top /*+ $view.height() + 16*/,
                        "left": view_pos.left + view_outer_width - ((view_pos_right+label_width+panel_width > main_pos_right) ? label_width+panel_width+(view_pos_right-button_pos.left)+5 : 0)
                    })
                    .addClass('upfront-ui')
                ;

                this.trigger('open');
            },

            set_title: function (title) {
                if (!title || !title.length) return false;
                this.$el.find(".upfront-settings_title").html(title);
            },
            toggle_panel: function (panel) {
                this.panels.invoke("conceal");
                panel.$el.find(".upfront-settings_panel").css('height', '');
                panel.show();
                panel.reveal();
                this.set_title(panel.get_title());
                var min_height = 0;
                this.panels.each(function(p){
                    min_height += p.$el.find(".upfront-settings_label").outerHeight();
                });
                var panel_height = panel.$el.find(".upfront-settings_panel").outerHeight() - 1;
                if ( panel_height >= min_height ) {
                    this.$el.css('height', panel_height);
                } else {
                    panel.$el.find(".upfront-settings_panel").css('height', min_height);
                    this.$el.css('height', min_height);
                }
            },

            refresh_panel: function (panel) {
                if (panel.is_active()) this.toggle_panel(panel);
            },

            close_panel: function (panel) {
                this.panels.invoke("conceal");
                this.panels.invoke("show");
                this.set_title(this.get_title());
            },
            remove: function(){
                if (this.panels) {
                    this.panels.each(function(panel){
                        panel.remove();
                    });
                }
                Backbone.View.prototype.remove.call(this);
            }
        });

        return {
            "Settings": Settings,
            "Panel": SettingsPanel,
            "Item": SettingsItem,
            "ItemTabbed": SettingsItemTabbed,
            "Lightbox": {
            "Trigger": Settings_LightboxTrigger,
                "LabeledTrigger": Settings_LabeledLightboxTrigger
            },
            "Anchor": {
                "Trigger": Settings_AnchorTrigger,
                "LabeledTrigger": Settings_LabeledAnchorTrigger
            }
        };

    });
}(jQuery));