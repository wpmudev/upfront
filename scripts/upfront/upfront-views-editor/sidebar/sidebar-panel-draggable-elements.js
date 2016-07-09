(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-layout-elements',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-data-elements',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-plugins-elements'

    ], function ( SidebarPanel, SidebarPanel_Settings_Section_LayoutElements, SidebarPanel_Settings_Section_DataElements, SidebarPanel_Settings_Section_PluginsElements ) {
        return SidebarPanel.extend({
            "className": "sidebar-panel sidebar-panel-elements",
            initialize: function () {
                this.active = true;
                this.sections = _([
                    new SidebarPanel_Settings_Section_LayoutElements({"model": this.model}),
                    new SidebarPanel_Settings_Section_DataElements({"model": this.model}),
                    new SidebarPanel_Settings_Section_PluginsElements({"model": this.model})
                ]);

                this.elements = _([]);
                Upfront.Events.on("command:layout:save", this.on_save, this);
                Upfront.Events.on("command:layout:save_as", this.on_save, this);
                Upfront.Events.on("command:layout:publish", this.on_save, this);
                //Upfront.Events.on("command:layout:preview", this.on_preview, this); // Do NOT drop shadow region from layout on preview build
                Upfront.Events.on("command:layout:save_success", this.on_save_after, this);
                Upfront.Events.on("command:layout:save_error", this.on_save_after, this);
                Upfront.Events.on("entity:drag_stop", this.reset_modules, this);
                Upfront.Events.on("layout:render", this.apply_state_binding, this);
            },
            get_title: function () {
                return l10n.draggable_elements;
            },
            on_save: function () {
                var regions = this.model.get('regions');
                this._shadow_region = regions.get_by_name('shadow');
                regions.remove(this._shadow_region, {silent: true});
            },
            on_preview: function () { return this.on_save(); },
            apply_state_binding: function () {
                Upfront.Events.on("command:undo", this.reset_modules, this);
                Upfront.Events.on("command:redo", this.reset_modules, this);
            },
            on_render: function () {
                var me = this;
                this.reset_modules();
                if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.THEME ) {
                    setTimeout( function() {
                        me.$el.find('.sidebar-panel-title').trigger('click');
                    }, 100);
                }
            },
            on_save_after: function () {
                var regions = this.model.get('regions');
                if ( this._shadow_region )
                    regions.add(this._shadow_region, {silent: true});
                else
                    this.reset_modules();
            },
            get_elements: function () {
                var elements = [];
                if ( this.sections ){
                    this.sections.each(function(section){
                        if ( section.elements.size() )
                            elements.push(section.elements.value());
                    });
                }
                return _( _.flatten(elements) );
            },
            update_sections: function () {
                if ( ! this.sections )
                    return;
                var me = this,
                    section_have_els = 0;
                this.sections.each(function(section){
                    if ( section.elements && section.elements.size() > 0 ){
                        section_have_els++;
                    }
                    else {
                        me.$el.find('.sidebar-panel-tabspane [data-target='+section.cid+']').hide();
                        me.$el.find('.sidebar-panel-content #'+section.cid).hide();
                    }
                });
                if ( section_have_els <= 1 ){
                    this.$el.find('.sidebar-panel-tabspane').addClass('sidebar-panel-tabspane-hidden');
                }
                else {
                    this.$el.find('.sidebar-panel-tabspane').removeClass('sidebar-panel-tabspane-hidden');
                }
            },
            reset_modules: function () {
                var regions = this.model.get("regions"),
                    region = regions ? regions.get_by_name('shadow') : false,
                    elements = this.get_elements()
                    ;
                this.update_sections();
                if (!regions) return false;
                if ( ! region ){
                    region = new Upfront.Models.Region({
                        "name": "shadow",
                        "container": "shadow",
                        "title": "Shadow Region"
                    });
                    this.model.get('regions').add( region );
                }
                //console.log(elements.value())
                if ( region.get("modules").length != elements.size() ) {
                    var modules = region.get("modules");
                    elements.each(function (element) {
                        var found = false;
                        modules.forEach(function(module){
                            if ( module.get('shadow') == element.shadow_id )
                                found = true;
                        });
                        if ( ! found ){
                            element.add_element();
                        }
                    }, this);
                }
            }
        });

    });
}(jQuery));