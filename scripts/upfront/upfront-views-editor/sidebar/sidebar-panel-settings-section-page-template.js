(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section',
        'upfront/post-editor/upfront-post-edit'
    ], function (SidebarPanel_Settings_Section, PostEditorBox) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function (opts) {
                this.options = opts;
                this.settings = _([]);
                this.templates = _([]);
                this.layouts = _([]);
                this.options.call = false;
                this.layoutList = new Upfront.Collections.PageTemplateList([], {postId: this.options.postId});
                this.load_dev = ( _upfront_storage_key != _upfront_save_storage_key ? 1 : 0 );
            },
            get_name: function () {
                return 'templates';
            },
            get_title: function () {
                return l10n.label_page_template;
            },
            on_render: function () {
                var me = this;

                if( !this.options.call ) {
                    // fetching layout templates data from custom post type
                    this.layoutList.fetch({load_dev: me.load_dev, template_type: 'layout'}).done(function(response){
                        me.layouts = new Upfront.Collections.PageTemplateList(response.data.results);

                        // fetching page template files in sequence after layout templates
                        me.layoutList.fetch({load_dev: me.load_dev, template_type: 'page'}).done(function(response){
                            me.templates = new Upfront.Collections.PageTemplateList(response.data.results);
                            // append the Template UI
                            me.append_template_box();
                        });
                    });

                    this.options.call = true;
                }
            },
            append_template_box: function () {
                var me = this;
                var template_editor_view = new PostEditorBox.PageTemplateEditor({collection: me.layoutList, label: l10n.label_page_template});

                setTimeout(function () {
                    template_editor_view.allPageTemplates = me.templates;
                    template_editor_view.allPageLayouts = me.layouts;
                    template_editor_view.render();
                    template_editor_view.delegateEvents();
                    me.$el.empty();
                    me.$el.append(template_editor_view.$el);
                    template_editor_view.after_append();
                }, 300);
            }
        });

    });
}(jQuery));