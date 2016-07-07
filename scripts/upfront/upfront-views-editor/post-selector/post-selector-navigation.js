(function($) {

    define([
        'scripts/upfront/upfront-views-editor/content-editor/content-editor-pagination'
    ], function( ContentEditorPagination ) {

        return ContentEditorPagination.extend({
            className: 'upfront-selector-navigation',
            handle_pagination_request: function (e, page) {
				page = page ? page : parseInt($(e.target).attr("data-page_idx"), 10) || 0
                var me = this,
                    pagination = this.collection.pagination
                ;
                this.options.pageSelection(page);
            }
        });

    });
})(jQuery);
