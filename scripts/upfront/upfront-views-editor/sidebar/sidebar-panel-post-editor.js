(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-post-details',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-post-tag-category',
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section-page-template'
    ], function ( SidebarPanel, SidebarPanel_Settings_Section_PostDetails, SidebarPanel_Settings_Section_PostTagCategory, SidebarPanel_Settings_Section_PageTemplate ) {

        return SidebarPanel.extend({
            "className": "sidebar-panel sidebar-panel-post-editor",
            initialize: function (opts) {
                var me = this;
                this.active = true;
                this.postId = this.getPostId();
                this.sections = _([
                    new SidebarPanel_Settings_Section_PostDetails({"model": this.model, "postId": this.postId})
                ]);

                if ( Upfront.Application.is_single( "post" ) ) {
                    me.sections.push(new SidebarPanel_Settings_Section_PostTagCategory({"model": me.model, "postId": this.postId}));
                } else if ( Upfront.Application.is_single( "page" ) ) {
                    me.sections.push(new SidebarPanel_Settings_Section_PageTemplate({"model": me.model, "postId": this.postId}));
                }

                Upfront.Events.off("command:layout:save", this.on_save, this);
                Upfront.Events.on("command:layout:save", this.on_save, this);

                Upfront.Events.off("command:layout:save_as", this.on_save, this);
                Upfront.Events.on("command:layout:save_as", this.on_save, this);

                Upfront.Events.off("command:layout:publish", this.on_save, this);
                Upfront.Events.on("command:layout:publish", this.on_save, this);

                //Upfront.Events.on("command:layout:preview", this.on_preview, this); // Do NOT drop shadow region from layout on preview build
                Upfront.Events.off("command:layout:save_success", this.on_save_after, this);
                Upfront.Events.on("command:layout:save_success", this.on_save_after, this);

                Upfront.Events.off("command:layout:save_error", this.on_save_after, this);
                Upfront.Events.on("command:layout:save_error", this.on_save_after, this);

                Upfront.Events.off("entity:drag_stop", this.reset_modules, this);
                Upfront.Events.on("entity:drag_stop", this.reset_modules, this);

                Upfront.Events.off("layout:render", this.apply_state_binding, this);
                Upfront.Events.on("layout:render", this.apply_state_binding, this);
            },
            get_title: function () {
                if ( Upfront.Application.is_single( "post" ) ) {
                    return l10n.post_settings;
                } else if ( Upfront.Application.is_single( "page" ) ) {
                    return l10n.page_settings;
                }
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
                // Delay to make it active after all other are rendered
                setTimeout( function() {
                    me.$el.find('.sidebar-panel-title').trigger('click');
                }, 200);
            },
            _post_type_has_taxonomy: function (tax, post) {
                if (!tax) return true;
                var type = post.get("post_type") || 'post';
                return "page" !== type;
            },
            getPostId: function() {
                postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
                if ( !this.postId && "themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.THEME ) {
                    // We're dealing with a theme exporter request
                    // Okay, so let's fake a post
                    postId = "fake_post";
                }
                else if ( !this.postId && "themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.CONTENT_STYLE ){
                    postId = "fake_styled_post";
                }

                return postId;
            }
        });

    });
}(jQuery, Backbone));