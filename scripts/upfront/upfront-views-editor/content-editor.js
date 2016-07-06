(function($, Backbone){
    define([
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-sidebar-command',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-search',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-pagination',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-posts',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-pages',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-comments',
    ], function (
        ContentEditorSidebarCommand,
        ContentEditorSearch,
        ContentEditorPagination,
        ContentEditorPosts,
        ContentEditorPages,
        ContentEditorComments
    ) {

        return {
            ContentEditor_SidebarCommand: ContentEditorSidebarCommand,
            ContentEditorSearch: ContentEditorSearch,
            ContentEditorPagination: ContentEditorPagination,
            ContentEditorPosts: ContentEditorPosts,
            ContentEditorPages: ContentEditorPages,
            ContentEditorComments: ContentEditorComments
        };

    });
}(jQuery, Backbone));