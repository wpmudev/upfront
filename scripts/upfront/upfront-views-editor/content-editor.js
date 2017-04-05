(function($){
    define([
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-sidebar-command',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-search',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-pagination',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-posts',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-pages',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-cpt',
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-comments'
    ], function (
        ContentEditorSidebarCommand,
        ContentEditorSearch,
        ContentEditorPagination,
        ContentEditorPosts,
        ContentEditorPages,
        ContentEditorCpt,
        ContentEditorComments
    ) {

        return {
            SidebarCommand: ContentEditorSidebarCommand,
            Search: ContentEditorSearch,
            Pagination: ContentEditorPagination,
            Posts: ContentEditorPosts,
            Pages: ContentEditorPages,
            Cpt: ContentEditorCpt,
            Comments: ContentEditorComments
        };

    });
}(jQuery));
